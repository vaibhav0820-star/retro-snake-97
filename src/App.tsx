/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameId } from './types/game';
import { Header } from './components/common/Header';
import { HighScoresModal } from './components/common/HighScoresModal';
import { SnakeGame } from './components/games/SnakeGame';
import { BrickBreakerGame } from './components/games/BrickBreakerGame';
import { MiniMarioGame } from './components/games/MiniMarioGame';
import { TetrisGame } from './components/games/TetrisGame';
import { BlueprintExplorer } from './components/blueprint/BlueprintExplorer';
import { MechanicsRemixer } from './components/blueprint/MechanicsRemixer';
import { sound } from './utils/audio';
import { Play, Sparkles, BookOpen, Dna, Trophy, Gamepad2, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'play' | 'blueprints' | 'remixer'>('play');
  const [activeGame, setActiveGame] = useState<GameId>('snake');
  const [isScoresOpen, setIsScoresOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(!sound.enabled);
  const [crtFilter, setCrtFilter] = useState(false);

  const toggleSound = () => {
    const next = !soundMuted;
    sound.enabled = !next;
    setSoundMuted(next);
  };

  const handleSelectPlayGame = (gameId: GameId) => {
    setActiveGame(gameId);
    setCurrentTab('play');
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${crtFilter ? 'crt-scanlines' : ''}`}>
      {/* Top Bar Contract (Wordmark · Links · Actions) */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenScores={() => setIsScoresOpen(true)}
        soundMuted={soundMuted}
        onToggleSound={toggleSound}
        crtFilter={crtFilter}
        onToggleCrt={() => setCrtFilter(!crtFilter)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero Section */}
        <section className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              {/* Unboxed Metadata Discipline */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Google AI Studio Showcase</span>
                <span aria-hidden="true">·</span>
                <span>Web Audio 8-Bit Synth</span>
                <span aria-hidden="true">·</span>
                <span>Pure HTML5 Canvas</span>
                <span aria-hidden="true">·</span>
                <span>Zero Latency</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Classic Mini Games <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400">
                  Built for the Browser
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Play instant browser-native classics with physics-driven loops, or explore comprehensive design blueprints, collision mathematics, and starter code to craft your next mini game.
              </p>

              {/* Primary Quick-Play Selector */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setCurrentTab('play')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Play 4 Instant Classics
                </button>

                <button
                  onClick={() => setCurrentTab('blueprints')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-sm cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Explore 14+ Blueprints
                </button>

                <button
                  onClick={() => setCurrentTab('remixer')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Dna className="w-4 h-4 text-emerald-400" />
                  Mechanics Remixer
                </button>
              </div>
            </div>

            {/* Cabinet Visual Asset */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-[16/10] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl group">
                <img
                  src="/src/assets/images/arcade_cabinet_hero_1790753508918.jpg"
                  alt="Retro Arcade Cabinet Console"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback container in accordance with Zero-Broken-Image Policy
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-xs text-slate-300 font-mono">
                    <span className="text-amber-400 font-bold">ARCADE V1.0</span> · Ready to build
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs (Play Classics / Blueprint Catalog / DNA Remixer) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setCurrentTab('play')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                currentTab === 'play'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Play Classics
            </button>
            <button
              onClick={() => setCurrentTab('blueprints')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                currentTab === 'blueprints'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Game Blueprint Catalog
            </button>
            <button
              onClick={() => setCurrentTab('remixer')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                currentTab === 'remixer'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dna className="w-4 h-4" />
              Mechanics Remixer
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Responsive 60fps</span>
            <span aria-hidden="true">·</span>
            <span>Keyboard & Touch</span>
          </div>
        </div>

        {/* Tab 1: Play Classics */}
        {currentTab === 'play' && (
          <div className="space-y-6">
            {/* Game Selector Sub-bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'snake', label: 'Retro Snake 97', year: '1976', genre: 'Grid Growth' },
                  { id: 'bounce', label: 'Bounce Ball / Brick Breaker', year: '1976', genre: 'Kinetic Physics' },
                  { id: 'mario', label: 'Mini Mario Platformer', year: '1985', genre: 'Jump Physics' },
                  { id: 'tetris', label: 'Tetra Blocks', year: '1984', genre: 'Polyomino Matrix' },
                ].map(game => (
                  <button
                    key={game.id}
                    onClick={() => setActiveGame(game.id as GameId)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      activeGame === game.id
                        ? 'bg-slate-800 border-amber-500/80 text-white shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{game.label}</span>
                    <span className="ml-1.5 text-[11px] text-slate-500 font-mono">({game.year})</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsScoresOpen(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" />
                View High Scores
              </button>
            </div>

            {/* Active Game Surface */}
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
              {activeGame === 'snake' && <SnakeGame />}
              {activeGame === 'bounce' && <BrickBreakerGame />}
              {activeGame === 'mario' && <MiniMarioGame />}
              {activeGame === 'tetris' && <TetrisGame />}
            </div>
          </div>
        )}

        {/* Tab 2: Blueprint Catalog */}
        {currentTab === 'blueprints' && (
          <BlueprintExplorer onSelectPlayGame={handleSelectPlayGame} />
        )}

        {/* Tab 3: Mechanics Remixer */}
        {currentTab === 'remixer' && <MechanicsRemixer />}

        {/* Hall of Fame High Scores Modal */}
        <HighScoresModal
          isOpen={isScoresOpen}
          onClose={() => setIsScoresOpen(false)}
          activeGameId={activeGame}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            ArcadeClassic · Classical Mini Game Engine & Blueprint Catalog
          </div>
          <div className="flex items-center gap-3">
            <span>HTML5 Canvas</span>
            <span>·</span>
            <span>Web Audio Synth</span>
            <span>·</span>
            <span>Google AI Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
