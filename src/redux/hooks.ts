import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";
import { isTransaction } from "@/lib/utils";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useTransactions = () => {
  const selector = useAppSelector((state) => state.recordings);
  return {
    ...selector,
    transactions: selector.recordings.filter(isTransaction),
  };
};

export const useRecordings = () => {
  const selector = useAppSelector((state) => state.recordings);
  return {
    ...selector,
    recordings: selector.recordings.filter(
      (recording) => recording.audioDataBase64
    ),
  };
};

export const useWallets = () => {
  const selector = useAppSelector((state) => state.wallets);
  return selector;
};
