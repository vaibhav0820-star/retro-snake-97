import React, { useState } from 'react';
import { GameBlueprint, GameId } from '../../types/game';
import { GAME_BLUEPRINTS } from '../../data/gameBlueprints';
import { Check, Copy, Play, Search, Code2, Sparkles, BookOpen, Layers } from 'lucide-react';

interface BlueprintExplorerProps {
  onSelectPlayGame: (id: GameId) => void;
}

export const BlueprintExplorer: React.FC<BlueprintExplorerProps> = ({ onSelectPlayGame }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBlueprintId, setExpandedBlueprintId] = useState<string | null>('lunar-lander');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const filteredBlueprints = GAME_BLUEPRINTS.filter(bp => {
    const matchesCategory = selectedCategory === 'all' || bp.category === selectedCategory;
    const matchesDiff = selectedDifficulty === 'all' || bp.difficulty === selectedDifficulty;
    const matchesSearch =
      bp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.coreMechanic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDiff && matchesSearch;
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Intro */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Classic Browser Games: Architecture & Mechanics Blueprint Catalog
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Explore 14+ foundational game design archetypes that excel in the browser. Each blueprint includes core mathematical formulas, collision loops, control schemes, modern twists, and starter code ready to implement in Google AI Studio.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-mono">
              {filteredBlueprints.length} Archetypes Available
            </span>
          </div>
        </div>

        {/* Filter Controls (Segmented buttons) */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            {[
              { id: 'all', label: 'All Archetypes' },
              { id: 'arcade', label: 'Arcade Action' },
              { id: 'physics', label: 'Physics & Vectors' },
              { id: 'puzzle', label: 'Puzzle & Logic' },
              { id: 'timing', label: 'Timing & Rhythm' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Difficulty Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            {[
              { id: 'all', label: 'Any Difficulty' },
              { id: 'Beginner', label: 'Beginner (1 Day)' },
              { id: 'Intermediate', label: 'Intermediate' },
              { id: 'Advanced', label: 'Advanced' },
            ].map(diff => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedDifficulty === diff.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mechanics, formulas, games..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Blueprints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBlueprints.map(bp => {
          const isExpanded = expandedBlueprintId === bp.id;

          return (
            <div
              key={bp.id}
              className={`p-5 bg-slate-900 border rounded-xl transition-all ${
                isExpanded ? 'border-amber-500/50 shadow-lg ring-1 ring-amber-500/20' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <span>{bp.year}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{bp.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{bp.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>Est. {bp.estimatedDevTime}</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{bp.title}</h3>
                </div>

                {bp.playableInApp && (
                  <button
                    onClick={() => onSelectPlayGame(bp.playableInApp!)}
                    className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Play in App
                  </button>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {bp.tagline}
              </p>

              {/* Core Mechanic summary */}
              <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                <div className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Core Mechanic:
                </div>
                <div className="text-xs text-slate-300 leading-normal">
                  {bp.coreMechanic}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 text-xs">
                  {/* Physics & Math */}
                  <div>
                    <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-mono">
                      <span>∑ PHYSICS & FORMULA:</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded font-mono text-[11px] text-amber-300 border border-slate-800 overflow-x-auto">
                      {bp.physicsFormula}
                    </div>
                  </div>

                  {/* Loop Steps */}
                  <div>
                    <div className="font-semibold text-slate-300 mb-1.5">
                      Execution Loop (tick / dt update):
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 leading-relaxed">
                      {bp.loopSteps.map((step, idx) => (
                        <li key={idx} className="marker:text-slate-500">{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Modern Twists for AI Studio */}
                  <div>
                    <div className="font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Remix & Twist Ideas:
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {bp.twistIdeas.map((twist, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{twist}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Controls */}
                  <div>
                    <div className="font-semibold text-slate-300 mb-1">
                      Controls Layout:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {bp.controlsLayout.map((ctrl, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[11px] border border-slate-700">
                          {ctrl}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Starter Code Snippet */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-300 font-mono text-[11px]">
                        CORE LOGIC SNIPPET
                      </span>
                      <button
                        onClick={() => handleCopyCode(bp.id, bp.starterSnippet)}
                        className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 rounded border border-slate-700 transition-colors"
                      >
                        {copiedCodeId === bp.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Snippet</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-950 rounded-lg text-[11px] text-emerald-300 font-mono overflow-x-auto border border-slate-800/80 leading-relaxed">
                      {bp.starterSnippet}
                    </pre>
                  </div>
                </div>
              )}

              {/* Toggle expand button */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={() => setExpandedBlueprintId(isExpanded ? null : bp.id)}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  {isExpanded ? 'Hide Architecture Blueprint' : 'View Full Blueprint & Math →'}
                </button>

                <span className="text-[11px] text-slate-500">
                  {bp.whyItWorks.split(';')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
