import { ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import Amount from "@/components/amount";
import { Button } from "../ui/button";

interface HomeHeaderProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export const HomeHeader = ({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  onAddIncome,
  onAddExpense,
}: HomeHeaderProps) => {
  return (
    <div className="bg-gradient-to-br from-brand-lime via-lime-500 to-green-600 text-primary-foreground p-[1rem] rounded-b-3xl pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex flex-col gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-3 border border-primary-foreground/20">
        <Amount
          amount={totalBalance}
          className="text-3xl font-bold text-white"
        />
        <div className="flex gap-2">
          <div
            className="flex items-center gap-2 w-full cursor-pointer bg-green-500/20 rounded-lg p-2 transition-all duration-100"
            onClick={onAddIncome}
          >
            <div className="bg-green-500/20 rounded-lg p-1">
              <ArrowUpRight className="h-4 w-4 text-green-400" />
            </div>
            <div className="w-full">
              <p className="text-xs opacity-75">Income</p>
              <Amount amount={monthlyIncome} className="text-white" />
            </div>
            <Plus className="h-6 w-6" />
          </div>

          <div
            className="flex items-center gap-2 w-full cursor-pointer bg-red-500/20 rounded-lg p-2 transition-all duration-100"
            onClick={onAddExpense}
          >
            <div className="bg-red-500/20 rounded-lg p-1">
              <ArrowDownRight className="h-4 w-4 text-red-400" />
            </div>
            <div className="w-full">
              <p className="text-xs opacity-75">Outcome</p>
              <Amount amount={monthlyExpenses} className="text-white" />
            </div>
            <Plus className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
