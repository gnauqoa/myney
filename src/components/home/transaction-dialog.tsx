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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAppDispatch, useAppSelector, useWallets } from "@/redux/hooks";
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
  walletId: z.string().min(1, "Please select a wallet"),
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
  const { wallets } = useWallets();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: RecordingType.OUTCOME,
      amount: "",
      categoryId: categories[0]?.id.toString() || "",
      description: "",
      walletId: wallets[0]?.id || "",
    },
  });

  // Set default type when dialog opens with a pre-selected type
  useEffect(() => {
    if (open && defaultType) {
      form.setValue("type", defaultType);
    }
  }, [open, defaultType, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      onClose?.();
    }
  }, [open, form, onClose]);

  const onSubmit = (data: TransactionFormData) => {
    dispatch(
      addRecording({
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        type: data.type as RecordingType,
        description: data.description || "",
        walletId: data.walletId,
        createdAt: dayjs().toISOString(),
        id: uuidv4(),
        duration: 0,
        audioDataBase64: "",
        transcription: "",
      })
    );

    form.reset();
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Type <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={RecordingType.INCOME}>
                        Income
                      </SelectItem>
                      <SelectItem value={RecordingType.OUTCOME}>
                        Outcome
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => {
                const numericValue = field.value
                  ? field.value.replace(/[^\d]/g, "")
                  : "";

                const formattedValue = numericValue
                  ? new Intl.NumberFormat("vi-VN").format(Number(numericValue))
                  : "";

                return (
                  <FormItem>
                    <FormLabel>
                      Số tiền <span className="text-destructive">*</span>
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          autoFocus
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className="pr-8 text-left"
                          value={formattedValue}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, "");
                            field.onChange(raw);
                          }}
                        />
                      </FormControl>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₫
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Category <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="capitalize">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Wallet <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder="Select wallet"
                          className="capitalize"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem
                          className="capitalize"
                          key={wallet.id}
                          value={wallet.id.toString()}
                        >
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <div className="flex flex-row gap-3 w-full overflow-hidden">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="w-full flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Adding..." : "Confirm"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
