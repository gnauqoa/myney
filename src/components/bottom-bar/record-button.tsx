import { Button } from "@/components/ui/button";
import "./index.css";
import { Mic, Square } from "lucide-react";
import { IonFab } from "@ionic/react";
import { useState, useRef, useEffect } from "react";
import { Microphone } from "@mozartec/capacitor-microphone";
import type { Recording } from "@/types/recording";
import { useAppDispatch } from "@/redux/hooks";
import { addRecording } from "@/redux/slices/recordings";
import { v4 as uuidv4 } from "uuid";

export const RecordBtn = () => {
  const dispatch = useAppDispatch();
  const [isRecording, setIsRecording] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup once on unmount (not on isRecording change)
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Microphone.checkPermissions();
      if (permission.microphone !== "granted") {
        const requestResult = await Microphone.requestPermissions();
        if (requestResult.microphone !== "granted") {
          console.error("Microphone permission denied");
          return;
        }
      }

      await Microphone.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);

      // ✅ start interval AFTER state update
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      setIsPressing(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!isRecording) return;

      const result = await Microphone.stopRecording();

      // ✅ clear timer first
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecording(false);

      // ✅ don't reset duration immediately (allow UI to display final value)
      setTimeout(() => setRecordingDuration(0), 500);

      console.log("Recording stopped", result);

      if (result && recordingDuration > 0) {
        const recording: Recording = {
          id: uuidv4(),
          duration: recordingDuration,
          createdAt: new Date().toISOString(),
          description: "Record",
          audioDataBase64: result.base64String,
        };
        dispatch(addRecording(recording));
        console.log("Recording saved:", recording);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const handlePressStart = () => {
    setIsPressing(true);
    pressTimeoutRef.current = setTimeout(() => startRecording(), 200);
  };

  const handlePressEnd = () => {
    setIsPressing(false);

    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }

    if (isRecording) stopRecording();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <IonFab
      vertical="bottom"
      horizontal="center"
      slot="fixed"
      className="fab-center"
    >
      <div className="relative flex flex-col items-center">
        {/* Timer label */}
        {isRecording && (
          <div className="absolute -top-16 bg-destructive text-white px-4 py-2 rounded-full shadow-lg animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Recording {formatDuration(recordingDuration)}
            </span>
          </div>
        )}

        {isPressing && (
          <div className="absolute inset-0 rounded-full animate-ping bg-primary/30 -z-10" />
        )}

        <Button
          variant="default"
          size="icon"
          className={`cursor-pointer z-20 rounded-full w-[4rem] h-[4rem] transition-all ${
            isPressing ? "scale-110 shadow-2xl" : "scale-100"
          } ${isRecording ? "bg-destructive hover:bg-destructive/90" : ""}`}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
        >
          {isRecording ? (
            <Square className="size-6" fill="currentColor" />
          ) : (
            <Mic className="size-6" />
          )}
        </Button>
      </div>
    </IonFab>
  );
};

export default RecordBtn;
