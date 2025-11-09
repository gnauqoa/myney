import { ModelState, useTranscribe } from "@/context/transcribe";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";

const LoadingModel = () => {
  const { modelState, loadingProgress } = useTranscribe();

  return (
    <AlertDialog open={modelState !== ModelState.READY}>
      <AlertDialogContent className="max-w-[85vw] w-[85vw]">
        <AlertDialogHeader className="overflow-hidden w-full">
          <AlertDialogTitle>Loading model...</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-1 justify-center items-center w-full">
            <Spinner className="size-8" />
            <div className="flex flex-col gap-1 w-full overflow-hidden">
              <span className="truncate text-sm text-muted-foreground">
                {loadingProgress.file}
              </span>
              <Progress value={loadingProgress.progress} />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LoadingModel;
