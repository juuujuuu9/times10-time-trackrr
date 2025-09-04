import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  ChartDataLabels
);

interface ChartData {
  projectName?: string;
  clientName?: string;
  totalCost: number;
  totalHours: number;
}

interface TimeSeriesData {
  date: string;
  hours: number;
  cost: number;
}

interface ReportsChartsProps {
  projectCosts: ChartData[];
  clientCosts: ChartData[];
  timeSeriesData: TimeSeriesData[];
  period: string;
  viewType: 'project' | 'client';
}

export const HorizontalBarChart: React.FC<{ data: ChartData[]; title: string; period: string }> = ({ data, title, period }) => {
  // Sort data by cost in descending order for better visualization
  const sortedData = [...data].sort((a, b) => b.totalCost - a.totalCost);

  // Calculate better scaling for small value differences
  const maxCost = Math.max(...sortedData.map(item => item.totalCost));
  const suggestedMax = maxCost < 100 ? Math.ceil(maxCost * 1.2) : Math.ceil(maxCost * 1.1);

  // Function to copy value to clipboard
  const copyToClipboard = (value: number, label: string) => {
    const text = `$${value.toLocaleString()}`;
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log(`Copied ${text} for ${label}`);
    });
  };

  const chartData = {
    labels: sortedData.map(item => {
      if (item.projectName && item.clientName) {
        return `${item.projectName}\n${item.clientName}`;
      }
      return item.projectName || item.clientName || 'Unknown';
    }),
    datasets: [
      {
        label: 'Cost ($)',
        data: sortedData.map(item => item.totalCost),
        backgroundColor: 'rgba(214, 58, 46, 0.8)',
        borderColor: 'rgba(214, 58, 46, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const, // This makes it horizontal
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 10,
        right: 50, // Extra padding for value labels
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend for cleaner look
      },
      title: {
        display: true,
        text: title,
        color: '#1F2937',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        callbacks: {
          title: function(context: any) {
            const item = sortedData[context[0].dataIndex];
            if (item.projectName && item.clientName) {
              return [item.projectName, item.clientName];
            }
            return item.projectName || item.clientName || 'Unknown';
          },
          label: function(context: any) {
            return `Cost: $${context.parsed.x.toLocaleString()}`;
          },
        },
      },
      datalabels: {
        display: true,
        color: '#1F2937',
        anchor: 'end' as const,
        align: 'right' as const,
        offset: 10,
        font: {
          weight: 'bold' as const,
          size: 12,
        },
        formatter: function(value: any) {
          return `$${parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const value = sortedData[elementIndex].totalCost;
        const label = sortedData[elementIndex].projectName || sortedData[elementIndex].clientName || 'Unknown';
        copyToClipboard(value, label);
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        display: true,
        position: 'bottom' as const,
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return `$${value.toLocaleString()}`;
          },
        },
        grid: {
          color: '#E5E7EB',
        },
        title: {
          display: true,
          text: 'Cost ($)',
          color: '#6B7280',
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        // Add better scaling for small value differences
        beginAtZero: true,
        suggestedMax: suggestedMax,
        // Add padding to prevent cut-off
        afterBuildTicks: function(scale: any) {
          scale.max = scale.max * 1.05; // Add 5% padding to the right
        },
      },
      y: {
        type: 'category' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: '#6B7280',
          maxRotation: 0,
          font: {
            size: 12,
          },
          callback: function(value: any, index: number) {
            const item = sortedData[index];
            if (item.projectName && item.clientName) {
              return [
                item.projectName,
                item.clientName
              ];
            }
            return item.projectName || item.clientName || 'Unknown';
          }
        },
        grid: {
          display: false,
        },
        // Add more space between bars
        afterBuildTicks: function(scale: any) {
          scale.max = scale.max + 0.5; // Add padding at the top
        },
      },
    },
  };

  // Calculate dynamic height based on number of items
  const minHeight = 400;
  const itemHeight = 35; // Height per item
  const calculatedHeight = Math.max(minHeight, sortedData.length * itemHeight + 100);

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
      <div className="mb-4 text-sm text-gray-600">
        💡 Click on any bar to copy the cost value to your clipboard
      </div>
      <div style={{ height: `${calculatedHeight}px` }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export const CostBarChart: React.FC<{ data: ChartData[]; title: string; period: string }> = ({ data, title, period }) => {
  const chartData = {
    labels: data.map(item => item.projectName || item.clientName || 'Unknown'),
    datasets: [
      {
        label: 'Cost ($)',
        data: data.map(item => item.totalCost),
        backgroundColor: 'rgba(214, 58, 46, 0.8)',
        borderColor: 'rgba(214, 58, 46, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Hours',
        data: data.map(item => item.totalHours / 3600), // Convert seconds to hours
        backgroundColor: 'rgba(107, 114, 128, 0.8)',
        borderColor: 'rgba(107, 114, 128, 1)',
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: title,
        color: '#1F2937',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            if (context.datasetIndex === 0) {
              return `Cost: $${context.parsed.y.toLocaleString()}`;
            } else {
              return `Hours: ${context.parsed.y.toFixed(1)}h`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#6B7280',
          maxRotation: 45,
        },
        grid: {
          color: '#E5E7EB',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            return `$${value.toLocaleString()}`;
          },
        },
        grid: {
          color: '#E5E7EB',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            return `${value.toFixed(1)}h`;
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export const CostDoughnutChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Green
    'rgba(245, 158, 11, 0.8)',   // Yellow
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(139, 92, 246, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(14, 165, 233, 0.8)',   // Sky Blue
    'rgba(34, 197, 94, 0.8)',    // Emerald
  ];

  const chartData = {
    labels: data.map(item => item.projectName || item.clientName || 'Unknown'),
    datasets: [
      {
        data: data.map(item => {
          const cost = item.totalCost;
          return cost || 0;
        }),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
        hoverOffset: 4,
        cutout: '40%', // Make the hole much smaller for thicker segments
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5,
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#374151',
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          padding: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
        },
      },
      title: {
        display: true,
        text: title,
        color: '#1F2937',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            // Convert data values to numbers for accurate calculation
            const dataValues = context.dataset.data.map((v: any) => parseFloat(v) || 0);
            const total = dataValues.reduce((a: number, b: number) => a + b, 0);
            const value = parseFloat(context.parsed) || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: '#1F2937',
        font: {
          weight: 'bold' as const,
          size: 11,
        },
        formatter: function(value: any, context: any) {
          // Get the actual data values from the dataset and ensure they're numbers
          const dataValues = context.dataset.data.map((v: any) => parseFloat(v) || 0);
          const total = dataValues.reduce((a: number, b: number) => a + b, 0);
          
          // Use the data index to get the correct value
          const dataIndex = context.dataIndex;
          const numValue = dataValues[dataIndex] || 0;
          
          // Debug logging
          console.log('Datalabels formatter:', {
            value: value,
            dataIndex: dataIndex,
            numValue: numValue,
            dataValues: dataValues,
            total: total
          });
          
          const percentage = total > 0 ? ((numValue / total) * 100).toFixed(1) : '0.0';
          const formattedValue = numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          return `${percentage}%\n$${formattedValue}`;
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
      <div className="h-[500px]">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export const TimeSeriesChart: React.FC<{ data: TimeSeriesData[]; period: string }> = ({ data, period }) => {
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Hours',
        data: data.map(item => item.hours / 3600), // Convert seconds to hours
        borderColor: 'rgba(214, 58, 46, 1)',
        backgroundColor: 'rgba(214, 58, 46, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(214, 58, 46, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Cost ($)',
        data: data.map(item => item.cost),
        borderColor: 'rgba(107, 114, 128, 1)',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(107, 114, 128, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `Time & Cost Trends - ${period}`,
        color: '#1F2937',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#374151',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            if (context.datasetIndex === 0) {
              return `Hours: ${context.parsed.y.toFixed(1)}h`;
            } else {
              return `Cost: $${context.parsed.y.toLocaleString()}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#6B7280',
        },
        grid: {
          color: '#E5E7EB',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            return `${value.toFixed(1)}h`;
          },
        },
        grid: {
          color: '#E5E7EB',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            return `$${value.toLocaleString()}`;
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export const ReportsCharts: React.FC<ReportsChartsProps> = ({ 
  projectCosts, 
  clientCosts, 
  timeSeriesData, 
  period, 
  viewType 
}) => {
  const currentData = viewType === 'project' ? projectCosts : clientCosts;
  const chartTitle = viewType === 'project' ? 'Project Costs' : 'Client Costs';

  return (
    <div className="space-y-8">
      {/* Main Charts Section - Full width Doughnut chart */}
      {currentData.length > 0 && (
        <div className="space-y-8">
          {/* Horizontal Bar Chart - Cost per Project/Client */}
          <HorizontalBarChart 
            data={currentData} 
            title={`${chartTitle} - ${period}`} 
            period={period} 
          />

          {/* Doughnut Chart - Full Width */}
          <CostDoughnutChart 
            data={currentData} 
            title={`${chartTitle} Distribution - ${period}`} 
          />
        </div>
      )}

              {/* No Data Message */}
        {currentData.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-300 p-12 text-center shadow-sm">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">
            No {viewType === 'project' ? 'project' : 'client'} costs for this time period
          </p>
        </div>
      )}
    </div>
  );
};
