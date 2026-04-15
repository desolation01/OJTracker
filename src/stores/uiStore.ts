"use client";

import { create } from "zustand";

interface UIState {
  isEntryPanelOpen: boolean;
  activeDate: string | null;
  setEntryPanelOpen: (open: boolean) => void;
  setActiveDate: (date: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isEntryPanelOpen: false,
  activeDate: null,
  setEntryPanelOpen: (open) => set({ isEntryPanelOpen: open }),
  setActiveDate: (date) => set({ activeDate: date }),
}));
