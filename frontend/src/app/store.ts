import { create } from 'zustand';
import { persist } from 'zustand/middleware';

declare global {
  interface Window {
    puter: any;
  }
}


export interface Faction { name: string; description: string; motto: string; leader: string; }
export interface POI { name: string; description: string; danger_level: string; }
export interface WorldLore { world_name: string; core_history: string; magic_system: string; factions: Faction[]; points_of_interest: POI[]; }
export interface ChatMessage { role: 'user' | 'model'; content: string; image_url?: string; }

export interface Project {
  id: string; userEmail?: string; spark: string; genre: string | null; lore: WorldLore | null;
  chatHistory: ChatMessage[]; storyContent: string; customName?: string; isArchived?: boolean;
  status?: 'generating' | 'done' | 'error' | 'stopped'; error?: string;
}

export interface Notification { id: string; projectId: string; message: string; }

interface AppState {
  userEmail: string | null; loginTime: number | null; login: (email: string) => void; logout: () => void; checkSession: () => boolean;
  projects: Project[]; currentProjectId: string | null;
  currentView: 'dashboard' | 'workspace' | 'my-worlds'; setCurrentView: (view: 'dashboard' | 'workspace' | 'my-worlds') => void;
  searchQuery: string; setSearchQuery: (query: string) => void;
  generatingProjects: string[]; notifications: Notification[]; addNotification: (projectId: string, message: string) => void; removeNotification: (id: string) => void;
  selectedGenre: string | null; setSelectedGenre: (genre: string | null) => void;
  createNewProject: (genre?: string | null) => void; loadProject: (id: string) => void;
  fetchProjects: () => Promise<void>; pollProject: (id: string) => Promise<Project | null>;
  startWorldGeneration: (spark: string, genre: string | null) => Promise<void>; stopGeneration: (projectId: string) => Promise<void>;
  sendChatMessage: (projectId: string, message: string) => Promise<void>; sendChatImage: (projectId: string, prompt: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>; deleteProject: (id: string) => Promise<void>; renameProject: (id: string, newName: string) => Promise<void>;
  isLoading: boolean; setIsLoading: (isLoading: boolean) => void; isChatLoading: boolean; setIsChatLoading: (isLoading: boolean) => void;
  error: string | null; setError: (error: string | null) => void;
}

const saveProjectsToPuter = async (email: string, projects: Project[]) => {
  if (typeof window !== 'undefined' && window.puter) {
    await window.puter.kv.set('projects_' + email, projects);
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userEmail: null, loginTime: null,
      login: (email) => { set({ userEmail: email, loginTime: Date.now(), currentView: 'dashboard' }); get().fetchProjects(); },
      logout: () => set({ userEmail: null, loginTime: null, projects: [], currentProjectId: null, currentView: 'dashboard' }),
      checkSession: () => {
         const time = get().loginTime;
         if (time && Date.now() - time > 48 * 60 * 60 * 1000) { get().logout(); return false; }
         return !!get().userEmail;
      },
      projects: [], currentProjectId: null, currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }), searchQuery: '', setSearchQuery: (query) => set({ searchQuery: query }),
      generatingProjects: [], notifications: [],
      addNotification: (projectId, message) => set((state) => ({ notifications: [...state.notifications, { id: Date.now().toString(), projectId, message }] })),
      removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) })),
      selectedGenre: null, setSelectedGenre: (genre) => set({ selectedGenre: genre }),
      createNewProject: (genre?: string | null) => { set({ currentProjectId: null, selectedGenre: genre !== undefined ? genre : null, currentView: 'workspace' }); },
      loadProject: (id) => { set({ currentProjectId: id, selectedGenre: null, currentView: 'workspace' }); },

      fetchProjects: async () => {
        const email = get().userEmail; if (!email) return;
        try {
          if (typeof window !== 'undefined' && window.puter) {
             const data = await window.puter.kv.get('projects_' + email);
             if (data) set({ projects: data });
          }
        } catch (e) { console.error("Failed to fetch projects", e); }
      },
      pollProject: async (id) => { return null; },

      startWorldGeneration: async (spark, genre) => {
        const email = get().userEmail; if (!email) return;
        set({ isLoading: true, error: null });
        
        const projectId = Date.now().toString() + Math.random().toString(36).substring(7);
        set({ currentProjectId: projectId });
        
        const newProject: Project = { id: projectId, userEmail: email, spark, genre: genre || null, lore: null, chatHistory: [{role: 'model', content: 'Welcome to Atlas Studio. I am the Story Weaver. What world shall we weave today?'}], storyContent: '', status: 'generating', isArchived: false };
        set(state => {
           const newProjects = [...state.projects, newProject];
           saveProjectsToPuter(email, newProjects);
           return { projects: newProjects, generatingProjects: [...state.generatingProjects, projectId] };
        });

        try {
           const genrePrompt = genre ? "CRITICAL GENRE ENFORCEMENT: Perfect alignment with '" + genre + "'." : "";
           const lorePrompt = "You are the Master Loremaster. Expand this spark into rich world lore:\nSpark: " + spark + "\n" + genrePrompt + "\nCRITICAL: Return ONLY valid JSON exactly matching: {\"world_name\": \"string\", \"core_history\": \"string\", \"magic_system\": \"string\", \"factions\": [{\"name\": \"string\", \"description\": \"string\", \"motto\": \"string\", \"leader\": \"string\"}], \"points_of_interest\": [{\"name\": \"string\", \"description\": \"string\", \"danger_level\": \"string\"}]}";
           
           if (!window.puter) throw new Error("Puter.js not loaded. Refresh the page.");
           
           const loreResponse = await window.puter.ai.chat(lorePrompt, { model: 'gemini-1.5-pro' });
           let loreText = typeof loreResponse === 'string' ? loreResponse : loreResponse.message.content;
           if (loreText.startsWith("```json")) loreText = loreText.replace(/```json/g, "").replace(/```/g, "");
           if (loreText.startsWith("```")) loreText = loreText.replace(/```/g, "");
           
           const parsedLore = JSON.parse(loreText.trim());
           
           set(state => {
              const p = [...state.projects];
              const idx = p.findIndex(x => x.id === projectId);
              if (idx >= 0) { p[idx].lore = parsedLore; saveProjectsToPuter(email, p); }
              return { projects: p };
           });
           
           const storyPrompt = "You are a bestselling author. Write an immersive opening chapter (2000 words) based on this world:\nWorld Name: " + parsedLore.world_name + "\nHistory: " + parsedLore.core_history + "\nMagic: " + parsedLore.magic_system + "\nCRITICAL: Start immediately. End on a massive cliffhanger. At the very end add: 'For what is going to happen next, Type next part...'";
           
           const stream = await window.puter.ai.chat(storyPrompt, { model: 'gemini-1.5-pro', stream: true });
           let fullStory = '';
           
           for await (const chunk of stream) {
              const textChunk = chunk?.text || "";
              fullStory += textChunk;
              set(state => {
                 const p = [...state.projects];
                 const idx = p.findIndex(x => x.id === projectId);
                 if (idx >= 0 && p[idx].status !== ('abort' as any)) {
                    p[idx].storyContent = fullStory;
                    if (fullStory.length % 50 === 0) saveProjectsToPuter(email, p);
                 }
                 return { projects: p };
              });
           }
           
           set(state => {
              const p = [...state.projects];
              const idx = p.findIndex(x => x.id === projectId);
              if (idx >= 0) { 
                 p[idx].status = 'done'; 
                 saveProjectsToPuter(email, p);
              }
              get().addNotification(projectId, "World generation completed!");
              return { projects: p, generatingProjects: state.generatingProjects.filter(id => id !== projectId), isLoading: false };
           });
           
        } catch (e: any) {
           console.error(e);
           set(state => {
              const p = [...state.projects];
              const idx = p.findIndex(x => x.id === projectId);
              if (idx >= 0) { p[idx].status = 'error'; p[idx].error = e.message; saveProjectsToPuter(email, p); }
              return { projects: p, isLoading: false, generatingProjects: state.generatingProjects.filter(id => id !== projectId) };
           });
        }
      },

      stopGeneration: async (projectId) => {
         const email = get().userEmail; if (!email) return;
         set(state => {
            const p = [...state.projects];
            const idx = p.findIndex(x => x.id === projectId);
            if (idx >= 0) { p[idx].status = 'abort' as any; saveProjectsToPuter(email, p); }
            return { projects: p };
         });
      },

      sendChatMessage: async (projectId, message) => {
         const email = get().userEmail; if (!email) return;
         set({ isChatLoading: true });
         
         set(state => {
             const p = [...state.projects];
             const idx = p.findIndex(x => x.id === projectId);
             if (idx >= 0) {
                 p[idx].chatHistory.push({ role: 'user', content: message });
                 saveProjectsToPuter(email, p);
             }
             return { projects: p };
         });
         
         try {
             if (!window.puter) throw new Error("Puter not loaded");
             const proj = get().projects.find(p => p.id === projectId);
             const history = proj?.chatHistory.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })) || [];
             history.unshift({ role: 'system', content: 'You are the Master Weaver. Answer questions about the world lore.' });
             
             const response = await window.puter.ai.chat(history as any, { model: 'gemini-1.5-pro' });
             const reply = typeof response === 'string' ? response : response.message.content;
             
             set(state => {
                 const p = [...state.projects];
                 const idx = p.findIndex(x => x.id === projectId);
                 if (idx >= 0) {
                     p[idx].chatHistory.push({ role: 'model', content: reply });
                     saveProjectsToPuter(email, p);
                 }
                 return { projects: p, isChatLoading: false };
             });
         } catch(e) {
             console.error(e);
             set({ isChatLoading: false });
         }
      },

      sendChatImage: async (projectId, prompt) => {
         const email = get().userEmail; if (!email) return;
         set({ isChatLoading: true });
         try {
             const encoded = encodeURIComponent(prompt);
             const url = 'https://image.pollinations.ai/prompt/' + encoded + '?width=1024&height=1024&nologo=true';
             set(state => {
                 const p = [...state.projects];
                 const idx = p.findIndex(x => x.id === projectId);
                 if (idx >= 0) {
                     p[idx].chatHistory.push({ role: 'model', content: 'Here is a glimpse of that vision...', image_url: url });
                     saveProjectsToPuter(email, p);
                 }
                 return { projects: p, isChatLoading: false };
             });
         } catch(e) { console.error(e); set({ isChatLoading: false }); }
      },

      archiveProject: async (id) => {
         const email = get().userEmail; if (!email) return;
         set(state => {
             const p = [...state.projects];
             const idx = p.findIndex(x => x.id === id);
             if (idx >= 0) { p[idx].isArchived = true; saveProjectsToPuter(email, p); }
             return { projects: p, currentView: 'dashboard' };
         });
      },
      deleteProject: async (id) => {
         const email = get().userEmail; if (!email) return;
         set(state => {
             const p = state.projects.filter(x => x.id !== id);
             saveProjectsToPuter(email, p);
             return { projects: p, currentView: 'dashboard' };
         });
      },
      renameProject: async (id, newName) => {
         const email = get().userEmail; if (!email) return;
         set(state => {
             const p = [...state.projects];
             const idx = p.findIndex(x => x.id === id);
             if (idx >= 0) { p[idx].customName = newName; saveProjectsToPuter(email, p); }
             return { projects: p };
         });
      },

      isLoading: false, setIsLoading: (l) => set({ isLoading: l }),
      isChatLoading: false, setIsChatLoading: (l) => set({ isChatLoading: l }),
      error: null, setError: (e) => set({ error: e })
    }),
    { name: 'atlas-studio-storage' }
  )
);
