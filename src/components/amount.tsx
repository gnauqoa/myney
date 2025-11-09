import { cn } from "@/lib/utils";
import React from "react";
import { RecordingType } from "@/types/recording";

interface AmountProps {
  amount: number;
  hideSuffix?: boolean;
  className?: string;
  type?: RecordingType;
}

const Amount: React.FC<AmountProps> = ({
  amount,
  hideSuffix = false,
  type = RecordingType.INCOME,
  className,
}) => {
  const formatted = amount.toLocaleString("vi-VN");

  return (
    <span
      className={cn(
        "text-sm font-semibold",
        type === RecordingType.INCOME ? "text-green-600" : "text-red-600",
        className
      )}
    >
      {type === RecordingType.INCOME ? "" : "-"}
      {formatted}
      {!hideSuffix && " ₫"}
    </span>
  );
};

export default Amount;
