import React, { useState } from 'react';
import { getHighScores } from '../../utils/storage';
import { GameId } from '../../types/game';
import { Trophy, X, Medal } from 'lucide-react';

interface HighScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGameId?: GameId;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({
  isOpen,
  onClose,
  activeGameId,
}) => {
  const [filterGame, setFilterGame] = useState<GameId | 'all'>(activeGameId || 'all');

  if (!isOpen) return null;

  const allScores = getHighScores();
  const displayedScores = filterGame === 'all'
    ? allScores
    : allScores.filter(s => s.gameId === filterGame);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Arcade Hall of Fame</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Filter */}
        <div className="flex items-center gap-1.5 my-4 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {[
            { id: 'all', label: 'All Classics' },
            { id: 'snake', label: 'Snake' },
            { id: 'bounce', label: 'Bounce Ball' },
            { id: 'mario', label: 'Mini Mario' },
            { id: 'tetris', label: 'Tetra Blocks' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterGame(tab.id as GameId | 'all')}
              className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                filterGame === tab.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-hidden border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3">Game</th>
                <th className="py-2.5 px-3 text-right">Score</th>
                <th className="py-2.5 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {displayedScores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No scores recorded yet. Play a round to post the first record!
                  </td>
                </tr>
              ) : (
                displayedScores.slice(0, 10).map((record, index) => (
                  <tr key={record.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono">
                      {index === 0 ? (
                        <span className="text-amber-400 font-bold">1ST ★</span>
                      ) : index === 1 ? (
                        <span className="text-slate-300 font-bold">2ND</span>
                      ) : index === 2 ? (
                        <span className="text-amber-600 font-bold">3RD</span>
                      ) : (
                        `#${index + 1}`
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      {record.playerName}
                    </td>
                    <td className="py-2.5 px-3 capitalize">
                      {record.gameId === 'snake'
                        ? 'Retro Snake'
                        : record.gameId === 'bounce'
                        ? 'Bounce Ball'
                        : record.gameId === 'mario'
                        ? 'Mini Mario'
                        : 'Tetra Blocks'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                      {record.score.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-mono text-[11px]">
                      {record.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>Records stored in browser storage</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
