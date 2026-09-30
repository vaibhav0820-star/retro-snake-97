import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { getHighScores, saveHighScore } from '../../utils/storage';
import { Play, RotateCcw, Pause, Volume2, VolumeX, Shield, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Point {
  x: number;
  y: number;
}

interface GoldenFood extends Point {
  expiresAt: number;
}

const GRID_SIZE = 22;

export const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [applesEaten, setApplesEaten] = useState(0);
  const [speedLevel, setSpeedLevel] = useState<'Chill' | 'Classic' | 'Turbo'>('Classic');
  const [wallWrap, setWallWrap] = useState(false);
  const [soundMuted, setSoundMuted] = useState(!sound.enabled);
  const [playerName, setPlayerName] = useState('AAA');
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Refs for loop & inputs to prevent closure staleness
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const nextDirRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>({ x: 15, y: 10 });
  const goldenFoodRef = useRef<GoldenFood | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  // Speed ms
  const speedMs = speedLevel === 'Chill' ? 120 : speedLevel === 'Classic' ? 85 : 55;

  // Load high score
  useEffect(() => {
    const scores = getHighScores('snake');
    if (scores.length > 0) {
      setHighScore(scores[0].score);
    }
  }, []);

  const spawnFood = useCallback((currentSnake: Point[]): Point => {
    const occupied = new Set(currentSnake.map(p => `${p.x},${p.y}`));
    const vacant: Point[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          vacant.push({ x, y });
        }
      }
    }
    if (vacant.length === 0) return { x: 0, y: 0 };
    const randomIndex = Math.floor(Math.random() * vacant.length);
    return vacant[randomIndex];
  }, []);

  const spawnGoldenFood = useCallback((currentSnake: Point[]) => {
    if (Math.random() < 0.25 && !goldenFoodRef.current) {
      const pos = spawnFood(currentSnake);
      goldenFoodRef.current = {
        x: pos.x,
        y: pos.y,
        expiresAt: Date.now() + 8000,
      };
    }
  }, [spawnFood]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = width / GRID_SIZE;

    // Clear background (dark slate felt / arcade phosphors)
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    // Draw regular food (apple)
    const food = foodRef.current;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * cellSize, (food.y + 0.5) * cellSize, cellSize * 0.42, 0, Math.PI * 2);
    ctx.fill();

    // Apple highlight & leaf
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc((food.x + 0.38) * cellSize, (food.y + 0.38) * cellSize, cellSize * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse((food.x + 0.55) * cellSize, (food.y + 0.18) * cellSize, cellSize * 0.15, cellSize * 0.08, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Golden bonus food if active
    const golden = goldenFoodRef.current;
    if (golden && golden.expiresAt > Date.now()) {
      const remainingPct = (golden.expiresAt - Date.now()) / 8000;
      const pulse = 0.38 + Math.sin(Date.now() / 150) * 0.06;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc((golden.x + 0.5) * cellSize, (golden.y + 0.5) * cellSize, cellSize * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow ring
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + remainingPct * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc((golden.x + 0.5) * cellSize, (golden.y + 0.5) * cellSize, cellSize * 0.46, 0, Math.PI * 2 * remainingPct);
      ctx.stroke();

      // Golden star mark
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(cellSize * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', (golden.x + 0.5) * cellSize, (golden.y + 0.52) * cellSize);
    }

    // Draw snake body
    const snake = snakeRef.current;
    snake.forEach((seg, index) => {
      const isHead = index === 0;
      const px = seg.x * cellSize;
      const py = seg.y * cellSize;
      const pad = cellSize * 0.08;

      if (isHead) {
        // Snake head
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.roundRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2, 6);
        ctx.fill();

        // Eyes based on direction
        const dir = dirRef.current;
        ctx.fillStyle = '#ffffff';
        let eye1X = px + cellSize * 0.3;
        let eye1Y = py + cellSize * 0.3;
        let eye2X = px + cellSize * 0.7;
        let eye2Y = py + cellSize * 0.7;

        if (dir.x === 1) {
          eye1X = px + cellSize * 0.65;
          eye1Y = py + cellSize * 0.28;
          eye2X = px + cellSize * 0.65;
          eye2Y = py + cellSize * 0.72;
        } else if (dir.x === -1) {
          eye1X = px + cellSize * 0.35;
          eye1Y = py + cellSize * 0.28;
          eye2X = px + cellSize * 0.35;
          eye2Y = py + cellSize * 0.72;
        } else if (dir.y === -1) {
          eye1X = px + cellSize * 0.28;
          eye1Y = py + cellSize * 0.35;
          eye2X = px + cellSize * 0.72;
          eye2Y = py + cellSize * 0.35;
        } else if (dir.y === 1) {
          eye1X = px + cellSize * 0.28;
          eye1Y = py + cellSize * 0.65;
          eye2X = px + cellSize * 0.72;
          eye2Y = py + cellSize * 0.65;
        }

        const eyeRadius = cellSize * 0.11;
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(eye1X + dir.x * 1, eye1Y + dir.y * 1, eyeRadius * 0.55, 0, Math.PI * 2);
        ctx.arc(eye2X + dir.x * 1, eye2Y + dir.y * 1, eyeRadius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body segment gradient
        const t = index / snake.length;
        const r = Math.round(16 + (30 - 16) * t);
        const g = Math.round(185 - (185 - 120) * t);
        const b = Math.round(129 - (129 - 80) * t);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.roundRect(px + pad, py + pad, cellSize - pad * 2, cellSize - pad * 2, 4);
        ctx.fill();
      }
    });
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setIsPlaying(false);
    setIsGameOver(true);
    sound.playGameOver();

    if (finalScore > highScore) {
      setHighScore(finalScore);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  }, [highScore]);

  // Main game tick
  const tick = useCallback(() => {
    if (!isPlaying || isPaused || isGameOver) return;

    // Apply buffered direction
    dirRef.current = nextDirRef.current;
    const currentSnake = snakeRef.current;
    const dir = dirRef.current;
    const head = currentSnake[0];

    let newX = head.x + dir.x;
    let newY = head.y + dir.y;

    // Wall collision or wrap
    if (wallWrap) {
      newX = (newX + GRID_SIZE) % GRID_SIZE;
      newY = (newY + GRID_SIZE) % GRID_SIZE;
    } else {
      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
        handleGameOver(score);
        return;
      }
    }

    // Self-collision (check excluding tail which will move forward unless growing)
    const hitSelf = currentSnake.slice(0, -1).some(seg => seg.x === newX && seg.y === newY);
    if (hitSelf) {
      handleGameOver(score);
      return;
    }

    const newHead = { x: newX, y: newY };
    const ateRegularFood = newX === foodRef.current.x && newY === foodRef.current.y;
    const golden = goldenFoodRef.current;
    const ateGoldenFood = golden && golden.expiresAt > Date.now() && newX === golden.x && newY === golden.y;

    const newSnake = [newHead, ...currentSnake];

    if (ateRegularFood) {
      sound.playEat();
      const nextScore = score + 10;
      setScore(nextScore);
      setApplesEaten(prev => prev + 1);
      foodRef.current = spawnFood(newSnake);
      spawnGoldenFood(newSnake);
    } else if (ateGoldenFood) {
      sound.playGoldenEat();
      const nextScore = score + 50;
      setScore(nextScore);
      goldenFoodRef.current = null;
    } else {
      newSnake.pop(); // Remove tail
    }

    // Clean up expired golden food
    if (goldenFoodRef.current && goldenFoodRef.current.expiresAt <= Date.now()) {
      goldenFoodRef.current = null;
    }

    snakeRef.current = newSnake;
    draw();
  }, [isPlaying, isPaused, isGameOver, wallWrap, score, spawnFood, spawnGoldenFood, draw, handleGameOver]);

  // Game loop with requestAnimationFrame + delta timing
  useEffect(() => {
    let animId: number;
    const loop = (timestamp: number) => {
      if (!lastTickTimeRef.current) lastTickTimeRef.current = timestamp;
      const elapsed = timestamp - lastTickTimeRef.current;

      if (elapsed >= speedMs) {
        lastTickTimeRef.current = timestamp;
        tick();
      }
      animId = requestAnimationFrame(loop);
    };

    if (isPlaying && !isPaused && !isGameOver) {
      animId = requestAnimationFrame(loop);
    } else {
      draw();
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPaused, isGameOver, speedMs, tick, draw]);

  const changeDirection = useCallback((dx: number, dy: number) => {
    const cur = dirRef.current;
    // Disallow 180-degree instant reversal
    if (dx !== 0 && cur.x === -dx) return;
    if (dy !== 0 && cur.y === -dy) return;
    nextDirRef.current = { x: dx, y: dy };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') changeDirection(0, -1);
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') changeDirection(0, 1);
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') changeDirection(-1, 0);
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') changeDirection(1, 0);
      else if (e.key === ' ') {
        if (isPlaying) setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, isPlaying]);

  const startGame = () => {
    const startSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    snakeRef.current = startSnake;
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    foodRef.current = spawnFood(startSnake);
    goldenFoodRef.current = null;
    setScore(0);
    setApplesEaten(0);
    setIsGameOver(false);
    setIsPaused(false);
    setHasSubmittedScore(false);
    setIsPlaying(true);
    sound.playEat();
  };

  const submitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (score <= 0 || hasSubmittedScore) return;
    saveHighScore('snake', playerName, score, `${speedLevel} Speed · ${applesEaten} Apples`);
    setHasSubmittedScore(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* Game Board Surface */}
      <div className="flex flex-col items-center w-full lg:w-auto">
        <div className="relative p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
          <canvas
            ref={canvasRef}
            width={440}
            height={440}
            className="w-full max-w-[440px] aspect-square rounded-lg bg-slate-950 block"
          />

          {/* Start Screen Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono mb-1">Arcade 1976 Classic</span>
              <h3 className="text-2xl font-bold text-white mb-2">Retro Snake 97</h3>
              <p className="text-sm text-slate-300 max-w-xs mb-6">
                Guide the green serpent, eat apples, and avoid walls or your own tail. Look out for golden stars!
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Game
              </button>
            </div>
          )}

          {/* Pause Screen Overlay */}
          {isPlaying && isPaused && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <h3 className="text-2xl font-bold text-amber-400 mb-2">Game Paused</h3>
              <p className="text-xs text-slate-400 mb-4">Press Space or Resume to continue</p>
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg"
              >
                Resume
              </button>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-red-400 font-mono mb-1">Collision Detected</span>
              <h3 className="text-2xl font-bold text-white mb-1">Game Over</h3>
              <div className="my-3 text-center">
                <div className="text-xs text-slate-400">Final Score</div>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">{score}</div>
                <div className="text-xs text-slate-500 mt-1">Apples Eaten: {applesEaten}</div>
              </div>

              {!hasSubmittedScore ? (
                <form onSubmit={submitScore} className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    maxLength={4}
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value.toUpperCase())}
                    className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-center font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400 uppercase text-sm"
                    placeholder="AAA"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded"
                  >
                    Save Score
                  </button>
                </form>
              ) : (
                <div className="text-xs text-emerald-400 mb-4 flex items-center gap-1 font-mono">
                  <span>✓ Record saved to Arcade Leaderboard</span>
                </div>
              )}

              <button
                onClick={startGame}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Mobile / Touch D-Pad */}
        <div className="mt-4 flex flex-col items-center gap-1.5 md:hidden">
          <button
            onClick={() => changeDirection(0, -1)}
            aria-label="Up"
            className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 font-bold flex items-center justify-center text-lg border border-slate-700"
          >
            ▲
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => changeDirection(-1, 0)}
              aria-label="Left"
              className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 font-bold flex items-center justify-center text-lg border border-slate-700"
            >
              ◀
            </button>
            <button
              onClick={() => changeDirection(0, 1)}
              aria-label="Down"
              className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 font-bold flex items-center justify-center text-lg border border-slate-700"
            >
              ▼
            </button>
            <button
              onClick={() => changeDirection(1, 0)}
              aria-label="Right"
              className="w-12 h-12 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg text-slate-200 font-bold flex items-center justify-center text-lg border border-slate-700"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel & HUD */}
      <div className="flex-1 flex flex-col gap-4 w-full">
        {/* Score Dashboard */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div>
            <div className="text-xs text-slate-400">Score</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">{score}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Apples</div>
            <div className="text-2xl font-mono font-bold text-red-400 tabular-nums">{applesEaten}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Record</div>
            <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">{Math.max(score, highScore)}</div>
          </div>
        </div>

        {/* Options & Controls */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Speed Tier
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['Chill', 'Classic', 'Turbo'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setSpeedLevel(tier)}
                className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                  speedLevel === tier
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300">Toroidal Wall Wrap (Nokia Style)</span>
            <button
              onClick={() => setWallWrap(!wallWrap)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                wallWrap
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {wallWrap ? 'Enabled' : 'Solid Walls'}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300">Web Audio Synthesizer</span>
            <button
              onClick={() => {
                const next = !soundMuted;
                sound.enabled = !next;
                setSoundMuted(next);
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700"
              title="Toggle Sound Effects"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-1.5 font-mono">
          <div className="font-semibold text-slate-300 mb-1">KEYBOARD SHORTCUTS</div>
          <div>• Arrow Keys / WASD : Steer snake</div>
          <div>• Spacebar : Pause / Resume match</div>
          <div>• Red Apple : +10 points & +1 length</div>
          <div>• Golden Star : +50 points (timed pulse)</div>
        </div>
      </div>
    </div>
  );
};
