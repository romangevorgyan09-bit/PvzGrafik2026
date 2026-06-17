import React, { useState } from 'react';
import { Employee, PRESET_COLORS } from '../types';
import { 
  Plus, Edit, Trash2, Moon, Sun, Download, Upload, Trash, LogOut, 
  HelpCircle, UserCog, Palette, ShieldAlert, KeyRound, Check, X
} from 'lucide-react';

interface SettingsProps {
  employees: Employee[];
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
  onAddEmployee: (name: string, color: string, rate: number, rateType: 'hour' | 'day') => void;
  onUpdateEmployee: (id: string, name: string, color: string, rate: number, rateType: 'hour' | 'day') => void;
  onDeleteEmployee: (id: string) => void;
  onStartTour: () => void;
  onExportData: () => void;
  onImportData: (data: any) => void;
  onClearAllData: () => void;
  onLogout: () => void;
  userEmail: string | null;
  recoveryCode?: string;
}

export default function Settings({
  employees,
  theme,
  onThemeChange,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onStartTour,
  onExportData,
  onImportData,
  onClearAllData,
  onLogout,
  userEmail,
  recoveryCode
}: SettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [rate, setRate] = useState(0);
  const [rateType, setRateType] = useState<'hour' | 'day'>('hour');

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setColor(PRESET_COLORS[0]);
    setRate(150);
    setRateType('hour');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setColor(emp.color);
    setRate(emp.rate);
    setRateType(emp.rateType);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingId) {
      onUpdateEmployee(editingId, name.trim(), color, rate, rateType);
    } else {
      onAddEmployee(name.trim(), color, rate, rateType);
    }
    setIsModalOpen(false);
  };

  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);

  React.useEffect(() => {
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(v => setIsPersisted(v));
    }
  }, []);

  const handleRequestPersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const granted = await navigator.storage.persist();
        setIsPersisted(granted);
        if (granted) {
          alert('Защита активирована! Локальные данные успешно защищены от автоматической очистки кэша на уровне вашей операционной системы.');
        } else {
          alert('Дополнительная защита не поддерживается вашим браузером или уже управляется ОС.');
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      alert('Ваш браузер не поддерживает API защиты постоянных данных. Но не волнуйтесь, стандартный кэш все равно очищается только при полном очищении приложения в настройках операционной системы.');
    }
  };

  const handleCopyTextBackup = () => {
    const localRaw = localStorage.getItem('PVZ_SCHEDULE_DATA_GUEST');
    if (!localRaw) {
      alert('У вас пока нет сохраненных локальных данных для резервной копии.');
      return;
    }
    try {
      const encoded = btoa(unescape(encodeURIComponent(localRaw)));
      navigator.clipboard.writeText(`PVZ_BACKUP_${encoded}`);
      alert('Текстовый код вашей резервной копии успешно скопирован в буфер обмена! Вы можете сохранить его в Заметки или отправить себе в Telegram.');
    } catch (err) {
      alert('Ошибка при кодировании данных: ' + err);
    }
  };

  const handleRestoreTextBackup = () => {
    const rawInput = prompt('Вставьте ранее скопированный текстовый код резервной копии (он должен начинаться с PVZ_BACKUP_):');
    if (!rawInput) return;

    let cleanInput = rawInput.trim();
    if (cleanInput.startsWith('PVZ_BACKUP_')) {
      cleanInput = cleanInput.replace('PVZ_BACKUP_', '');
    }

    try {
      const decodedJson = decodeURIComponent(escape(atob(cleanInput)));
      const parsed = JSON.parse(decodedJson);
      if (!parsed || !Array.isArray(parsed.employees)) {
        alert('Неверный формат текстовой резервной копии!');
        return;
      }

      if (confirm('Внимание! Импорт текстовой копии заменит все текущие смены, заметки и настройки сотрудников. Продолжить?')) {
        onImportData(parsed);
      }
    } catch (err) {
      alert('Ошибка восстановления. Убедитесь, что вставили код полностью без ошибок: ' + err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        onImportData(parsed);
      } catch (err) {
        alert('Ошибка при импорте: неверный формат файла JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col space-y-6 max-w-[540px] md:max-w-[720px] xl:max-w-[1020px] mx-auto px-4 pb-28">
      
      {/* Local Storage Protection Header */}
      <div className="bg-[#14141b]/90 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex flex-col gap-4 animate-in fade-in duration-350">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#ffaa00]">
            База данных приложения
          </span>
          <h4 className="font-extrabold text-sm text-gray-200 mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Автономный режим (100% надёжность без аккаунтов)
          </h4>

          {/* Device storage protection info */}
          <div className="mt-3.5 p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                🛡️ Спец-защита кэша в системе: {isPersisted ? 'АКТИВИРОВАНА' : 'НЕ АКТИВИРОВАНА'}
              </span>
              {!isPersisted && (
                <button
                  type="button"
                  onClick={handleRequestPersistence}
                  className="px-2.5 py-1 bg-amber-400 text-black hover:bg-amber-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Усилить защиту кэша
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              {isPersisted 
                ? 'Превосходно! Браузер закрепил хранилище приложения на диске. Ваши данные застрахованы операционной системой от автоматической очистки кэша при нехватке памяти устройства.' 
                : 'По умолчанию операционная система вашего телефона или ПК может автоматически стереть кэш при очистке памяти. Нажмите кнопку выше, чтобы закрепить базу данных и уберечь графики от удаления.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: EMPLOYEES */}
      <div className="bg-[#14141b]/90 border border-white/5 shadow-xl rounded-2xl md:rounded-3xl p-5 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-3 mb-4">
          <UserCog className="w-4 h-4 text-amber-400" />
          Сотрудники
        </h3>

        <div className="space-y-3 mb-4">
          {employees.map((emp) => {
            const initial = emp.name.charAt(0).toUpperCase() || '?';
            return (
              <div key={emp.id} className="flex items-center justify-between p-3.5 bg-black/25 border border-white/[0.03] rounded-xl">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-black shadow-inner shadow-black/20"
                    style={{ backgroundColor: emp.color }}
                  >
                    {initial}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-gray-100">{emp.name}</h5>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                      {emp.rate} ₽ ({emp.rateType === 'day' ? 'за смену' : 'в час'})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-gray-100 transition cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-dashed border-white/10 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить сотрудника
        </button>
      </div>

      {/* SECTION: APP COLORS & THEME */}
      <div className="bg-[#14141b]/90 border border-white/5 shadow-xl rounded-2xl md:rounded-3xl p-5 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-3 mb-4">
          <Palette className="w-4 h-4 text-amber-400" />
          Оформление приложения
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onThemeChange('dark')}
            className={`py-6 border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
              theme === 'dark'
                ? 'bg-amber-400/10 border-amber-400 text-amber-400 font-extrabold'
                : 'bg-black/10 border-white/5 text-gray-400 hover:border-white/10'
            }`}
          >
            <Moon className="w-6 h-6" />
            <span className="text-xs">Темная неоновая</span>
          </button>
          
          <button
            onClick={() => onThemeChange('light')}
            className={`py-6 border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
              theme === 'light'
                ? 'bg-amber-400/10 border-amber-400 text-amber-400 font-extrabold'
                : 'bg-black/10 border-white/5 text-gray-400 hover:border-white/10'
            }`}
          >
            <Sun className="w-6 h-6" />
            <span className="text-xs">Светлая чистая</span>
          </button>
        </div>
      </div>

      {/* SECTION: ONBOARDING ACCORD */}
      <div className="bg-[#14141b]/90 border border-white/5 shadow-xl rounded-2xl md:rounded-3xl p-5 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-3 mb-4">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Интерактивное обучение
        </h3>
        <button
          onClick={onStartTour}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:from-amber-300 hover:to-amber-400 transition active:scale-[0.98] cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
        >
          🎓 Запустить интерактивное обучение
        </button>
      </div>

      {/* SECTION: DATABASE MANAGEMENT & RESET */}
      <div className="bg-[#14141b]/90 border border-white/5 shadow-xl rounded-2xl md:rounded-3xl p-5 backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-extrabold flex items-center gap-1.5 border-b border-white/5 pb-3 mb-4">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          Управление резервными копиями
        </h3>

        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              onClick={onExportData}
              className="py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-gray-300 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Скачать файл (JSON)
            </button>

            <label className="py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-gray-300 transition cursor-pointer flex items-center justify-center gap-2 text-center">
              <Upload className="w-4 h-4 text-emerald-400" />
              Загрузить файл...
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
          </div>

          <div className="h-px bg-white/5 my-1" />

          {/* Quick clipboard textual copy paste */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block pl-1">
              Резервная копия прямо в текст (подходит для телефонов)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                onClick={handleCopyTextBackup}
                className="py-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
              >
                📋 Копировать текст бэкапа
              </button>

              <button
                onClick={handleRestoreTextBackup}
                className="py-3 bg-amber-400/5 hover:bg-amber-400/10 border border-amber-400/10 hover:border-amber-400/20 text-amber-400 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
              >
                📥 Вставить текст бэкапа
              </button>
            </div>
            <p className="text-[9px] text-gray-500 leading-snug pl-1">
              Вы можете скопировать этот текст и сохранить в Telegram или заметки на телефоне на случай непредвиденного сброса.
            </p>
          </div>

          <div className="h-px bg-white/5 my-1" />

          <button
            onClick={onClearAllData}
            className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2"
          >
            <Trash className="w-4 h-4" />
            Полный сброс всех данных
          </button>
        </div>
      </div>

      {/* Employee Editor Dynamic Modal Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
          {/* Backdrop cover click */}
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#14141b] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] md:max-h-[90vh] animate-in slide-in-from-bottom duration-200">
            {/* Native Sheet Drawer Bar handle on top */}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto my-3 md:hidden shrink-0" />

            {/* Sticky Header block inside modal */}
            <div className="flex justify-between items-center px-6 pb-4 pt-1 md:pt-4 border-b border-white/5 shrink-0">
              <h3 className="text-base md:text-lg font-black text-gray-100 uppercase tracking-wide">
                {editingId ? 'Редактировать сотрудника' : 'Новый сотрудник'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable inputs wrapper block */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ffaa00] pl-1">
                  Имя сотрудника
                </label>
                <input
                  type="text"
                  placeholder="Введите имя..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#0a0a0e] border border-white/5 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400 transition text-sm font-bold"
                />
              </div>

              {/* Color badges swatches grid */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ffaa00] pl-1">
                  Цвет на календаре
                </label>
                <div className="flex flex-wrap gap-2.5 pt-1 pl-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full border-2 transition-all shadow-inner relative cursor-pointer"
                      style={{ 
                        backgroundColor: c, 
                        borderColor: color === c ? '#fff' : 'rgba(255,255,255,0.08)',
                        transform: color === c ? 'scale(1.15)' : 'none'
                      }}
                    >
                      {color === c && (
                        <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-black font-extrabold stroke-[3.5px]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate Model switches button row */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ffaa00] pl-1">
                  Тип ставки
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#0a0a0e] p-1 border border-white/5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRateType('hour')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
                      rateType === 'hour' 
                        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20 font-extrabold' 
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    Почасовая
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateType('day')}
                    className={`py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
                      rateType === 'day' 
                        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20 font-extrabold' 
                        : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    За смену
                  </button>
                </div>
              </div>

              {/* Rate Value Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#ffaa00] pl-1">
                  Размер ставки (в рублях)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rate || ''}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="w-full pl-4 pr-10 py-3.5 bg-[#0a0a0e] border border-white/5 rounded-xl text-gray-100 focus:outline-none focus:border-amber-400 transition text-sm font-bold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-extrabold text-sm pl-1 border-l border-white/5 h-5 flex items-center">
                    ₽
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky/Fixed Footer Actions Block with Safe Area Protection */}
            <div className="p-6 border-t border-white/10 bg-[#16161e] md:rounded-b-3xl shrink-0 pb-[calc(env(safe-area-inset-bottom)+20px)] md:pb-6 z-20">
              <div className="grid grid-cols-2 gap-3">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEmployee(editingId);
                      setIsModalOpen(false);
                    }}
                    className="py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold text-sm rounded-xl cursor-pointer hover:bg-red-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-3.5 bg-white/5 text-gray-400 font-extrabold text-sm rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition"
                  >
                    Отмена
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  className="py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-sm rounded-xl cursor-pointer hover:from-amber-300 hover:to-amber-400 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/15"
                >
                  <Check className="w-4 h-4 text-black stroke-[3px]" />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
