"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Plus, Settings2, MoreVertical, Edit2, Trash2, Archive, Search, Bell, Home as HomeIcon, Compass, Folder, ArrowLeft, Square, ChevronDown, ChevronUp, ChevronLeft, Copy, Download, FileText, Menu, X } from 'lucide-react';
import { useAppStore } from './store';

const AI_INSPIRATIONS = [
  { genre: 'Superhero', text: "In a world where most people have special super powers called Quirks, a boy named Leo born without powers dreams of being a hero. Leo inherits the power of the world's top hero and joins a special school to fight evil and save people." },
  { genre: 'Fantasy', text: "In a shattered world of floating islands above a poisonous sea, a young pilot named Elara discovers a forgotten map. Elara must navigate treacherous skies and rival factions to find the legendary safe haven before the sea rises to consume them all." },
  { genre: 'Cyberpunk', text: "In a neon-drenched megacity where memories can be extracted and sold, a rogue archivist named Kael stumbles upon a memory that proves the ruling megacorp's greatest product is actually wiping people's minds. Kael must expose the truth while being hunted by cybernetic enforcers." },
  { genre: 'Sci-Fi', text: "In a universe where faster-than-light travel requires a pilot's consciousness to temporarily merge with a dark-matter entity, a veteran pilot named Nova gets stuck mid-jump. Nova's crew has to venture into the ship's mind-bending engine room to rescue her sanity before the entity consumes them." },
  { genre: 'Steampunk', text: "In a soot-choked Victorian metropolis powered by massive clockwork gears, an orphaned mechanic named Orion finds a blueprint for a machine that creates clean air. Orion joins forces with a wealthy rebel to build it, sparking a revolution against the smog-barons." },
  { genre: 'Horror', text: "In an isolated mountain town where the sun hasn't risen in six months, nightmares begin physically manifesting in the dark. A skeptical sheriff named Silas must team up with a reclusive occultist to find the source of the curse before the shadows tear the town apart." },
  { genre: 'Post-Apocalyptic', text: "In a world reclaimed by hyper-aggressive, sentient plant life, humanity survives in moving crawler-cities. A scavenger named Rya finds a seed that doesn't mutate, setting off on a dangerous journey to find fertile soil and start the first true farm in centuries." },
  { genre: 'Mystery', text: "In a 1920s city where everyone's exact date of death is tattooed on their wrist at birth, a detective named Arthur discovers a string of murders where the victims died years before their scheduled dates. Arthur must catch the killer who has seemingly found a way to cheat fate." },
  { genre: 'Space Opera', text: "In a galaxy fractured by a centuries-long war between telepathic monks and cyborg warlords, a smuggler named Jax accidentally steals a weapon capable of destroying suns. Jax must assemble a ragtag crew to return it to its ancient creators before either side can use it." },
  { genre: 'Urban Fantasy', text: "In modern-day London, mythological creatures live secretly among humans, regulated by a magical mafia. When a werewolf mob boss is assassinated, a human detective named Clara who can see through illusions is forced to solve the case to prevent an all-out supernatural gang war." },
  { genre: 'Dystopian', text: "In a society where your worth is determined by a constantly updating social score, a perfect citizen named Maya inexplicably drops to a score of zero. Now an outlaw, Maya must survive in the lawless lower levels and hack the central AI to clear her name." },
  { genre: 'Historical Fantasy', text: "In ancient Rome where the gods physically walk the earth but are losing their powers, a gladiator named Cassius is chosen by a dying Ares. Cassius must fight his way out of the arena to find the stolen ambrosia that can restore the pantheon before the empire collapses." },
  { genre: 'Thriller', text: "In a high-tech facility where time flows backwards, an investigator named Elena must solve her own murder by piecing together clues before the event actually occurs in her reverse-timeline." },
  { genre: 'Comedy', text: "In a universe where bureaucratic red tape governs the laws of physics, a low-level clerk named Bob accidentally files the wrong paperwork and temporarily disables gravity on Earth. Bob must navigate the floating chaos to submit an appeal to the intergalactic council." },
  { genre: 'Romance', text: "In a society where soulmates are linked by a red string of fate visible to everyone, a woman named Lyra discovers her string has been intentionally cut. Lyra sets out to find the person who wields the fabled 'Scissors of Destiny' to forge her own path." },
  { genre: 'Western', text: "In a harsh desert where the frontier is expanding into parallel dimensions, a lone gunslinger named Wyatt rides between worlds hunting a dimension-hopping outlaw who destroyed his hometown." }
];

const InspirationWidget = () => {
  const [ideas, setIdeas] = useState<{genre: string, text: string}[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const lastSwipeTime = useRef(0);
  const { createNewProject, startWorldGeneration } = useAppStore();

  useEffect(() => {
    // Robust Fisher-Yates shuffle to guarantee completely random selection
    const shuffleArray = (array: any[]) => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };

    const byGenre: Record<string, typeof AI_INSPIRATIONS> = {};
    AI_INSPIRATIONS.forEach(item => {
      if(!byGenre[item.genre]) byGenre[item.genre] = [];
      byGenre[item.genre].push(item);
    });
    
    // Pick 4 strictly different genres
    const shuffledGenres = shuffleArray(Object.keys(byGenre)).slice(0, 4);
    
    const selected = shuffledGenres.map(g => {
      const items = byGenre[g];
      return items[Math.floor(Math.random() * items.length)];
    });
    
    setIdeas(selected);
  }, []);

  if (ideas.length === 0) return null;

  const currentIdea = ideas[currentIndex];

  const handleCreate = () => {
     const genre = typeof currentIdea === 'string' ? "Fantasy" : currentIdea?.genre || "Fantasy";
     const text = typeof currentIdea === 'string' ? currentIdea : currentIdea?.text || "";
     createNewProject(genre);
     setTimeout(() => startWorldGeneration(text, null), 100);
  };


  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (diff > 50) {
      setCurrentIndex((prev) => (prev + 1) % ideas.length);
    } else if (diff < -50) {
      setCurrentIndex((prev) => (prev - 1 + ideas.length) % ideas.length);
    }
    setTouchStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastSwipeTime.current < 400) return; // Throttle wheel events
    
    if (Math.abs(e.deltaX) > 20) {
      if (e.deltaX > 0) {
        setCurrentIndex((prev) => (prev + 1) % ideas.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + ideas.length) % ideas.length);
      }
      lastSwipeTime.current = now;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      setCurrentIndex((prev) => (prev + 1) % ideas.length);
    } else if (e.key === 'ArrowLeft') {
      setCurrentIndex((prev) => (prev - 1 + ideas.length) % ideas.length);
    }
  };

  return (
    <div 
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e) => e.currentTarget.focus()}
      style={{ 
        background: 'rgba(20, 22, 28, 0.4)', 
        backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '20px', 
        padding: '1.5rem', 
        width: '100%', 
        maxWidth: '350px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        userSelect: 'none',
        outline: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)' }}>
        <span style={{ fontSize: '1.1rem' }}>✨</span>
        <span style={{ fontWeight: 500, fontSize: '1rem' }}>AI Inspiration</span>
      </div>
      
      <div style={{ minHeight: '110px', display: 'flex', alignItems: 'center' }}>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#f0f0f0', transition: 'opacity 0.3s ease', textAlign: 'justify', fontWeight: 600 }}>"{typeof currentIdea === 'string' ? currentIdea : currentIdea?.text}"</p>
      </div>

      <button 
        className="btn-glass-gradient" 
        style={{ width: '100%' }}
        onClick={handleCreate}
      >
        Create World from Idea <span style={{ marginLeft: '4px' }}>↗</span>
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '0.5rem' }}>
        <button 
          onClick={() => setCurrentIndex(prev => prev === 0 ? ideas.length - 1 : prev - 1)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px', opacity: 0.8 }}
        >
          &lt;
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {ideas.map((_, idx) => (
            <div 
              key={idx} 
              onClick={() => setCurrentIndex(idx)}
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: idx === currentIndex ? 'var(--accent-gold)' : 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'background 0.3s ease'
              }} 
            />
          ))}
        </div>
        <button 
          onClick={() => setCurrentIndex(prev => prev === ideas.length - 1 ? 0 : prev + 1)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px', opacity: 0.8 }}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  const { 
    projects, currentProjectId, createNewProject, loadProject, archiveProject, deleteProject, renameProject,
    fetchProjects, pollProject,
    isLoading, error,
    chatLoadingState,
    currentView, setCurrentView, searchQuery, setSearchQuery,
    startWorldGeneration, stopGeneration, sendChatMessage, sendChatImage,
    generatingProjects, notifications, removeNotification,
    selectedGenre, setSelectedGenre,
    userEmail, login, logout, checkSession
  } = useAppStore();

  const [inputVal, setInputVal] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWorldsDropdown, setShowWorldsDropdown] = useState(false);
  const [showMenuForProject, setShowMenuForProject] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showMobileLore, setShowMobileLore] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const bgScrollRef = useRef<HTMLDivElement>(null);
  const workspaceScrollRef = useRef<HTMLDivElement>(null);

  // Derive active project
  const currentProject = projects.find(p => p.id === currentProjectId);
  const spark = currentProject?.spark || '';
  const lore = currentProject?.lore || null;
  const storyContent = currentProject?.storyContent || '';
  const chatHistory = currentProject?.chatHistory || [];

  useEffect(() => {
    if (checkSession()) {
      fetchProjects();
    }
  }, [fetchProjects, checkSession]);

  const isChatLoading = chatLoadingState[currentProject?.id || ''];

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    const activePollingIds = generatingProjects;
    if (activePollingIds.length === 0) return;
    
    const interval = setInterval(() => {
      activePollingIds.forEach(id => pollProject(id));
    }, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [generatingProjects, pollProject]);

  useEffect(() => {
    if (!isUserScrolled && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading, storyContent, isUserScrolled]);

  const handleWorkspaceScroll = (e: React.UIEvent<HTMLDivElement>) => {
     const container = e.currentTarget;
     const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
     setIsUserScrolled(!isNearBottom);
  };

  const handleSendChat = async (overrideMsg?: string) => {
    if (!currentProjectId) return;
    const msgToSend = overrideMsg || inputVal;
    if (!msgToSend.trim()) return;
    setInputVal('');

    if (msgToSend.startsWith('/imagine ')) {
       const prompt = msgToSend.replace('/imagine ', '');
       await sendChatImage(currentProjectId, prompt);
       return;
    }

    await sendChatMessage(currentProjectId, msgToSend);
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!currentProject && !isLoading) {
        startWorldGeneration(inputVal, selectedGenre);
        setInputVal('');
      } else if (currentProject && !isChatLoading && currentProject.status !== 'generating') {
        handleSendChat();
      }
    }
  };

  const activeProjects = projects.filter(p => !p.isArchived).reverse(); 
  
  const allTemplates = [
    { name: "Superhero", desc: "Caped crusaders and extraordinary abilities", img: "/Superhero.jpeg" },
    { name: "Action+Advanture", desc: "High-octane thrills and perilous journeys", img: "/Action.jpeg" },
    { name: "Mythical", desc: "Gods, legends, and ancient magic", img: "/batch1_img5.jpg" },
    { name: "Sci-Fi", desc: "Space exploration and advanced tech", img: "/bg_vertical.jpg" },
    { name: "Dark Fantasy", desc: "Gritty, grim worlds with dangerous magic", img: "/batch2_img2.jpg" },
    { name: "Ancient Civilization", desc: "Lost empires and forgotten histories", img: "/batch2_img3.jpg" },
    { name: "Modern", desc: "Contemporary settings with a twist", img: "/mordern.jpeg" },
    { name: "Dystopian Era", desc: "Bleak futures and totalitarian regimes", img: "/Dystopian.jpeg" },
    { name: "Futuristic", desc: "Cyberpunk and highly advanced societies", img: "/futuristic.jpeg" },
    { name: "Horror", desc: "Terrifying realms and cosmic dread", img: "/batch1_img2.jpg" },
    { name: "Supernatural", desc: "Vampires, werewolves, and the occult", img: "/batch1_img3.jpg" },
    { name: "High Fantasy", desc: "Epic quests, elves, and vast kingdoms", img: "/batch1_img1.jpg" },
    { name: "Magic", desc: "Wizards, witches, and spellcrafting", img: "/batch2_img5.jpg" }
  ];

  const searchResults = searchQuery.trim() ? [
     ...activeProjects.filter(p => (p.customName || p.lore?.world_name || p.spark).toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({ type: 'world', data: p })),
     ...allTemplates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map(t => ({ type: 'template', name: t.name, img: t.img }))
  ] : [];

  const renderSidebarNav = () => (
    <>
      {showMobileNav && <div className="overlay" onClick={() => setShowMobileNav(false)} />}
      <div className={`sidebar-left ${showMobileNav ? 'open' : ''}`} style={{ width: '280px', zIndex: 100 }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }} className="mobile-only">
           <X size={24} color="#fff" onClick={() => setShowMobileNav(false)} />
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0px' }}>
           <img src="/logo_mark.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'cover', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,1)) brightness(1.2)' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
           <img src="/logo_text.png" alt="ATLAS STUDIO" style={{ height: '45px', objectFit: 'contain', marginTop: '0', marginLeft: '-20px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,1)) brightness(1.2)' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
        
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div 
            onClick={() => setCurrentView('dashboard')} 
            style={{ padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: currentView === 'dashboard' ? 'var(--accent-glow)' : 'transparent', color: currentView === 'dashboard' ? 'var(--accent-gold)' : '#c59b27' }}
          >
            <HomeIcon size={18} /> Home
          </div>
          
          <div style={{ padding: '1rem 1rem 0.5rem 1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 500 }}>
            <Folder size={16} /> My Worlds
          </div>

          <div style={{ paddingLeft: '2.5rem', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
            {activeProjects.map(p => (
               <div key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>
                 <div 
                   onClick={() => loadProject(p.id)}
                   style={{ fontSize: '0.9rem', color: currentProjectId === p.id ? 'var(--accent-gold)' : 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                 >
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                      {p.customName || p.lore?.world_name || "Untitled World"}
                      {p.status === 'generating' && <Loader2 size={12} className="animate-spin" style={{ display: 'inline', marginLeft: '5px' }}/>}
                    </div>
                    
                    <MoreVertical 
                      size={14} 
                      style={{ opacity: 0.7, flexShrink: 0, marginLeft: '8px' }} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenuForProject(showMenuForProject === p.id ? null : p.id);
                      }}
                    />
                 </div>

                  {showMenuForProject === p.id && (
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.2rem', marginBottom: '0.4rem', padding: '0.2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.7rem', padding: '0.3rem 0.4rem', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); const newName = window.prompt("Rename world:"); if (newName) renameProject(p.id, newName); setShowMenuForProject(null); }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Edit2 size={12}/> Rename</div>
                        <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.7rem', padding: '0.3rem 0.4rem', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); archiveProject(p.id); setShowMenuForProject(null); }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Archive size={12}/> Archive</div>
                        <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#ff4444', fontSize: '0.7rem', padding: '0.3rem 0.4rem', borderRadius: '4px' }} onClick={(e) => { e.stopPropagation(); if (window.confirm("Are you sure you want to permanently delete this world?")) deleteProject(p.id); setShowMenuForProject(null); }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}><Trash2 size={12}/> Delete</div>
                     </div>
                  )}
               </div>
            ))}
            {activeProjects.length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No worlds yet.</span>}
          </div>
        </div>
        
        <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent' }}>
           <img src="/profile.jpg" alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'top' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
           <div style={{ flex: 1, overflowX: 'auto', whiteSpace: 'nowrap', msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="no-scrollbar">
             <span style={{ fontSize: '0.9rem', color: '#fff', paddingRight: '1rem' }}>{userEmail ? userEmail.split('@')[0] : ''}</span>
           </div>
           <button onClick={logout} title="Sign Out" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
             <Settings2 size={16} />
           </button>
        </div>
      </div>
    </>
  );

  const renderMobileHeader = () => (
    <div className="mobile-header">
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Menu size={24} color="#fff" onClick={() => setShowMobileNav(true)} />
          <img src="/logo_mark.png" alt="Logo" style={{ width: '40px', height: '40px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,1)) brightness(1.2)' }} />
       </div>
       <div style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>Atlas Studio</div>
       <div>
         {lore && <Settings2 size={24} color="#fff" onClick={() => setShowMobileLore(!showMobileLore)} />}
       </div>
    </div>
  );

  const renderTopBar = () => (
    <div style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2rem', position: 'relative', zIndex: 9999 }} className="padding-responsive">
       <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="input-base" 
            placeholder="Search Worlds, Genres..." 
            style={{ paddingLeft: '3rem', background: '#111218' }}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
            onFocus={() => setShowSearchDropdown(true)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
          />
          {showSearchDropdown && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', marginTop: '0.5rem', padding: '0.5rem', zIndex: 50, boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
              {searchResults.map((res: any, idx) => (
                <div 
                  key={idx} 
                  style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    if (res.type === 'world') {
                       loadProject(res.data.id);
                    } else {
                       createNewProject(res.name);
                    }
                  }}
                >
                  {res.type === 'world' ? <Folder size={14} color="var(--accent-gold)"/> : <Compass size={14} color="var(--accent-color)" />}
                  {res.type === 'world' ? (res.data.customName || res.data.lore?.world_name || res.data.spark) : res.name}
                </div>
              ))}
            </div>
          )}
       </div>
       
       <div style={{ position: 'relative' }}>
         <Bell 
            size={20} 
            color={notifications.length > 0 ? 'var(--accent-gold)' : '#fff'} 
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
            onClick={() => setShowNotifications(!showNotifications)}
         />
         {notifications.length > 0 && <div style={{ position: 'absolute', top: -2, right: -2, width: '8px', height: '8px', background: 'red', borderRadius: '50%' }} />}
         
         {showNotifications && (
            <div style={{ position: 'absolute', top: '100%', right: 0, background: 'rgba(10, 12, 16, 0.98)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-subtle)', borderRadius: '12px', marginTop: '1rem', width: '300px', zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.8)', padding: '1rem' }}>
               <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Notifications</h4>
               {notifications.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No new notifications.</p> : null}
               {notifications.map(n => (
                  <div key={n.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => { loadProject(n.projectId); removeNotification(n.id); setShowNotifications(false); }}>
                     <p style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', marginBottom: '4px' }}>Generation Complete</p>
                     <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                  </div>
               ))}
            </div>
         )}
       </div>


    </div>
  );

  const renderDashboard = () => (
    <div className="workspace-container">
      {renderSidebarNav()}
      
      {renderMobileHeader()}
      <div 
        ref={workspaceScrollRef}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative' }}
        onScroll={handleWorkspaceScroll}
      >
        
        <div style={{ position: 'relative', zIndex: 9999 }}>
           {renderTopBar()}
        </div>

        <div className="padding-responsive" style={{ padding: '0 3rem 3rem 3rem', maxWidth: '1400px', width: '100%', position: 'relative', zIndex: 10 }}>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '2rem', marginBottom: '4rem', justifyContent: 'space-between' }}>
             <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
                <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1rem', color: '#fff', fontWeight: 300, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>Build worlds<br/>beyond <span style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>imagination</span></h1>
                <p style={{ color: '#eee', fontSize: '1.1rem', marginBottom: '2rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>Atlas Studio is your AI-powered worldbuilding studio.<br/>Create immersive worlds for stories, games, and more.</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <button className="btn-glass-gradient" onClick={() => createNewProject(null)}><Plus size={18}/> Create New World</button>
                   <button className="btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' })}><Compass size={18}/> Explore Genres</button>
                </div>
             </div>
             <div style={{ flex: '1 1 350px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
               <InspirationWidget />
             </div>
           </div>

           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>My Worlds</h2>
             <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setCurrentView('my-worlds')}>View All &gt;</span>
           </div>

           <div className="dashboard-grid" style={{ marginBottom: '4rem' }}>
              {activeProjects.slice(0, 8).map(p => {
                 const firstImageMsg = p.chatHistory.find(m => m.image_url);
                 const charCodeSum = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                 const fallbackIndex = charCodeSum % 38;
                 const batchNum = Math.floor(fallbackIndex / 5) + 1;
                 const imgNum = (fallbackIndex % 5) + 1;
                 const thumbUrl = firstImageMsg?.image_url || `/batch${batchNum}_img${imgNum}.jpg`; 
                 return (
                   <div key={p.id} className="world-card" onClick={() => loadProject(p.id)}>
                     <div className="world-card-image" style={{ backgroundImage: `url('${thumbUrl}')` }} />
                     <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                           <h3 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.customName || p.lore?.world_name || "Untitled World"}</h3>
                           <MoreVertical size={16} color="var(--text-secondary)" onClick={(e) => { e.stopPropagation(); archiveProject(p.id); }} />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                           {p.status === 'generating' ? <span style={{color: 'var(--accent-gold)'}}>Generating... <Loader2 size={10} className="animate-spin" style={{display:'inline'}}/></span> : 
                           (p.lore ? 'Detailed World' : 'Sparked World')}
                        </p>
                     </div>
                   </div>
                 );
              })}
              {activeProjects.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>You haven't forged any worlds yet.</p>}
           </div>

           <div id="explore-section">
             <h2 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '1rem' }}>Explore <span style={{ color: 'var(--accent-gold)' }}>Genres</span></h2>
             <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Select a genre to strictly enforce its aesthetic, rules, and worldbuilding layout for your next creation.</p>
             
             <div className="dashboard-scroll-row">
                {allTemplates.map(t => (
                   <div key={t.name} className="world-card" onClick={() => createNewProject(t.name)}>
                      <div className="world-card-image" style={{ backgroundImage: `url('${t.img}')` }} />
                      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                         <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>{t.name}</h3>
                         <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.desc}</p>
                      </div>
                   </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );


  const renderMyWorlds = () => (
    <div className="workspace-container">
      {renderSidebarNav()}
      {renderMobileHeader()}
      <div ref={workspaceScrollRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }} onScroll={handleWorkspaceScroll}>
        {renderTopBar()}
        <div className="padding-responsive" style={{ padding: '0 3rem 3rem 3rem', maxWidth: '1400px', width: '100%' }}>
           <h2 style={{ fontSize: '2rem', fontWeight: 300, marginBottom: '3rem' }}>All <span style={{ color: 'var(--accent-gold)' }}>Worlds</span></h2>
           <div className="dashboard-grid">
              {activeProjects.map(p => {
                 const firstImageMsg = p.chatHistory.find(m => m.image_url);
                 const charCodeSum = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                 const fallbackIndex = charCodeSum % 38;
                 const batchNum = Math.floor(fallbackIndex / 5) + 1;
                 const imgNum = (fallbackIndex % 5) + 1;
                 const thumbUrl = firstImageMsg?.image_url || `/batch${batchNum}_img${imgNum}.jpg`; 
                 return (
                   <div key={p.id} className="world-card" onClick={() => loadProject(p.id)}>
                     <div className="world-card-image" style={{ backgroundImage: `url('${thumbUrl}')` }} />
                     <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                           <h3 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.customName || p.lore?.world_name || "Untitled World"}</h3>
                           <MoreVertical size={16} color="var(--text-secondary)" onClick={(e) => { e.stopPropagation(); archiveProject(p.id); }} />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                           {p.status === 'generating' ? <span style={{color: 'var(--accent-gold)'}}>Generating... <Loader2 size={10} className="animate-spin" style={{display:'inline'}}/></span> : 
                           (p.lore ? 'Detailed World' : 'Sparked World')}
                        </p>
                     </div>
                   </div>
                 );
              })}
           </div>
        </div>
      </div>
    </div>
  );

  const renderWorkspace = () => {
    const isGenerating = currentProject?.status === 'generating';

    return (
    <div className="workspace-container">
      {renderSidebarNav()}
      {renderMobileHeader()}

      <div className="center-canvas">
         <div className="top-nav" style={{ justifyContent: 'space-between' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-primary)' }}>
               <ArrowLeft size={20} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setCurrentView('dashboard')} />
               <span style={{ fontWeight: 500 }}>
                 {currentProject?.customName || lore?.world_name || "New Workspace"}
                 {(currentProject?.genre || selectedGenre) && <span style={{ marginLeft: '10px', fontSize: '0.75rem', background: 'var(--accent-glow)', color: 'var(--accent-gold)', padding: '2px 8px', borderRadius: '12px' }}>{currentProject?.genre || selectedGenre}</span>}
               </span>
             </span>
         </div>

         <div ref={workspaceScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column' }} onScroll={handleWorkspaceScroll}>
            {!currentProject && !isLoading && (
               <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '600px' }}>
                  <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 300 }}>What world shall we weave?</h1>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Describe your universe, and the Atlas engine will generate its history, characters, and a massive story in the background.</p>
               </div>
            )}

            {isLoading && (
               <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--accent-glow)' }}>
                     <Loader2 className="animate-spin" size={32} color="var(--accent-gold)" />
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>Forging World Lore in the background...</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.7 }}>You can return home and start another world while you wait!</p>
               </div>
            )}

            {currentProject?.error && (
               <div style={{ margin: 'auto', maxWidth: '600px', padding: '1.5rem', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)', borderRadius: '12px' }}>
                  <h3 style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Generation Error</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                     {currentProject.error.includes("429") || currentProject.error.includes("RESOURCE_EXHAUSTED") 
                        ? "You have exhausted the Google Gemini API Free Tier daily quota (20 requests/day). To continue generating worlds, please upgrade your Google API key to a Pay-as-you-go plan in Google AI Studio, or wait for your daily limit to reset."
                        : currentProject.error}
                  </p>
               </div>
            )}

            {(storyContent || lore || isGenerating) && (
               <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', marginTop: '2rem' }}>
                  <div className="chat-message user" style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', color: 'white' }}>
                     {spark}
                  </div>
                  
                  {(storyContent || isGenerating) && (
                    <div className="chat-message ai" style={{ marginBottom: '2rem', background: (isGenerating && !storyContent) ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', color: 'white', transition: 'background 0.5s ease' }}>
                      <p className="story-font" style={{ whiteSpace: 'pre-wrap' }}>{storyContent}</p>
                      {isGenerating && !storyContent && (
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '4rem 2rem', perspective: '1000px' }}>
                            <div style={{ transformStyle: 'preserve-3d', animation: 'logo-spin 3s linear infinite' }}>
                               <img src="/logo_mark.png" alt="Generating..." style={{ width: '90px', height: '90px', filter: 'drop-shadow(0 4px 15px rgba(0,0,0,0.8))' }} />
                            </div>
                            <span style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 500, textShadow: '0 4px 15px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.8)' }}>
                               Generating Story<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
                            </span>
                         </div>
                      )}
                      {isGenerating && storyContent && (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem', color: 'var(--accent-gold)' }}>
                            <Loader2 className="animate-spin" size={20} />
                            <span style={{ fontSize: '0.9rem' }}>Weaving the story...</span>
                         </div>
                      )}
                    </div>
                  )}

                  {chatHistory.slice(1).map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'model'}`} style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', color: 'white' }}>
                       <p className={msg.role === 'model' ? 'story-font' : ''} style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                       {msg.image_url && (
                         <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                           <img src={msg.image_url} alt="Generated Art" style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', objectFit: 'contain' }} />
                         </div>
                       )}
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="chat-message ai" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', color: 'white' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-gold)' }}>
                          <Loader2 className="animate-spin" size={24} />
                          <span>Weaving Response...</span>
                       </div>
                    </div>
                  )}
                  {error && <p style={{ color: '#ff4444', textAlign: 'center' }}>{error}</p>}
               </div>
            )}
            <div ref={chatEndRef} />
         </div>

         <div style={{ padding: '0 3rem 2rem 3rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }} className="padding-responsive">
             {lore && !isGenerating && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', alignItems: 'center' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => handleSendChat("Generate a highly detailed image of the main location based on the current story.")} disabled={isChatLoading}>
                    Generate Location Image
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => handleSendChat("Generate a highly detailed image of the main character based on the current story.")} disabled={isChatLoading}>
                    Generate Character Image
                  </button>

                  <div style={{ flex: 1 }} />

                  {storyContent && (
                    <>
                      <button className="btn-secondary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => { navigator.clipboard.writeText(storyContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                        <Copy size={14} /> {copied ? "Copied!" : "Copy Story"}
                      </button>

                      <div style={{ position: 'relative' }}>
                         <button className="btn-gold" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', padding: '0.4rem 0.8rem', borderRadius: '8px' }} onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
                            <Download size={14} /> Download {showDownloadMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                         </button>
                         {showDownloadMenu && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.2rem', background: 'rgba(10, 12, 16, 0.98)', backdropFilter: 'blur(16px)', border: '1px solid var(--accent-gold)', borderRadius: '6px', zIndex: 100, minWidth: '90px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }}>
                               <div title="Download TXT" style={{ cursor: 'pointer', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-primary)' }} onClick={() => { const blob = new Blob([storyContent], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${lore?.world_name || 'Story'}.txt`; a.click(); setShowDownloadMenu(false); }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(200, 170, 110, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <FileText size={12} color="#aaa"/> TXT
                               </div>
                               <div title="Download DOCX" style={{ cursor: 'pointer', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-primary)' }} onClick={() => { fetch(`https://ai-world-builder-backend.onrender.com/api/project/${currentProjectId}/download/docx`, { headers: { 'X-User-Email': userEmail || '' }}).then(async res => { if (!res.ok) { const text = await res.text(); alert('DOCX Download failed: ' + text); throw new Error(text); } return res.blob(); }).then(blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${lore?.world_name || 'Story'}.docx`; a.click(); URL.revokeObjectURL(url); setShowDownloadMenu(false); }).catch(err => console.error(err)); }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(200, 170, 110, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <FileText size={12} color="#4285F4"/> DOCX
                               </div>
                               <div title="Download PDF" style={{ cursor: 'pointer', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-primary)' }} onClick={() => { fetch(`https://ai-world-builder-backend.onrender.com/api/project/${currentProjectId}/download/pdf`, { headers: { 'X-User-Email': userEmail || '' }}).then(async res => { if (!res.ok) { const text = await res.text(); alert('PDF Download failed: ' + text); throw new Error(text); } return res.blob(); }).then(blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${lore?.world_name || 'Story'}.pdf`; a.click(); URL.revokeObjectURL(url); setShowDownloadMenu(false); }).catch(err => console.error(err)); }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(200, 170, 110, 0.15)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                  <FileText size={12} color="#EA4335"/> PDF
                               </div>
                            </div>
                         )}
                      </div>
                    </>
                  )}
               </div>
             )}

             <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
                <textarea 
                  className="input-base" 
                  style={{ border: 'none', background: 'transparent', resize: 'none', minHeight: '80px', maxHeight: '300px', padding: '1rem 1.5rem', fontSize: '1rem', lineHeight: '1.5' }}
                  placeholder={!lore ? "Message Atlas Studio..." : "Ask the Weaver what happens next, or use /imagine..."}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleEnter}
                />
                
                {isGenerating ? (
                   <button 
                     className="btn-primary" 
                     style={{ borderRadius: '50%', padding: '0.6rem', width: '40px', height: '40px', background: '#ff4444' }}
                     onClick={() => currentProjectId && stopGeneration(currentProjectId)} 
                   >
                     <Square size={16} fill="#fff" color="#fff" />
                   </button>
                ) : (
                   <button 
                     className="btn-primary" 
                     style={{ borderRadius: '50%', padding: '0.6rem', width: '40px', height: '40px', background: 'var(--text-primary)' }}
                     onClick={() => !lore ? (inputVal.trim() && startWorldGeneration(inputVal, selectedGenre)) : handleSendChat()} 
                     disabled={isLoading || isChatLoading || !inputVal.trim()}
                   >
                     {isLoading || isChatLoading ? <Loader2 size={18} className="animate-spin" color="#000" /> : <Send size={18} color="#000" />}
                   </button>
                )}
             </div>
             <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
               Atlas Studio can make mistakes. Check important info.
             </p>
         </div>
      </div>

      {lore && (
        <>
          {showMobileLore && <div className="overlay" onClick={() => setShowMobileLore(false)} />}
          <div className={`sidebar-right ${showMobileLore ? 'open' : ''}`} style={{ width: '350px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', borderLeft: '1px solid var(--border-subtle)' }}>
            <div className="top-nav" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Settings2 size={18} color="var(--accent-gold)" /> World Context</span>
               <X size={20} color="var(--text-secondary)" className="mobile-only" onClick={() => setShowMobileLore(false)} />
            </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
               <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>World Name</h3>
               <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '1.1rem' }}>{lore.world_name}</p>
            </div>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
               <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Core Setting</h3>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{lore.core_history}</p>
            </div>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
               <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Magic & Technology</h3>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{lore.magic_system}</p>
            </div>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
               <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Major Factions</h3>
               {lore.factions.map((f, i) => (
                 <div key={i} style={{ marginBottom: '1rem' }}>
                   <span style={{ color: 'var(--accent-gold)', fontWeight: 500 }}>{f.name}</span><br/>
                   <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.description}</span>
                 </div>
               ))}
             </div>
           </div>
          </div>
        </>
      )}
    </div>
    );
  }



  if (!userEmail) {
     return (
       <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', position: 'relative', overflow: 'hidden' }}>
         <video autoPlay loop muted playsInline style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, zIndex: 0 }}>
            <source src="/hero_bg_video.mp4" type="video/mp4" />
         </video>
         <div className="padding-responsive" style={{ position: 'relative', zIndex: 10, background: 'rgba(10,10,10,0.8)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(10px)', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0px', marginBottom: '2rem' }}>
              <img src="/logo_mark.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'cover', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,1)) brightness(1.2)' }} />
              <img src="/logo_text.png" alt="ATLAS STUDIO" style={{ height: '45px', objectFit: 'contain', marginTop: '0', marginLeft: '-20px', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,1)) brightness(1.2)' }} />
            </div>
            <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontWeight: 500 }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Enter your email to access your worlds.</p>
            <input 
              type="email" 
              placeholder="Email address" 
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && emailInput.trim()) login(emailInput.trim()); }}
              style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: '#fff', marginBottom: '1rem', outline: 'none' }}
            />
            <button 
              className="btn-gold" 
              style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
              onClick={() => { if (emailInput.trim()) login(emailInput.trim()); }}
            >
              Sign In
            </button>
         </div>
       </div>
     );
  }

  const renderGlobalBackground = () => (
    <div ref={bgRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, willChange: 'transform' }}>
       <video 
         autoPlay 
         muted 
         loop
         playsInline 
         style={{ width: '100%', height: '100%', objectFit: 'cover' }}
       >
          <source src="/seamless_bg.mp4" type="video/mp4" />
       </video>
       <div style={{ position: 'absolute', inset: 0, background: 'rgba(6, 7, 10, 0.5)' }} />
       <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '400px', background: 'linear-gradient(to bottom, transparent, var(--bg-base) 90%, var(--bg-base) 100%)' }} />
    </div>
  );

  let viewContent = null;
  if (currentView === 'my-worlds') viewContent = renderMyWorlds();
  else if (currentView === 'dashboard') viewContent = renderDashboard();
  else viewContent = renderWorkspace();

  return (
    <>
      {renderGlobalBackground()}
      {viewContent}
    </>
  );
}
