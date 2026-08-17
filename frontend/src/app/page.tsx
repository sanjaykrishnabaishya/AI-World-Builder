import Image from "next/image";
import styles from "./page.module.css";

export default async function Home() {
  let backendMessage = "Connecting to backend...";
  try {
    const res = await fetch("http://127.0.0.1:8000/", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      backendMessage = data.message;
    }
  } catch (error) {
    backendMessage = "Backend is currently offline. Start FastAPI to see the message!";
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'serif', letterSpacing: '2px' }}>AI World Builder</h1>
        <p style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '2rem' }}>Your infinite universe awaits.</p>
        
        <div style={{ padding: '20px', background: '#111', borderRadius: '8px', border: '1px solid #333' }}>
          <h2 style={{ fontSize: '1rem', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Server Status</h2>
          <p style={{ color: '#00ffcc', fontFamily: 'monospace', fontSize: '1.1rem' }}>{backendMessage}</p>
        </div>
      </main>
    </div>
  );
}
