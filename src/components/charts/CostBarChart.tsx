import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
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

interface CostBarChartProps {
  data: ProjectCostData[];
}

export default function CostBarChart({ data }: CostBarChartProps) {
  const chartData = {
    labels: data.map(item => item.projectName),
    datasets: [
      {
        label: 'Cost ($)',
        data: data.map(item => Math.round(item.totalCost * 100) / 100),
        backgroundColor: [
          '#10B981',
          '#4F46E5',
          '#F59E0B',
          '#EC4899',
          '#8B5CF6',
          '#06B6D4',
          '#84CC16',
          '#F97316',
        ],
        borderColor: [
          '#059669',
          '#3730A3',
          '#D97706',
          '#BE185D',
          '#7C3AED',
          '#0891B2',
          '#65A30D',
          '#EA580C',
        ],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            return `${data[index].projectName} (${data[index].clientName})`;
          },
          label: (context: any) => {
            const index = context[0].dataIndex;
            const cost = context.parsed.y;
            const hours = data[index].totalHours;
            return [
              `Cost: $${cost.toFixed(2)}`,
              `Hours: ${hours.toFixed(1)}h`,
              `Rate: $${hours > 0 ? (cost / hours).toFixed(2) : '0.00'}/h`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#374151',
          drawBorder: false,
        },
        ticks: {
          color: '#D1D5DB',
          font: {
            size: 12,
          },
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: '#374151',
          drawBorder: false,
        },
        ticks: {
          color: '#D1D5DB',
          font: {
            size: 12,
          },
          callback: (value: any) => `$${value}`,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
} 