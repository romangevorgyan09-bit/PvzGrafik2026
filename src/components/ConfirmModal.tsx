import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, text, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={onCancel} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-sm bg-[#14141b] border border-white/5 shadow-2xl rounded-2xl p-6 z-10 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>

            <h3 className="text-base font-black text-gray-100 mb-2 leading-snug">
              {title}
            </h3>

            <p className="text-xs text-gray-400 leading-relaxed mb-6 font-medium">
              {text}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition"
              >
                Отмена
              </button>
              
              <button
                type="button"
                onClick={onConfirm}
                className="py-3 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-red-500/15 active:scale-95 transition"
              >
                Да, удалить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
