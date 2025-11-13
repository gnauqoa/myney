export enum RecordingType {
  INCOME = "income",
  OUTCOME = "outcome",
}

export interface Recording {
  id: string;
  duration: number;
  audioDataBase64?: string;
  transcription?: string;
  type?: RecordingType;
  categoryId?: string;
  amount?: number;
  description?: string;
  walletId: string;
  createdAt: string;
}

export type Transaction = Omit<
  Recording,
  "amount" | "type" | "categoryId" | "description"
> & {
  amount: number;
  type: RecordingType;
  categoryId: string;
  description: string;
};
