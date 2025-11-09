import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2 } from "lucide-react";
import { useAppDispatch, useTransactions } from "@/redux/hooks";
import { removeRecording } from "@/redux/slices/recordings";
import Transaction from "../transaction";
import { Checkbox } from "../ui/checkbox";

interface TransactionsListProps {
  onAddClick: () => void;
}

export const TransactionsList = ({ onAddClick }: TransactionsListProps) => {
  const dispatch = useAppDispatch();
  const { transactions } = useTransactions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<
    Record<string, boolean>
  >({});

  const selectedTransactionArr = Object.keys(selectedTransactions).filter(
    (id) => selectedTransactions[id]
  );

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete === "selected") {
      selectedTransactionArr.forEach((id) => dispatch(removeRecording(id)));
      setSelectedTransactions({});
    } else if (transactionToDelete) {
      dispatch(removeRecording(transactionToDelete));
      setTransactionToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => {
      if (prev) setSelectedTransactions({});
      return !prev;
    });
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Your income and expenses</CardDescription>
            </div>
            <Button onClick={onAddClick} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your income and expenses
            </p>
            <Button onClick={onAddClick}>Add Transaction</Button>
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
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleSelectMode}
              size="sm"
              variant="ghost"
              className="text-primary"
            >
              {selectMode ? "Cancel" : "Select"}
            </Button>
            <Button onClick={onAddClick} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectMode && (
          <div className="flex items-center gap-2 pb-2 px-3">
            <Checkbox
              checked={
                !!transactions.length &&
                selectedTransactionArr.length === transactions.length
              }
              onCheckedChange={(checked) => {
                setSelectedTransactions(
                  transactions.reduce((acc, t) => {
                    acc[t.id] = !!checked;
                    return acc;
                  }, {} as Record<string, boolean>)
                );
              }}
            />
            <span className="text-sm font-medium">Select all</span>
            {selectMode && (
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ml-2"
                  disabled={!selectedTransactionArr.length}
                  onClick={() => {
                    setTransactionToDelete("selected");
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        {transactions.map((transaction) => (
          <Transaction
            key={transaction.id}
            transaction={transaction}
            onDelete={handleDeleteClick}
            onSelect={
              selectMode
                ? (id, checked) =>
                    setSelectedTransactions((prev) => ({
                      ...prev,
                      [id]: checked,
                    }))
                : undefined
            }
            selectedTransactions={selectMode ? selectedTransactions : undefined}
          />
        ))}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The transaction will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
