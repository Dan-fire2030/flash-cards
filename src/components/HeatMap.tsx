'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DayData {
  date: string;
  count: number;
  level: number;
}

interface HeatMapProps {
  year?: number;
  month?: number;
}

export default function HeatMap({ 
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1 
}: HeatMapProps) {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

  useEffect(() => {
    loadMonthData();
  }, [year, month]);

  const loadMonthData = async () => {
    try {
      setLoading(true);
      
      // 月の最初と最後の日を取得
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('date, cards_studied')
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      const sessionMap = new Map<string, number>();
      let maxCount = 0;
      
      sessions?.forEach(session => {
        const count = sessionMap.get(session.date) || 0;
        const newCount = count + session.cards_studied;
        sessionMap.set(session.date, newCount);
        maxCount = Math.max(maxCount, newCount);
      });

      // カレンダー形式のデータを作成
      const monthData: DayData[] = [];
      
      // 月の最初の日の曜日を取得（月曜日を0とする）
      let firstDayOfWeek = firstDay.getDay() - 1;
      if (firstDayOfWeek === -1) firstDayOfWeek = 6; // 日曜日の場合は6
      
      // 最初の週の空白を追加
      for (let i = 0; i < firstDayOfWeek; i++) {
        monthData.push({
          date: '',
          count: 0,
          level: -1
        });
      }
      
      // 月の日付を追加
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, month - 1, day);
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = sessionMap.get(dateStr) || 0;
        const level = maxCount > 0 ? Math.min(4, Math.floor((count / maxCount) * 4)) : 0;
        
        monthData.push({
          date: dateStr,
          count,
          level
        });
      }
      
      // 最後の週の空白を追加（6週分になるように）
      while (monthData.length < 42) {
        monthData.push({
          date: '',
          count: 0,
          level: -1
        });
      }
      
      setData(monthData);
    } catch (error) {
      console.error('Error loading heat map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (level: number) => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800',
      'bg-green-200 dark:bg-green-900',
      'bg-green-400 dark:bg-green-700',
      'bg-green-600 dark:bg-green-500',
      'bg-green-800 dark:bg-green-400'
    ];
    return colors[level];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getWeeksData = () => {
    const weeks: DayData[][] = [];
    for (let i = 0; i < data.length; i += 7) {
      weeks.push(data.slice(i, i + 7));
    }
    return weeks;
  };

  const getDayOfMonth = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.getDate().toString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
      </div>
    );
  }

  const weeks = getWeeksData();

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div 
              key={day} 
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* カレンダーグリッド */}
        <div className="space-y-0.5 sm:space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="aspect-square relative group"
                >
                  {day.date ? (
                    <button
                      className={`
                        w-full h-full rounded-sm border border-gray-200 dark:border-gray-700
                        transition-all duration-200 hover:scale-110 hover:z-10
                        hover:shadow-lg relative text-xs sm:text-sm
                        ${day.level >= 0 ? getColorClass(day.level) : 'bg-white dark:bg-gray-900'}
                      `}
                      onClick={() => setSelectedDay(day)}
                    >
                      <span className="absolute top-0.5 left-0.5 sm:left-1 text-xs text-gray-600 dark:text-gray-400">
                        {getDayOfMonth(day.date)}
                      </span>
                      {day.count > 0 && (
                        <span className="absolute bottom-0.5 right-0.5 sm:right-1 text-xs font-bold text-gray-700 dark:text-gray-300">
                          {day.count}
                        </span>
                      )}
                      {/* ツールチップ */}
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap pointer-events-none z-20 transition-opacity">
                        {formatDate(day.date)}: {day.count}枚学習
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* 凡例とサマリー */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">少ない</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm border border-gray-200 dark:border-gray-700 ${getColorClass(level)}`}
                />
              ))}
            </div>
            <span className="text-gray-500 dark:text-gray-400">多い</span>
          </div>
          
          {selectedDay && selectedDay.date && (
            <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatDate(selectedDay.date)}
              </span>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                {selectedDay.count}枚学習
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}