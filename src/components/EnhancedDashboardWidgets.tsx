import React, { useState, useEffect } from 'react';

interface TimeEntry {
  id: number;
  userId: number;
  projectId: number;
  startTime: string | null;
  endTime: string | null;
  durationManual: number | null;
  notes: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  userPayRate: string;
  projectName: string;
  clientName: string;
}

interface EnhancedDashboardWidgetsProps {
  timeEntries: TimeEntry[];
  period: string;
  canViewFinancialData: boolean;
}

export const EnhancedDashboardWidgets: React.FC<EnhancedDashboardWidgetsProps> = ({
  timeEntries,
  period,
  canViewFinancialData
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'users' | 'projects' | 'clients'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'hours' | 'cost' | 'entries'>('hours');

  // Calculate metrics
  const totalHours = timeEntries.reduce((sum, entry) => {
    if (entry.durationManual) {
      return sum + (entry.durationManual / 3600);
    } else if (entry.startTime && entry.endTime) {
      return sum + ((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60));
    }
    return sum;
  }, 0);

  const totalCost = timeEntries.reduce((sum, entry) => {
    if (entry.userPayRate) {
      const payRate = parseFloat(entry.userPayRate);
      if (entry.durationManual) {
        return sum + (entry.durationManual / 3600 * payRate);
      } else if (entry.startTime && entry.endTime) {
        const hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
        return sum + (hours * payRate);
      }
    }
    return sum;
  }, 0);

  const manualEntries = timeEntries.filter(e => e.durationManual).length;
  const timerEntries = timeEntries.filter(e => e.startTime && e.endTime).length;

  // User metrics
  const userMetrics = timeEntries.reduce((acc, entry) => {
    if (!acc[entry.userId]) {
      acc[entry.userId] = {
        name: entry.userName,
        email: entry.userEmail,
        payRate: entry.userPayRate,
        entries: 0,
        hours: 0,
        cost: 0,
        manualEntries: 0,
        timerEntries: 0
      };
    }

    const stats = acc[entry.userId];
    stats.entries++;

    let hours = 0;
    if (entry.durationManual) {
      hours = entry.durationManual / 3600;
      stats.manualEntries++;
    } else if (entry.startTime && entry.endTime) {
      hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
      stats.timerEntries++;
    }

    stats.hours += hours;

    if (entry.userPayRate) {
      const payRate = parseFloat(entry.userPayRate);
      stats.cost += hours * payRate;
    }

    return acc;
  }, {} as Record<number, any>);

  // Project metrics
  const projectMetrics = timeEntries.reduce((acc, entry) => {
    if (!acc[entry.projectId]) {
      acc[entry.projectId] = {
        name: entry.projectName,
        client: entry.clientName,
        entries: 0,
        hours: 0,
        cost: 0
      };
    }

    const stats = acc[entry.projectId];
    stats.entries++;

    let hours = 0;
    if (entry.durationManual) {
      hours = entry.durationManual / 3600;
    } else if (entry.startTime && entry.endTime) {
      hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
    }

    stats.hours += hours;

    if (entry.userPayRate) {
      const payRate = parseFloat(entry.userPayRate);
      stats.cost += hours * payRate;
    }

    return acc;
  }, {} as Record<number, any>);

  // Client metrics
  const clientMetrics = timeEntries.reduce((acc, entry) => {
    if (!acc[entry.clientName]) {
      acc[entry.clientName] = {
        entries: 0,
        hours: 0,
        cost: 0,
        projects: new Set()
      };
    }

    const stats = acc[entry.clientName];
    stats.entries++;
    stats.projects.add(entry.projectName);

    let hours = 0;
    if (entry.durationManual) {
      hours = entry.durationManual / 3600;
    } else if (entry.startTime && entry.endTime) {
      hours = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / (1000 * 60 * 60);
    }

    stats.hours += hours;

    if (entry.userPayRate) {
      const payRate = parseFloat(entry.userPayRate);
      stats.cost += hours * payRate;
    }

    return acc;
  }, {} as Record<string, any>);

  // Sort data based on selected metric
  const getSortedData = () => {
    switch (selectedView) {
      case 'users':
        return Object.values(userMetrics).sort((a: any, b: any) => {
          if (selectedMetric === 'hours') return b.hours - a.hours;
          if (selectedMetric === 'cost') return b.cost - a.cost;
          return b.entries - a.entries;
        });
      case 'projects':
        return Object.values(projectMetrics).sort((a: any, b: any) => {
          if (selectedMetric === 'hours') return b.hours - a.hours;
          if (selectedMetric === 'cost') return b.cost - a.cost;
          return b.entries - a.entries;
        });
      case 'clients':
        return Object.entries(clientMetrics).map(([name, data]: [string, any]) => ({
          name,
          ...data,
          projectCount: data.projects.size
        })).sort((a: any, b: any) => {
          if (selectedMetric === 'hours') return b.hours - a.hours;
          if (selectedMetric === 'cost') return b.cost - a.cost;
          return b.entries - a.entries;
        });
      default:
        return [];
    }
  };

  const sortedData = getSortedData();

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enhanced Analytics</h2>
            <p className="text-sm text-gray-600">Detailed insights into your time tracking data</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* View Selector */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'overview', label: 'Overview', icon: '📊' },
                { key: 'users', label: 'Users', icon: '👥' },
                { key: 'projects', label: 'Projects', icon: '📋' },
                { key: 'clients', label: 'Clients', icon: '🏢' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedView(key as any)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Metric Selector */}
            {selectedView !== 'overview' && (
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'hours', label: 'Hours', icon: '⏱️' },
                  { key: 'cost', label: 'Cost', icon: '💰' },
                  { key: 'entries', label: 'Entries', icon: '📝' }
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMetric(key as any)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedMetric === key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(totalHours)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {canViewFinancialData ? `$${Math.round(totalCost).toLocaleString()}` : '***'}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{timeEntries.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entry Types</p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.round(manualEntries/timeEntries.length*100)}% Manual
                </p>
                <p className="text-sm text-gray-500">
                  {Math.round(timerEntries/timeEntries.length*100)}% Timer
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Views */}
      {selectedView !== 'overview' && (
        <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedView === 'users' && '👥 Team Member Performance'}
              {selectedView === 'projects' && '📋 Project Analysis'}
              {selectedView === 'clients' && '🏢 Client Analysis'}
            </h3>
            <p className="text-sm text-gray-600">
              Sorted by {selectedMetric === 'hours' ? 'total hours' : selectedMetric === 'cost' ? 'total cost' : 'number of entries'}
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {sortedData.slice(0, 10).map((item: any, index: number) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">
                      {selectedView === 'clients' ? item.name : item.name}
                    </h4>
                    {selectedView === 'projects' && (
                      <p className="text-sm text-gray-600">Client: {item.client}</p>
                    )}
                    {selectedView === 'clients' && (
                      <p className="text-sm text-gray-600">{item.projectCount} projects</p>
                    )}
                    {selectedView === 'users' && (
                      <p className="text-sm text-gray-600">{item.email}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedMetric === 'hours' ? Math.round(item.hours) : 
                         selectedMetric === 'cost' ? (canViewFinancialData ? `$${Math.round(item.cost).toLocaleString()}` : '***') :
                         item.entries}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedMetric === 'hours' ? 'hours' : 
                         selectedMetric === 'cost' ? 'cost' : 'entries'}
                      </p>
                    </div>
                    
                    {selectedView === 'users' && (
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-700">
                          {Math.round(item.manualEntries)}/{Math.round(item.timerEntries)}
                        </p>
                        <p className="text-xs text-gray-500">manual/timer</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress bar for visual representation */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Hours: {Math.round(item.hours)}</span>
                    {canViewFinancialData && <span>Cost: ${Math.round(item.cost).toLocaleString()}</span>}
                    <span>Entries: {item.entries}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (item.hours / Math.max(...sortedData.map((d: any) => d.hours))) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Series Chart Placeholder */}
      <div className="bg-white rounded-lg border border-gray-300 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Time Tracking Trends</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p className="text-gray-500">Chart visualization would go here</p>
            <p className="text-sm text-gray-400">Integration with charting library needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};
