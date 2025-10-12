/**
 * Comprehensive cache clearing utility
 * This function clears all possible caches to ensure fresh data after payment
 */

export const clearAllCaches = async (): Promise<void> => {
  try {
    console.log('🔄 Starting comprehensive cache clearing...');
    
    // 1. Clear service worker caches
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Service worker caches cleared');
    }
    
    // 2. Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('✅ Service workers unregistered');
    }
    
    // 3. Clear localStorage and sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Local storage cleared');
    } catch (e) {
      console.log('⚠️ Could not clear local storage:', e);
    }
    
    // 4. Clear IndexedDB (if used)
    if ('indexedDB' in window) {
      try {
        // Clear any IndexedDB databases that might be caching data
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            return new Promise((resolve, reject) => {
              if (db.name) {
                const deleteReq = indexedDB.deleteDatabase(db.name);
                deleteReq.onsuccess = () => resolve(true);
                deleteReq.onerror = () => reject(deleteReq.error);
              } else {
                resolve(true); // Skip if no name
              }
            });
          })
        );
        console.log('✅ IndexedDB cleared');
      } catch (e) {
        console.log('⚠️ Could not clear IndexedDB:', e);
      }
    }
    
    // 5. Clear any fetch cache (if supported)
    if ('caches' in window) {
      try {
        // Clear any additional caches that might not be service worker related
        const allCaches = await caches.keys();
        for (const cacheName of allCaches) {
          await caches.delete(cacheName);
        }
        console.log('✅ All caches cleared');
      } catch (e) {
        console.log('⚠️ Could not clear additional caches:', e);
      }
    }
    
    console.log('✅ Comprehensive cache clearing completed');
    
  } catch (error) {
    console.error('❌ Error during cache clearing:', error);
    throw error;
  }
};

/**
 * Clear caches and force reload with cache bypass
 */
export const clearCachesAndReload = async (): Promise<void> => {
  await clearAllCaches();
  
  // Force hard reload with cache bypass
  console.log('🔄 Forcing hard reload with cache bypass...');
  window.location.reload();
};

/**
 * Check if payment success is detected in URL and clear caches if so (without reload)
 */
export const clearCachesOnPaymentSuccess = async (): Promise<void> => {
  if (typeof window !== 'undefined' && window.location.search.includes('payment=success')) {
    console.log('💰 Payment success detected, clearing caches (no reload)...');
    await clearAllCaches();
  }
};

/**
 * Clear caches and redirect to a specific URL after payment success (single redirect)
 */
export const clearCachesAndRedirect = async (redirectUrl: string): Promise<void> => {
  console.log('🔄 Clearing caches before redirect to:', redirectUrl);
  await clearAllCaches();
  
  // Add a small delay to ensure cache clearing is complete
  setTimeout(() => {
    console.log('✅ Cache clearing complete, redirecting to:', redirectUrl);
    window.location.href = redirectUrl;
  }, 100);
};

/**
 * Clear caches without any reload or redirect (for use on destination pages)
 */
export const clearCachesOnly = async (): Promise<void> => {
  console.log('🔄 Clearing caches only (no reload/redirect)...');
  await clearAllCaches();
};
