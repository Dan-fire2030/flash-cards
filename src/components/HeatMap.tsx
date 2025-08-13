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
}

export default function HeatMap({ year = new Date().getFullYear() }: HeatMapProps) {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [maxCount, setMaxCount] = useState(0);

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  useEffect(() => {
    loadYearData();
  }, [year]);

  const loadYearData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('date, cards_studied')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      const sessionMap = new Map<string, number>();
      let max = 0;
      
      sessions?.forEach(session => {
        const count = sessionMap.get(session.date) || 0;
        const newCount = count + session.cards_studied;
        sessionMap.set(session.date, newCount);
        max = Math.max(max, newCount);
      });
      
      setMaxCount(max);

      const yearData: DayData[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = sessionMap.get(dateStr) || 0;
        const level = max > 0 ? Math.min(4, Math.floor((count / max) * 4)) : 0;
        
        yearData.push({
          date: dateStr,
          count,
          level
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setData(yearData);
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
    let currentWeek: DayData[] = [];
    
    const firstDay = new Date(year, 0, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: '', count: 0, level: -1 });
    }
    
    data.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', count: 0, level: -1 });
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const getMonthPositions = () => {
    const positions: { month: string; position: number }[] = [];
    let lastMonth = -1;
    
    getWeeksData().forEach((week, weekIndex) => {
      week.forEach(day => {
        if (day.date) {
          const month = new Date(day.date).getMonth();
          if (month !== lastMonth) {
            positions.push({
              month: months[month],
              position: weekIndex * 13
            });
            lastMonth = month;
          }
        }
      });
    });
    
    return positions;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
      </div>
    );
  }

  const weeks = getWeeksData();
  const monthPositions = getMonthPositions();

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          {weekDays.map((day, i) => (
            <div key={i} className="h-[13px] flex items-center">
              {i % 2 === 1 && day}
            </div>
          ))}
        </div>
        
        <div className="flex-1 overflow-x-auto">
          <div className="relative">
            <div className="flex gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
              {monthPositions.map(({ month, position }) => (
                <div
                  key={`${month}-${position}`}
                  className="absolute"
                  style={{ left: `${position}px` }}
                >
                  {month}
                </div>
              ))}
            </div>
            
            <div className="flex gap-1 mt-6">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                        w-[11px] h-[11px] rounded-sm cursor-pointer
                        transition-all duration-200 hover:ring-2 hover:ring-offset-1
                        hover:ring-gray-400 dark:hover:ring-gray-600
                        ${day.level === -1 ? 'invisible' : getColorClass(day.level)}
                      `}
                      onClick={() => day.date && setSelectedDay(day)}
                      title={day.date ? `${formatDate(day.date)}: ${day.count}枚` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>少ない</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-[11px] h-[11px] rounded-sm ${getColorClass(level)}`}
              />
            ))}
          </div>
          <span>多い</span>
        </div>
        
        {selectedDay && (
          <div className="ml-4 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <span className="font-medium">{formatDate(selectedDay.date)}</span>
            <span className="ml-2">{selectedDay.count}枚学習</span>
          </div>
        )}
      </div>
    </div>
  );
}