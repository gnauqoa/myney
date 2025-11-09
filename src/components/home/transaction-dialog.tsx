import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addRecording } from "@/redux/slices/recordings";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import { RecordingType } from "@/types/recording";

// Define validation schema
const transactionSchema = z.object({
  type: z.nativeEnum(RecordingType),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  categoryId: z.string().min(1, "Please select a category"),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: RecordingType;
  onClose?: () => void;
}

export const AddTransactionDialog = ({
  open,
  onOpenChange,
  defaultType,
  onClose,
}: AddTransactionDialogProps) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.categories.categories);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: RecordingType.OUTCOME,
      amount: "",
      categoryId: categories[0].id.toString(),
      description: "",
    },
  });

  const type = watch("type");
  const categoryId = watch("categoryId");

  // Set default type when dialog opens with a pre-selected type
  useEffect(() => {
    if (open && defaultType) {
      setValue("type", defaultType);
    }
  }, [open, defaultType, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      onClose?.();
    }
  }, [open, reset, onClose]);

  const onSubmit = (data: TransactionFormData) => {
    dispatch(
      addRecording({
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        type: data.type as RecordingType,
        description: data.description || "",
        createdAt: dayjs().toISOString(),
        id: uuidv4(),
        duration: 0,
        audioDataBase64: "",
        transcription: "",
      })
    );

    reset();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[90%]">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>
            Add a new income or expense transaction
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setValue("type", value as RecordingType)
              }
            >
              <SelectTrigger
                id="type"
                className={errors.type ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RecordingType.INCOME}>Income</SelectItem>
                <SelectItem value={RecordingType.OUTCOME}>Outcome</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("amount")}
              autoFocus
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={categoryId}
              onValueChange={(value) => setValue("categoryId", value)}
            >
              <SelectTrigger
                id="category"
                className={errors.categoryId ? "border-destructive" : ""}
              >
                <SelectValue
                  placeholder="Select category"
                  className="capitalize"
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    className="capitalize"
                    key={category.id}
                    value={category.id.toString()}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              {...register("description")}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <div className="flex flex-row gap-3 w-full overflow-hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="w-full flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Confirm"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
