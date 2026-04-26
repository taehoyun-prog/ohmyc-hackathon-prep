/**
 * ohmyc service worker — Web Push event handler.
 * nami_backup/public/sw.js 패턴 단순화 import (도메인 적응).
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: '세린', body: event.data.text() || '약속한 시간이야' };
  }

  const { title, body, url, todoId } = payload;

  event.waitUntil(
    self.registration.showNotification(title || '세린', {
      body: body || '약속한 시간이야',
      icon: '/assets/ohmyc-mark.svg',
      badge: '/assets/ohmyc-mark.svg',
      data: { url: url || '/', todoId },
      tag: todoId ? `pair-${todoId}` : 'pair',
      requireInteraction: false,
      silent: false,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  // iOS Safari subscription expiration 갱신 (R-4 plan_b)
  event.waitUntil(
    Promise.resolve()
      .then(() =>
        self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: event.oldSubscription
            ? event.oldSubscription.options.applicationServerKey
            : undefined,
        }),
      )
      .then((newSubscription) => {
        // 클라이언트에 갱신 알림 — postMessage 또는 fetch /api/push/subscribe
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anonUserId: 'pending', // 클라이언트 메인 스레드가 갱신 시 채움
            endpoint: newSubscription.endpoint,
            p256dh: btoa(
              String.fromCharCode(
                ...new Uint8Array(newSubscription.getKey('p256dh')),
              ),
            ),
            auth: btoa(
              String.fromCharCode(
                ...new Uint8Array(newSubscription.getKey('auth')),
              ),
            ),
            userAgent: self.navigator ? self.navigator.userAgent : null,
            expirationTime: newSubscription.expirationTime
              ? new Date(newSubscription.expirationTime).toISOString()
              : null,
          }),
        });
      })
      .catch(() => {}),
  );
});
