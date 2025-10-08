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
  taskName?: string;
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
  canViewFinancialData: boolean;
}

export const HorizontalBarChart: React.FC<{ data: ChartData[]; title: string; period: string; canViewFinancialData: boolean }> = ({ data, title, period, canViewFinancialData }) => {
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
      const parts = [];
      if (item.clientName) parts.push(item.clientName);
      if (item.projectName) parts.push(item.projectName);
      if (item.taskName) parts.push(item.taskName);
      return parts.length > 0 ? parts.join(' - ') : 'Unknown';
    }),
    datasets: [
      {
        label: canViewFinancialData ? 'Cost ($)' : 'Hours',
        data: canViewFinancialData 
          ? sortedData.map(item => item.totalCost)
          : sortedData.map(item => item.totalHours / 3600), // Show hours instead of cost
        backgroundColor: canViewFinancialData 
          ? 'rgba(214, 58, 46, 0.8)' 
          : 'rgba(59, 130, 246, 0.8)',
        borderColor: canViewFinancialData 
          ? 'rgba(214, 58, 46, 1)' 
          : 'rgba(59, 130, 246, 1)',
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
            if (canViewFinancialData) {
              return `Cost: $${context.parsed.x.toLocaleString()}`;
            } else {
              return `Hours: ${context.parsed.x.toFixed(1)}h`;
            }
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
          if (canViewFinancialData) {
            return `$${parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
          } else {
            return `${parseFloat(value).toFixed(1)}h`;
          }
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const elementIndex = elements[0].index;
        const value = canViewFinancialData 
          ? sortedData[elementIndex].totalCost 
          : sortedData[elementIndex].totalHours / 3600;
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
            if (canViewFinancialData) {
              return `$${value.toLocaleString()}`;
            } else {
              return `${value.toFixed(1)}h`;
            }
          },
        },
        grid: {
          color: '#E5E7EB',
        },
        title: {
          display: true,
          text: canViewFinancialData ? 'Cost ($)' : 'Hours',
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
    labels: data.map(item => {
      const parts = [];
      if (item.clientName) parts.push(item.clientName);
      if (item.projectName) parts.push(item.projectName);
      if (item.taskName) parts.push(item.taskName);
      return parts.length > 0 ? parts.join(' - ') : 'Unknown';
    }),
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

export const CostDoughnutChart: React.FC<{ data: ChartData[]; title: string; canViewFinancialData: boolean }> = ({ data, title, canViewFinancialData }) => {
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

  // Group data by client for hierarchical legend
  const groupedData = data.reduce((acc, item, index) => {
    const clientName = item.clientName || 'Unknown Client';
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push({ ...item, originalIndex: index });
    return acc;
  }, {} as Record<string, Array<ChartData & { originalIndex: number }>>);

  const chartData = {
    labels: data.map(item => {
      const parts = [];
      if (item.clientName) parts.push(item.clientName);
      if (item.projectName) parts.push(item.projectName);
      if (item.taskName) parts.push(item.taskName);
      return parts.length > 0 ? parts.join(' - ') : 'Unknown';
    }),
    datasets: [
      {
        data: data.map(item => {
          if (canViewFinancialData) {
            const cost = item.totalCost;
            return cost || 0;
          } else {
            const hours = item.totalHours / 3600;
            return hours || 0;
          }
        }),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(color => color.replace('0.8', '1')),
        borderWidth: 2,
        hoverOffset: 4,
        cutout: '40%', // Make the hole much smaller for thicker segments
      },
    ],
  };

  // Custom legend component
  const CustomLegend = ({ 
    chartRef, 
    selectedProject, 
    setSelectedProject 
  }: { 
    chartRef: any;
    selectedProject: ChartData | null;
    setSelectedProject: (project: ChartData | null) => void;
  }) => {
    const selectProject = (project: ChartData & { originalIndex: number }) => {
      setSelectedProject(project);
    };

    return (
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(groupedData).map(([clientName, clientProjects]) => (
          <div key={clientName} className="space-y-2">
            {/* Client Header */}
            <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
              <div className="text-sm font-semibold text-gray-800 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {clientName}
              </div>
            </div>
            
            {/* Projects under this client */}
            <div className="ml-4 space-y-1">
              {clientProjects.map((project) => {
                const backgroundColor = colors[project.originalIndex % colors.length];
                const projectName = project.projectName || 'Unknown Project';
                
                const isSelected = selectedProject?.projectName === project.projectName && 
                                 selectedProject?.clientName === project.clientName;
                
                return (
                  <div 
                    key={project.originalIndex}
                    className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                    onClick={() => selectProject(project)}
                  >
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor }}
                    />
                    <span className={`text-sm flex-1 truncate ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                      {projectName}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-blue-600 flex-shrink-0">(selected)</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Project details component
  const ProjectDetails = ({ project }: { project: ChartData }) => {
    const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    
    const totalCost = project.totalCost || 0;
    const totalHours = project.totalHours || 0;
    const hoursInHours = totalHours / 3600; // Convert seconds to hours
    
    // Fetch team members when component mounts
    React.useEffect(() => {
      const fetchTeamMembers = async () => {
        setLoading(true);
        setError(null);
        
        try {
          // This would be the actual API call to get team members for this project
          // For now, we'll simulate with mock data
          const response = await fetch(`/api/projects/${project.projectName}/team-members`);
          
          if (response.ok) {
            const data = await response.json();
            setTeamMembers(data.teamMembers || []);
          } else {
            // Fallback to mock data for demonstration
            setTeamMembers([
              {
                id: 1,
                name: 'John Doe',
                hours: 24.5,
                cost: 2450,
                avatar: null
              },
              {
                id: 2,
                name: 'Jane Smith',
                hours: 18.0,
                cost: 1800,
                avatar: null
              },
              {
                id: 3,
                name: 'Mike Johnson',
                hours: 12.5,
                cost: 1250,
                avatar: null
              }
            ]);
          }
        } catch (err) {
          console.error('Error fetching team members:', err);
          setError('Failed to load team members');
          // Fallback to mock data
          setTeamMembers([
            {
              id: 1,
              name: 'John Doe',
              hours: 24.5,
              cost: 2450,
              avatar: null
            },
            {
              id: 2,
              name: 'Jane Smith',
              hours: 18.0,
              cost: 1800,
              avatar: null
            }
          ]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchTeamMembers();
    }, [project.projectName]);
    
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Project Details</h3>
          <button
            onClick={() => setSelectedProject(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Project Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">{project.projectName}</h4>
            <p className="text-sm text-gray-600">{project.clientName}</p>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {canViewFinancialData ? `$${totalCost.toLocaleString()}` : `${hoursInHours.toFixed(1)}h`}
              </div>
              <div className="text-sm text-blue-700">
                {canViewFinancialData ? 'Total Cost' : 'Total Hours'}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {canViewFinancialData ? `${hoursInHours.toFixed(1)}h` : `$${totalCost.toLocaleString()}`}
              </div>
              <div className="text-sm text-green-700">
                {canViewFinancialData ? 'Total Hours' : 'Total Cost'}
              </div>
            </div>
          </div>
          
          {/* Team Members */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-3">Team Members</h5>
            
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading team members...</span>
              </div>
            ) : error ? (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            ) : teamMembers.length > 0 ? (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{member.name}</div>
                        <div className="text-sm text-gray-500">
                          {canViewFinancialData ? `$${member.cost.toLocaleString()}` : `${member.hours}h`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-800">
                        {canViewFinancialData ? `${member.hours}h` : `$${member.cost.toLocaleString()}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {canViewFinancialData ? 'Hours' : 'Cost'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No team members found for this project.
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
        display: false, // Hide default legend since we're using custom one
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
            if (canViewFinancialData) {
              return `${context.label}: $${value.toLocaleString()} (${percentage}%)`;
            } else {
              return `${context.label}: ${value.toFixed(1)}h (${percentage}%)`;
            }
          },
        },
      },
      datalabels: {
        color: '#1F2937',
        font: {
          weight: 'bold' as const,
          size: 11,
        },
        display: function(context: any) {
          // Hide labels for hidden segments
          const meta = context.chart.getDatasetMeta(0);
          if (meta && meta.data[context.dataIndex]) {
            return !meta.data[context.dataIndex].hidden;
          }
          return true;
        },
        formatter: function(value: any, context: any) {
          // Get the actual data values from the dataset and ensure they're numbers
          const dataValues = context.dataset.data.map((v: any) => parseFloat(v) || 0);
          const total = dataValues.reduce((a: number, b: number) => a + b, 0);
          
          // Use the data index to get the correct value
          const dataIndex = context.dataIndex;
          const numValue = dataValues[dataIndex] || 0;
          
          const percentage = total > 0 ? ((numValue / total) * 100).toFixed(1) : '0.0';
          if (canViewFinancialData) {
            const formattedValue = numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return `${percentage}%\n$${formattedValue}`;
          } else {
            return `${percentage}%\n${numValue.toFixed(1)}h`;
          }
        },
      },
    },
  };

  const [chartRef, setChartRef] = React.useState<any>(null);
  const [selectedProject, setSelectedProject] = React.useState<ChartData | null>(null);

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
      <div className="mb-4 text-sm text-gray-600">
        💡 Click on legend items to view project details. Projects are grouped by client.
      </div>
      <div className="flex gap-6">
        {/* Chart or Project Details - Left Side */}
        <div className="flex-1">
          {selectedProject ? (
            <ProjectDetails project={selectedProject} />
          ) : (
            <div className="h-[400px]">
              <Doughnut 
                data={chartData} 
                options={options}
                ref={(ref) => setChartRef(ref)}
              />
            </div>
          )}
        </div>
        
        {/* Custom Legend - Right Side */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Legend</h3>
            <CustomLegend 
              chartRef={chartRef} 
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
            />
          </div>
        </div>
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
  viewType,
  canViewFinancialData
}) => {
  const currentData = viewType === 'project' ? projectCosts : clientCosts;
  const chartTitle = canViewFinancialData 
    ? (viewType === 'project' ? 'Project Costs' : 'Client Costs')
    : (viewType === 'project' ? 'Project Hours' : 'Client Hours');

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
            canViewFinancialData={canViewFinancialData}
          />

          {/* Doughnut Chart - Full Width */}
          <CostDoughnutChart 
            data={currentData} 
            title={`${chartTitle} Distribution - ${period}`}
            canViewFinancialData={canViewFinancialData}
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
