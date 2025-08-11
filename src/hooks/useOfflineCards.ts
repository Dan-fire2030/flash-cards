'use client';

import { useEffect, useState, useCallback } from 'react';
import { Flashcard, Category } from '@/types';
import { useOffline } from '@/contexts/OfflineContext';

const CACHE_KEY_CARDS = 'offline_cards';
const CACHE_KEY_CATEGORIES = 'offline_categories';
const CACHE_KEY_TIMESTAMP = 'offline_cache_timestamp';

interface CachedData {
  cards: Flashcard[];
  categories: Category[];
  timestamp: string;
}

export function useOfflineCards() {
  const { isOnline } = useOffline();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ローカルストレージからキャッシュデータを読み込む
  const loadFromCache = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    try {
      const cachedCards = localStorage.getItem(CACHE_KEY_CARDS);
      const cachedCategories = localStorage.getItem(CACHE_KEY_CATEGORIES);
      const cachedTimestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);

      if (cachedCards && cachedCategories) {
        setCards(JSON.parse(cachedCards));
        setCategories(JSON.parse(cachedCategories));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to load from cache:', err);
      return false;
    }
  }, []);

  // データをローカルストレージにキャッシュする
  const saveToCache = useCallback((cardsData: Flashcard[], categoriesData: Category[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CACHE_KEY_CARDS, JSON.stringify(cardsData));
      localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(categoriesData));
      localStorage.setItem(CACHE_KEY_TIMESTAMP, new Date().toISOString());
    } catch (err) {
      console.error('Failed to save to cache:', err);
    }
  }, []);

  // APIからデータを取得
  const fetchFromAPI = useCallback(async () => {
    try {
      const [cardsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/cards'),
        fetch('/api/categories')
      ]);

      if (!cardsResponse.ok || !categoriesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const cardsData = await cardsResponse.json();
      const categoriesData = await categoriesResponse.json();

      setCards(cardsData);
      setCategories(categoriesData);

      // キャッシュに保存
      saveToCache(cardsData, categoriesData);
      return true;
    } catch (err) {
      console.error('Failed to fetch from API:', err);
      return false;
    }
  }, [saveToCache]);

  // データの読み込み
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isOnline) {
      // オンラインの場合はAPIから取得
      const success = await fetchFromAPI();
      if (!success) {
        // API取得に失敗した場合はキャッシュから読み込み
        const cacheSuccess = loadFromCache();
        if (!cacheSuccess) {
          setError('データの読み込みに失敗しました');
        }
      }
    } else {
      // オフラインの場合はキャッシュから読み込み
      const cacheSuccess = loadFromCache();
      if (!cacheSuccess) {
        setError('オフラインデータが見つかりません。一度オンラインでアプリを開いてください。');
      }
    }

    setLoading(false);
  }, [isOnline, fetchFromAPI, loadFromCache]);

  // 初回読み込み
  useEffect(() => {
    loadData();
  }, []);

  // オンライン状態が変わったら再読み込み
  useEffect(() => {
    if (isOnline && !loading) {
      loadData();
    }
  }, [isOnline]);

  // キャッシュをクリアする関数
  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(CACHE_KEY_CARDS);
    localStorage.removeItem(CACHE_KEY_CATEGORIES);
    localStorage.removeItem(CACHE_KEY_TIMESTAMP);
    setCards([]);
    setCategories([]);
  }, []);

  // キャッシュの有効期限を確認
  const isCacheValid = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const timestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);
    if (!timestamp) return false;

    const cacheTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    return (now - cacheTime) < oneDay;
  }, []);

  return {
    cards,
    categories,
    loading,
    error,
    refetch: loadData,
    clearCache,
    isCacheValid: isCacheValid(),
    isOffline: !isOnline
  };
}