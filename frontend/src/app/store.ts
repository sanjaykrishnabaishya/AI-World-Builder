import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  image_url?: string;
}

export interface Project {
  id: string;
  spark: string;
  lore: WorldLore | null;
  chatHistory: ChatMessage[];
  storyContent: string; // We'll use this for the streaming story
}

interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  
  // Current active project state
  spark: string;
  setSpark: (spark: string) => void;
  lore: WorldLore | null;
  setLore: (lore: WorldLore | null) => void;
  chatHistory: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  
  storyContent: string;
  setStoryContent: (content: string) => void;
  appendStoryContent: (chunk: string) => void;

  // Actions
  createNewProject: () => void;
  loadProject: (id: string) => void;
  saveCurrentProject: () => void;

  // UI state (not persisted)
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isChatLoading: boolean;
  setIsChatLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const initialChat = [{ role: 'model' as const, content: 'Welcome to Atlas Studio. I am the Story Weaver. Should we start by detailing your characters manually, or would you like me to auto-generate a cast based on your world lore?' }];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      spark: '',
      setSpark: (spark) => set({ spark }),
      lore: null,
      setLore: (lore) => set({ lore }),
      chatHistory: initialChat,
      addMessage: (msg) => {
        set((state) => ({ chatHistory: [...state.chatHistory, msg] }));
        get().saveCurrentProject();
      },
      clearChat: () => set({ chatHistory: initialChat }),
      
      storyContent: '',
      setStoryContent: (content) => {
         set({ storyContent: content });
         get().saveCurrentProject();
      },
      appendStoryContent: (chunk) => {
         set((state) => ({ storyContent: state.storyContent + chunk }));
      },

      createNewProject: () => {
        const state = get();
        // Save current before creating new
        if (state.spark || state.lore) {
           state.saveCurrentProject();
        }
        set({
          currentProjectId: Date.now().toString(),
          spark: '',
          lore: null,
          chatHistory: initialChat,
          storyContent: ''
        });
      },

      loadProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        if (project) {
          set({
            currentProjectId: id,
            spark: project.spark,
            lore: project.lore,
            chatHistory: project.chatHistory,
            storyContent: project.storyContent
          });
        }
      },

      saveCurrentProject: () => {
        const state = get();
        if (!state.currentProjectId && !state.spark && !state.lore) return;
        
        const id = state.currentProjectId || Date.now().toString();
        const projectData: Project = {
          id,
          spark: state.spark,
          lore: state.lore,
          chatHistory: state.chatHistory,
          storyContent: state.storyContent
        };

        set((s) => {
          const existingIndex = s.projects.findIndex(p => p.id === id);
          const newProjects = [...s.projects];
          if (existingIndex >= 0) {
            newProjects[existingIndex] = projectData;
          } else {
            newProjects.push(projectData);
          }
          return { projects: newProjects, currentProjectId: id };
        });
      },

      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      isChatLoading: false,
      setIsChatLoading: (isChatLoading) => set({ isChatLoading }),
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: 'atlas-studio-storage',
      partialize: (state) => ({ 
        projects: state.projects, 
        currentProjectId: state.currentProjectId,
        spark: state.spark,
        lore: state.lore,
        chatHistory: state.chatHistory,
        storyContent: state.storyContent
      }),
    }
  )
);
