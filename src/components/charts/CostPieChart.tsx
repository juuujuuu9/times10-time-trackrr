import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface ProjectCostData {
  projectId: string;
  projectName: string;
  clientName: string;
  totalCost: number;
  totalHours: number;
}

interface CostPieChartProps {
  data: ProjectCostData[];
}

export default function CostPieChart({ data }: CostPieChartProps) {
  const chartData = {
    labels: data.map(item => item.projectName),
    datasets: [
      {
        data: data.map(item => Number(item.totalCost)),
        backgroundColor: [
          '#10B981',
          '#F59E0B',
          '#EC4899',
          '#8B5CF6',
          '#06B6D4',
          '#84CC16',
          '#F97316',
          '#4F46E5',
        ],
        borderColor: [
          '#059669',
          '#D97706',
          '#BE185D',
          '#7C3AED',
          '#0891B2',
          '#65A30D',
          '#EA580C',
          '#3730A3',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#D1D5DB',
          font: {
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            return `${data[index].projectName} (${data[index].clientName})`;
          },
          label: (context: any) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `Cost: $${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Pie data={chartData} options={options} />
    </div>
  );
} 