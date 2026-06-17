/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  name: string;
  color: string;
  rate: number;
  rateType: 'hour' | 'day';
}

export interface Shift {
  empId: string;
  type: 'full' | 'morning' | 'evening';
  start: string;
  end: string;
  note?: string;
}

export interface DayShifts {
  shifts: Shift[];
}

export interface PersonalNote {
  id: string;
  title: string;
  body: string;
  date: string;
  createdAt: string; // ISO String
}

export interface UserSettings {
  theme: 'dark' | 'light';
  currentEmpFilter: string; // "all" or employee.id
  recoveryCode?: string;
}

export interface ShiftTemplate {
  id: 'full' | 'morning' | 'evening';
  name: string;
  icon: string;
  defaultStart: string;
  defaultEnd: string;
  color: string;
  hrs: number;
}

export const TEMPLATES: ShiftTemplate[] = [
  { id: 'full', name: 'Полная', icon: '☀️', defaultStart: '09:00', defaultEnd: '21:00', color: '#ffdb4d', hrs: 12 },
  { id: 'morning', name: 'Утро', icon: '🌅', defaultStart: '09:00', defaultEnd: '15:00', color: '#34d399', hrs: 6 },
  { id: 'evening', name: 'Вечер', icon: '🌆', defaultStart: '15:00', defaultEnd: '21:00', color: '#60a5fa', hrs: 6 }
];

export const PRESET_COLORS = [
  '#ffdb4d', // Yellow
  '#34d399', // Green
  '#60a5fa', // Blue
  '#f87171', // Red
  '#c084fc', // Purple
  '#f472b6', // Pink
  '#fb923c', // Orange
  '#2dd4bf'  // Teal
];
