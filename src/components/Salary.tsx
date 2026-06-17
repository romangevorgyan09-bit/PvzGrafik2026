import { Shift, Employee, TEMPLATES } from '../types';
import { Wallet, CalendarDays, Clock } from 'lucide-react';

interface SalaryProps {
  currentDate: Date;
  shifts: Record<string, Shift[]>;
  employees: Employee[];
  currentEmpFilter: string;
}

export default function Salary({ currentDate, shifts, employees, currentEmpFilter }: SalaryProps) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const filteredEmps = currentEmpFilter === 'all'
    ? employees
    : employees.filter(e => e.id === currentEmpFilter);

  // Compute stats of active month: days, hours for each employee
  let accumulatedGrandTotal = 0;

  const salaryEntries = filteredEmps.map(emp => {
    let daysCount = 0;
    let hoursCount = 0;

    Object.entries(shifts).forEach(([dateStr, record]) => {
      const parts = dateStr.split('-');
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;

      if (y === currentYear && m === currentMonth) {
        const empShifts = record.filter(s => s.empId === emp.id);
        empShifts.forEach(s => {
          daysCount++;
          const template = TEMPLATES.find(t => t.id === s.type);
          hoursCount += template ? template.hrs : 12;
        });
      }
    });

    const earned = emp.rateType === 'day' 
      ? daysCount * emp.rate 
      : hoursCount * emp.rate;

    accumulatedGrandTotal += earned;

    return {
      emp,
      days: daysCount,
      hours: hoursCount,
      earned
    };
  });

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-amber-500/5 border border-white/5 shadow-xl rounded-2xl md:rounded-3xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3 mb-4">
        <h3 className="text-xs uppercase tracking-widest text-[#10b981] font-extrabold flex items-center gap-1.5 label-salary">
          <Wallet className="w-4 h-4 text-emerald-400" />
          Расчет зарплаты &amp; Статистика
        </h3>
        <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400 total-pay">
          Итого: {accumulatedGrandTotal.toLocaleString('ru-RU')} ₽
        </span>
      </div>

      {salaryEntries.length === 0 ? (
        <p className="text-xs text-center py-4 text-gray-500 font-semibold">Нет сотрудников</p>
      ) : (
        <div className="space-y-4">
          {salaryEntries.map(({ emp, days, hours, earned }) => {
            const initial = emp.name.trim().charAt(0).toUpperCase() || '?';
            
            return (
              <div key={emp.id} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.02] last:border-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-black shadow-inner shadow-black/20 shrink-0"
                    style={{ backgroundColor: emp.color }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-gray-200 truncate pr-1">
                      {emp.name}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span>Ставка: {emp.rate} ₽/{emp.rateType === 'day' ? 'смена' : 'ч'}</span>
                      <span className="text-gray-600 font-normal">•</span>
                      <span className="text-gray-500 text-[9px] uppercase tracking-wider font-extrabold">
                        {emp.rateType === 'day' ? 'Смены' : 'Почасовая'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300 earned-sum">
                    {earned.toLocaleString('ru-RU')} ₽
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 text-[10px] font-extrabold text-gray-500 mt-1 uppercase tracking-wider">
                    <span className="flex items-center gap-0.5 text-ellipsis">
                      <CalendarDays className="w-3 h-3 text-amber-400 shrink-0" />
                      {days} дн
                    </span>
                    <span className="text-gray-700/60 font-normal">|</span>
                    <span className="flex items-center gap-0.5 text-ellipsis">
                      <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                      {hours} ч
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
