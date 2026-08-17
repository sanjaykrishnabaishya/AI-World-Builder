"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Globe, Loader2, Sparkles, Folder, Plus, MapPin, Users, BookOpen } from 'lucide-react';
import { useAppStore } from './store';

export default function Home() {
  const { 
    projects, currentProjectId, createNewProject, loadProject, saveCurrentProject,
    spark, setSpark, lore, setLore, 
    storyContent, setStoryContent, appendStoryContent,
    isLoading, setIsLoading, error, setError,
    chatHistory, addMessage, clearChat, isChatLoading, setIsChatLoading
  } = useAppStore();

  const [chatInput, setChatInput] = useState('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  useEffect(() => {
    if (projects.length === 0 && !currentProjectId && !spark) {
      createNewProject();
    }
  }, []);

  const handleCastSpark = async () => {
    if (!spark) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spark })
      });
      if (!response.ok) throw new Error("Backend unreachable.");
      const data = await response.json();
      setLore(data);
      saveCurrentProject();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    if (!lore) return;
    setIsGeneratingStory(true);
    setStoryContent('');
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lore })
      });
      
      if (!response.body) throw new Error("No readable stream");
      const reader = response.body.getReader();
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
      setError("Story generation failed: " + err.message);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleSendChat = async (overrideMsg?: string) => {
    const msgToSend = overrideMsg || chatInput;
    if (!msgToSend.trim()) return;
    
    if (msgToSend.startsWith('/imagine ')) {
       const prompt = msgToSend.replace('/imagine ', '');
       addMessage({ role: 'user', content: msgToSend });
       setChatInput('');
       setIsChatLoading(true);
       
       try {
         const response = await fetch('http://127.0.0.1:8000/api/generate/image', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ prompt: prompt })
         });
         
         if (!response.ok) throw new Error("Image generation failed (the model might be loading).");
         const data = await response.json();
         addMessage({ role: 'model', content: `Generated image for: "${prompt}"`, image_url: data.image_url });
       } catch (err: any) {
         addMessage({ role: 'model', content: "Error: " + err.message + "\n\n(If the model is loading, wait 30 seconds and try again)." });
       } finally {
         setIsChatLoading(false);
       }
       return;
    }

    addMessage({ role: 'user', content: msgToSend });
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgToSend, lore: lore, history: chatHistory }) 
      });
      
      if (!response.ok) throw new Error("Chat backend offline.");
      const data = await response.json();
      addMessage({ role: 'model', content: data.reply });
    } catch (err: any) {
      addMessage({ role: 'model', content: "Error: " + err.message });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="workspace-container" style={{ position: 'relative', zIndex: 1 }}>
      {/* Sidebar: Projects */}
      <div className="sidebar" style={{ width: '280px' }}>
        <div className="top-nav" style={{ gap: '10px' }}>
           <Globe size={20} color="var(--accent-color)" /> Atlas Studio
        </div>
        
        <div style={{ padding: '1rem' }}>
          <button className="btn-primary" style={{ width: '100%', marginBottom: '2rem' }} onClick={createNewProject}>
            <Plus size={18} /> New Workspace
          </button>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
             Saved Projects
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {projects.map(p => (
               <div 
                 key={p.id} 
                 onClick={() => loadProject(p.id)}
                 style={{ 
                   padding: '0.75rem', 
                   background: currentProjectId === p.id ? 'var(--bg-surface-hover)' : 'transparent',
                   border: currentProjectId === p.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
                   borderRadius: '6px', 
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '10px',
                   color: currentProjectId === p.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                 }}
               >
                 <Folder size={16} /> 
                 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                   {p.lore?.world_name || "Untitled World"}
                 </span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Main Content Area: Split 50/50 vertically if lore exists */}
      <div className="main-content" style={{ display: 'flex', flexDirection: 'row' }}>
        
        {/* Left Column: Lore & Story */}
        <div style={{ flex: 1, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', height: '100%' }}>
           <div className="top-nav">World & Story</div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              {!lore ? (
                <div style={{ maxWidth: '600px', margin: '0 auto', marginTop: '10vh' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Initiate Genesis</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Provide the core spark for your world. The engine will structure it instantly.</p>
                  
                  <textarea 
                    className="input-base" 
                    style={{ minHeight: '150px', marginBottom: '1rem' }}
                    placeholder="E.g. A hollow earth society where citizens ride giant armored beetles..."
                    value={spark}
                    onChange={(e) => setSpark(e.target.value)}
                  />
                  <button className="btn-primary" onClick={handleCastSpark} disabled={isLoading || !spark}>
                    {isLoading ? <><Loader2 className="animate-spin" size={18} /> Generating World Lore...</> : <><Sparkles size={18} /> Initialize Lore</>}
                  </button>
                  {error && <p style={{ color: '#ff4444', marginTop: '1rem' }}>{error}</p>}
                </div>
              ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                   <div style={{ marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>{lore.world_name}</h2>
                   </div>
                   
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                     <div className="panel" style={{ padding: '1rem' }}>
                       <h3 style={{ color: 'var(--accent-color)', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={16}/> Core Setting</h3>
                       <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{lore.core_history}</p>
                     </div>
                     <div className="panel" style={{ padding: '1rem' }}>
                       <h3 style={{ color: 'var(--accent-color)', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={16}/> Technology & Magic</h3>
                       <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{lore.magic_system}</p>
                     </div>
                   </div>

                   <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '2rem 0' }} />
                   
                   {/* Story Generation Section */}
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 style={{ fontSize: '2rem' }}>The Chronicle</h2>
                      {!storyContent && (
                         <button className="btn-primary" onClick={handleGenerateStory} disabled={isGeneratingStory}>
                           {isGeneratingStory ? <><Loader2 className="animate-spin" size={18} /> Weaving...</> : 'Generate 6k+ Word Story'}
                         </button>
                      )}
                   </div>

                   {storyContent && (
                      <div className="panel" style={{ background: 'var(--bg-base)', border: 'none', padding: '0' }}>
                         <div style={{ whiteSpace: 'pre-wrap', fontSize: '1.1rem', lineHeight: 1.8, color: '#e0e0e0' }}>
                           {storyContent}
                         </div>
                         {isGeneratingStory && <div style={{ marginTop: '1rem', color: 'var(--accent-color)' }}><Loader2 className="animate-spin" size={20} /></div>}
                      </div>
                   )}
                </div>
              )}
           </div>
        </div>

        {/* Right Column: Story Weaver Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-surface)' }}>
          <div className="top-nav" style={{ background: 'var(--bg-base)' }}>Story Weaver</div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
             {chatHistory.map((msg, i) => (
               <div key={i} className={`chat-message ${msg.role}`}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  {msg.image_url && (
                    <img src={msg.image_url} alt="Generated Art" style={{ marginTop: '1rem', width: '100%', borderRadius: '8px', border: '1px solid var(--border-subtle)' }} />
                  )}
               </div>
             ))}
             {isChatLoading && (
               <div className="chat-message ai" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <Loader2 className="animate-spin" size={18} /> Weaver is typing...
               </div>
             )}
             <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
             
             {/* Suggestion Chips */}
             <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }} onClick={() => handleSendChat("I want to change the main character's name to Aris.")}>
                  Change Character Name
                </button>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }} onClick={() => handleSendChat("/imagine A highly detailed digital painting of the main location")}>
                  Generate Location Image
                </button>
                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap' }} onClick={() => handleSendChat("/imagine A highly detailed digital painting of the main character")}>
                  Generate Character Image
                </button>
             </div>

             <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="input-base" 
                  placeholder="Direct the Weaver: e.g. 'Rewrite paragraph 2', 'Add a plot twist', '/imagine a dragon'"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                />
                <button className="btn-primary" onClick={() => handleSendChat()} disabled={isChatLoading || !chatInput.trim()}>
                  <Send size={18} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
