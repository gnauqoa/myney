import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Loader2, Mic, Trash2 } from "lucide-react";
import { useAppDispatch, useRecordings } from "@/redux/hooks";
import { removeRecording, removeRecordings } from "@/redux/slices/recordings";
import Record from "@/components/record-gemini";
// import Record from "@/components/record";
import { useTranscribe } from "@/context/transcribe";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Recording } from "@/types/recording";

export const RecordingsList = () => {
  const dispatch = useAppDispatch();
  const { transcribes, transcribingAll } = useTranscribe();
  const { recordings } = useRecordings();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [recordingToDelete, setRecordingToDelete] = useState<string | null>(
    null
  );
  const [selectedRecordings, setSelectedRecordings] = useState<
    Record<string, boolean>
  >({});
  const [selectMode, setSelectMode] = useState(false);

  const selectedRecordingArr = Object.keys(selectedRecordings).filter(
    (id) => selectedRecordings[id]
  );

  const toggleSelectMode = () => {
    setSelectMode((prev) => {
      if (prev) {
        // Clear selections when turning off select mode
        setSelectedRecordings({});
      }
      return !prev;
    });
  };

  const openDeleteDialog = Boolean(recordingToDelete);
  const recordingsToTranscribe = recordings.filter(
    (recording) => !recording.amount
  );

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const handleDeleteClick = (id: string) => {
    setRecordingToDelete(id);
  };

  const handleDelete = () => {
    if (recordingToDelete) {
      if (playingId === recordingToDelete && audioElement) {
        audioElement.pause();
        setPlayingId(null);
      }
      if (recordingToDelete === "selected")
        dispatch(removeRecordings(selectedRecordings));
      else dispatch(removeRecording(recordingToDelete));
      setRecordingToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setRecordingToDelete(null);
  };

  const handlePlayPause = (recording: Recording) => {
    if (playingId === recording.id && audioElement) {
      audioElement.pause();
      setPlayingId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    if (!recording.audioDataBase64) {
      console.log("No audio data available for this recording");
      return;
    }

    const audio = new Audio(
      `data:audio/webm;base64,${recording.audioDataBase64}`
    );

    audio.onended = () => {
      setPlayingId(null);
    };

    audio.onerror = (e) => {
      console.error("Error playing audio:", e);
      setPlayingId(null);
    };

    audio.play().catch((error) => {
      console.error("Failed to play audio:", error);
      setPlayingId(null);
    });

    setAudioElement(audio);
    setPlayingId(recording.id);
  };

  if (recordings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recordings</CardTitle>
          <CardDescription>Your recorded transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Mic className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
            <p className="text-sm text-muted-foreground">
              Press and hold the button below to record your first transaction
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="">Recordings</CardTitle>
            <CardDescription>
              {recordings.length} recording{recordings.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            className="text-primary"
            onClick={toggleSelectMode}
          >
            {selectMode ? "Cancel" : "Select"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectMode && (
          <div className="flex items-center gap-2 pl-3">
            <Checkbox
              checked={
                !!recordingsToTranscribe.length &&
                selectedRecordingArr.length === recordingsToTranscribe.length
              }
              disabled={!recordingsToTranscribe.length}
              onCheckedChange={(checked) => {
                setSelectedRecordings(
                  recordingsToTranscribe.reduce((acc, recording) => {
                    acc[recording.id] = !!checked;
                    return acc;
                  }, {} as Record<string, boolean>)
                );
              }}
            />
            <span className="text-sm font-medium">Select all</span>
            <div className="flex items-center gap-1 ml-auto pr-3">
              {transcribingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => transcribes(selectedRecordingArr)}
                  title="Convert voice to expense"
                  disabled={
                    !selectedRecordingArr.length ||
                    !recordingsToTranscribe.length
                  }
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              <Button
                disabled={
                  !selectedRecordingArr.length || !recordingsToTranscribe.length
                }
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteClick("selected")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {recordings.map((recording) => (
          <Record
            onSelect={
              selectMode
                ? (id, checked) =>
                    setSelectedRecordings((prev) => ({
                      ...prev,
                      [id]: checked,
                    }))
                : undefined
            }
            selectedRecordings={selectMode ? selectedRecordings : undefined}
            key={recording.id}
            recording={recording}
            playingId={playingId || ""}
            handlePlayPause={handlePlayPause}
            handleDeleteClick={handleDeleteClick}
          />
        ))}
      </CardContent>

      <AlertDialog
        open={openDeleteDialog}
        onOpenChange={(handleOpen) => {
          if (!handleOpen) {
            handleCancelDelete();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              {recordingToDelete === "selected"
                ? "This action cannot be undone. The recordings and their audio data will be permanently deleted."
                : "This action cannot be undone. The recording and its audio data will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default RecordingsList;
