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
  userEmail?: string;
  spark: string;
  genre?: string;
  lore: WorldLore | null;
  chatHistory: ChatMessage[];
  storyContent: string;
  customName?: string;
  isArchived?: boolean;
  status?: 'generating' | 'done' | 'error' | 'stopped';
  error?: string;
}

export interface Notification {
  id: string;
  projectId: string;
  message: string;
}

interface AppState {
  userEmail: string | null;
  loginTime: number | null;
  login: (email: string) => void;
  logout: () => void;
  checkSession: () => boolean;

  projects: Project[];
  currentProjectId: string | null;
  
  currentView: 'dashboard' | 'workspace';
  setCurrentView: (view: 'dashboard' | 'workspace') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  generatingProjects: string[];
  notifications: Notification[];
  addNotification: (projectId: string, message: string) => void;
  removeNotification: (id: string) => void;
  selectedGenre: string | null;
  setSelectedGenre: (genre: string | null) => void;
  
  // UI Actions
  createNewProject: (genre?: string | null) => void;
  loadProject: (id: string) => void;
  
  // Engine Actions
  fetchProjects: () => Promise<void>;
  pollProject: (id: string) => Promise<Project | null>;
  startWorldGeneration: (spark: string, genre: string | null) => Promise<void>;
  stopGeneration: (projectId: string) => Promise<void>;
  sendChatMessage: (projectId: string, message: string) => Promise<void>;
  sendChatImage: (projectId: string, prompt: string) => Promise<void>;
  
  archiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, newName: string) => Promise<void>;

  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isChatLoading: boolean;
  setIsChatLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userEmail: null,
      loginTime: null,
      login: (email) => set({ userEmail: email, loginTime: Date.now(), currentView: 'dashboard' }),
      logout: () => set({ userEmail: null, loginTime: null, projects: [], currentProjectId: null, currentView: 'dashboard' }),
      checkSession: () => {
         const time = get().loginTime;
         if (time && Date.now() - time > 48 * 60 * 60 * 1000) {
            get().logout();
            return false;
         }
         return !!get().userEmail;
      },

      projects: [],
      currentProjectId: null,
      
      currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      generatingProjects: [],
      notifications: [],
      addNotification: (projectId, message) => set((state) => ({ 
        notifications: [...state.notifications, { id: Date.now().toString(), projectId, message }] 
      })),
      removeNotification: (id) => set((state) => ({ 
        notifications: state.notifications.filter(n => n.id !== id) 
      })),
      selectedGenre: null,
      setSelectedGenre: (genre) => set({ selectedGenre: genre }),

      createNewProject: (genre?: string | null) => {
        set({
          currentProjectId: null, // Will be set when generation starts
          selectedGenre: genre !== undefined ? genre : null,
          currentView: 'workspace'
        });
      },

      loadProject: (id) => {
        set({
          currentProjectId: id,
          selectedGenre: null,
          currentView: 'workspace'
        });
        get().pollProject(id);
      },

      fetchProjects: async () => {
        const email = get().userEmail;
        if (!email) return;
        try {
            const res = await fetch('http://127.0.0.1:8000/api/projects', {
              headers: { 'X-User-Email': email || '' }
            });
            if (res.ok) {
              const data = await res.json();
              set({ projects: data.projects });
              // Re-hydrate generating projects
              const generating = data.projects.filter((p: Project) => p.status === 'generating').map((p: Project) => p.id);
              set({ generatingProjects: generating });
            }
        } catch (e) {
            console.error("Failed to fetch projects");
        }
      },

      pollProject: async (id) => {
        const email = get().userEmail;
        if (!email) return null;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/project/${id}`, {
              headers: { 'X-User-Email': email || '' }
            });
            if (res.ok) {
              const project = await res.json();
              set(state => {
                  const idx = state.projects.findIndex(p => p.id === id);
                  const newProjects = [...state.projects];
                  if (idx >= 0) newProjects[idx] = project;
                  else newProjects.push(project);
                  
                  // Handle completion notification if we transitioned from generating -> done
                  let newGenerating = [...state.generatingProjects];
                  if (state.generatingProjects.includes(id) && project.status !== 'generating') {
                      newGenerating = newGenerating.filter(gid => gid !== id);
                      if (project.status === 'done' && state.currentProjectId !== id) {
                          get().addNotification(id, "World generation completed!");
                      }
                  } else if (project.status === 'generating' && !state.generatingProjects.includes(id)) {
                      newGenerating.push(id);
                  }
                  
                  return { projects: newProjects, generatingProjects: newGenerating, isLoading: false };
              });
              return project;
            }
        } catch (e) {
            console.error("Poll failed", e);
        }
        return null;
      },

      startWorldGeneration: async (spark, genre) => {
        const email = get().userEmail;
        if (!email) return;
        set({ isLoading: true, error: null });
        try {
            // 1. Start project
            const res = await fetch('http://127.0.0.1:8000/api/project/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-User-Email': email || '' },
              body: JSON.stringify({ spark, genre })
            });
            if (!res.ok) throw new Error("Failed to create project");
            const data = await res.json();
            const projectId = data.project_id;
            
            set({ currentProjectId: projectId });
            set(state => {
                const newProj = { id: projectId, userEmail: email, spark, genre, lore: null, chatHistory: [], storyContent: '', status: 'generating', isArchived: false };
                const newGenerating = [...state.generatingProjects, projectId];
                return { projects: [...state.projects, newProj], generatingProjects: newGenerating };
            });
            
            get().pollProject(projectId);
            
        } catch (e: any) {
            console.error(e);
            set({ error: e.message, isLoading: false });
        }
      },

      stopGeneration: async (projectId: string) => {
          const email = get().userEmail;
          if (!email) return;
          try {
              await fetch(`http://127.0.0.1:8000/api/project/${projectId}/stop`, { 
                method: 'POST',
                headers: { 'X-User-Email': email || '' }
              });
              await get().pollProject(projectId);
          } catch (e) {
              console.error(e);
          }
      },
      
      sendChatMessage: async (projectId, message) => {
          const email = get().userEmail;
          if (!email) return;
          set({ isChatLoading: true });
          try {
              await fetch(`http://127.0.0.1:8000/api/project/${projectId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Email': email || '' },
                body: JSON.stringify({ message })
              });
              await get().pollProject(projectId);
          } catch (e) {
              console.error(e);
          } finally {
              set({ isChatLoading: false });
          }
      },
      
      sendChatImage: async (projectId, prompt) => {
          const email = get().userEmail;
          if (!email) return;
          set({ isChatLoading: true });
          try {
              await fetch(`http://127.0.0.1:8000/api/project/${projectId}/chat_image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Email': email || '' },
                body: JSON.stringify({ prompt })
              });
              await get().pollProject(projectId);
          } catch (e) {
              console.error(e);
          } finally {
              set({ isChatLoading: false });
          }
      },

      archiveProject: async (id) => {
          const email = get().userEmail;
          if (!email) return;
          try {
              await fetch(`http://127.0.0.1:8000/api/project/${id}/archive`, { 
                method: 'POST',
                headers: { 'X-User-Email': email || '' }
              });
              await get().fetchProjects();
              if (get().currentProjectId === id) get().createNewProject();
          } catch (e) {
              console.error(e);
          }
      },

      deleteProject: async (id) => {
          const email = get().userEmail;
          if (!email) return;
          try {
              await fetch(`http://127.0.0.1:8000/api/project/${id}`, { 
                method: 'DELETE',
                headers: { 'X-User-Email': email || '' }
              });
              await get().fetchProjects();
              if (get().currentProjectId === id) get().createNewProject();
          } catch (e) {
              console.error(e);
          }
      },

      renameProject: async (id, newName) => {
          const email = get().userEmail;
          if (!email) return;
          try {
              await fetch(`http://127.0.0.1:8000/api/project/${id}/rename`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Email': email || '' },
                body: JSON.stringify({ name: newName })
              });
              await get().fetchProjects();
          } catch (e) {
              console.error(e);
          }
      },

      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      isChatLoading: false,
      setIsChatLoading: (isChatLoading) => set({ isChatLoading }),
      error: null,
      setError: (error) => set({ error }),
    }),
    {
      name: 'atlas-studio-auth',
      partialize: (state) => ({ userEmail: state.userEmail, loginTime: state.loginTime }),
    }
  )
);
