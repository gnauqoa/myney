import { useMemo, useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useTransactions } from "@/redux/hooks";
import { RecordingType } from "@/types/recording";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonthRangePicker } from "@/components/ui/monthrangepicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Helper function to get CSS variable value
const getCSSVariable = (variable: string): string => {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
};

export const IncomeExpenseChart = () => {
  const { transactions } = useTransactions();
  const [themeColors, setThemeColors] = useState({
    foreground: "",
    border: "",
    mutedForeground: "",
  });

  // Date range state - default to current month and 2 months before
  const [dateRange, setDateRange] = useState<
    { start: Date; end: Date } | undefined
  >(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);

    return { start, end };
  });

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Handle month range selection
  const handleMonthRangeSelect = (
    range: { start: Date; end: Date } | undefined
  ) => {
    setDateRange(range);
    setIsDialogOpen(false); // Close dialog after selection
  };

  // Update theme colors when component mounts or theme changes
  useEffect(() => {
    const updateThemeColors = () => {
      setThemeColors({
        foreground: getCSSVariable("--foreground"),
        border: getCSSVariable("--border"),
        mutedForeground: getCSSVariable("--muted-foreground"),
      });
    };

    updateThemeColors();

    // Listen for theme changes
    const observer = new MutationObserver(updateThemeColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Calculate monthly income and expense data
  const chartData = useMemo(() => {
    if (!dateRange) {
      return {
        categories: [],
        incomeData: [],
        expenseData: [],
        monthsInRange: [],
      };
    }

    const monthlyData: {
      [key: string]: { income: number; expense: number };
    } = {};

    // Generate list of months in the selected range
    const monthsInRange: string[] = [];
    const current = new Date(
      dateRange.start.getFullYear(),
      dateRange.start.getMonth(),
      1
    );
    const end = new Date(
      dateRange.end.getFullYear(),
      dateRange.end.getMonth(),
      1
    );

    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(
        current.getMonth() + 1
      ).padStart(2, "0")}`;
      monthsInRange.push(monthKey);
      monthlyData[monthKey] = { income: 0, expense: 0 };

      current.setMonth(current.getMonth() + 1);
    }

    // Process transactions in the selected range
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;

      // Only include transactions in the selected range
      if (monthlyData[monthKey] !== undefined) {
        if (transaction.type === RecordingType.INCOME) {
          monthlyData[monthKey].income += transaction.amount;
        } else if (transaction.type === RecordingType.OUTCOME) {
          monthlyData[monthKey].expense += transaction.amount;
        }
      }
    });

    // Format data for chart
    const categories = monthsInRange.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    });

    const incomeData = monthsInRange.map(
      (monthKey) => monthlyData[monthKey].income
    );
    const expenseData = monthsInRange.map(
      (monthKey) => monthlyData[monthKey].expense
    );

    return { categories, incomeData, expenseData, monthsInRange };
  }, [transactions, dateRange]);

  const series = [
    {
      name: "Income",
      data: chartData.incomeData,
    },
    {
      name: "Expense",
      data: chartData.expenseData,
    },
  ];

  const options: ApexOptions = useMemo(() => {
    // Convert OKLCH to RGB for ApexCharts
    const foregroundColor = themeColors.foreground
      ? `oklch(${themeColors.foreground})`
      : "#000000";
    const borderColor = themeColors.border
      ? `oklch(${themeColors.border})`
      : "#e5e7eb";

    return {
      chart: {
        type: "bar",
        height: 350,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
        },
        background: "transparent",
        zoom: {
          enabled: true,
          type: "x",
          autoScaleYaxis: true,
          zoomedArea: {
            fill: {
              color: "#90CAF9",
              opacity: 0.4,
            },
            stroke: {
              color: "#0D47A1",
              opacity: 0.4,
              width: 1,
            },
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: chartData.categories,
        labels: {
          style: {
            colors: Array(chartData.categories.length).fill(foregroundColor),
          },
        },
        axisBorder: {
          color: borderColor,
        },
        axisTicks: {
          color: borderColor,
        },
      },
      yaxis: {
        title: {
          text: "Amount ($)",
          style: {
            color: foregroundColor,
          },
        },
        labels: {
          style: {
            colors: Array(chartData.categories.length).fill(foregroundColor),
          },
          formatter: (value) => {
            return `$${value.toFixed(0)}`;
          },
        },
      },
      fill: {
        opacity: 1,
      },
      colors: ["#22c55e", "#ef4444"], // green for income, red for expense
      tooltip: {
        theme: "dark",
        y: {
          formatter: (value) => {
            return `$${value.toFixed(2)}`;
          },
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        labels: {
          colors: [foregroundColor],
        },
        markers: {
          size: 4,
        },
      },
      grid: {
        borderColor: borderColor,
        strokeDashArray: 4,
      },
    };
  }, [chartData.categories, themeColors]);

  // Quick selector presets for common ranges
  const quickSelectors = [
    {
      label: "Last 3 Months",
      startMonth: new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 2,
        1
      ),
      endMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
    {
      label: "Last 6 Months",
      startMonth: new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1
      ),
      endMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
    {
      label: "This Year",
      startMonth: new Date(new Date().getFullYear(), 0, 1),
      endMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
    {
      label: "Last Year",
      startMonth: new Date(new Date().getFullYear() - 1, 0, 1),
      endMonth: new Date(new Date().getFullYear() - 1, 11, 1),
    },
  ];

  return (
    <Card className="mx-2">
      <CardHeader>
        <CardTitle>Income vs Expense</CardTitle>
        <CardDescription>
          Monthly comparison of income and expenses
        </CardDescription>

        {/* Month Range Picker */}
        <div className="mt-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange ? (
                  `${format(dateRange.start, "MMM yyyy")} - ${format(
                    dateRange.end,
                    "MMM yyyy"
                  )}`
                ) : (
                  <span>Pick a month range</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-fit">
              <DialogHeader>
                <DialogTitle>Select Month Range</DialogTitle>
              </DialogHeader>
              <MonthRangePicker
                onMonthRangeSelect={handleMonthRangeSelect}
                selectedMonthRange={dateRange}
                quickSelectors={quickSelectors}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.incomeData.every((val) => val === 0) &&
        chartData.expenseData.every((val) => val === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              No transaction data available for selected period
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Add some transactions to see your financial statistics
            </p>
          </div>
        ) : (
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={350}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default IncomeExpenseChart;
