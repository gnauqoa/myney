import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { type Transaction as TransactionType } from "@/types/recording";
import Amount from "./amount";
import CategoryBadge from "./category-badge";
import { Checkbox } from "./ui/checkbox";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface TransactionProps {
  transaction: TransactionType;
  onDelete: (id: string) => void;
  selectedTransactions?: Record<string, boolean>;
  onSelect?: (id: string, checked: boolean) => void;
}

const Transaction = ({
  transaction,
  onDelete,
  selectedTransactions,
  onSelect,
}: TransactionProps) => {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors border border-border/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {selectedTransactions && (
          <Checkbox
            checked={!!selectedTransactions[transaction.id]}
            onCheckedChange={(checked) => onSelect?.(transaction.id, !!checked)}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-row items-center gap-2">
            <p className="font-medium capitalize text-sm truncate">
              {transaction.description || "Transaction"}
            </p>
            <span className="text-zinc-600 text-xl">&bull;</span>
            <span className="text-xs text-muted-foreground">
              {dayjs(transaction.createdAt).fromNow()}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {transaction.amount && (
              <Amount amount={transaction.amount} type={transaction.type} />
            )}
            <CategoryBadge categoryId={transaction.categoryId} />
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
        onClick={() => onDelete(transaction.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Transaction;
