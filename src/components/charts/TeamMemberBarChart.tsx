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

interface TeamMemberData {
  userName: string;
  totalHours: number;
}

interface TeamMemberBarChartProps {
  data: TeamMemberData[];
}

export default function TeamMemberBarChart({ data }: TeamMemberBarChartProps) {
  const chartData = {
    labels: data.map(item => item.userName),
    datasets: [
      {
        label: 'Hours',
        data: data.map(item => Math.round(item.totalHours * 10) / 10),
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
            return context[0].label;
          },
          label: (context: any) => {
            return `Hours: ${context.parsed.y}`;
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
          callback: (value: any) => `${value}h`,
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