// ============================================================
// REGISTER SERVICE WORKER - UNREGISTER OLD VERSION FIRST
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    console.log('📦 Checking Service Worker...');
    
    // 🔥 1. Unregister old service workers
    navigator.serviceWorker.getRegistrations()
      .then(function(registrations) {
        for (var i = 0; i < registrations.length; i++) {
          console.log('🗑️ Unregistering old SW:', registrations[i].scope);
          registrations[i].unregister();
        }
      })
      .then(function() {
        // 🔥 2. Register new SW dengan timestamp
        var swUrl = 'sw.js?v=' + Date.now();
        console.log('📦 Registering new SW:', swUrl);
        
        return navigator.serviceWorker.register(swUrl, { 
          scope: '/'
        });
      })
      .then(function(registration) {
        console.log('✅ Service Worker registered with scope:', registration.scope);
        
        // 🔥 3. Check for updates every 30 seconds
        setInterval(function() {
          registration.update();
          console.log('🔄 Checking for updates...');
        }, 30000);
      })
      .catch(function(error) {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}
