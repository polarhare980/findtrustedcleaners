'use client'; import { useEffect, useState } from 'react';
const STORAGE_KEY='ftc_theme';
export default function ThemeToggle(){ const [mode, setMode] = useState('system'); useEffect(()=>{ const s=localStorage.getItem(STORAGE_KEY) || 'system'; setMode(s); },[]);
  function set(next){ localStorage.setItem(STORAGE_KEY, next); setMode(next); const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; const isDark = next==='dark' || (next==='system' && systemDark); document.documentElement.classList.toggle('dark', isDark); }
  return (<div className="fixed right-3 bottom-3 z-50 rounded-full shadow-lg bg-white/90 dark:bg-white/10 backdrop-blur border px-2 py-1 flex items-center gap-2">
    <button aria-label="System theme" onClick={()=>set('system')} className={mode==='system'?'font-semibold underline':''}>System</button><span>·</span>
    <button aria-label="Light theme" onClick={()=>set('light')} className={mode==='light'?'font-semibold underline':''}>Light</button><span>·</span>
    <button aria-label="Dark theme" onClick={()=>set('dark')} className={mode==='dark'?'font-semibold underline':''}>Dark</button></div>);
}
