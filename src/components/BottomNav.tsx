import { motion } from 'motion/react';
import { Calendar, FileText, Settings, Info } from 'lucide-react';

interface BottomNavProps {
  activeView: 'schedule' | 'notes' | 'settings';
  onChangeView: (view: 'schedule' | 'notes' | 'settings') => void;
  onShowAbout: () => void;
}

export default function BottomNav({ activeView, onChangeView, onShowAbout }: BottomNavProps) {
  const tabs = [
    { id: 'schedule', label: 'Календарь', icon: Calendar },
    { id: 'notes', label: 'Заметки', icon: FileText },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[540px] md:max-w-[720px] xl:max-w-[1020px] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 z-40">
      <div className="bg-[#14141b]/85 border border-white/5 shadow-2xl rounded-2xl md:rounded-3xl p-1.5 backdrop-blur-xl flex justify-between items-center relative gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeView(tab.id)}
              className="flex-1 py-2.5 px-2 rounded-xl flex flex-col justify-center items-center gap-1.5 relative transition-colors duration-200 focus:outline-none cursor-pointer group"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Animated sliding background capsule */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-amber-400/10 border border-amber-400/20 rounded-xl"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive 
                    ? 'text-amber-400 scale-110' 
                    : 'text-gray-400 group-hover:text-gray-200 group-hover:scale-105'
                }`}
              />

              <span
                className={`text-[10px] sm:text-xs font-bold transition-colors duration-200 ${
                  isActive 
                    ? 'text-amber-400' 
                    : 'text-gray-400 group-hover:text-gray-200'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Info / About tab */}
        <button
          onClick={onShowAbout}
          className="flex-1 py-2.5 px-2 rounded-xl flex flex-col justify-center items-center gap-1.5 relative text-gray-400 hover:text-gray-200 transition-colors duration-200 focus:outline-none cursor-pointer group"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <Info className="w-5 h-5 group-hover:scale-105 transition-transform" />
          <span className="text-[10px] sm:text-xs font-bold">О прог.</span>
        </button>
      </div>
    </nav>
  );
}
