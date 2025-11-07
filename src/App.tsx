import React, { StrictMode, useRef, useState, useEffect } from "react";
import { PhoWhisperProvider, usePhoWhisper } from "./PhoWhisperContext";

const TranscriptionComponent: React.FC = () => {
  const {
    modelState,
    processingState,
    loadingProgress,
    error,
    transcriptionResult,
    loadModel,
    transcribe,
    reset,
  } = usePhoWhisper();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [runTime, setRunTime] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const runTimerRef = useRef<number | null>(null);

  // Start timing when transcribing
  const startTimer = () => {
    runTimerRef.current = performance.now();
    setRunTime(null);
  };

  // Stop timing when transcription result arrives
  useEffect(() => {
    if (transcriptionResult && runTimerRef.current) {
      const duration = (performance.now() - runTimerRef.current) / 1000;
      setRunTime(duration);
      runTimerRef.current = null;
    }
  }, [transcriptionResult]);

  // --- Handle file upload ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    await processAudioBuffer(arrayBuffer);
  };

  // --- Load media from URL (https:// or record://...) ---
  const handleLoadFromUrl = async () => {
    if (!audioUrl) return;
    try {
      if (audioUrl.startsWith("record://")) {
        alert("Use the Record button to capture audio.");
        return;
      }

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      await processAudioBuffer(arrayBuffer);
    } catch (err) {
      console.error(err);
      alert("Failed to load audio from URL");
    }
  };

  // --- Process audio buffer (shared logic) ---
  const processAudioBuffer = async (arrayBuffer: ArrayBuffer) => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const float32Array = audioBuffer.getChannelData(0);
    startTimer();
    transcribe(float32Array);
  };

  // --- Handle microphone recording ---
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        await processAudioBuffer(arrayBuffer);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const handleStopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setIsRecording(false);
    }
  };

  const handleReset = () => {
    reset();
    setRunTime(null);
  };

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "black",
        color: "white",
        maxWidth: "800px",
        margin: "0 auto",
        borderRadius: "8px",
      }}
    >
      <h1>PhoWhisper Transcription</h1>

      {/* Model State */}
      <div style={{ marginBottom: "20px" }}>
        <h2>Model Status: {modelState}</h2>
        {modelState === "idle" && <button onClick={loadModel}>Load Model</button>}
        {modelState === "loading" && (
          <div>
            <progress value={loadingProgress.progress} max={100} />
            <p>Loading: {loadingProgress.progress.toFixed(1)}%</p>
            {loadingProgress.file && <p>File: {loadingProgress.file}</p>}
          </div>
        )}
        {modelState === "ready" && <p style={{ color: "limegreen" }}>✓ Model Ready</p>}
        {modelState === "error" && <p style={{ color: "red" }}>✗ Model Error</p>}
      </div>

      {/* Input Controls */}
      {modelState === "ready" && (
        <>
          {/* Upload file */}
          <div style={{ marginBottom: "20px" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={processingState === "processing"}
            />
          </div>

          {/* Load from URL */}
          <div style={{ marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Enter audio URL or record://"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              style={{ width: "80%", padding: "6px" }}
            />
            <button onClick={handleLoadFromUrl} disabled={processingState === "processing"}>
              Load from URL
            </button>
          </div>

          {/* Microphone recording */}
          <div style={{ marginBottom: "20px" }}>
            {!isRecording ? (
              <button onClick={handleStartRecording}>🎙 Start Recording</button>
            ) : (
              <button onClick={handleStopRecording}>⏹ Stop Recording</button>
            )}
          </div>
        </>
      )}

      {/* Processing State */}
      {processingState === "processing" && <p>Processing audio...</p>}

      {/* Results */}
      {transcriptionResult && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Transcription Result:</h2>
          <div
            style={{
              padding: "15px",
              backgroundColor: "#f0f0f0",
              color: "black",
              borderRadius: "5px",
              whiteSpace: "pre-wrap",
            }}
          >
            {transcriptionResult.text}
          </div>

          {/* Show run time */}
          {runTime !== null && (
            <p style={{ marginTop: "10px", color: "cyan" }}>
              ⏱ Model run time: {runTime.toFixed(2)} seconds
            </p>
          )}

          {transcriptionResult.chunks && (
            <div style={{ marginTop: "20px" }}>
              <h3>Timestamps:</h3>
              {transcriptionResult.chunks.map((chunk, idx) => (
                <div key={idx} style={{ marginBottom: "10px" }}>
                  <strong>
                    [{chunk.timestamp[0].toFixed(2)}s -{" "}
                    {chunk.timestamp[1]?.toFixed(2) || "end"}s]
                  </strong>
                  <span> {chunk.text}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={handleReset}>Clear Results</button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "5px",
            marginTop: "20px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <StrictMode>
    <PhoWhisperProvider>
      <TranscriptionComponent />
    </PhoWhisperProvider>
  </StrictMode>
);

export default App;
