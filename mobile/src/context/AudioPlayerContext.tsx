import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export interface TrackInfo {
  bookId: string;
  bookTitle: string;
  chapterTitle: string;
  coverImage: string;
  chapterIndex: number;
}

interface AudioPlayerCtx {
  trackInfo: TrackInfo | null;
  isPlaying: boolean;
  soundRef: React.MutableRefObject<Audio.Sound | null>;
  chapterIdxRef: React.MutableRefObject<number>;
  setTrackInfo: (info: TrackInfo | null) => void;
  setIsPlaying: (v: boolean) => void;
  stop: () => Promise<void>;
  togglePlayback: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerCtx | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const chapterIdxRef = useRef(0);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try { soundRef.current.setOnPlaybackStatusUpdate(null); } catch {}
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    setTrackInfo(null);
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {}
  }, []);

  return (
    <AudioPlayerContext.Provider value={{
      trackInfo, setTrackInfo,
      isPlaying, setIsPlaying,
      soundRef, chapterIdxRef,
      stop, togglePlayback,
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be inside AudioPlayerProvider');
  return ctx;
}
