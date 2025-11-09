import { IncomeExpenseChart } from "@/components/statistics";

const StatisticsPage = () => {
  return (
    <div className="h-full overflow-auto bg-background py-2">
      <IncomeExpenseChart />
    </div>
  );
};

export default StatisticsPage;
