import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Moon,
  Sun,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Amount from "@/components/amount";

interface HomeHeaderProps {
  isDark: boolean;
  toggleDarkMode: () => void;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export const HomeHeader = ({
  isDark,
  toggleDarkMode,
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  onAddIncome,
  onAddExpense,
}: HomeHeaderProps) => {
  return (
    <div className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between mb-6 pt-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary-foreground/20">
            <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm opacity-90">Welcome back,</p>
            <p className="text-xl font-bold">John Doe</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={toggleDarkMode}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Calendar className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Balance Card */}
        <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
          <p className="text-sm opacity-90 mb-2">Total Balance</p>
          <Amount
            amount={totalBalance}
            className="text-4xl font-bold mb-4 text-white"
          />
          <div className="flex gap-4 ">
            <div
              className="flex items-center gap-2 w-full cursor-pointer hover:bg-green-500/20 rounded-lg p-2 transition-all duration-100"
              onClick={onAddIncome}
            >
              <div className="bg-green-500/20 rounded-lg">
                <ArrowUpRight className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs opacity-75">Income</p>
                <p className="font-semibold">
                  ${monthlyIncome.toLocaleString()}
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-2 w-full cursor-pointer hover:bg-red-500/20 rounded-lg p-2 transition-all duration-100"
              onClick={onAddExpense}
            >
              <div className="bg-red-500/20 rounded-lg">
                <ArrowDownRight className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs opacity-75">Expenses</p>
                <p className="font-semibold">
                  ${monthlyExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs opacity-75 mt-1">(click to add transaction)</p>
        </div>
      </div>
    </div>
  );
};
