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

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface AppState {
  spark: string;
  setSpark: (spark: string) => void;
  lore: WorldLore | null;
  setLore: (lore: WorldLore | null) => void;
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isChatLoading: boolean;
  setIsChatLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  spark: '',
  setSpark: (spark) => set({ spark }),
  lore: null,
  setLore: (lore) => set({ lore }),
  chatHistory: [{ role: 'model', content: 'Welcome to Atlas Studio. I am the Story Weaver. Should we start by detailing your characters manually, or would you like me to auto-generate a cast based on your world lore?' }],
  addMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  clearChat: () => set({ chatHistory: [{ role: 'model', content: 'Welcome to Atlas Studio. I am the Story Weaver. Should we start by detailing your characters manually, or would you like me to auto-generate a cast based on your world lore?' }] }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  isChatLoading: false,
  setIsChatLoading: (isChatLoading) => set({ isChatLoading }),
  error: null,
  setError: (error) => set({ error }),
}));
