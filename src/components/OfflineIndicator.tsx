'use client';

import { useOffline } from '@/contexts/OfflineContext';
import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const { isOnline, syncStatus, lastSyncTime } = useOffline();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else if (syncStatus === 'syncing' || syncStatus === 'success' || syncStatus === 'error') {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOnline, syncStatus]);

  if (!show) return null;

  const getStatusMessage = () => {
    if (!isOnline) {
      return {
        message: 'オフラインモード（読み取り専用）',
        bgColor: 'bg-gray-600',
        icon: '📵'
      };
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          message: 'データを同期中...',
          bgColor: 'bg-blue-600',
          icon: '🔄'
        };
      case 'success':
        return {
          message: 'データの同期が完了しました',
          bgColor: 'bg-green-600',
          icon: '✅'
        };
      case 'error':
        return {
          message: '同期に失敗しました',
          bgColor: 'bg-red-600',
          icon: '❌'
        };
      default:
        return null;
    }
  };

  const status = getStatusMessage();
  if (!status) return null;

  return (
    <div className={`fixed top-16 left-0 right-0 z-40 ${status.bgColor} text-white px-4 py-2 text-center transition-all duration-300`}>
      <div className="flex items-center justify-center gap-2">
        <span>{status.icon}</span>
        <span className="text-sm font-medium">{status.message}</span>
        {lastSyncTime && isOnline && (
          <span className="text-xs opacity-75 ml-2">
            最終同期: {lastSyncTime.toLocaleTimeString('ja-JP')}
          </span>
        )}
      </div>
    </div>
  );
}