import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { transcribeAndExtracts } from "@/apis/gemini";
import { updateRecordings } from "@/redux/slices/recordings";

export enum ModelState {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

export enum TranscribeType {
  PHO_WHISPER = "pho-whisper",
  GEMINI = "gemini",
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

export interface TranscriptionResult {
  text: string;
  chunks?: Array<{
    text: string;
    timestamp: [number, number | null];
  }>;
}

interface TranscribeContextType {
  modelState: ModelState;
  processingState: ProcessingState;
  loadingProgress: LoadingProgress;
  error: string | null;
  loadModel: () => void;
  reset: () => void;
  transcribes: (ids?: string[]) => Promise<void>;
  transcribingAll: boolean;
}

const TranscribeContext = createContext<TranscribeContextType | undefined>(
  undefined
);

interface TranscribeProviderProps {
  children: ReactNode;
}

export const TranscribeProvider: React.FC<TranscribeProviderProps> = ({
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
  const { recordings } = useAppSelector((state) => state.recordings);
  const { categoryNames, mappedCategoriesByName } = useAppSelector(
    (state) => state.categories
  );
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [transcribingAll, setTranscribingAll] = useState<boolean>(false);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(
      new URL("../worker/pho-whisper.ts", import.meta.url),
      {
        type: "module",
      }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent) => {
      const {
        type,
        progress,
        file,
        uuid,
        data,
        error: workerError,
      } = event.data;

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
          document.dispatchEvent(
            new CustomEvent(`transcription-result-${uuid}`, { detail: data })
          );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadModel = () => {
    if (modelState === ModelState.LOADING || modelState === ModelState.READY)
      return;

    setError(null);
    setLoadingProgress({ progress: 0 });
    workerRef.current?.postMessage({ type: "load" });
  };

  // const transcribe = (audioData: AudioBuffer): Promise<TranscriptionResult> => {
  //   return new Promise((resolve, reject) => {
  //     if (modelState !== ModelState.READY) {
  //       const errorMsg = "Model is not ready. Please load the model first.";
  //       setError(errorMsg);
  //       reject(new Error(errorMsg));
  //       return;
  //     }

  //     setProcessingState(ProcessingState.IDLE);
  //     setError(null);

  //     let audio;
  //     if (audioData.numberOfChannels === 2) {
  //       const SCALING_FACTOR = Math.sqrt(2);

  //       const left = audioData.getChannelData(0);
  //       const right = audioData.getChannelData(1);

  //       audio = new Float32Array(left.length);
  //       for (let i = 0; i < audioData.length; ++i) {
  //         audio[i] = (SCALING_FACTOR * (left[i] + right[i])) / 2;
  //       }
  //     } else {
  //       // If the audio is not stereo, we can just use the first channel:
  //       audio = audioData.getChannelData(0);
  //     }

  //     const uuid = uuidv4();

  //     // Set up event listener BEFORE sending message to worker
  //     const handleResult = (event: CustomEvent<TranscriptionResult>) => {
  //       document.removeEventListener(
  //         `transcription-result-${uuid}`,
  //         handleResult as EventListener
  //       );
  //       resolve(event.detail);
  //     };

  //     document.addEventListener(
  //       `transcription-result-${uuid}`,
  //       handleResult as EventListener
  //     );

  //     workerRef.current?.postMessage({ type: "transcribe", audio, uuid });
  //   });
  // };

  const transcribesByGemini = async () => {
    setTranscribingAll(true);
    const needTranscribe = recordings.filter((recording) => !recording.amount);
    const results = await transcribeAndExtracts(
      needTranscribe.map((recording) => ({
        id: recording.id,
        audioDataBase64: recording.audioDataBase64 || "",
      })),
      categoryNames
    );

    dispatch(
      updateRecordings(
        results.map((result) => ({
          id: result.id,
          amount: result.data?.amount,
          categoryId: mappedCategoriesByName[result.data?.category || ""]?.id,
          description: result.data?.description,
          transcription: result.data?.transcription,
          type: result.data?.type,
        }))
      )
    );
    setTranscribingAll(false);
  };

  const reset = () => {
    setProcessingState(ProcessingState.IDLE);
    setError(null);
  };

  useEffect(() => {
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TranscribeContext.Provider
      value={{
        modelState,
        processingState,
        loadingProgress,
        error,
        loadModel,
        reset,
        transcribingAll,
        transcribes: transcribesByGemini,
      }}
    >
      {children}
    </TranscribeContext.Provider>
  );
};

export const useTranscribe = () => {
  const context = useContext(TranscribeContext);
  if (!context) {
    throw new Error("useTranscribe must be used within a TranscribeProvider");
  }
  return context;
};
