'use client';

import { useState, useCallback, useEffect } from 'react';
import { Flashcard } from '@/types';

const STUDY_PROGRESS_KEY = 'study_progress';

interface StudyProgress {
  cards: Flashcard[];
  currentCardIndex: number;
  selectedCategories: string[];
  selectedCategory?: string; // 後方互換性のため
  isAllCategoriesSelected: boolean;
  includeChildren: boolean;
  studyStats: {
    correct: number;
    incorrect: number;
    remaining: number;
  };
  sessionStartTime: string;
  answeredCards: Set<number>; // 回答済みカードのインデックス
}

export function useStudyProgress() {
  const [hasProgress, setHasProgress] = useState(false);

  // ページ読み込み時に進行状況をチェック
  useEffect(() => {
    checkForProgress();
  }, []);

  const checkForProgress = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    try {
      const saved = localStorage.getItem(STUDY_PROGRESS_KEY);
      const exists = saved !== null;
      setHasProgress(exists);
      return exists;
    } catch (error) {
      console.error('Error checking study progress:', error);
      return false;
    }
  }, []);

  const saveProgress = useCallback((progress: Omit<StudyProgress, 'answeredCards'> & { answeredCards: number[] }) => {
    if (typeof window === 'undefined') return;
    
    try {
      const progressToSave = {
        ...progress,
        answeredCards: progress.answeredCards // 配列として保存
      };
      localStorage.setItem(STUDY_PROGRESS_KEY, JSON.stringify(progressToSave));
      setHasProgress(true);
      console.log('Study progress saved:', progressToSave);
    } catch (error) {
      console.error('Error saving study progress:', error);
    }
  }, []);

  const loadProgress = useCallback((): (StudyProgress & { answeredCards: number[] }) | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(STUDY_PROGRESS_KEY);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      console.log('Study progress loaded:', parsed);
      return parsed;
    } catch (error) {
      console.error('Error loading study progress:', error);
      return null;
    }
  }, []);

  const clearProgress = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STUDY_PROGRESS_KEY);
      setHasProgress(false);
      console.log('Study progress cleared');
    } catch (error) {
      console.error('Error clearing study progress:', error);
    }
  }, []);

  return {
    hasProgress,
    saveProgress,
    loadProgress,
    clearProgress,
    checkForProgress
  };
}