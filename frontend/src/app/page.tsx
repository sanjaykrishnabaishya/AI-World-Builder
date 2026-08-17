"use client";

import { useState } from 'react';
import { Send, Globe, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from './store';

export default function Home() {
  const { 
    spark, setSpark, lore, setLore, 
    isLoading, setIsLoading, error, setError,
    chatHistory, addMessage, isChatLoading, setIsChatLoading
  } = useAppStore();

  const [chatInput, setChatInput] = useState('');

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    // Check if it's an image command (we'll implement this fully in Step 4)
    if (chatInput.startsWith('/imagine ')) {
       addMessage({ role: 'user', content: chatInput });
       setChatInput('');
       setIsChatLoading(true);
       setTimeout(() => {
          addMessage({ role: 'model', content: "🎨 Image generation feature is coming in Step 4! For now, describe the visual details you want."});
          setIsChatLoading(false);
       }, 1000);
       return;
    }

    addMessage({ role: 'user', content: chatInput });
    setChatInput('');
    setIsChatLoading(true);

    try {
      // We will create this backend endpoint in Step 3
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, lore: lore, history: chatHistory }) 
      });
      
      if (!response.ok) throw new Error("Chat backend offline. Start the FastAPI server.");
      const data = await response.json();
      addMessage({ role: 'model', content: data.reply });
    } catch (err: any) {
      addMessage({ role: 'model', content: "Error: " + err.message });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="workspace-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="top-nav" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '1.5rem', fontWeight: 600, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <Globe size={20} color="var(--accent-color)" /> Atlas Studio
        </div>
        <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <p style={{ marginBottom: '1rem', fontWeight: 500 }}>Active Workspace</p>
          <div style={{ padding: '0.75rem', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
             {lore ? lore.world_name : "New Project"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ flexDirection: 'row' }}>
        
        {/* Left Pane: World Generator / Lore Viewer */}
        <div style={{ flex: 1, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="top-nav">World Lore</div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {!lore ? (
              <div style={{ maxWidth: '600px', margin: '0 auto', marginTop: '10vh' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Create a New Workspace</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Describe your universe. The Atlas Engine will structure its history, factions, and geography.</p>
                
                <textarea 
                  className="input-base" 
                  style={{ minHeight: '150px', marginBottom: '1rem' }}
                  placeholder="E.g. A cyberpunk city built inside the crater of a dormant volcano..."
                  value={spark}
                  onChange={(e) => setSpark(e.target.value)}
                />
                <button className="btn-primary" onClick={handleCastSpark} disabled={isLoading || !spark}>
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Generating Workspace...</> : <><Sparkles size={18} /> Generate World</>}
                </button>
                {error && <p style={{ color: '#ff4444', marginTop: '1rem' }}>{error}</p>}
              </div>
            ) : (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2.5rem' }}>{lore.world_name}</h2>
                    <button className="btn-secondary" onClick={() => setLore(null)}>New Project</button>
                 </div>
                 
                 <div className="panel" style={{ marginBottom: '2rem' }}>
                   <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Core History</h3>
                   <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{lore.core_history}</p>
                 </div>

                 <div className="panel" style={{ marginBottom: '2rem' }}>
                   <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Magic & Technology</h3>
                   <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{lore.magic_system}</p>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '4rem' }}>
                    <div>
                      <h3 style={{ marginBottom: '1rem' }}>Factions</h3>
                      {lore.factions.map((f, i) => (
                        <div key={i} className="panel" style={{ marginBottom: '1rem', padding: '1rem' }}>
                          <h4 style={{ color: 'var(--text-primary)' }}>{f.name}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Led by {f.leader}</p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{f.description}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 style={{ marginBottom: '1rem' }}>Points of Interest</h3>
                      {lore.points_of_interest.map((poi, i) => (
                        <div key={i} className="panel" style={{ marginBottom: '1rem', padding: '1rem' }}>
                          <h4 style={{ color: 'var(--text-primary)' }}>{poi.name}</h4>
                          <p style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.5rem' }}>Danger: {poi.danger_level}</p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{poi.description}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Interactive Chat / Story Weaver */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-surface)' }}>
          <div className="top-nav" style={{ background: 'var(--bg-base)' }}>Story Weaver Chat</div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
             {chatHistory.map((msg, i) => (
               <div key={i} className={`chat-message ${msg.role}`}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
               </div>
             ))}
             {isChatLoading && (
               <div className="chat-message ai" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <Loader2 className="animate-spin" size={18} /> Weaver is typing...
               </div>
             )}
          </div>

          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Tip: Type <b>/imagine [description]</b> to generate an image for your story.
             </p>
             <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  className="input-base" 
                  placeholder="Ask a question, describe a character, or continue the story..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                />
                <button className="btn-primary" onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}>
                  <Send size={18} />
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
