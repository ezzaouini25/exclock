import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorldClockItem {
  id: string;
  name: string;
  timeZone: string;
  countryCode: string;
}

export interface AlarmItem {
  id: string;
  time: string; // HH:mm format
  label: string;
  enabled: boolean;
  repeat: "none" | "daily" | "weekdays" | "weekends" | "custom";
  customDays: number[]; // 0-6 (Sun-Sat)
  sound: string;
  volume: number;
  snooze: number; // minutes
}

interface AppState {
  worldClocks: WorldClockItem[];
  alarms: AlarmItem[];
  addWorldClock: (clock: WorldClockItem) => void;
  removeWorldClock: (id: string) => void;
  addAlarm: (alarm: AlarmItem) => void;
  updateAlarm: (id: string, alarm: Partial<AlarmItem>) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
}

const defaultWorldClocks: WorldClockItem[] = [
  {
    id: "1",
    name: "New York",
    timeZone: "America/New_York",
    countryCode: "US",
  },
  { id: "2", name: "London", timeZone: "Europe/London", countryCode: "GB" },
  { id: "3", name: "Tokyo", timeZone: "Asia/Tokyo", countryCode: "JP" },
  { id: "4", name: "Sydney", timeZone: "Australia/Sydney", countryCode: "AU" },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      worldClocks: defaultWorldClocks,
      alarms: [],
      addWorldClock: (clock) =>
        set((state) => ({ worldClocks: [...state.worldClocks, clock] })),
      removeWorldClock: (id) =>
        set((state) => ({
          worldClocks: state.worldClocks.filter((c) => c.id !== id),
        })),
      addAlarm: (alarm) =>
        set((state) => ({ alarms: [...state.alarms, alarm] })),
      updateAlarm: (id, updatedAlarm) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, ...updatedAlarm } : a,
          ),
        })),
      removeAlarm: (id) =>
        set((state) => ({ alarms: state.alarms.filter((a) => a.id !== id) })),
      toggleAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a,
          ),
        })),
    }),
    {
      name: "exclock-storage",
    },
  ),
);
