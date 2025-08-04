import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TimeEntryData {
  date: string;
  hours: number;
  cost: number;
}

interface TimeTrendChartProps {
  data: TimeEntryData[];
  type: 'hours' | 'cost';
}

export default function TimeTrendChart({ data, type }: TimeTrendChartProps) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: type === 'hours' ? 'Hours' : 'Cost ($)',
        data: data.map(item => type === 'hours' ? item.hours : item.cost),
        borderColor: type === 'hours' ? '#4F46E5' : '#10B981',
        backgroundColor: type === 'hours' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: type === 'hours' ? '#4F46E5' : '#10B981',
        pointBorderColor: '#1F2937',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
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
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            return type === 'hours' ? `Hours: ${value.toFixed(1)}` : `Cost: $${value.toFixed(2)}`;
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
          callback: (value: any) => {
            return type === 'hours' ? `${value}h` : `$${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
} 