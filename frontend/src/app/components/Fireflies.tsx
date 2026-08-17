"use client";

import { useEffect, useRef } from 'react';

export default function Fireflies() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fireflies: any[] = [];
    const numFireflies = 50;

    for (let i = 0; i < numFireflies; i++) {
      fireflies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 2,
        ang: Math.random() * 2 * Math.PI,
        v: (Math.random() * 0.5) + 0.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(196, 181, 253, 0.8)'; // Antigravity violet accent

      fireflies.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.s, 0, 2 * Math.PI);
        ctx.fill();

        f.x += f.v * Math.cos(f.ang);
        f.y += f.v * Math.sin(f.ang);

        // Randomly change direction slightly
        f.ang += (Math.random() * 0.1) - 0.05;

        // Wrap around
        if (f.x < 0) f.x = canvas.width;
        if (f.x > canvas.width) f.x = 0;
        if (f.y < 0) f.y = canvas.height;
        if (f.y > canvas.height) f.y = 0;
      });

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6
      }} 
    />
  );
}
