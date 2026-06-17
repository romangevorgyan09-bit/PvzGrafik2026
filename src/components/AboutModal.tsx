import { motion, AnimatePresence } from 'motion/react';
import { X, Send, BarChart2, Award, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export default function AboutModal({ isOpen, onClose, onStartTour }: AboutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-lg bg-[#14141b] border-t md:border border-white/5 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
          >
            {/* Native Sheet Bar handle for mobile drawers */}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 md:hidden" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-100 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                О программе
              </h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Author profile card */}
            <div className="bg-gradient-to-r from-amber-400/10 to-transparent border border-amber-400/15 p-5 rounded-2xl flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 font-black text-black text-lg flex items-center justify-center shadow-lg shadow-amber-400/20 shrink-0">
                РГ
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#ffaa00]">
                  Автор проекта
                </span>
                <h4 className="font-extrabold text-base text-gray-100 mt-0.5 truncate pr-2">
                  Роман Геворгян
                </h4>
                <p className="text-xs text-gray-400">
                  Разработчик и автор приложения
                </p>
              </div>
            </div>

            {/* Application Branding Card */}
            <div className="bg-[#0a0a0e] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center mb-5 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center text-4xl shadow-md mb-3">
                📊
              </div>
              <h4 className="text-xl font-black text-gray-100">ПВЗ График</h4>
              <p className="text-xs text-[#ffaa00] font-bold tracking-widest uppercase mt-1">
                Версия 2.0 (Optimized React)
              </p>
            </div>

            {/* Functional summary info blocks */}
            <div className="bg-[#1a1a24] border border-white/5 p-5 rounded-2xl text-xs space-y-3 mb-5 leading-relaxed text-gray-300">
              <p className="font-medium">
                <strong className="text-gray-100 font-extrabold">ПВЗ График</strong> — современный адаптивный инструмент, созданный для точного контроля за рабочими графиками пункт-выдачи заказов и мгновенного расчета бюджетов зарплат.
              </p>
              <ul className="space-y-2 pl-1 pt-1">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">📅</span>
                  <span><strong className="text-gray-100">Календарь</strong> — поддержка жестов, drag-выделения на сенсорных экранах и ПК.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#34d399] font-bold">👥</span>
                  <span><strong className="text-gray-100">Персонал</strong> — почасовые или посменные оклады сотрудников.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#60a5fa] font-bold">💰</span>
                  <span><strong className="text-gray-100">Зарплаты</strong> — автоматическое сальдо и детальные ведомости.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff80b2] font-bold">📝</span>
                  <span><strong className="text-gray-100">Заметки</strong> — персональный архив записей с динамическим поиском.</span>
                </li>
              </ul>
            </div>

            {/* Telegram and Actions Buttons group */}
            <div className="space-y-3">
              <a
                href="https://t.me/Roman2000123"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#229ED9] hover:bg-[#1f8fc4] text-white font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/10 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Связаться с разработчиком: @Roman2000123
              </a>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartTour();
                  }}
                  className="py-3.5 bg-white/5 hover:bg-white/10 text-amber-400 border border-amber-400/25 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <HelpCircle className="w-4 h-4" />
                  Экскурсия
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 bg-white/5 text-gray-300 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-white/10 transition"
                >
                  Закрыть
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
