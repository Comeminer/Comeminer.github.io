'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { siteConfig } from '../siteConfig';

const activeGroup = siteConfig.bgGroups?.find(group => group.id === siteConfig.activeBgGroup);
const images = activeGroup ? activeGroup.images : siteConfig.bgImages || [];
const storageKey = 'blog-background-playback';
const BackgroundContext = createContext<{
  images: string[];
  index: number;
  paused: boolean;
  toggle: () => void;
} | null>(null);

export function BackgroundPlaybackProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      const savedIndex = images.indexOf(saved?.image);
      if (saved?.paused === true && savedIndex >= 0) {
        setIndex(savedIndex);
        setPaused(true);
      }
    } catch { /* Storage may be unavailable; the control still works. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ paused, image: images[index] }));
    } catch { /* Keep the selection for this visit when storage is unavailable. */ }
  }, [index, paused, ready]);

  useEffect(() => {
    if (!ready || paused || images.length <= 1) return;
    const timer = setInterval(() => setIndex(current => (current + 1) % images.length), 10000);
    return () => clearInterval(timer);
  }, [paused, ready]);

  return (
    <BackgroundContext.Provider value={{ images, index, paused, toggle: () => setPaused(current => !current) }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackgroundPlayback() {
  const context = useContext(BackgroundContext);
  if (!context) throw new Error('BackgroundPlaybackProvider is required');
  return context;
}

export function BackgroundPlaybackButton() {
  const { images, paused, toggle } = useBackgroundPlayback();
  if (siteConfig.useGradient || images.length <= 1) return null;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      title={paused ? '恢复每 10 秒切换背景' : '停止轮播，固定当前背景图片'}
      className="rounded-full border border-indigo-300 bg-white/80 px-4 py-2 text-sm font-medium text-indigo-800 shadow-sm transition-colors hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-indigo-600 dark:bg-slate-800 dark:text-indigo-200 dark:hover:bg-slate-700"
    >
      {paused ? '恢复背景轮播' : '固定当前背景'}
    </button>
  );
}
