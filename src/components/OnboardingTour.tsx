import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, X, Check } from 'lucide-react';

interface TourStep {
  title: string;
  body: string;
  actionHint?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Добро пожаловать в ПВЗ График! 👋",
    body: "Рады приветствовать вас в обновленном приложении! Мы подготовили интерактивную экскурсию, которая откроет секреты планирования всего за одну минуту. Готовы?",
    actionHint: "Нажмите «Начать экскурсию», чтобы продолжить"
  },
  {
    title: "Календарь смен 📅",
    body: "Это центр управления расписанием. Нажмите на любой день, чтобы отредактировать список смен. <br/><br/>💡 <strong>Секретный жест:</strong> зажмите палец или левую кнопку мыши на дате и проведите по соседним полям: вы сможете <strong>быстро заполнить график на несколько дней вперед</strong>!",
    actionHint: "Попробуйте провести по датам после завершения обучения"
  },
  {
    title: "Вкладки смен (Типы) ☀️🌅🌆",
    body: "Каждая смена имеет форму: Полная (12ч — ☀️), Утренняя (6ч — 🌅) или Вечерняя (6ч — 🌆). Каждому сотруднику присваивается собственный цвет для легкого восприятия.",
    actionHint: "Вы можете изменять оклады и очертания в настройках"
  },
  {
    title: "Фильтрация сотрудников 👥",
    body: "В верхней ленте чипсов можно выбрать конкретного сотрудника. Календарь немедленно сфокусируется только на его графиках, а ведомость пересчитает его личные выплаты.",
    actionHint: "Нажмите «Все графики» для суммарного обзора"
  },
  {
    title: "Быстрый экспорт в Telegram 📋",
    body: "Хотите быстро поделиться графиком? Нажмите кнопку копирования (📋) в самом верхнем меню. Весь ваш календарь смен мгновенно преобразуется в превосходно отформатированный структурированный текст. Отправляйте его в Telegram чат сотрудникам одной кнопкой!",
    actionHint: "Попробуйте новую кнопку копирования рядом с шапкой профиля"
  },
  {
    title: "Печать графика в PDF 🖨️",
    body: "По многочисленным просьбам мы добавили кнопку печати (🖨️) в верхней панели. Теперь вы можете сохранить весь цветной календарь в высококачественном PDF документе или вывести его напрямую на принтер. Идеальное решение, чтобы повесить красивый график прямо на стену ПВЗ!",
    actionHint: "Нажмите зелёную иконку принтера в самом верху для теста"
  },
  {
    title: "Статистика и Зарплата 💰",
    body: "Инструмент мгновенно пересчитывает отработанные смены, суммарные часы и итоговую сумму зарплаты за выбранный месяц по часовым или посменным ставкам сотрудников.",
    actionHint: "Больше никаких блокнотов и ручных формул!"
  },
  {
    title: "Заметки и Планирование 📝",
    body: "Переходите во вкладку заметок, чтобы вести личные списки, записывать важные контакты или фиксировать пожелания персонала. Удобный встроенный поиск сориентирует вас за доли секунды.",
    actionHint: "Разделяйте личные дела и служебные памятки"
  },
  {
    title: "Все настройки под рукой ⚙️",
    body: "Добавляйте и изменяйте свойства сотрудников, настраивайте цветовую палитру приложения (стильная темная или чистая светлая темы) и обязательно скачивайте JSON резервные копии для страховки ваших данных.",
    actionHint: "Экспортируйте результаты в один клик!"
  },
  {
    title: "Все готово! 🎉",
    body: "Вы успешно завершили интерактивный курс! Теперь вы полноценный управляющий графиками. Планируйте с удовольствием, экономьте время и автоматизируйте расчеты ваших сотрудников.",
    actionHint: "Удачи в использовании ПВЗ График v2!"
  }
];

interface OnboardingTourProps {
  onFinish: () => void;
}

export default function OnboardingTour({ onFinish }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setStepIndex(stepIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      {/* Absolute layout center popover with floating aesthetic dots */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: -15 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-[#14141b]/95 border border-amber-500/25 rounded-3xl p-6 md:p-8 shadow-2xl relative"
        >
          {/* Pulsing decoration boundary glow */}
          <div className="absolute inset-[-1px] rounded-3xl border border-amber-400/20 pointer-events-none animate-pulse" />

          {/* Stepper progress numeric tag button */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ffaa00] bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full flex items-center gap-1 onboarding-badge">
              <Sparkles className="w-3.5 h-3.5 animate-bounce" />
              Шаг {stepIndex + 1} из {TOUR_STEPS.length}
            </span>
            
            <button
              onClick={onFinish}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-xl font-black text-gray-100 mb-4 tracking-tight leading-snug">
            {currentStep.title}
          </h3>

          <p 
            className="text-sm text-gray-300 leading-relaxed mb-6 font-medium"
            dangerouslySetInnerHTML={{ __html: currentStep.body }}
          />

          {currentStep.actionHint && (
            <div className="p-3 bg-amber-400/[0.03] border border-amber-400/10 rounded-xl mb-6 text-xs text-amber-300/90 italic font-medium onboarding-hint">
              💡 {currentStep.actionHint}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            {!isFirst ? (
              <button
                type="button"
                onClick={handlePrev}
                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-300 transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </button>
            ) : (
              <span /> // placeholder
            )}

            <button
              onClick={handleNext}
              className="py-3 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/10 transition active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
            >
              {isLast ? (
                <>
                  Начать работу
                  <Check className="w-4 h-4 stroke-[3px]" />
                </>
              ) : (
                <>
                  Далее
                  <ArrowRight className="w-4 h-4 stroke-[3px]" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
