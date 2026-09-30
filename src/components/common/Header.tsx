import React from 'react';
import { Volume2, VolumeX, Tv, Trophy } from 'lucide-react';
import { sound } from '../../utils/audio';

interface HeaderProps {
  currentTab: 'play' | 'blueprints' | 'remixer';
  onTabChange: (tab: 'play' | 'blueprints' | 'remixer') => void;
  onOpenScores: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  crtFilter: boolean;
  onToggleCrt: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenScores,
  soundMuted,
  onToggleSound,
  crtFilter,
  onToggleCrt,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark in display face */}
      <button
        onClick={() => onTabChange('play')}
        className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors cursor-pointer text-left"
      >
        ArcadeClassic
      </button>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <button
          onClick={() => onTabChange('play')}
          className={`transition-colors hover:text-white cursor-pointer ${
            currentTab === 'play' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Play Classics
        </button>
        <button
          onClick={() => onTabChange('blueprints')}
          className={`transition-colors hover:text-white cursor-pointer ${
            currentTab === 'blueprints' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Game Blueprints
        </button>
        <button
          onClick={() => onTabChange('remixer')}
          className={`transition-colors hover:text-white cursor-pointer ${
            currentTab === 'remixer' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          DNA Remixer
        </button>
        <button
          onClick={onOpenScores}
          className="transition-colors hover:text-white cursor-pointer flex items-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          Leaderboard
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleCrt}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
            crtFilter
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Vintage CRT Monitor Scanlines"
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CRT Mode</span>
        </button>

        <button
          onClick={onToggleSound}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          title={soundMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {soundMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>
      </div>
    </header>
  );
};
