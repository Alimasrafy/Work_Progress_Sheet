"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type MonthBucket = {
  key: string;
  revenue: {
    USD: number;
    EUR: number;
  };
  projects: number;
};

export function MonthlyRevenueChart({ months }: { months: MonthBucket[] }) {
  return (
    <Bar
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            grid: { color: "rgba(148, 163, 184, 0.22)" }
          }
        },
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }}
      data={{
        labels: months.map((month) => month.key),
        datasets: [
          {
            label: "EUR Revenue",
            data: months.map((month) => month.revenue.EUR),
            backgroundColor: "rgba(37, 99, 235, 0.72)",
            borderRadius: 5
          },
          {
            label: "USD Revenue",
            data: months.map((month) => month.revenue.USD),
            backgroundColor: "rgba(245, 158, 11, 0.72)",
            borderRadius: 5
          }
        ]
      }}
    />
  );
}
