import { useState, useEffect } from 'react';

export default function PWAStatus() {
  const [pwaInfo, setPwaInfo] = useState({
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    isOnline: navigator.onLine,
    displayMode: 'browser'
  });

  useEffect(() => {
    // Check PWA status
    const checkPWAStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      setPwaInfo({
        isInstalled: isStandalone,
        isStandalone,
        hasServiceWorker,
        isOnline: navigator.onLine,
        displayMode: isStandalone ? 'standalone' : 'browser'
      });
    };

    checkPWAStatus();

    // Listen for online/offline events
    const handleOnline = () => setPwaInfo(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaInfo(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=pwa')) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-40 max-w-xs">
      <h3 className="text-xs font-medium text-gray-900 mb-2">PWA Status</h3>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Display Mode:</span>
          <span className={`font-medium ${pwaInfo.isStandalone ? 'text-green-600' : 'text-blue-600'}`}>
            {pwaInfo.displayMode}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Service Worker:</span>
          <span className={`font-medium ${pwaInfo.hasServiceWorker ? 'text-green-600' : 'text-red-600'}`}>
            {pwaInfo.hasServiceWorker ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Connection:</span>
          <span className={`font-medium ${pwaInfo.isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {pwaInfo.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        {pwaInfo.isInstalled && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Installation:</span>
            <span className="font-medium text-green-600">Installed</span>
          </div>
        )}
      </div>
    </div>
  );
}
