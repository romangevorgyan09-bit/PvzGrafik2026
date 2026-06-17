import { useState } from 'react';
import { TEMPLATES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronDown } from 'lucide-react';

interface FillModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates: string[];
  onConfirmFill: (type: 'full' | 'morning' | 'evening', pattern: string) => void;
}

export default function FillModal({ isOpen, onClose, selectedDates, onConfirmFill }: FillModalProps) {
  const [activeType, setActiveType] = useState<'full' | 'morning' | 'evening'>('full');
  const [pattern, setPattern] = useState('all');

  const handleConfirm = () => {
    onConfirmFill(activeType, pattern);
  };

  if (!isOpen) return null;

  // Render numbers cleanly
  const sortedDates = [...selectedDates].sort();
  const dateNumbers = sortedDates.map(k => k.split('-')[2]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-[#14141b] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] md:max-h-[90vh]"
        >
          {/* iOS guide bar */}
          <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-3 md:hidden shrink-0" />

          {/* Fixed Header */}
          <div className="flex justify-between items-center px-6 pb-4 pt-1 border-b border-white/5 shrink-0">
            <div>
              <h3 className="text-base md:text-lg font-black text-gray-100">Быстрое заполнение</h3>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">
                Массовое назначение на выделенные дни
              </p>
            </div>
            
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content wrapper */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
            {/* Quick confirmation details banner */}
            <div className="bg-[#0a0a0e] border border-white/5 p-4 rounded-2xl text-center space-y-1.5 relative">
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">
                {selectedDates.length}
              </div>
              <div className="text-[9px] uppercase font-black tracking-widest text-[#ffaa00]">
                Выбрано рабочих дней
              </div>
              <p className="text-[11px] text-gray-400 truncate px-2 font-medium">
                Числа: {dateNumbers.join(', ')}
              </p>
            </div>

            <div className="space-y-4">
              {/* Shifts option choosing templates */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-1 block">
                  Выберите тип смены
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveType(t.id)}
                      className={`py-3.5 border rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                        activeType === t.id 
                          ? 'border-amber-400 bg-amber-400/10 text-amber-400 font-extrabold' 
                          : 'border-white/5 bg-[#0a0a0e] text-gray-400 hover:border-white/10'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="text-[10px] font-bold">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector for pattern layouts */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-1 block">
                  Шаблон заполнения
                </label>
                <div className="relative">
                  <select
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full px-4 py-3.5 border border-white/5 rounded-xl bg-[#0a0a0e] text-gray-200 outline-none focus:border-amber-400 text-xs font-bold appearance-none cursor-pointer"
                  >
                    <option value="all">Каждый выделенный день</option>
                    <option value="2/2">По графику 2 через 2</option>
                    <option value="3/3">По графику 3 через 3</option>
                    <option value="5/2">Пятидневка (Пн-Пт)</option>
                    <option value="1/1">Через день</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer with Safe Area bottoms */}
          <div className="p-6 border-t border-white/10 bg-[#16161e] md:rounded-b-3xl shrink-0 pb-[calc(env(safe-area-inset-bottom)+20px)] md:pb-6 z-20">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 bg-white/5 hover:bg-white/10 text-gray-400 font-extrabold text-sm rounded-xl cursor-pointer active:scale-95 transition"
              >
                Отмена
              </button>
              
              <button
                type="button"
                onClick={handleConfirm}
                className="py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-sm rounded-xl cursor-pointer shadow-lg shadow-amber-500/15 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3px]" />
                Заполнить
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
