import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { getHighScores, saveHighScore } from '../../utils/storage';
import { Play, RotateCcw, ArrowDown, ArrowUp, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 24;

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface TetrominoDef {
  shape: number[][];
  color: string;
}

const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06b6d4', // Cyan
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3b82f6', // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f97316', // Orange
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#eab308', // Yellow
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#22c55e', // Green
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a855f7', // Purple
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ef4444', // Red
  },
};

interface ActivePiece {
  type: TetrominoType;
  matrix: number[][];
  x: number;
  y: number;
}

export const TetrisGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holdCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState('AAA');
  const [hasSavedScore, setHasSavedScore] = useState(false);

  // Mutable Game Refs
  const gridRef = useRef<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
  const activePieceRef = useRef<ActivePiece | null>(null);
  const nextPieceRef = useRef<TetrominoType>('T');
  const holdPieceRef = useRef<TetrominoType | null>(null);
  const canHoldRef = useRef(true);
  const lastDropTimeRef = useRef(0);
  const bagRef = useRef<TetrominoType[]>([]);

  useEffect(() => {
    const scores = getHighScores('tetris');
    if (scores.length > 0) {
      setHighScore(scores[0].score);
    }
  }, []);

  // 7-Bag generator
  const getNextFromBag = useCallback((): TetrominoType => {
    if (bagRef.current.length === 0) {
      const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
      // Fisher-Yates shuffle
      for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
      }
      bagRef.current = types;
    }
    return bagRef.current.pop()!;
  }, []);

  const rotateMatrix = (matrix: number[][]): number[][] => {
    const N = matrix.length;
    const rotated = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        rotated[c][N - 1 - r] = matrix[r][c];
      }
    }
    return rotated;
  };

  const isValidPos = (piece: ActivePiece, grid: string[][]): boolean => {
    const { matrix, x, y } = piece;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const gridX = x + c;
          const gridY = y + r;
          if (gridX < 0 || gridX >= COLS || gridY >= ROWS) return false;
          if (gridY >= 0 && grid[gridY][gridX] !== '') return false;
        }
      }
    }
    return true;
  };

  const spawnPiece = useCallback((): boolean => {
    const type = nextPieceRef.current;
    nextPieceRef.current = getNextFromBag();
    const def = TETROMINOES[type];
    const newPiece: ActivePiece = {
      type,
      matrix: def.shape,
      x: Math.floor((COLS - def.shape[0].length) / 2),
      y: 0,
    };

    if (!isValidPos(newPiece, gridRef.current)) {
      return false; // Game Over
    }

    activePieceRef.current = newPiece;
    canHoldRef.current = true;
    return true;
  }, [getNextFromBag]);

  const lockPiece = useCallback(() => {
    const piece = activePieceRef.current;
    if (!piece) return;

    const grid = gridRef.current;
    const color = TETROMINOES[piece.type].color;

    // Stamp into grid
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] !== 0) {
          const gy = piece.y + r;
          const gx = piece.x + c;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            grid[gy][gx] = color;
          }
        }
      }
    }

    // Check complete rows
    const fullRows: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (grid[r].every(cell => cell !== '')) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      if (fullRows.length >= 4) {
        sound.playTetrisClear();
        confetti({ particleCount: 70, spread: 50 });
      } else {
        sound.playLineClear();
      }

      // Filter out complete rows
      const remainingRows = grid.filter((_, idx) => !fullRows.includes(idx));
      const emptyRows = Array.from({ length: fullRows.length }, () => Array(COLS).fill(''));
      gridRef.current = [...emptyRows, ...remainingRows];

      const linePoints = [0, 100, 300, 500, 800];
      setScore(s => s + (linePoints[fullRows.length] || 100) * level);
      setLines(l => {
        const nextLines = l + fullRows.length;
        setLevel(Math.floor(nextLines / 10) + 1);
        return nextLines;
      });
    } else {
      sound.playBounce();
    }

    // Spawn next piece
    if (!spawnPiece()) {
      setIsGameOver(true);
      setIsPlaying(false);
      sound.playGameOver();
    }
  }, [level, spawnPiece]);

  // Compute ghost piece position
  const getGhostY = useCallback((): number => {
    const piece = activePieceRef.current;
    if (!piece) return 0;
    let ghostY = piece.y;
    while (isValidPos({ ...piece, y: ghostY + 1 }, gridRef.current)) {
      ghostY++;
    }
    return ghostY;
  }, []);

  const moveHorizontal = (dx: number) => {
    const piece = activePieceRef.current;
    if (!piece || !isPlaying || isGameOver) return;
    const test: ActivePiece = { ...piece, x: piece.x + dx };
    if (isValidPos(test, gridRef.current)) {
      piece.x += dx;
      sound.playTone(300, 0.03, 'square', 0.08);
    }
  };

  const rotatePiece = () => {
    const piece = activePieceRef.current;
    if (!piece || !isPlaying || isGameOver) return;
    const rotated = rotateMatrix(piece.matrix);
    // Wall kicks: try basic offset (0, 0), then (-1, 0), (1, 0), (0, -1)
    const offsets = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
    ];
    for (const offset of offsets) {
      const test: ActivePiece = {
        ...piece,
        matrix: rotated,
        x: piece.x + offset.x,
        y: piece.y + offset.y,
      };
      if (isValidPos(test, gridRef.current)) {
        piece.matrix = rotated;
        piece.x += offset.x;
        piece.y += offset.y;
        sound.playTone(400, 0.04, 'triangle', 0.1);
        return;
      }
    }
  };

  const softDrop = () => {
    const piece = activePieceRef.current;
    if (!piece || !isPlaying || isGameOver) return;
    const test: ActivePiece = { ...piece, y: piece.y + 1 };
    if (isValidPos(test, gridRef.current)) {
      piece.y += 1;
      setScore(s => s + 1);
    } else {
      lockPiece();
    }
  };

  const hardDrop = () => {
    const piece = activePieceRef.current;
    if (!piece || !isPlaying || isGameOver) return;
    const ghostY = getGhostY();
    const dropDistance = ghostY - piece.y;
    piece.y = ghostY;
    setScore(s => s + dropDistance * 2);
    sound.playTone(200, 0.06, 'square', 0.15);
    lockPiece();
  };

  const holdPiece = () => {
    if (!canHoldRef.current || !activePieceRef.current || !isPlaying || isGameOver) return;
    const currentType = activePieceRef.current.type;

    if (!holdPieceRef.current) {
      holdPieceRef.current = currentType;
      spawnPiece();
    } else {
      const temp = holdPieceRef.current;
      holdPieceRef.current = currentType;
      const def = TETROMINOES[temp];
      activePieceRef.current = {
        type: temp,
        matrix: def.shape,
        x: Math.floor((COLS - def.shape[0].length) / 2),
        y: 0,
      };
    }
    canHoldRef.current = false;
    sound.playTone(350, 0.05, 'triangle', 0.12);
  };

  const startGame = () => {
    gridRef.current = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
    bagRef.current = [];
    holdPieceRef.current = null;
    canHoldRef.current = true;
    nextPieceRef.current = getNextFromBag();
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsGameOver(false);
    setHasSavedScore(false);
    spawnPiece();
    setIsPlaying(true);
    sound.playEat();
  };

  // Main Render & Drop Loop
  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      // Drop interval based on level (faster with each level)
      const dropInterval = Math.max(80, 800 - (level - 1) * 75);

      if (isPlaying && !isGameOver) {
        if (time - lastDropTimeRef.current >= dropInterval) {
          lastDropTimeRef.current = time;
          const piece = activePieceRef.current;
          if (piece) {
            const test: ActivePiece = { ...piece, y: piece.y + 1 };
            if (isValidPos(test, gridRef.current)) {
              piece.y += 1;
            } else {
              lockPiece();
            }
          }
        }
      }

      // Draw Main Grid
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);

      // Grid guidelines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, ROWS * CELL_SIZE);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(COLS * CELL_SIZE, r * CELL_SIZE);
        ctx.stroke();
      }

      // Draw locked cells
      const grid = gridRef.current;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = grid[r][c];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fillRect(c * CELL_SIZE + 1, r * CELL_SIZE + 1, CELL_SIZE - 2, 3);
          }
        }
      }

      // Draw Ghost Piece
      const piece = activePieceRef.current;
      if (piece && isPlaying && !isGameOver) {
        const ghostY = getGhostY();
        const color = TETROMINOES[piece.type].color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        for (let r = 0; r < piece.matrix.length; r++) {
          for (let c = 0; c < piece.matrix[r].length; c++) {
            if (piece.matrix[r][c] !== 0) {
              const gx = (piece.x + c) * CELL_SIZE;
              const gy = (ghostY + r) * CELL_SIZE;
              ctx.strokeRect(gx + 2, gy + 2, CELL_SIZE - 4, CELL_SIZE - 4);
            }
          }
        }

        // Draw Active Piece
        ctx.fillStyle = color;
        for (let r = 0; r < piece.matrix.length; r++) {
          for (let c = 0; c < piece.matrix[r].length; c++) {
            if (piece.matrix[r][c] !== 0) {
              const px = (piece.x + c) * CELL_SIZE;
              const py = (piece.y + r) * CELL_SIZE;
              ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
              ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, 3);
              ctx.fillStyle = color;
            }
          }
        }
      }

      // Draw Mini Canvas for Next Piece
      const nextCanvas = nextCanvasRef.current;
      if (nextCanvas) {
        const nCtx = nextCanvas.getContext('2d');
        if (nCtx) {
          nCtx.fillStyle = '#0f172a';
          nCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
          const nextDef = TETROMINOES[nextPieceRef.current];
          if (nextDef) {
            nCtx.fillStyle = nextDef.color;
            const size = 16;
            const offsetX = (nextCanvas.width - nextDef.shape[0].length * size) / 2;
            const offsetY = (nextCanvas.height - nextDef.shape.length * size) / 2;
            for (let r = 0; r < nextDef.shape.length; r++) {
              for (let c = 0; c < nextDef.shape[r].length; c++) {
                if (nextDef.shape[r][c] !== 0) {
                  nCtx.fillRect(offsetX + c * size + 1, offsetY + r * size + 1, size - 2, size - 2);
                }
              }
            }
          }
        }
      }

      // Draw Mini Canvas for Hold Piece
      const holdCanvas = holdCanvasRef.current;
      if (holdCanvas) {
        const hCtx = holdCanvas.getContext('2d');
        if (hCtx) {
          hCtx.fillStyle = '#0f172a';
          hCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
          if (holdPieceRef.current) {
            const holdDef = TETROMINOES[holdPieceRef.current];
            hCtx.fillStyle = holdDef.color;
            const size = 16;
            const offsetX = (holdCanvas.width - holdDef.shape[0].length * size) / 2;
            const offsetY = (holdCanvas.height - holdDef.shape.length * size) / 2;
            for (let r = 0; r < holdDef.shape.length; r++) {
              for (let c = 0; c < holdDef.shape[r].length; c++) {
                if (holdDef.shape[r][c] !== 0) {
                  hCtx.fillRect(offsetX + c * size + 1, offsetY + r * size + 1, size - 2, size - 2);
                }
              }
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, level, getGhostY, lockPiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveHorizontal(-1);
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveHorizontal(1);
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') rotatePiece();
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') softDrop();
      else if (e.key === ' ') hardDrop();
      else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') holdPiece();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const submitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (score <= 0 || hasSavedScore) return;
    saveHighScore('tetris', playerName, score, `Level ${level} · ${lines} Lines Cleared`);
    setHasSavedScore(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* Tetris Board */}
      <div className="flex flex-col items-center w-full lg:w-auto">
        <div className="relative p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
          <canvas
            ref={canvasRef}
            width={COLS * CELL_SIZE}
            height={ROWS * CELL_SIZE}
            className="w-full max-w-[280px] aspect-[10/20] rounded-lg bg-slate-950 block"
          />

          {/* Start Screen Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-purple-400 font-mono mb-1">Puzzle 1984 Classic</span>
              <h3 className="text-2xl font-bold text-white mb-2">Tetra Blocks</h3>
              <p className="text-sm text-slate-300 max-w-xs mb-6">
                Rotate and stack falling polyominoes. Clear full horizontal rows and master the Super Rotation System!
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Drop Blocks
              </button>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-red-400 font-mono mb-1">Matrix Full</span>
              <h3 className="text-2xl font-bold text-white mb-1">Game Over</h3>
              <div className="my-3 text-center">
                <div className="text-xs text-slate-400">Total Score</div>
                <div className="text-3xl font-extrabold text-purple-400 font-mono tabular-nums">{score}</div>
                <div className="text-xs text-slate-500 mt-1">Lines: {lines} · Level: {level}</div>
              </div>

              {!hasSavedScore ? (
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
                className="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Mobile touch controls */}
        <div className="mt-3 flex flex-col items-center gap-2 md:hidden w-full max-w-[280px]">
          <div className="flex justify-between w-full gap-2">
            <button
              onClick={holdPiece}
              className="flex-1 py-2 bg-slate-800 text-xs font-bold text-slate-300 rounded border border-slate-700"
            >
              Hold (C)
            </button>
            <button
              onClick={rotatePiece}
              className="flex-1 py-2 bg-purple-600 text-xs font-bold text-white rounded"
            >
              Rotate ↻
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              onClick={() => moveHorizontal(-1)}
              className="py-3 bg-slate-800 text-white font-bold rounded border border-slate-700"
            >
              ◀
            </button>
            <button
              onClick={softDrop}
              className="py-3 bg-slate-800 text-white font-bold rounded border border-slate-700"
            >
              ▼
            </button>
            <button
              onClick={() => moveHorizontal(1)}
              className="py-3 bg-slate-800 text-white font-bold rounded border border-slate-700"
            >
              ▶
            </button>
          </div>
          <button
            onClick={hardDrop}
            className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded text-xs"
          >
            Hard Drop (Space) ⤓
          </button>
        </div>
      </div>

      {/* Side HUD */}
      <div className="flex-1 flex flex-col gap-4 w-full">
        {/* Next & Hold Pieces */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col items-center">
            <div className="text-xs uppercase font-mono text-slate-400 mb-2">Next</div>
            <canvas ref={nextCanvasRef} width={80} height={60} className="rounded bg-slate-950" />
          </div>
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col items-center">
            <div className="text-xs uppercase font-mono text-slate-400 mb-2">Hold</div>
            <canvas ref={holdCanvasRef} width={80} height={60} className="rounded bg-slate-950" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div>
            <div className="text-xs text-slate-400">Score</div>
            <div className="text-2xl font-mono font-bold text-purple-400 tabular-nums">{score}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Lines</div>
            <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">{lines}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Level</div>
            <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">{level}</div>
          </div>
        </div>

        {/* Controls Note */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300 font-mono">
          <div className="font-semibold text-purple-400 mb-1">KEYBOARD SHORTCUTS</div>
          <div>• Left / Right Arrow : Shift piece</div>
          <div>• Up Arrow : Rotate piece clockwise</div>
          <div>• Down Arrow : Soft drop (+1 pt)</div>
          <div>• Spacebar : Hard drop (instant lock)</div>
          <div>• C or Shift : Hold piece in reservoir</div>
        </div>
      </div>
    </div>
  );
};
