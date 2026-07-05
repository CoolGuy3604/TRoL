const CACHE_NAME = 'love-roulette-v1';

// Перехватываем все сетевые запросы сайта
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Фильтруем запросы: кэшируем ТОЛЬКО картинки (из папки images или любые изображения)
    if (event.request.destination === 'image' || url.pathname.includes('/images/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    // Стратегия Stale-While-Revalidate: отдаем картинку мгновенно из кэша,
                    // но в фоне проверяем на GitHub, не обновилась ли она, чтобы обновить кэш на будущее.
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Если интернета нет, просто проглатываем ошибку сети, картинка уже в кэше
                    });
                    
                    return cachedResponse || fetchPromise;
                });
            })
        );
    } else {
        // Все остальные файлы (скрипты, Firebase, звуки) пропускаем мимо кэша в обычном режиме
        return;
    }
});

// Очистка старых кэшей при обновлении версии воркера
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🧹 Удален старый кэш картинок:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});
