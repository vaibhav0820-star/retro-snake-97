import { HighScoreRecord, GameId } from '../types/game';

const STORAGE_KEY = 'arcade_classic_high_scores_v1';

const DEFAULT_SCORES: HighScoreRecord[] = [
  { id: '1', gameId: 'snake', playerName: 'NEO', score: 320, date: '2026-03-28', details: 'Normal Speed · 32 Apples' },
  { id: '2', gameId: 'snake', playerName: 'ACE', score: 210, date: '2026-03-27', details: 'Insane Speed · 21 Apples' },
  { id: '3', gameId: 'bounce', playerName: 'BRK', score: 4850, date: '2026-03-29', details: 'Stage 3 Cleared · Laser Paddle' },
  { id: '4', gameId: 'bounce', playerName: 'VIP', score: 3200, date: '2026-03-28', details: 'Stage 2 Cleared · Multi-Ball' },
  { id: '5', gameId: 'mario', playerName: 'MAR', score: 1450, date: '2026-03-30', details: 'Flagpole Reached · 12 Goombas' },
  { id: '6', gameId: 'mario', playerName: 'LUI', score: 980, date: '2026-03-25', details: 'Flagpole Reached · 35 Coins' },
  { id: '7', gameId: 'tetris', playerName: 'TET', score: 12400, date: '2026-03-29', details: 'Level 6 · 28 Lines Cleared' },
  { id: '8', gameId: 'tetris', playerName: 'RUS', score: 8600, date: '2026-03-26', details: 'Level 4 · 19 Lines Cleared' },
];

export function getHighScores(gameId?: GameId): HighScoreRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCORES));
      return gameId ? DEFAULT_SCORES.filter(s => s.gameId === gameId) : DEFAULT_SCORES;
    }
    const parsed: HighScoreRecord[] = JSON.parse(raw);
    const scores = parsed && Array.isArray(parsed) ? parsed : DEFAULT_SCORES;
    return gameId ? scores.filter(s => s.gameId === gameId) : scores;
  } catch {
    return DEFAULT_SCORES;
  }
}

export function saveHighScore(gameId: GameId, playerName: string, score: number, details?: string): HighScoreRecord[] {
  try {
    const all = getHighScores();
    const newRecord: HighScoreRecord = {
      id: Math.random().toString(36).substring(2, 9),
      gameId,
      playerName: (playerName.trim().toUpperCase() || 'PLY').slice(0, 4),
      score,
      date: new Date().toISOString().split('T')[0],
      details
    };
    const updated = [...all, newRecord].sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return DEFAULT_SCORES;
  }
}
