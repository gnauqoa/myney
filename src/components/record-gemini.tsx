import { Button } from "./ui/button";
import { Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Pause, Play, Trash2, FileText, Loader2 } from "lucide-react";
import { type Recording } from "@/types/recording";
import { useState } from "react";
import Amount from "./amount";
import CategoryBadge from "./category-badge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Checkbox } from "./ui/checkbox";
import { useTranscribe } from "@/context/transcribe";
import { toast } from "sonner";
import { updateRecording } from "@/redux/slices/recordings";
import { useAppDispatch } from "@/redux/hooks";
import { transcribeAndExtract } from "@/apis/gemini";

dayjs.extend(relativeTime);

const Record = ({
  recording,
  handlePlayPause,
  playingId,
  handleDeleteClick,
  selectedRecordings,
  onSelect,
}: {
  recording: Recording;
  playingId: string;
  handlePlayPause: (recording: Recording) => void;
  handleDeleteClick: (id: string) => void;
  selectedRecordings?: Record<string, boolean>;
  onSelect?: (id: string, checked: boolean) => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useAppDispatch();
  const { transcribingAll } = useTranscribe();
  const handleTranscribe = async () => {
    setIsProcessing(true);
    const result = await transcribeAndExtract({
      id: recording.id,
      audioDataBase64: recording.audioDataBase64 || "",
    });
    setIsProcessing(false);
    if (result.data.error) {
      return toast("Transcription failed", {
        description: result.data.error,
      });
    }
    dispatch(
      updateRecording({
        id: recording.id,
        updates: {
          amount: result.data?.amount || 0,
          categoryId: result.data.category,
          description: result.data.description,
          transcription: result.data.transcription,
          type: result.data.type,
        },
      })
    );
  };

  return (
    <div className="flex flex-col gap-1 p-3 hover:bg-muted/50 rounded-lg transition-colors border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedRecordings && (
            <Checkbox
              disabled={!!recording.amount}
              checked={
                recording.amount ? false : selectedRecordings?.[recording.id]
              }
              onCheckedChange={(checked) => onSelect?.(recording.id, !!checked)}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full shrink-0 ${
              !recording.audioDataBase64
                ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                : playingId === recording.id
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            onClick={() => handlePlayPause(recording)}
            disabled={!recording.audioDataBase64}
            title={
              !recording.audioDataBase64 ? "No audio data" : "Play recording"
            }
          >
            {playingId === recording.id ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
            )}
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-medium capitalize text-sm truncate">
              {recording.description || "Record"}
            </p>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {recording.amount && (
                <Amount amount={recording.amount} type={recording.type} />
              )}
              <CategoryBadge categoryId={recording.categoryId} />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(recording.duration)}</span>
              <span className="text-zinc-600 text-xl">&bull;</span>
              <span className="">{dayjs(recording.createdAt).fromNow()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {recording.amount ? (
            <></>
          ) : isProcessing || transcribingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-primary hover:text-primary hover:bg-primary/10"
              onClick={handleTranscribe}
              title="Convert voice to expense"
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleDeleteClick(recording.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Record;
