import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // カスタムService Workerファイルを追加
  sw: 'sw-custom.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      }
    },
    {
      urlPattern: ({ request }: { request: any }) => request.destination === 'document',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'documents',
        networkTimeoutSeconds: 10,
      }
    },
    // Supabase API calls caching
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/cards/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'cards-api',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/categories/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'categories-api',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-storage',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
});

const nextConfig: NextConfig = {
  /* config options here */
  // Supabase functionsフォルダを除外
  outputFileTracingExcludes: {
    '*': ['supabase/**/*'],
  }
};

export default withPWA(nextConfig);