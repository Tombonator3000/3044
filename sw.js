/**
 * Geometry 3044 - Service Worker
 * Enables offline gameplay and resource caching
 */

const CACHE_NAME = 'geometry-3044-v1';
const AUDIO_CACHE_NAME = 'geometry-3044-audio-v1';

// Core files that must be cached for the app to work
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json',

    // Main JavaScript
    '/js/main.js',
    '/js/config.js',
    '/js/globals.js',

    // Core modules
    '/js/core/index.js',
    '/js/core/GameLoop.js',
    '/js/core/GameState.js',
    '/js/core/InputHandler.js',
    '/js/core/CollisionSystem.js',

    // Entities
    '/js/entities/index.js',
    '/js/entities/Player.js',
    '/js/entities/Enemy.js',
    '/js/entities/Boss.js',
    '/js/entities/Bullet.js',
    '/js/entities/PowerUp.js',

    // Systems
    '/js/systems/index.js',
    '/js/systems/WaveManager.js',
    '/js/systems/ParticleSystem.js',
    '/js/systems/SoundSystem.js',
    '/js/systems/MusicManager.js',
    '/js/systems/ShipManager.js',
    '/js/systems/GameModeManager.js',
    '/js/systems/AchievementSystem.js',
    '/js/systems/DailyChallengeSystem.js',
    '/js/systems/GrazingSystem.js',
    '/js/systems/RiskRewardSystem.js',
    '/js/systems/SlowMotionSystem.js',
    '/js/systems/ZoneSystem.js',
    '/js/systems/ReactiveMusicSystem.js',
    '/js/systems/PowerUpManager.js',
    '/js/systems/BulletPool.js',

    // Weapons
    '/js/weapons/index.js',
    '/js/weapons/WeaponManager.js',
    '/js/weapons/PlasmaBeam.js',
    '/js/weapons/HomingMissile.js',
    '/js/weapons/ChainLightning.js',
    '/js/weapons/Railgun.js',
    '/js/weapons/SynthwaveAnnihilator.js',
    '/js/weapons/SpreadNova.js',
    '/js/weapons/BlackHoleGrenade.js',
    '/js/weapons/DroneCompanion.js',
    '/js/weapons/MirrorShield.js',
    '/js/weapons/TimeFracture.js',

    // UI
    '/js/ui/index.js',
    '/js/ui/MenuManager.js',
    '/js/ui/HUD.js',
    '/js/ui/HUDThemes.js',
    '/js/ui/MobileControls.js',
    '/js/ui/OptionsMenu.js',
    '/js/ui/ComboDisplay.js',
    '/js/ui/RadicalSlang.js',
    '/js/ui/components/index.js',
    '/js/ui/components/ScoreDisplay.js',
    '/js/ui/components/LivesDisplay.js',
    '/js/ui/components/WaveDisplay.js',
    '/js/ui/components/ComboMeter.js',
    '/js/ui/components/PowerUpSlots.js',
    '/js/ui/components/BossHealthBar.js',
    '/js/ui/components/HighScoreDisplay.js',
    '/js/ui/components/PerformanceMonitor.js',
    '/js/ui/components/MultiplierPopup.js',
    '/js/ui/components/BombsDisplay.js',

    // Effects
    '/js/effects/index.js',
    '/js/effects/Starfield.js',
    '/js/effects/VHSEffect.js',
    '/js/effects/VHSGlitch.js',
    '/js/effects/CRTEffect.js',
    '/js/effects/Explosions.js',
    '/js/effects/RadicalSlang.js',

    // Rendering
    '/js/rendering/index.js',
    '/js/rendering/GridRenderer.js',

    // Utils
    '/js/utils/index.js',
    '/js/utils/DrawUtils.js',
    '/js/utils/Logger.js',

    // Icons
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Audio files (cached separately for better management)
const AUDIO_ASSETS = [
    '/assets/audio/Menu.mp3',
    '/assets/audio/game1.mp3'
];

// Install event - cache all core assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        Promise.all([
            // Cache core assets
            caches.open(CACHE_NAME).then((cache) => {
                console.log('[SW] Caching core assets...');
                return cache.addAll(CORE_ASSETS);
            }),
            // Cache audio separately (larger files)
            caches.open(AUDIO_CACHE_NAME).then((cache) => {
                console.log('[SW] Caching audio assets...');
                return cache.addAll(AUDIO_ASSETS);
            })
        ]).then(() => {
            console.log('[SW] All assets cached successfully');
            // Skip waiting to activate immediately
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old cache versions
                    if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached version if available
            if (cachedResponse) {
                // Update cache in background for next time (stale-while-revalidate)
                event.waitUntil(
                    fetch(event.request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const cacheName = url.pathname.includes('/audio/')
                                ? AUDIO_CACHE_NAME
                                : CACHE_NAME;
                            caches.open(cacheName).then((cache) => {
                                cache.put(event.request, networkResponse.clone());
                            });
                        }
                    }).catch(() => {
                        // Network failed, that's okay - we served from cache
                    })
                );
                return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(event.request).then((networkResponse) => {
                // Don't cache non-successful responses
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                // Clone the response before caching
                const responseToCache = networkResponse.clone();

                // Determine which cache to use
                const cacheName = url.pathname.includes('/audio/')
                    ? AUDIO_CACHE_NAME
                    : CACHE_NAME;

                caches.open(cacheName).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Network failed and not in cache
                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }

                // For other requests, return a simple error response
                return new Response('Offline - Resource not available', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Background sync for high scores (future feature)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-highscores') {
        console.log('[SW] Syncing high scores...');
        // Future: sync high scores to server
    }
});

console.log('[SW] Service Worker loaded');
