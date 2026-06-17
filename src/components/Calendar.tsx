import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Shift, Employee, ShiftTemplate, TEMPLATES } from '../types';

interface CalendarProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  shifts: Record<string, Shift[]>;
  employees: Employee[];
  currentEmpFilter: string;
  onSelectDay: (date: Date) => void;
  onSelectRange: (dates: string[]) => void;
}

const RU_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const RU_WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function Calendar({
  currentDate,
  setCurrentDate,
  shifts,
  employees,
  currentEmpFilter,
  onSelectDay,
  onSelectRange
}: CalendarProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const isDragging = useRef(false);
  const dragStartKey = useRef<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  // Helper: date item to string YYYY-MM-DD
  const getDayKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  // Get start index (0=Monday, ..., 6=Sunday)
  let startDow = firstDayOfMonth.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Generate days array
  const dayObjects: { date: Date; isOtherMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = startDow - 1; i >= 0; i--) {
    dayObjects.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isOtherMonth: true
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    dayObjects.push({
      date: new Date(year, month, i),
      isOtherMonth: false
    });
  }

  // Next month leading days
  const remaining = dayObjects.length % 7;
  if (remaining > 0) {
    const nextDaysNeeded = 7 - remaining;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      dayObjects.push({
        date: new Date(year, month + 1, i),
        isOtherMonth: true
      });
    }
  }

  // Handlers for Swipe Gesture to make month switching satisfying
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const prevMonth = () => {
    setDragDirection('right');
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setDragDirection('left');
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  // Unified cell finder based on mouse/touch client coordinates
  const getCellKeyFromCoords = (clientX: number, clientY: number): string | null => {
    const element = document.elementFromPoint(clientX, clientY);
    const dayCell = element?.closest('.day-cell') as HTMLElement | null;
    return dayCell?.dataset.key || null;
  };

  // DRAG: Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent, key: string) => {
    // Left click only
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStartKey.current = key;
    setSelectedDates([key]);
    
    // Prevent default texts selection
    e.preventDefault();
  };

  const handleMouseEnter = (key: string) => {
    if (!isDragging.current || !dragStartKey.current) return;
    
    // Calculate intermediate days
    const range = computeDateRange(dragStartKey.current, key);
    setSelectedDates(range);
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dragStartKey.current = null;
    
    if (selectedDates.length > 1) {
      onSelectRange([...selectedDates]);
      setSelectedDates([]);
    } else if (selectedDates.length === 1) {
      const parts = selectedDates[0].split('-');
      onSelectDay(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      setSelectedDates([]);
    }
  };

  // DRAG: Touch Handlers
  const handleTouchStart = (e: React.TouchEvent, key: string) => {
    isDragging.current = true;
    dragStartKey.current = key;
    setSelectedDates([key]);
    
    // Record coordinates for horizontal month-swipe fallback
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !dragStartKey.current) return;
    
    const touch = e.touches[0];
    const key = getCellKeyFromCoords(touch.clientX, touch.clientY);
    
    if (key) {
      const range = computeDateRange(dragStartKey.current, key);
      setSelectedDates(range);
      
      // If we are actively dragging dates on the grid, prevent natural screen scroll
      if (range.length > 1 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dragStartKey.current = null;

    if (selectedDates.length > 1) {
      onSelectRange([...selectedDates]);
      setSelectedDates([]);
    } else if (selectedDates.length === 1) {
      const parts = selectedDates[0].split('-');
      onSelectDay(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      setSelectedDates([]);
    } else {
      // Touch-swipe fallback detection (if no date range was selected)
      if (touchStartX.current !== null && touchStartY.current !== null) {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX.current;
        const dy = touch.clientY - touchStartY.current;
        
        // Horizontal swiping threshold (fast / distinct swipe)
        if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx > 0) prevMonth();
          else nextMonth();
        }
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Calculate inclusive dates array between two date keys
  const computeDateRange = (startKey: string, endKey: string): string[] => {
    const parseKey = (k: string) => {
      const p = k.split('-');
      return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    };
    
    const d1 = parseKey(startKey);
    const d2 = parseKey(endKey);
    const minD = d1 < d2 ? d1 : d2;
    const maxD = d1 < d2 ? d2 : d1;
    
    const arr: string[] = [];
    let cur = new Date(minD);
    
    while (cur <= maxD) {
      arr.push(getDayKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
    
    return arr;
  };

  // Global mouse up binder to guarantee safe drag reset
  useEffect(() => {
    const onGlobalMouseUp = () => {
      handleMouseUp();
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [selectedDates]);

  return (
    <div className="flex flex-col select-none">
      {/* Header controls */}
      <div className="flex justify-between items-center px-2 py-3 gap-2">
        <button
          onClick={prevMonth}
          className="w-10 h-10 bg-[#14141b] hover:bg-[#1a1a24] border border-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-100 transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className="text-lg md:text-xl font-extrabold capitalize text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-amber-200 to-amber-400">
          {RU_MONTHS[month]} {year}
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={resetToToday}
            className="px-3 py-2 bg-gradient-to-r from-red-500 to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/10 active:scale-95 transition cursor-pointer"
          >
            Сегодня
          </button>
          <button
            onClick={nextMonth}
            className="w-10 h-10 bg-[#14141b] hover:bg-[#1a1a24] border border-white/5 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-100 transition active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drag & multi select tip banner */}
      <div className="mx-2 mb-3 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/15 rounded-xl flex items-center gap-2 text-xs text-gray-300 font-medium">
        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>Выделите несколько дат пальцем / мышкой для быстрого графика</span>
      </div>

      {/* Days Grid Container */}
      <div 
        ref={calendarRef}
        className="mx-2 bg-[#14141b]/90 border border-white/5 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden backdrop-blur-md"
      >
        <div className="grid grid-cols-7 bg-white/[0.02] border-b border-white/5 py-1.5">
          {RU_WEEK_DAYS.map((wd, idx) => (
            <div 
              key={idx} 
              className={`text-center text-[10px] md:text-xs font-black uppercase tracking-widest py-1 ${
                idx === 5 || idx === 6 ? 'text-red-400' : 'text-gray-400'
              }`}
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-white/5">
          {dayObjects.map((obj, index) => {
            const key = getDayKey(obj.date);
            const isToday = getDayKey(new Date()) === key;
            const isWeekend = obj.date.getDay() === 0 || obj.date.getDay() === 6;
            
            // Filter shifts based on chosen employee path
            let cellShifts = shifts[key] || [];
            if (currentEmpFilter !== 'all') {
              cellShifts = cellShifts.filter((s) => s.empId === currentEmpFilter);
            }

            const isSelected = selectedDates.includes(key);
            const hasShift = cellShifts.length > 0;

            // Generate shift styles (gradients, colors, indicator icons)
            let cellStyle: React.CSSProperties = {};
            let shiftIcon: string | null = null;

            if (hasShift) {
              if (cellShifts.length === 1) {
                const shiftRef = cellShifts[0];
                const emp = employees.find((e) => e.id === shiftRef.empId);
                const tmpl = TEMPLATES.find((t) => t.id === shiftRef.type);
                cellStyle = {
                  '--shift-color': emp?.color || tmpl?.color || '#ffdb4d'
                } as React.CSSProperties;
                shiftIcon = tmpl?.icon || '☀️';
              } else {
                const stepColors = cellShifts.map((s) => {
                  const emp = employees.find((e) => e.id === s.empId);
                  return emp?.color || '#ffdb4d';
                });
                // Create crisp multiple borders or hard-gradient stripes
                cellStyle = {
                  '--shift-gradient': `linear-gradient(135deg, ${stepColors.join(', ')})`
                } as React.CSSProperties;
              }
            }

            return (
              <div
                key={index}
                data-key={key}
                className={`day-cell relative font-sans aspect-[1/1.05] sm:aspect-[1/1.1] flex flex-col items-center justify-center cursor-pointer transition-colors duration-150 py-1.5 ${
                  obj.isOtherMonth 
                    ? 'text-gray-700 bg-black/10' 
                    : isWeekend 
                      ? 'text-red-400/90 bg-[#14141b]/40' 
                      : 'text-gray-100 bg-[#14141b]'
                } ${isToday ? 'relative' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, key)}
                onMouseEnter={() => handleMouseEnter(key)}
                onTouchStart={(e) => handleTouchStart(e, key)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Background selection bubble */}
                {isSelected && (
                  <motion.div 
                    layoutId={`select-${key}`}
                    className="absolute inset-[10%] bg-amber-400/25 border-2 border-amber-400 rounded-full z-10"
                  />
                )}

                {/* Day inner circle container */}
                <div 
                  className={`relative w-[80%] aspect-square rounded-full flex items-center justify-center transition-all ${
                    hasShift 
                      ? cellShifts.length === 1 
                        ? 'bg-[var(--shift-color)] text-black shadow-lg shadow-[var(--shift-color)]/20 font-bold'
                        : 'bg-gradient-to-br from-[#ffdb4d] to-[#ff6b6b] text-black shadow-lg font-extrabold'
                      : ''
                  } ${
                    isToday && !hasShift 
                      ? 'border border-amber-400 text-amber-400 bg-amber-400/5' 
                      : ''
                  }`}
                  style={hasShift && cellShifts.length > 1 ? { background: cellStyle['--shift-gradient' as any] as string } : cellStyle}
                >
                  <span className={`text-xs sm:text-sm font-extrabold select-none ${hasShift ? 'text-slate-900 drop-shadow-sm' : ''}`}>
                    {obj.date.getDate()}
                  </span>

                  {/* Template indicator icon */}
                  {hasShift && cellShifts.length === 1 && shiftIcon && (
                    <span className="absolute top-[2px] right-[2px] text-[8px] select-none">
                      {shiftIcon}
                    </span>
                  )}

                  {/* Multiple shifts count marker */}
                  {hasShift && cellShifts.length > 1 && (
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full text-[7px] w-3 h-3 flex items-center justify-center font-bold">
                      {cellShifts.length}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
