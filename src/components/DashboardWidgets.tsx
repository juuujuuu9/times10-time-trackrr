import React from 'react';

interface DashboardWidgetsProps {
  totalHours: number;
  totalCost: number;
  activeTeamMembers: number;
  totalProjects: number;
  period: string;
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  totalHours,
  totalCost,
  activeTeamMembers,
  totalProjects,
  period
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const avgHoursPerMember = activeTeamMembers > 0 ? totalHours / activeTeamMembers : 0;
  const avgCostPerHour = totalHours > 0 ? Math.round(totalCost / (totalHours / 3600)) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Productivity Score */}
      <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 rounded-xl border border-indigo-600/30 p-6 hover:border-indigo-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-300">Productivity Score</p>
            <p className="text-2xl font-bold text-white">
              {activeTeamMembers > 0 ? Math.round((totalHours / (activeTeamMembers * 40 * 3600)) * 100) : 0}%
            </p>
            <p className="text-xs text-indigo-400">vs 40h/week target</p>
          </div>
          <div className="p-3 bg-indigo-600/30 rounded-xl">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Average Hours per Member */}
      <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-xl border border-emerald-600/30 p-6 hover:border-emerald-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-300">Avg Hours/Member</p>
            <p className="text-2xl font-bold text-white">{formatDuration(avgHoursPerMember)}</p>
            <p className="text-xs text-emerald-400">This {period.toLowerCase()}</p>
          </div>
          <div className="p-3 bg-emerald-600/30 rounded-xl">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Average Rate */}
      <div className="bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-xl border border-amber-600/30 p-6 hover:border-amber-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-300">Average Rate</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(avgCostPerHour)}</p>
            <p className="text-xs text-amber-400">Per hour</p>
          </div>
          <div className="p-3 bg-amber-600/30 rounded-xl">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Project Efficiency */}
      <div className="bg-gradient-to-br from-rose-600/20 to-rose-800/20 rounded-xl border border-rose-600/30 p-6 hover:border-rose-500/50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-rose-300">Project Efficiency</p>
            <p className="text-2xl font-bold text-white">
              {totalProjects > 0 ? Math.round((activeTeamMembers / totalProjects) * 10) / 10 : 0}
            </p>
            <p className="text-xs text-rose-400">Members per project</p>
          </div>
          <div className="p-3 bg-rose-600/30 rounded-xl">
            <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
