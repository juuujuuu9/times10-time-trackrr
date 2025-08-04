import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface UserWorkloadData {
  userName: string;
  totalHours: number;
  totalCost: number;
}

interface UserWorkloadChartProps {
  data: UserWorkloadData[];
  type: 'hours' | 'cost';
}

export default function UserWorkloadChart({ data, type }: UserWorkloadChartProps) {
  const chartData = {
    labels: data.map(item => item.userName),
    datasets: [
      {
        data: data.map(item => type === 'hours' ? item.totalHours : item.totalCost),
        backgroundColor: [
          '#EC4899',
          '#8B5CF6',
          '#06B6D4',
          '#84CC16',
          '#F97316',
          '#4F46E5',
          '#10B981',
          '#F59E0B',
        ],
        borderColor: [
          '#BE185D',
          '#7C3AED',
          '#0891B2',
          '#65A30D',
          '#EA580C',
          '#3730A3',
          '#059669',
          '#D97706',
        ],
        borderWidth: 2,
        hoverOffset: 4,
        cutout: '60%',
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
          label: (context: any) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            if (type === 'hours') {
              return `${context.label}: ${value.toFixed(1)}h (${percentage}%)`;
            } else {
              return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
            }
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  );
} 