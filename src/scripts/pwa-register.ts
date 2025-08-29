// PWA Service Worker Registration
export function registerPWA() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update prompt
                  showUpdatePrompt(registration);
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

function showUpdatePrompt(registration: ServiceWorkerRegistration) {
  // Create update notification
  const updateNotification = document.createElement('div');
  updateNotification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  updateNotification.innerHTML = `
    <div class="flex items-center space-x-2">
      <span>New version available!</span>
      <button id="update-btn" class="bg-white text-blue-500 px-2 py-1 rounded text-sm font-medium hover:bg-gray-100">
        Update
      </button>
      <button id="dismiss-btn" class="text-white hover:text-gray-200">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(updateNotification);
  
  // Handle update button click
  document.getElementById('update-btn')?.addEventListener('click', () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });
  
  // Handle dismiss button click
  document.getElementById('dismiss-btn')?.addEventListener('click', () => {
    document.body.removeChild(updateNotification);
  });
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.body.contains(updateNotification)) {
      document.body.removeChild(updateNotification);
    }
  }, 10000);
}

// Handle service worker messages
if (typeof window !== 'undefined') {
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'RELOAD_PAGE') {
      window.location.reload();
    }
  });
}
