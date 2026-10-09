// Service worker App Rilievo: rende l'app installabile e utilizzabile offline.
// Il segnaposto della versione viene sostituito da pubblica_app.py a ogni pubblicazione: cambia la cache e forza l'aggiornamento.
const CACHE = 'app-rilievo-2.01';
const FILES = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './lib/pdf.min.js', './lib/pdf.worker.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(u => new Request(u, {cache: 'reload'}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('app-rilievo-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // pagina: prima la rete (così arrivano gli aggiornamenti), offline la copia salvata
  if (req.mode === 'navigate') {
    // no-cache: chiede sempre al server se la pagina e' cambiata, ignorando la copia del browser (10 minuti su GitHub Pages)
    e.respondWith(fetch(req.url, {cache: 'no-cache'})
      .then(r => {                     // errore del server: si usa la copia salvata, che non viene toccata
        if (!r.ok) return caches.match('./index.html').then(c => c || r);
        const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy));
        return r;
      })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // librerie e icone: prima la cache
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
