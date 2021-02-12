

	importScripts('/app/js/cache.js');
//	var googleisthere = fetch('https://google.com', {mode: 'no-cors'}).then(r=>{return true;}).catch(e=>{return false;});
	var urlsToCache = [
  '/',
  '/a.b',
  '/app/module/amlich.js',
  '/app/module/canchi.js',
  '/app/module/napam.js',
  '/app/module/linhtinh.js',
  '/app/module/catnhat.js',
  '/app/module/hungnhat.js',
  '/app/module/thoithan2.js',
  '/app/css/bootstrap.min.css',
  '/index.html',
  '/module.html',
  '/app/css/style.css',
  '/app/js/jquery.min.js',
  '/app/js/cache.js',
  '/app/js/vansu.vendor.js',
  '/app/js/ruleq.js'
];
var curentVersion='thienco_v8';
caches.keys().then(function (cachesNames) {

for (i = 0; i < cachesNames.length; i++) {
        if(cachesNames[i] !==curentVersion){
            caches.delete(cachesNames[i])
	const dbs = await window.indexedDB.databases()
	dbs.forEach(db => { window.indexedDB.deleteDatabase(db.name) })

        }
}

})

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(curentVersion)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});



self.addEventListener('fetch', (event) => {
	
	if(event.request.url.match(/google\.com|analytics|yandex|api\.github\.com|adnhung\.gq/)){
			 return;
	}else{
	
  event.respondWith(async function() {
    const cache = await caches.open(curentVersion);
    const cachedResponse = await cache.match(event.request, {ignoreSearch: true});
    const networkResponsePromise = fetch(event.request);

    event.waitUntil(async function() {
      const networkResponse = await networkResponsePromise;
      await cache.put(event.request, networkResponse.clone());
    }());

    // Returned the cached response if we have one, otherwise return the network response.
    return cachedResponse || networkResponsePromise;
  }());
}
});


