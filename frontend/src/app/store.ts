import { create } from 'zustand';

export interface Faction {
  name: string;
  description: string;
  motto: string;
  leader: string;
}

export interface POI {
  name: string;
  description: string;
  danger_level: string;
}

export interface WorldLore {
  world_name: string;
  core_history: string;
  magic_system: string;
  factions: Faction[];
  points_of_interest: POI[];
}

interface AppState {
  spark: string;
  setSpark: (spark: string) => void;
  lore: WorldLore | null;
  setLore: (lore: WorldLore | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  spark: '',
  setSpark: (spark) => set({ spark }),
  lore: null,
  setLore: (lore) => set({ lore }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),
}));
