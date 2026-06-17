/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Employee, Shift, PersonalNote, UserSettings, TEMPLATES } from './types';
import { motion } from 'motion/react';

// Components
import BottomNav from './components/BottomNav';
import Calendar from './components/Calendar';
import Salary from './components/Salary';
import Notes from './components/Notes';
import Settings from './components/Settings';
import AboutModal from './components/AboutModal';
import OnboardingTour from './components/OnboardingTour';
import ShiftsModal from './components/ShiftsModal';
import FillModal from './components/FillModal';
import ConfirmModal from './components/ConfirmModal';

// Icons for top banner
import { Sparkles, BarChart2, CalendarDays, Wallet, Printer } from 'lucide-react';

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Роман', color: '#ffdb4d', rate: 150, rateType: 'hour' },
  { id: 'e2', name: 'Анна', color: '#34d399', rate: 2000, rateType: 'day' }
];

export default function App() {
  const currentUser = null;
  const [authLoading, setAuthLoading] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashStep, setSplashStep] = useState('Загрузка локальной базы...');
  const isGuestMode = true;
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };

  // Application Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Record<string, Shift[]>>({});
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    currentEmpFilter: 'all'
  });

  // UI state managers
  const [activeView, setActiveView] = useState<'schedule' | 'notes' | 'settings'>('schedule');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [activeDate, setActiveDate] = useState<Date | null>(null);
  const [rangeDates, setRangeDates] = useState<string[]>([]);
  const [isShiftsOpen, setIsShiftsOpen] = useState(false);
  const [isFillOpen, setIsFillOpen] = useState(false);

  // Active dates for relative months scrolling
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Custom styled confirmation parameters
  const [confirmParams, setConfirmParams] = useState<{
    isOpen: boolean;
    title: string;
    text: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    text: '',
    onConfirm: () => {}
  });

  // 1. Initial Load of LocalStorage Data
  useEffect(() => {
    const localRaw = localStorage.getItem('PVZ_SCHEDULE_DATA_GUEST');
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        setEmployees(parsed.employees || INITIAL_EMPLOYEES);
        setShifts(parsed.shifts || {});
        setNotes(parsed.personalNotes || []);
        setSettings(parsed.settings || { theme: 'dark', currentEmpFilter: 'all' });
        document.documentElement.setAttribute('data-theme', parsed.settings?.theme || 'dark');
      } catch (e) {
        console.error('Error parsing local storage guest data', e);
      }
    } else {
      // First setup default dummy data
      setEmployees(INITIAL_EMPLOYEES);
      setShifts({});
      setNotes([]);
      setSettings({ theme: 'dark', currentEmpFilter: 'all' });
      document.documentElement.setAttribute('data-theme', 'dark');
      
      localStorage.setItem('PVZ_SCHEDULE_DATA_GUEST', JSON.stringify({
        employees: INITIAL_EMPLOYEES,
        shifts: {},
        personalNotes: [],
        settings: { theme: 'dark', currentEmpFilter: 'all' }
      }));
    }

    // Gorgeous native simulated bootloader sequence
    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 8) + 6;
      if (currentPct >= 100) {
        currentPct = 100;
        clearInterval(interval);
        setTimeout(() => {
          setAuthLoading(false);
        }, 400);
      }
      setSplashProgress(currentPct);

      if (currentPct < 25) {
        setSplashStep('Инициализация локальной базы данных...');
      } else if (currentPct < 50) {
        setSplashStep('Загрузка списков сотрудников...');
      } else if (currentPct < 75) {
        setSplashStep('Подключение интерактивного планировщика...');
      } else if (currentPct < 92) {
        setSplashStep('Защита кэша в реестре устройства...');
      } else {
        setSplashStep('Запуск рабочего стола ПВЗ График...');
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Handle local state commits safely to browser localStorage
  const commitGuestState = (
    nextEmps: Employee[],
    nextShifts: Record<string, Shift[]>,
    nextNotes: PersonalNote[],
    nextSettings: UserSettings
  ) => {
    localStorage.setItem('PVZ_SCHEDULE_DATA_GUEST', JSON.stringify({
      employees: nextEmps,
      shifts: nextShifts,
      personalNotes: nextNotes,
      settings: nextSettings
    }));
  };

  // Launch training walkthrough automatically at first launch
  useEffect(() => {
    const isTourSeen = localStorage.getItem('PVZ_WALKTHROUGH_COMPLETED_V2');
    if (!isTourSeen && !authLoading) {
      setIsTourOpen(true);
    }
  }, [authLoading]);

  const handleFinishTour = () => {
    localStorage.setItem('PVZ_WALKTHROUGH_COMPLETED_V2', '1');
    setIsTourOpen(false);
  };

  // -------------------------------------------------------------------
  // DATA OPERATIONS (Unified routing: Cloud Firestore vs local Guest Mode)
  // -------------------------------------------------------------------

  // Format Helper date strings
  const getDayKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Employees Management
  const handleAddEmployee = async (name: string, color: string, rate: number, rateType: 'hour' | 'day') => {
    const newId = 'e_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newEmp: Employee = { id: newId, name, color, rate, rateType };

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid, 'employees', newId), newEmp);
    } else {
      const updated = [...employees, newEmp];
      setEmployees(updated);
      commitGuestState(updated, shifts, notes, settings);
    }
  };

  const handleUpdateEmployee = async (id: string, name: string, color: string, rate: number, rateType: 'hour' | 'day') => {
    const updatedEmp: Employee = { id, name, color, rate, rateType };

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid, 'employees', id), updatedEmp);
    } else {
      const updated = employees.map(e => e.id === id ? updatedEmp : e);
      setEmployees(updated);
      commitGuestState(updated, shifts, notes, settings);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setConfirmParams({
      isOpen: true,
      title: 'Удалить сотрудника?',
      text: 'Вместе с сотрудником будут удалены все его назначенные смены. Восстановить данные будет невозможно.',
      onConfirm: async () => {
        if (currentUser) {
          const uid = currentUser.uid;
          
          // Delete employee doc
          await deleteDoc(doc(db, 'users', uid, 'employees', id));

          // Clean shifts linked to deleted employee
          Object.entries(shifts).forEach(async ([dateKey, rawRecord]) => {
            const record = rawRecord as Shift[];
            const filtered = record.filter(s => s.empId !== id);
            if (filtered.length !== record.length) {
              if (filtered.length === 0) {
                await deleteDoc(doc(db, 'users', uid, 'days', dateKey));
              } else {
                await setDoc(doc(db, 'users', uid, 'days', dateKey), { shifts: filtered });
              }
            }
          });
        } else {
          const nextEmps = employees.filter(e => e.id !== id);
          
          // Delete guest shifts
          const nextShifts: Record<string, Shift[]> = {};
          Object.entries(shifts).forEach(([dateKey, rawRecord]) => {
            const record = rawRecord as Shift[];
            const filtered = record.filter(s => s.empId !== id);
            if (filtered.length) {
              nextShifts[dateKey] = filtered;
            }
          });

          setEmployees(nextEmps);
          setShifts(nextShifts);
          commitGuestState(nextEmps, nextShifts, notes, settings);
        }
        setConfirmParams(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Day Shifts Management
  const handleAddShift = async (employeeId: string, type: 'full' | 'morning' | 'evening', start: string, end: string) => {
    if (!activeDate) return;
    const dateKey = getDayKey(activeDate);
    const existing = shifts[dateKey] || [];

    // Filter out prior entries of this employee on the same date to avoid double scheduling
    const nextArr = existing.filter(s => s.empId !== employeeId);
    nextArr.push({ empId: employeeId, type, start, end });

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid, 'days', dateKey), { shifts: nextArr });
    } else {
      const nextShifts = { ...shifts, [dateKey]: nextArr };
      setShifts(nextShifts);
      commitGuestState(employees, nextShifts, notes, settings);
    }
  };

  const handleRemoveShift = async (index: number) => {
    if (!activeDate) return;
    const dateKey = getDayKey(activeDate);
    const existing = shifts[dateKey] || [];
    
    const nextArr = [...existing];
    nextArr.splice(index, 1);

    if (currentUser) {
      if (nextArr.length === 0) {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'days', dateKey));
      } else {
        await setDoc(doc(db, 'users', currentUser.uid, 'days', dateKey), { shifts: nextArr });
      }
    } else {
      const nextShifts = { ...shifts };
      if (nextArr.length === 0) {
        delete nextShifts[dateKey];
      } else {
        nextShifts[dateKey] = nextArr;
      }
      setShifts(nextShifts);
      commitGuestState(employees, nextShifts, notes, settings);
    }
  };

  const handleConfirmFill = async (type: 'full' | 'morning' | 'evening', pattern: string) => {
    // Fill scheduler pattern logic
    let targetEmpId = settings.currentEmpFilter;
    if (targetEmpId === 'all') {
      targetEmpId = employees.length ? employees[0].id : '';
    }
    if (!targetEmpId) return;

    const templateRef = TEMPLATES.find(t => t.id === type) || TEMPLATES[0];
    const cloneShifts = { ...shifts };

    if (currentUser) {
      const batchList: Promise<any>[] = [];
      rangeDates.forEach((dateKey, index) => {
        const parts = dateKey.split('-');
        const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dow = dObj.getDay();

        let shouldFill = true;
        if (pattern === '2/2') shouldFill = (index % 4 < 2);
        else if (pattern === '3/3') shouldFill = (index % 6 < 3);
        else if (pattern === '5/2') shouldFill = (dow !== 0 && dow !== 6);
        else if (pattern === '1/1') shouldFill = (index % 2 === 0);

        if (shouldFill) {
          const daySh = cloneShifts[dateKey] || [];
          const nextArr = daySh.filter(s => s.empId !== targetEmpId);
          nextArr.push({ empId: targetEmpId, type, start: templateRef.defaultStart, end: templateRef.defaultEnd });
          
          const p = setDoc(doc(db, 'users', currentUser.uid, 'days', dateKey), { shifts: nextArr });
          batchList.push(p);
        }
      });
      await Promise.all(batchList);
    } else {
      rangeDates.forEach((dateKey, index) => {
        const parts = dateKey.split('-');
        const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dow = dObj.getDay();

        let shouldFill = true;
        if (pattern === '2/2') shouldFill = (index % 4 < 2);
        else if (pattern === '3/3') shouldFill = (index % 6 < 3);
        else if (pattern === '5/2') shouldFill = (dow !== 0 && dow !== 6);
        else if (pattern === '1/1') shouldFill = (index % 2 === 0);

        if (shouldFill) {
          const daySh = cloneShifts[dateKey] || [];
          const nextArr = daySh.filter(s => s.empId !== targetEmpId);
          nextArr.push({ empId: targetEmpId, type, start: templateRef.defaultStart, end: templateRef.defaultEnd });
          cloneShifts[dateKey] = nextArr;
        }
      });
      setShifts(cloneShifts);
      commitGuestState(employees, cloneShifts, notes, settings);
    }

    setIsFillOpen(false);
    setRangeDates([]);
  };

  // Notes Management Operations
  const handleAddNote = async (title: string, body: string) => {
    const id = 'n_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const dateStr = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    const newNote: PersonalNote = { 
      id, 
      title, 
      body, 
      date: dateStr, 
      createdAt: new Date().toISOString() 
    };

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid, 'notes', id), newNote);
    } else {
      const nextNotes = [...notes, newNote];
      setNotes(nextNotes);
      commitGuestState(employees, shifts, nextNotes, settings);
    }
  };

  const handleUpdateNote = async (id: string, title: string, body: string) => {
    const dateStr = new Date().toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    const updatedNote: PersonalNote = { 
      id, 
      title, 
      body, 
      date: dateStr, 
      createdAt: new Date().toISOString() 
    };

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid, 'notes', id), updatedNote);
    } else {
      const nextNotes = notes.map(n => n.id === id ? updatedNote : n);
      setNotes(nextNotes);
      commitGuestState(employees, shifts, nextNotes, settings);
    }
  };

  const handleDeleteNote = (id: string) => {
    setConfirmParams({
      isOpen: true,
      title: 'Удалить заметку?',
      text: 'Данное действие безвозвратно сотрет вашу заметку с серверов.',
      onConfirm: async () => {
        if (currentUser) {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'notes', id));
        } else {
          const nextNotes = notes.filter(n => n.id !== id);
          setNotes(nextNotes);
          commitGuestState(employees, shifts, nextNotes, settings);
        }
        setConfirmParams(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Copy Full Schedule in Text view formatted nicely for Telegram
  const handleCopyScheduleText = () => {
    const keys = Object.keys(shifts).sort();
    
    if (keys.length === 0 || employees.length === 0) {
      showToast('Нет запланированных смен для копирования.');
      return;
    }

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const monthNamesInRussian = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const formattedMonth = `${monthNamesInRussian[currentMonth]} ${currentYear}`;

    let text = `📅 *РАСПИСАНИЕ СМЕН ПВЗ* 📊\n`;
    text += `=========================\n\n`;

    // Calculate monthly statistics and salaries
    let salaryText = `💰 *ЗАРПЛАТА И СТАТИСТИКА ЗА ${formattedMonth.toUpperCase()}*:\n`;
    let grandTotal = 0;
    
    employees.forEach(emp => {
      let daysCount = 0;
      let hoursCount = 0;

      Object.entries(shifts).forEach(([dateStr, record]) => {
        const parts = dateStr.split('-');
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]) - 1;

        if (y === currentYear && m === currentMonth) {
          const empShifts = (record as Shift[]).filter(s => s.empId === emp.id);
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

      grandTotal += earned;

      salaryText += `  • *${emp.name}*: ${earned.toLocaleString('ru-RU')} ₽ (${hoursCount}ч / ${daysCount}дн)\n`;
    });
    
    salaryText += `  *Общая сумма к выплате*: ${grandTotal.toLocaleString('ru-RU')} ₽\n\n`;
    text += salaryText;
    text += `📅 *СМЕНЫ ПО СОТРУДНИКАМ*:\n`;
    text += `-------------------------\n`;

    employees.forEach(emp => {
      let empShifts: { date: string; start: string; end: string; type: string; note?: string }[] = [];
      
      keys.forEach(dateKey => {
        const dayShiftsList = shifts[dateKey] || [];
        dayShiftsList.forEach(s => {
          if (s.empId === emp.id) {
            const parts = dateKey.split('-');
            const friendlyDate = parts.length === 3 ? `${parts[2]}.${parts[1]}` : dateKey;
            empShifts.push({
              date: friendlyDate,
              start: s.start,
              end: s.end,
              type: s.type === 'full' ? 'Полная' : s.type === 'morning' ? 'Утро' : 'Вечер',
              note: s.note
            });
          }
        });
      });

      if (empShifts.length > 0) {
        text += `👤 *${emp.name}*:\n`;
        empShifts.forEach(item => {
          const noteText = item.note ? ` (${item.note})` : '';
          text += `  • ${item.date}: ${item.start} - ${item.end} [${item.type}]${noteText}\n`;
        });
        text += `\n`;
      }
    });

    text += `-------------------------\n`;
    text += `🕒 *ХРОНОЛОГИЧЕСКИЙ ГРАФИК*:\n`;
    
    let hasChronological = false;
    keys.forEach(dateKey => {
      const dayShiftsList = (shifts[dateKey] || []).filter(s => employees.some(e => e.id === s.empId));
      if (dayShiftsList.length > 0) {
        hasChronological = true;
        const parts = dateKey.split('-');
        const friendlyDate = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dateKey;
        text += `📅 ${friendlyDate}:\n`;
        dayShiftsList.forEach(s => {
          const emp = employees.find(e => e.id === s.empId);
          if (emp) {
            const noteText = s.note ? ` (${s.note})` : '';
            const typeText = s.type === 'full' ? '12ч' : s.type === 'morning' ? 'Утро' : 'Вечер';
            text += `  • ${emp.name}: ${s.start} - ${s.end} [${typeText}]${noteText}\n`;
          }
        });
      }
    });

    if (!hasChronological) {
      text = `📅 *РАСПИСАНИЕ СМЕН ПВЗ* 📊\nСмены пока не запланированы.`;
    } else {
      text += `\n\nСкопировано из веб-приложения "ПВЗ График".`;
    }

    try {
      navigator.clipboard.writeText(text);
      showToast('График + расчет зарплат скопированы успешно! Отправьте его в Telegram-чат сотрудников.');
    } catch (err) {
      showToast('Не удалось скопировать график автоматически. Ошибка: ' + err);
    }
  };

  // Direct beautiful window print layout handler
  const handlePrint = () => {
    window.print();
  };

  // Preference Settings Operations 
  const handleThemeChange = async (theme: 'dark' | 'light') => {
    const nextSettings = { ...settings, theme };
    setSettings(nextSettings);
    document.documentElement.setAttribute('data-theme', theme);

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'preferences'), nextSettings);
    } else {
      commitGuestState(employees, shifts, notes, nextSettings);
    }
  };

  const handleEmpFilterChange = async (filterId: string) => {
    const nextSettings = { ...settings, currentEmpFilter: filterId };
    setSettings(nextSettings);

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'preferences'), nextSettings);
    } else {
      commitGuestState(employees, shifts, notes, nextSettings);
    }
  };

  // JSON Management Tools
  const handleExportData = () => {
    const exportBundle = {
      employees,
      shifts,
      personalNotes: notes,
      settings
    };

    try {
      const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pvz-schema-backup-${getDayKey(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      alert('Ошибка скачивания файла: ' + e);
    }
  };

  const handleImportData = async (data: any) => {
    if (!data || !Array.isArray(data.employees)) {
      alert('Неверный формат файла!');
      return;
    }

    setConfirmParams({
      isOpen: true,
      title: 'Импортировать резервную копию?',
      text: 'Внимание! Это полностью ЗАМЕНИТ ваши текущие графики, сотрудников и заметки данными из импортируемого файла.',
      onConfirm: async () => {
        if (currentUser) {
          const uid = currentUser.uid;
          
          // Seeding loaded objects to Firestore
          const batch = writeBatch(db);

          // 1. Save settings
          const setRef = doc(db, 'users', uid, 'settings', 'preferences');
          batch.set(setRef, data.settings || settings);

          // 2. Clear old employees & write new
          data.employees.forEach((e: Employee) => {
            const docRef = doc(db, 'users', uid, 'employees', e.id);
            batch.set(docRef, e);
          });

          // 3. Days shifts
          if (data.shifts) {
            Object.entries(data.shifts).forEach(([dateKey, record]) => {
              const docRef = doc(db, 'users', uid, 'days', dateKey);
              batch.set(docRef, { shifts: record });
            });
          }

          // 4. Notes
          if (Array.isArray(data.personalNotes)) {
            data.personalNotes.forEach((n: PersonalNote) => {
              const docRef = doc(db, 'users', uid, 'notes', n.id);
              batch.set(docRef, n);
            });
          }

          await batch.commit();
        } else {
          setEmployees(data.employees);
          setShifts(data.shifts || {});
          setNotes(data.personalNotes || []);
          setSettings(data.settings || settings);
          commitGuestState(
            data.employees,
            data.shifts || {},
            data.personalNotes || [],
            data.settings || settings
          );
        }
        setConfirmParams(prev => ({ ...prev, isOpen: false }));
        alert('Выполнено: резервная копия восстановлена!');
      }
    });
  };

  const handleClearAllData = () => {
    setConfirmParams({
      isOpen: true,
      title: 'Полный сброс всех данных?',
      text: 'Критическое действие! Это навсегда удалит графики, сотрудников и заметки. Данное действие отменить невозможно.',
      onConfirm: async () => {
        if (currentUser) {
          const uid = currentUser.uid;
          const batch = writeBatch(db);

          // Clear employees collection
          employees.forEach(e => {
            batch.delete(doc(db, 'users', uid, 'employees', e.id));
          });
          // Clear days collection
          Object.keys(shifts).forEach(key => {
            batch.delete(doc(db, 'users', uid, 'days', key));
          });
          // Clear notes collection
          notes.forEach(n => {
            batch.delete(doc(db, 'users', uid, 'notes', n.id));
          });

          batch.set(doc(db, 'users', uid, 'settings', 'preferences'), {
            theme: 'dark',
            currentEmpFilter: 'all'
          });

          await batch.commit();
        } else {
          setEmployees(INITIAL_EMPLOYEES);
          setShifts({});
          setNotes([]);
          setSettings({ theme: 'dark', currentEmpFilter: 'all' });
          commitGuestState(INITIAL_EMPLOYEES, {}, [], { theme: 'dark', currentEmpFilter: 'all' });
        }
        setConfirmParams(prev => ({ ...prev, isOpen: false }));
        alert('Выполнено: все данные сброшены');
      }
    });
  };

  const handleLogout = () => {
    // No-op in offline mode
  };

  // Auth routing gates filter
  if (authLoading) {
    return (
      <div className="fixed inset-0 flex flex-col justify-center items-center bg-[#07070b] text-gray-100 select-none overflow-hidden z-50 px-6">
        {/* Soft glowing space elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[100vw] sm:w-[60vw] aspect-square bg-amber-400/[0.03] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[100vw] sm:w-[70vw] aspect-square bg-emerald-400/[0.02] rounded-full blur-[150px] pointer-events-none" />

        <div className="relative flex flex-col items-center w-full max-w-sm text-center">
          {/* Pulsating Brand Icon Frame */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: 1
            }}
            transition={{
              scale: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
              opacity: { duration: 0.8, ease: "easeOut" }
            }}
            className="relative mb-5"
          >
            {/* Ambient circular ripple aura */}
            <div className="absolute inset-[-15px] rounded-2xl bg-amber-400/10 blur-md animate-pulse duration-1000" />
            
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 via-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-4xl shadow-xl shadow-amber-500/25 relative z-10 border border-white/10 select-none">
              📊
            </div>
          </motion.div>

          {/* App Branding Typography */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="space-y-1"
          >
            <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 uppercase">
              ПВЗ ГРАФИК
            </h2>
            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">
              Интеллектуальный расчет &amp; учет смен
            </p>
          </motion.div>

          {/* Progressive Loading Line */}
          <motion.div 
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-[200px] bg-white/5 h-[4px] rounded-full mt-7 overflow-hidden border border-white/[0.03] p-0 flex"
          >
            <div 
              className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 rounded-full transition-all duration-150 shadow-[0_0_8px_rgb(251,191,36)]"
              style={{ width: `${splashProgress}%` }}
            />
          </motion.div>

          {/* Progressive Progress textual tag */}
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            className="text-[10px] font-black text-amber-400 font-mono tracking-wider mt-2.5"
          >
            {splashProgress}%
          </motion.span>

          {/* Changing Actions loader micro-state */}
          <div className="h-4 mt-1">
            <motion.p 
              key={splashStep}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.8, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[10px] tracking-wide text-gray-400 font-extrabold"
            >
              {splashStep}
            </motion.p>
          </div>
        </div>

        {/* Small Elegant Authors credit watermark line at bottom */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute bottom-8 left-0 right-0 text-center flex flex-col items-center gap-1.5"
        >
          <p className="text-[9px] uppercase tracking-widest text-gray-500 font-black">
            Роман Геворгян • Разработчик
          </p>
          <span className="text-[8px] tracking-wider text-gray-600 font-bold">
            Версия 2.0 (Optimized Offline React Engine)
          </span>
        </motion.div>
      </div>
    );
  }

  // Active dates filtering day-shift index array helper
  const selectedDayShifts = activeDate ? (shifts[getDayKey(activeDate)] || []) : [];

  return (
    <div className="w-full min-h-screen bg-[#0a0a0e] text-gray-100 font-sans tracking-normal relative overflow-x-hidden antialiased pb-24">
      
      {/* Visual glowing layout circles */}
      <div className="absolute top-[-5%] right-[-5%] w-[80vw] sm:w-[50vw] aspect-square bg-[#ffdb4d]/[0.02] rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[80vw] sm:w-[60vw] aspect-square bg-emerald-400/[0.015] rounded-full blur-[120px] pointer-events-none z-0" />

      {/* TOP HEADER STATUS PANEL */}
      <header className="sticky top-0 bg-[#0a0a0e]/80 border-b border-white/5 py-4 px-4 backdrop-blur-md z-30 transition-all">
        <div className="max-w-[540px] md:max-w-[720px] xl:max-w-[1020px] mx-auto flex justify-between items-center gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3 min-w-0" onClick={() => setIsAboutOpen(true)}>
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 to-[#ffa500] text-black text-xl font-black rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              📊
            </div>
            <div className="min-w-0 cursor-pointer">
              <h1 className="text-sm md:text-base font-black text-gray-100 tracking-tight flex items-center gap-1.5">
                ПВЗ График
                <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">
                  Локал
                </span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">
                Расписания &amp; Учет
              </p>
            </div>
          </div>

          {/* Floating actions menu */}
          <div className="flex items-center gap-1.5 shrink-0 print-hide">
            <button
              onClick={handleCopyScheduleText}
              className="w-10 h-10 bg-[#14141b] hover:bg-[#1a1a24] border border-white/5 text-gray-300 hover:text-white rounded-xl flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Скопировать график текстом"
            >
              📋
            </button>
            <button
              onClick={handlePrint}
              className="w-10 h-10 bg-[#14141b] hover:bg-[#1a1a24] border border-white/5 text-emerald-400 hover:text-emerald-300 rounded-xl flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Распечатать график в PDF"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setIsTourOpen(true)}
              className="w-10 h-10 bg-[#14141b] hover:bg-[#1a1a24] border border-white/5 text-gray-300 hover:text-white rounded-xl flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Интерактивный тур"
            >
              🎓
            </button>
          </div>
        </div>
      </header>

      {/* EMPLOYEES CHIP BAR SELECTION */}
      <div className="w-full bg-[#14141b]/20 border-b border-white/5 py-3 overflow-x-auto scrollbar-none z-20 relative">
        <div className="max-w-[540px] md:max-w-[720px] xl:max-w-[1020px] mx-auto px-4 flex gap-2 w-max sm:w-auto">
          <button
            onClick={() => handleEmpFilterChange('all')}
            className={`px-4 py-2 rounded-full font-bold text-xs cursor-pointer transition flex items-center gap-1.5 ${
              settings.currentEmpFilter === 'all'
                ? 'bg-[#14141b] border-2 border-amber-400 text-amber-400 shadow-md'
                : 'bg-[#14141b]/55 border border-white/5 text-gray-400'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-red-400 flex items-center justify-center text-[8px] font-black text-black">
              👥
            </div>
            Все графики
          </button>

          {employees.map((emp) => {
            const isActive = settings.currentEmpFilter === emp.id;
            return (
              <button
                key={emp.id}
                onClick={() => handleEmpFilterChange(emp.id)}
                className={`px-4 py-2 rounded-full font-bold text-xs cursor-pointer transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#14141b] border-2 border-[var(--active-color)] text-[var(--active-color)] shadow-md'
                    : 'bg-[#14141b]/55 border border-white/5 text-gray-400'
                }`}
                style={{ '--active-color': emp.color } as React.CSSProperties}
              >
                <span 
                  className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-black text-black shadow-inner shadow-black/15"
                  style={{ backgroundColor: emp.color }}
                >
                  {emp.name.trim().charAt(0).toUpperCase()}
                </span>
                {emp.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN LAYOUT GATEVIEWS */}
      <main className="py-4 relative">
        
        {/* TAB 1: SCHEDULE VIEW */}
        {activeView === 'schedule' && (
          <div className="max-w-[540px] md:max-w-[720px] xl:max-w-[1020px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-5 px-0 md:px-0">
            
            {/* Calendar Column */}
            <div className="xl:col-span-7 flex flex-col space-y-4">
              <Calendar
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                shifts={shifts}
                employees={employees}
                currentEmpFilter={settings.currentEmpFilter}
                onSelectDay={(date) => {
                  setActiveDate(date);
                  setIsShiftsOpen(true);
                }}
                onSelectRange={(dates) => {
                  setRangeDates(dates);
                  setIsFillOpen(true);
                }}
              />
            </div>

            {/* Statistics Column */}
            <div className="xl:col-span-5 flex flex-col space-y-4 px-4 md:px-0 transition-all">
              <Salary
                currentDate={currentDate}
                shifts={shifts}
                employees={employees}
                currentEmpFilter={settings.currentEmpFilter}
              />
            </div>
          </div>
        )}

        {/* TAB 2: PERSONAL NOTES VIEW */}
        {activeView === 'notes' && (
          <Notes
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {/* TAB 3: SETTINGS PREFERENCES VIEW */}
        {activeView === 'settings' && (
          <Settings
            employees={employees}
            theme={settings.theme}
            onThemeChange={handleThemeChange}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onStartTour={() => setIsTourOpen(true)}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onClearAllData={handleClearAllData}
            onLogout={handleLogout}
            userEmail={currentUser ? currentUser.email : 'Тестовый гость'}
            recoveryCode={settings.recoveryCode}
          />
        )}

      </main>

      {/* FLOATING NAVIGATION DOCK PANEL */}
      <BottomNav
        activeView={activeView}
        onChangeView={setActiveView}
        onShowAbout={() => setIsAboutOpen(true)}
      />

      {/* MODALS AND TOUGHTS SHEETS OVERLAYS */}
      
      {/* Dynamic Shifts Modal sheet on day cell click */}
      <ShiftsModal
        isOpen={isShiftsOpen}
        onClose={() => setIsShiftsOpen(false)}
        date={activeDate}
        shifts={selectedDayShifts}
        employees={employees}
        onAddShift={handleAddShift}
        onRemoveShift={handleRemoveShift}
      />

      {/* Quick Pattern Fill Modal */}
      <FillModal
        isOpen={isFillOpen}
        onClose={() => {
          setIsFillOpen(false);
          setRangeDates([]);
        }}
        selectedDates={rangeDates}
        onConfirmFill={handleConfirmFill}
      />

      {/* Stylized custom Confirm modal */}
      <ConfirmModal
        isOpen={confirmParams.isOpen}
        title={confirmParams.title}
        text={confirmParams.text}
        onConfirm={confirmParams.onConfirm}
        onCancel={() => setConfirmParams(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Project info acknowledgment dialog page */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Interactive Walkthrough Tutorial overlay */}
      {isTourOpen && (
        <OnboardingTour
          onFinish={handleFinishTour}
        />
      )}

      {/* Premium Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-sm px-4 print-hide">
          <div className="bg-[#14141b]/95 border border-emerald-500/30 shadow-2xl rounded-2xl p-4 flex items-center gap-3 backdrop-blur-xl animate-fade-in transition-all">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-base shrink-0">
              ✔️
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-gray-100">Успешно</p>
              <p className="text-[10px] text-gray-400 font-bold leading-normal mt-0.5">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
