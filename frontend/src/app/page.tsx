"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Globe, Loader2, Sparkles, Folder, Plus, Settings2, Image as ImageIcon } from 'lucide-react';
import { useAppStore } from './store';

export default function Home() {
  const { 
    projects, currentProjectId, createNewProject, loadProject, saveCurrentProject,
    spark, setSpark, lore, setLore, 
    storyContent, setStoryContent, appendStoryContent,
    isLoading, setIsLoading, error, setError,
    chatHistory, addMessage, isChatLoading, setIsChatLoading
  } = useAppStore();

  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading, storyContent]);

  useEffect(() => {
    if (projects.length === 0 && !currentProjectId && !spark) {
      createNewProject();
    }
  }, []);

  const handleInitialGeneration = async () => {
    if (!inputVal.trim()) return;
    const currentSpark = inputVal;
    setInputVal('');
    setSpark(currentSpark);
    setIsLoading(true);
    setError(null);
    setLore(null);
    setStoryContent('');

    try {
      // 1. Generate World Lore
      const loreRes = await fetch('http://127.0.0.1:8000/api/generate/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spark: currentSpark })
      });
      if (!loreRes.ok) throw new Error("Lore generation failed.");
      const loreData = await loreRes.json();
      setLore(loreData);
      
      // Save before story stream starts
      saveCurrentProject();

      // 2. Stream the 6000+ word story directly into the interface
      const storyRes = await fetch('http://127.0.0.1:8000/api/generate/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lore: loreData })
      });
      
      if (!storyRes.body) throw new Error("Stream failed");
      const reader = storyRes.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        appendStoryContent(chunkValue);
      }
      
      saveCurrentProject();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async (overrideMsg?: string) => {
    const msgToSend = overrideMsg || inputVal;
    if (!msgToSend.trim()) return;
    
    // Image Generation Logic
    if (msgToSend.startsWith('/imagine ')) {
       const prompt = msgToSend.replace('/imagine ', '');
       addMessage({ role: 'user', content: msgToSend });
       setInputVal('');
       setIsChatLoading(true);
       
       try {
         const imgRes = await fetch('http://127.0.0.1:8000/api/generate/image', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ prompt: prompt })
         });
         
         if (!imgRes.ok) throw new Error("Image generation failed (the model might be loading).");
         const data = await imgRes.json();
         addMessage({ role: 'model', content: `Generated image for: "${prompt}"`, image_url: data.image_url });
       } catch (err: any) {
         addMessage({ role: 'model', content: "Error: " + err.message + "\n\n(Wait 15 seconds and try again)." });
       } finally {
         setIsChatLoading(false);
       }
       return;
    }

    addMessage({ role: 'user', content: msgToSend });
    setInputVal('');
    setIsChatLoading(true);

    try {
      const chatRes = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgToSend, lore: lore, history: chatHistory }) 
      });
      
      if (!chatRes.ok) throw new Error("Chat backend offline.");
      const data = await chatRes.json();
      addMessage({ role: 'model', content: data.reply });
    } catch (err: any) {
      addMessage({ role: 'model', content: "Error: " + err.message });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!lore && !isLoading) {
        handleInitialGeneration();
      } else if (lore && !isChatLoading) {
        handleSendChat();
      }
    }
  };

  return (
    <div className="workspace-container">
      
      {/* Left Sidebar: Projects */}
      <div className="sidebar-left">
        <div className="top-nav" style={{ gap: '10px' }}>
           <Globe size={20} color="var(--text-primary)" /> Atlas Studio
        </div>
        
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
          <button className="btn-secondary" style={{ width: '100%', marginBottom: '2rem', display: 'flex', justifyContent: 'flex-start', gap: '10px' }} onClick={createNewProject}>
            <Plus size={18} /> New chat
          </button>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>History</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {projects.map(p => (
               <div 
                 key={p.id} 
                 onClick={() => loadProject(p.id)}
                 style={{ 
                   padding: '0.5rem', 
                   background: currentProjectId === p.id ? 'var(--bg-surface-hover)' : 'transparent',
                   borderRadius: '6px', 
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '10px',
                   color: currentProjectId === p.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                   fontSize: '0.9rem'
                 }}
               >
                 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                   {p.lore?.world_name || p.spark || "Empty Project"}
                 </span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Center Canvas: AI Chat & Story Generation */}
      <div className="center-canvas">
         <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            
            {!lore && !isLoading && !storyContent && (
               <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '600px' }}>
                  <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>What world shall we weave?</h1>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Describe your universe, and the Atlas engine will generate its history, characters, and a massive story.</p>
               </div>
            )}

            {isLoading && !storyContent && (
               <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Loader2 className="animate-spin" size={48} color="var(--accent-color)" />
                  <p style={{ color: 'var(--text-secondary)' }}>Forging World Lore...</p>
               </div>
            )}

            {(storyContent || lore) && (
               <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                  <div className="chat-message user" style={{ marginBottom: '2rem' }}>
                     {spark}
                  </div>
                  
                  {storyContent && (
                    <div className="chat-message ai" style={{ marginBottom: '2rem' }}>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.1rem', color: '#e3e3e3' }}>{storyContent}</p>
                      {isLoading && <Loader2 className="animate-spin" size={20} style={{ marginTop: '1rem' }} color="var(--accent-color)" />}
                    </div>
                  )}

                  {chatHistory.slice(1).map((msg, i) => (
                    <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                       <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                       {msg.image_url && (
                         <img src={msg.image_url} alt="Generated Art" style={{ marginTop: '1rem', width: '100%', borderRadius: '12px' }} />
                       )}
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="chat-message ai">
                      <Loader2 className="animate-spin" size={24} color="var(--accent-color)" />
                    </div>
                  )}
                  {error && <p style={{ color: '#ff4444', textAlign: 'center' }}>{error}</p>}
               </div>
            )}
            <div ref={chatEndRef} />
         </div>

         {/* Bottom Input Area */}
         <div style={{ padding: '2rem', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
             
             {lore && !isLoading && (
               <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => handleSendChat("I want to change the main character's name to Aris.")}>
                    Change Character Name
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }} onClick={() => handleSendChat("/imagine A highly detailed digital painting of the main location")}>
                    Generate Location Image
                  </button>
               </div>
             )}

             <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
                <textarea 
                  className="input-base" 
                  style={{ border: 'none', background: 'transparent', resize: 'none', minHeight: '44px', maxHeight: '200px', padding: '0.5rem 1rem' }}
                  placeholder={!lore ? "Message Atlas Studio..." : "Ask the Weaver to edit the story, or use /imagine..."}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleEnter}
                />
                <button 
                  className="btn-primary" 
                  style={{ borderRadius: '50%', padding: '0.6rem', width: '40px', height: '40px' }}
                  onClick={() => !lore ? handleInitialGeneration() : handleSendChat()} 
                  disabled={isLoading || isChatLoading || !inputVal.trim()}
                >
                  <Send size={18} />
                </button>
             </div>
             <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
               Atlas Studio can make mistakes. Check important info.
             </p>
         </div>
      </div>

      {/* Right Sidebar: Context / Lore */}
      {lore && (
        <div className="sidebar-right">
          <div className="top-nav" style={{ justifyContent: 'space-between' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Settings2 size={18} /> World Context</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="lore-panel">
               <h3>World Name</h3>
               <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{lore.world_name}</p>
            </div>
            <div className="lore-panel">
               <h3>Core Setting</h3>
               <p>{lore.core_history}</p>
            </div>
            <div className="lore-panel">
               <h3>Magic & Technology</h3>
               <p>{lore.magic_system}</p>
            </div>
            <div className="lore-panel">
               <h3>Major Factions</h3>
               {lore.factions.map((f, i) => (
                 <div key={i} style={{ marginBottom: '0.5rem' }}>
                   <span style={{ color: 'var(--text-primary)' }}>{f.name}</span> — <span style={{ fontSize: '0.8rem' }}>{f.description}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
