import {
  HomeHeader,
  BudgetOverview,
  RecordingsList,
  TransactionsList,
  AddTransactionDialog,
} from "@/components/home";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useState, useMemo } from "react";
import { useAppSelector, useTransactions } from "@/redux/hooks";
import { RecordingType } from "@/types/recording";

const HomePage = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] =
    useState<RecordingType>(RecordingType.OUTCOME);
  const { transactions } = useTransactions();

  // Get data from Redux
  const categories = useAppSelector((state) => state.categories.categories);

  const handleAddIncome = () => {
    setAddTransactionOpen(true);
    setDefaultTransactionType(RecordingType.INCOME);
  };

  const handleAddExpense = () => {
    setAddTransactionOpen(true);
    setDefaultTransactionType(RecordingType.OUTCOME);
  };

  // Calculate financial statistics from actual transactions
  const financialStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let totalBalance = 0;

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      const isCurrentMonth =
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear;

      if (transaction.type === RecordingType.INCOME) {
        totalBalance += transaction.amount || 0;
        if (isCurrentMonth) {
          monthlyIncome += transaction.amount || 0;
        }
      } else {
        totalBalance -= transaction.amount || 0;
        if (isCurrentMonth) {
          monthlyExpenses += transaction.amount || 0;
        }
      }
    });

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savings: totalBalance - monthlyExpenses,
    };
  }, [transactions]);

  // Calculate budget categories from actual transactions
  const budgetCategories = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Define budget limits per category
    const budgetLimits: Record<string, { budget: number; color: string }> = {
      "Food & Dining": { budget: 800, color: "bg-blue-500" },
      Transportation: { budget: 300, color: "bg-green-500" },
      Shopping: { budget: 500, color: "bg-yellow-500" },
      Entertainment: { budget: 200, color: "bg-purple-500" },
      "Bills & Utilities": { budget: 500, color: "bg-red-500" },
    };

    // Calculate spent amount per category
    const categorySpending: Record<string, number> = {};

    transactions.forEach((transaction) => {
      if (transaction.type === RecordingType.OUTCOME) {
        const transactionDate = new Date(transaction.createdAt);
        const isCurrentMonth =
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear;

        if (isCurrentMonth) {
          const category = categories.find(
            (c) => c.id === transaction.categoryId
          );
          if (category && budgetLimits[category.name]) {
            categorySpending[category.name] =
              (categorySpending[category.name] || 0) + transaction.amount;
          }
        }
      }
    });

    // Create budget overview array
    return Object.keys(budgetLimits).map((categoryName) => ({
      name: categoryName,
      spent: Math.round(categorySpending[categoryName] || 0),
      budget: budgetLimits[categoryName].budget,
      color: budgetLimits[categoryName].color,
    }));
  }, [transactions, categories]);

  return (
    <div className="h-full overflow-auto bg-background pb-24">
      <HomeHeader
        isDark={isDark}
        toggleDarkMode={toggleDarkMode}
        totalBalance={financialStats.totalBalance}
        monthlyIncome={financialStats.monthlyIncome}
        monthlyExpenses={financialStats.monthlyExpenses}
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
      />

      <div className="p-3 space-y-6 -mt-4">
        <BudgetOverview categories={budgetCategories} />
        <TransactionsList onAddClick={() => setAddTransactionOpen(true)} />
        <RecordingsList />
      </div>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={addTransactionOpen}
        onOpenChange={setAddTransactionOpen}
        defaultType={defaultTransactionType}
      />
    </div>
  );
};

export default HomePage;
