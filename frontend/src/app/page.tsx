"use client";

import { Sparkles, Scroll, Shield, MapPin } from 'lucide-react';
import { useAppStore } from './store';

export default function Home() {
  const { spark, setSpark, lore, setLore, isLoading, setIsLoading, error, setError } = useAppStore();

  const handleCastSpell = async () => {
    if (!spark) return;
    setIsLoading(true);
    setError(null);
    setLore(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spark })
      });

      if (!response.ok) {
        throw new Error("The spell fizzled. Ensure the FastAPI backend is running.");
      }

      const data = await response.json();
      setLore(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>The Grimoire of Worlds</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Describe a concept, a spark of an idea, and watch as the Loremaster weaves it into a living, breathing universe.
        </p>
      </header>

      <main>
        {!lore ? (
          <section style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <textarea 
              className="spark-input" 
              placeholder="E.g. A frozen wasteland where the only heat comes from sleeping dragons buried under the ice..."
              value={spark}
              onChange={(e) => setSpark(e.target.value)}
            />
            <div style={{ marginTop: '2rem' }}>
              <button 
                className="cast-button" 
                onClick={handleCastSpell} 
                disabled={isLoading || !spark}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles className="animate-pulse" /> Weaving the Universe...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles /> Cast Spark
                  </span>
                )}
              </button>
            </div>
            {error && <p style={{ color: '#ff4444', marginTop: '2rem' }}>{error}</p>}
          </section>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
               <h2 style={{ fontSize: '3.5rem' }}>{lore.world_name}</h2>
               <button className="cast-button" onClick={() => setLore(null)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                 Craft a New World
               </button>
            </div>

            <div className="codex-panel">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <Scroll size={28} color="var(--accent-gold)" /> Core History
              </h3>
              <p style={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>{lore.core_history}</p>
              
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginTop: '3rem', marginBottom: '1.5rem' }}>
                <Sparkles size={28} color="var(--accent-gold)" /> Magic & Technology
              </h3>
              <p style={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>{lore.magic_system}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
              <div className="codex-panel">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <Shield size={24} color="var(--accent-gold)" /> Major Factions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {lore.factions.map((f, i) => (
                    <div key={i} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '3px solid var(--accent-gold)' }}>
                      <h4 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{f.name}</h4>
                      <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1rem' }}>"{f.motto}" — Led by {f.leader}</p>
                      <p>{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="codex-panel">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <MapPin size={24} color="var(--accent-gold)" /> Points of Interest
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {lore.points_of_interest.map((poi, i) => (
                    <div key={i} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '3px solid #ff4444' }}>
                      <h4 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{poi.name}</h4>
                      <p style={{ color: '#ff4444', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Danger: {poi.danger_level}</p>
                      <p>{poi.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
