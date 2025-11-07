/* eslint-disable react-refresh/only-export-components */
// PhoWhisperContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export enum ModelState {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

export enum ProcessingState {
  IDLE = "idle",
  PROCESSING = "processing",
  COMPLETED = "completed",
  ERROR = "error",
}

interface LoadingProgress {
  progress: number;
  file?: string;
}

interface TranscriptionResult {
  text: string;
  chunks?: Array<{
    text: string;
    timestamp: [number, number | null];
  }>;
}

interface PhoWhisperContextType {
  modelState: ModelState;
  processingState: ProcessingState;
  loadingProgress: LoadingProgress;
  error: string | null;
  transcriptionResult: TranscriptionResult | null;
  loadModel: () => void;
  transcribe: (audio: Float32Array | ArrayBuffer) => void;
  reset: () => void;
}

const PhoWhisperContext = createContext<PhoWhisperContextType | undefined>(
  undefined
);

interface PhoWhisperProviderProps {
  children: ReactNode;
}

export const PhoWhisperProvider: React.FC<PhoWhisperProviderProps> = ({
  children,
}) => {
  const workerRef = useRef<Worker | null>(null);
  const [modelState, setModelState] = useState<ModelState>(ModelState.IDLE);
  const [processingState, setProcessingState] = useState<ProcessingState>(
    ProcessingState.IDLE
  );
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [transcriptionResult, setTranscriptionResult] =
    useState<TranscriptionResult | null>(null);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type, progress, file, data, error: workerError } = event.data;

      switch (type) {
        case "loading":
          setModelState(ModelState.LOADING);
          setLoadingProgress({ progress, file });
          break;

        case "loaded":
          setModelState(ModelState.READY);
          setLoadingProgress({ progress: 100 });
          setError(null);
          break;

        case "processing":
          setProcessingState(ProcessingState.PROCESSING);
          break;

        case "result":
          setProcessingState(ProcessingState.COMPLETED);
          setTranscriptionResult(data);
          break;

        case "error":
          if (modelState === ModelState.LOADING) {
            setModelState(ModelState.ERROR);
          }
          if (processingState === ProcessingState.PROCESSING) {
            setProcessingState(ProcessingState.ERROR);
          }
          setError(workerError);
          break;
      }
    };

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadModel = () => {
    if (modelState === ModelState.LOADING || modelState === ModelState.READY)
      return;

    setError(null);
    setLoadingProgress({ progress: 0 });
    workerRef.current?.postMessage({ type: "load" });
  };

  const transcribe = (audio: Float32Array | ArrayBuffer) => {
    if (modelState !== ModelState.READY) {
      setError("Model is not ready. Please load the model first.");
      return;
    }

    setProcessingState(ProcessingState.IDLE);
    setTranscriptionResult(null);
    setError(null);
    workerRef.current?.postMessage({ type: "transcribe", audio });
  };

  const reset = () => {
    setProcessingState(ProcessingState.IDLE);
    setTranscriptionResult(null);
    setError(null);
  };

  return (
    <PhoWhisperContext.Provider
      value={{
        modelState,
        processingState,
        loadingProgress,
        error,
        transcriptionResult,
        loadModel,
        transcribe,
        reset,
      }}
    >
      {children}
    </PhoWhisperContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePhoWhisper = () => {
  const context = useContext(PhoWhisperContext);
  if (!context) {
    throw new Error("usePhoWhisper must be used within a PhoWhisperProvider");
  }
  return context;
};
