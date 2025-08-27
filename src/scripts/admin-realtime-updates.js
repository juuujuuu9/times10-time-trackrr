// Admin Real-time Updates Utility
// This script handles real-time updates across admin pages when time entries are created/modified

class AdminRealTimeUpdates {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.updateInterval = null;
    this.lastUpdateTime = Date.now();
    this.isUpdating = false;
    
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('/admin/time-entries')) return 'time-entries';
    if (path.includes('/admin/reports')) return 'reports';
    if (path.includes('/admin/dashboard') || path === '/admin') return 'dashboard';
    if (path.includes('/admin/tasks')) return 'tasks';
    if (path.includes('/admin/projects')) return 'projects';
    if (path.includes('/admin/clients')) return 'clients';
    if (path.includes('/admin/users')) return 'users';
    return 'other';
  }

  init() {
    // Listen for time entry creation events from the timer
    window.addEventListener('timeEntryCreated', this.handleTimeEntryCreated.bind(this));
    
    // Listen for time entry updates from the time entries page
    window.addEventListener('timeEntryUpdated', this.handleTimeEntryUpdated.bind(this));
    
    // Listen for time entry deletions
    window.addEventListener('timeEntryDeleted', this.handleTimeEntryDeleted.bind(this));
    
    // Listen for task status updates
    window.addEventListener('taskStatusUpdated', this.handleTaskStatusUpdated.bind(this));
    
    // Set up periodic updates for dashboard and reports pages
    if (this.currentPage === 'dashboard' || this.currentPage === 'reports') {
      this.startPeriodicUpdates();
    }
    
    // Set up real-time updates for time entries page
    if (this.currentPage === 'time-entries') {
      this.setupTimeEntriesUpdates();
    }
  }

  handleTimeEntryCreated(event) {
    console.log('Time entry created event received:', event.detail);
    
    // Update the current page based on the event
    switch (this.currentPage) {
      case 'time-entries':
        this.refreshTimeEntriesTable();
        break;
      case 'dashboard':
        this.refreshDashboardData();
        break;
      case 'reports':
        this.refreshReportsData();
        break;
      default:
        // For other pages, just show a notification
        this.showNotification('New time entry created', 'success');
        break;
    }
  }

  handleTimeEntryUpdated(event) {
    console.log('Time entry updated event received:', event.detail);
    
    switch (this.currentPage) {
      case 'time-entries':
        this.refreshTimeEntriesTable();
        break;
      case 'dashboard':
        this.refreshDashboardData();
        break;
      case 'reports':
        this.refreshReportsData();
        break;
      default:
        this.showNotification('Time entry updated', 'info');
        break;
    }
  }

  handleTimeEntryDeleted(event) {
    console.log('Time entry deleted event received:', event.detail);
    
    switch (this.currentPage) {
      case 'time-entries':
        this.refreshTimeEntriesTable();
        break;
      case 'dashboard':
        this.refreshDashboardData();
        break;
      case 'reports':
        this.refreshReportsData();
        break;
      default:
        this.showNotification('Time entry deleted', 'warning');
        break;
    }
  }

  handleTaskStatusUpdated(event) {
    console.log('Task status updated event received:', event.detail);
    
    switch (this.currentPage) {
      case 'tasks':
        this.refreshTasksData();
        break;
      case 'projects':
        this.refreshProjectsData();
        break;
      case 'dashboard':
        this.refreshDashboardData();
        break;
      case 'reports':
        this.refreshReportsData();
        break;
      default:
        this.showNotification('Task status updated', 'info');
        break;
    }
  }

  async refreshTimeEntriesTable() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      // Fetch updated time entries data
      const response = await fetch('/api/admin/time-entries');
      if (response.ok) {
        const data = await response.json();
        this.updateTimeEntriesTable(data);
      }
    } catch (error) {
      console.error('Error refreshing time entries:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  updateTimeEntriesTable(data) {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Add new rows
    data.forEach(entry => {
      const row = this.createTimeEntryRow(entry);
      tbody.appendChild(row);
    });

    // Update results counter
    this.updateResultsCounter(data.length);
    
    // Show notification
    this.showNotification('Time entries updated', 'success');
  }

  createTimeEntryRow(entry) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';
    
    const taskDate = new Date(entry.startTime);
    const duration = entry.durationManual ? entry.durationManual / 3600 : 0;
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${entry.userName}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${entry.clientName}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${entry.projectName}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${entry.taskName}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        ${taskDate.toLocaleDateString()}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${duration ? Math.round(duration * 10) / 10 : 0} hours
      </td>
      <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
        ${entry.notes || '-'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex justify-end space-x-2">
          <button
            class="edit-time-entry-btn inline-flex items-center px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            data-time-entry-id="${entry.id}"
            title="Edit time entry"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Edit
          </button>
          <button
            class="delete-time-entry-btn inline-flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            data-time-entry-id="${entry.id}"
            data-time-entry-notes="${entry.notes || 'No notes'}"
            title="Delete time entry"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </button>
        </div>
      </td>
    `;

    return row;
  }

  async refreshDashboardData() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      // Reload the dashboard page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async refreshReportsData() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      // Reload the reports page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing reports:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async refreshTasksData() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      // Reload the tasks page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async refreshProjectsData() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      // Reload the projects page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing projects:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  setupTimeEntriesUpdates() {
    // Set up event listeners for edit/delete buttons on dynamically added rows
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      // Handle delete time entry button
      if (target.classList.contains('delete-time-entry-btn') || target.closest('.delete-time-entry-btn')) {
        const timeEntryId = parseInt(target.getAttribute('data-time-entry-id') || target.closest('.delete-time-entry-btn')?.getAttribute('data-time-entry-id') || '0');
        this.deleteTimeEntry(timeEntryId);
        return;
      }
      
      // Handle edit time entry button
      if (target.classList.contains('edit-time-entry-btn') || target.closest('.edit-time-entry-btn')) {
        const timeEntryId = parseInt(target.getAttribute('data-time-entry-id') || target.closest('.edit-time-entry-btn')?.getAttribute('data-time-entry-id') || '0');
        this.editTimeEntry(timeEntryId);
        return;
      }
    });
  }

  startPeriodicUpdates() {
    // Update every 30 seconds for dashboard and reports
    this.updateInterval = setInterval(() => {
      if (this.currentPage === 'dashboard') {
        this.refreshDashboardData();
      } else if (this.currentPage === 'reports') {
        this.refreshReportsData();
      }
    }, 30000); // 30 seconds
  }

  updateResultsCounter(count) {
    const resultsCounter = document.getElementById('resultsCounter');
    if (resultsCounter) {
      resultsCounter.textContent = `Showing ${count} time entries`;
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    // Set colors based on type
    switch (type) {
      case 'success':
        notification.className += ' bg-green-500 text-white';
        break;
      case 'error':
        notification.className += ' bg-red-500 text-white';
        break;
      case 'warning':
        notification.className += ' bg-yellow-500 text-white';
        break;
      default:
        notification.className += ' bg-blue-500 text-white';
        break;
    }
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Cleanup method
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    window.removeEventListener('timeEntryCreated', this.handleTimeEntryCreated.bind(this));
    window.removeEventListener('timeEntryUpdated', this.handleTimeEntryUpdated.bind(this));
    window.removeEventListener('timeEntryDeleted', this.handleTimeEntryDeleted.bind(this));
    window.removeEventListener('taskStatusUpdated', this.handleTaskStatusUpdated.bind(this));
  }
}

// Initialize real-time updates when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.adminRealTimeUpdates = new AdminRealTimeUpdates();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.adminRealTimeUpdates) {
    window.adminRealTimeUpdates.destroy();
  }
});
