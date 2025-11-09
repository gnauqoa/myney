import { Button } from "./ui/button";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { formatDuration, formatDate, formatTime } from "@/lib/utils";
import { Pause, Play, Trash2, FileText, Loader2 } from "lucide-react";
import { type Recording } from "@/types/recording";
import { useTranscribe, ModelState } from "@/context/transcribe";
import { useState } from "react";
import Amount from "./amount";
import CategoryBadge from "./category-badge";

const Record = ({
  recording,
  handlePlayPause,
  playingId,
  handleDeleteClick,
}: {
  recording: Recording;
  playingId: string;
  handlePlayPause: (recording: Recording) => void;
  handleDeleteClick: (id: string) => void;
}) => {
  const { modelState } = useTranscribe();
  const [isTranscribing] = useState(false);

  const handleTranscribe = async () => {};

  const isModelReady = modelState === ModelState.READY;

  return (
    <div
      key={recording.id}
      className="flex flex-col gap-1 p-3 hover:bg-muted/50 rounded-lg transition-colors border border-border/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
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
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium capitalize text-sm truncate">
                {recording.description || "Record"}
              </p>
              <CategoryBadge categoryId={recording.categoryId} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(recording.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span>{formatDate(recording.createdAt)}</span>
              </div>
              <span className="hidden sm:inline">
                {formatTime(recording.createdAt)}
              </span>
            </div>
            {recording.amount && (
              <Amount type={recording.type} amount={recording.amount} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={handleTranscribe}
            disabled={!isModelReady || isTranscribing}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </Button>
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
