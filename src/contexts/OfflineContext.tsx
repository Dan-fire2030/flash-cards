'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  isOfflineReady: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: Date | null;
  forceSyncData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const forceSyncData = useCallback(async () => {
    if (!navigator.onLine) return;

    setSyncStatus('syncing');
    try {
      // キャッシュを更新するためにService Workerにメッセージを送信
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_DATA'
        });
      }

      // APIからデータを再取得してキャッシュを更新
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSyncStatus('success');
        setLastSyncTime(new Date());
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Data sync error:', error);
      setSyncStatus('error');
    } finally {
      // 3秒後にステータスをリセット
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    }
  }, []);

  useEffect(() => {
    // 初期状態の設定
    setIsOnline(navigator.onLine);

    // オンライン/オフラインイベントのリスナー
    const handleOnline = () => {
      setIsOnline(true);
      // オンライン復帰時に自動同期
      forceSyncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Workerの準備状態を確認
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsOfflineReady(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [forceSyncData]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOfflineReady,
        syncStatus,
        lastSyncTime,
        forceSyncData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}