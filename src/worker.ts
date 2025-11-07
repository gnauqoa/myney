// worker.ts
import { pipeline, Pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.allowRemoteModels = true;

let transcriber: Pipeline | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, audio } = event.data;

  try {
    if (type === "load") {
      // Send loading progress
      self.postMessage({ type: "loading", progress: 0 });

      transcriber = await pipeline(
        "automatic-speech-recognition",
        "huuquyet/PhoWhisper-tiny",
        {
          progress_callback: (progress: {
            status: string;
            progress: number;
            file: string;
          }) => {
            if (progress.status === "progress") {
              self.postMessage({
                type: "loading",
                progress: progress.progress || 0,
                file: progress.file,
              });
            }
          },
        }
      );

      self.postMessage({ type: "loaded" });
    } else if (type === "transcribe") {
      if (!transcriber) {
        throw new Error("Model not loaded");
      }

      self.postMessage({ type: "processing" });

      const result = await transcriber(audio, {
        language: "vi",
        task: "transcribe",
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      });

      self.postMessage({
        type: "result",
        data: result,
      });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
