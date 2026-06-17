import { useState, useEffect } from 'react';
import { Shift, Employee, TEMPLATES } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Check, Clock } from 'lucide-react';

interface ShiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  shifts: Shift[];
  employees: Employee[];
  onAddShift: (employeeId: string, type: 'full' | 'morning' | 'evening', start: string, end: string) => void;
  onRemoveShift: (index: number) => void;
}

const RU_MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

const RU_WEEK_DAYS = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
];

export default function ShiftsModal({
  isOpen,
  onClose,
  date,
  shifts,
  employees,
  onAddShift,
  onRemoveShift
}: ShiftsModalProps) {
  const [activeEmpId, setActiveEmpId] = useState('');
  const [activeType, setActiveType] = useState<'full' | 'morning' | 'evening'>('full');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('21:00');

  useEffect(() => {
    if (employees.length && !activeEmpId) {
      setActiveEmpId(employees[0].id);
    }
  }, [employees]);

  // Sync default shift working times when shifting template selections
  const handleSelectType = (type: 'full' | 'morning' | 'evening') => {
    setActiveType(type);
    const tmpl = TEMPLATES.find(t => t.id === type);
    if (tmpl) {
      setStart(tmpl.defaultStart);
      setEnd(tmpl.defaultEnd);
    }
  };

  if (!date) return null;

  const title = `${date.getDate()} ${RU_MONTHS_GEN[date.getMonth()]} ${date.getFullYear()}`;
  const dayOfWeek = RU_WEEK_DAYS[date.getDay()];

  const handleSave = () => {
    if (!activeEmpId) return;
    onAddShift(activeEmpId, activeType, start, end);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-[#14141b] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] md:max-h-[90vh]"
          >
            {/* iOS sheet guide */}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-3 md:hidden shrink-0" />

            {/* Sticky Header Block */}
            <div className="flex justify-between items-start px-6 pb-4 pt-1 border-b border-white/5 shrink-0">
              <div>
                <h3 className="text-base md:text-lg font-black text-gray-100 leading-snug">{title}</h3>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">
                  {dayOfWeek}
                </span>
              </div>
              
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Main content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
              {/* List of active shifts scheduled for that date */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ffaa00] pl-1 block">
                  Смены на этот день
                </label>

                {shifts.length === 0 ? (
                  <div className="p-4 bg-black/10 border border-white/[0.03] rounded-2xl text-center text-xs text-gray-400 font-semibold">
                    Нет назначенных смен
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {shifts.map((s, idx) => {
                      const emp = employees.find(e => e.id === s.empId);
                      const tmpl = TEMPLATES.find(t => t.id === s.type);
                      if (!emp) return null;
                      const initial = emp.name.charAt(0).toUpperCase() || '?';

                      return (
                        <div 
                          key={idx} 
                          className="p-3.5 bg-black/20 border border-white/[0.03] rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-200"
                          style={{ borderLeft: `4.5px solid ${emp.color}` }}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black shadow-inner shadow-black/10 shrink-0"
                              style={{ backgroundColor: emp.color }}
                            >
                              {initial}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-sm text-gray-200">{emp.name}</h5>
                              <p className="text-[10px] text-gray-400 font-bold">
                                {tmpl?.name} ({s.start} – {s.end})
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => onRemoveShift(idx)}
                            className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 flex items-center justify-center cursor-pointer active:scale-95 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add new shift builder card section */}
              <div className="p-4 bg-[#0a0a0e] border border-white/5 rounded-2xl space-y-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#ffaa00] border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 rounded-full inline-block">
                  Назначить смену
                </span>

                {/* Employee Selector field */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-1 block">
                    Сотрудник
                  </label>
                  <select
                    value={activeEmpId}
                    onChange={(e) => setActiveEmpId(e.target.value)}
                    className="w-full px-4 py-3 border border-white/5 rounded-xl bg-[#14141b] text-gray-200 outline-none focus:border-amber-400 text-sm font-semibold"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                {/* Shifts templates toggle buttons */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-1 block">
                    Тип смены
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectType(t.id)}
                        className={`py-3.5 border rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                          activeType === t.id 
                            ? 'border-amber-400 bg-amber-400/10 text-amber-400 font-extrabold' 
                            : 'border-white/5 bg-[#14141b]/50 text-gray-400 hover:border-white/10'
                        }`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-[10px] font-bold">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Starts and Ends hours selector */}
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-1 block">
                      Начало
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="time"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#14141b] border border-white/5 rounded-xl text-gray-200 outline-none text-xs font-bold focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 pl-1 block">
                      Конец
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="time"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#14141b] border border-white/5 rounded-xl text-gray-200 outline-none text-xs font-bold focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer block with safety-area bottom padding */}
            <div className="p-6 border-t border-white/10 bg-[#16161e] md:rounded-b-3xl shrink-0 pb-[calc(env(safe-area-inset-bottom)+20px)] md:pb-6 z-20">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 bg-white/5 hover:bg-white/10 text-gray-400 font-extrabold text-sm rounded-xl cursor-pointer active:scale-95 transition"
                >
                  Закрыть
                </button>
                <button
                  onClick={handleSave}
                  disabled={!activeEmpId}
                  className="py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-sm rounded-xl cursor-pointer hover:from-amber-300 hover:to-amber-400 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/15 disabled:opacity-50"
                >
                  <Check className="w-5 h-5 stroke-[2.5px]" />
                  Сохранить
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
