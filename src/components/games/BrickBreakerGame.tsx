import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { getHighScores, saveHighScore } from '../../utils/storage';
import { Play, RotateCcw, Heart, Zap, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  color: string;
  isBomb?: boolean;
}

interface PowerUp {
  x: number;
  y: number;
  type: 'expand' | 'multi' | 'laser' | 'life';
  vy: number;
}

interface Laser {
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 480;

export const BrickBreakerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [activePowerUp, setActivePowerUp] = useState<string | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState('AAA');
  const [hasSavedScore, setHasSavedScore] = useState(false);

  // Mutable game refs
  const paddleRef = useRef({
    x: CANVAS_WIDTH / 2 - 45,
    y: CANVAS_HEIGHT - 32,
    w: 90,
    h: 12,
    speed: 7,
    isLaserActive: false,
    laserExpiresAt: 0,
    expandExpiresAt: 0,
  });

  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; fire: boolean }>({
    left: false,
    right: false,
    fire: false,
  });
  const ballServedRef = useRef(false);

  // Load high scores
  useEffect(() => {
    const scores = getHighScores('bounce');
    if (scores.length > 0) {
      setHighScore(scores[0].score);
    }
  }, []);

  const createLevelBricks = useCallback((lvl: number): Brick[] => {
    const bricks: Brick[] = [];
    const rows = lvl === 1 ? 5 : lvl === 2 ? 6 : 7;
    const cols = 8;
    const padding = 6;
    const brickW = (CANVAS_WIDTH - (cols + 1) * padding) / cols;
    const brickH = 18;
    const offsetY = 50;

    const rowColors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a855f7', '#ec4899'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Layout patterns
        if (lvl === 1 && (r + c) % 2 === 1 && r > 2) continue; // pyramid holes
        if (lvl === 2 && (c === 0 || c === cols - 1) && r > 3) continue; // castle battlements

        const isBomb = (r === 2 && c === 3) || (r === 1 && c === 4);
        const hp = isBomb ? 1 : r < 2 ? 2 : 1;
        const color = isBomb ? '#ef4444' : rowColors[r % rowColors.length];

        bricks.push({
          x: padding + c * (brickW + padding),
          y: offsetY + r * (brickH + padding),
          w: brickW,
          h: brickH,
          hp,
          maxHp: hp,
          color,
          isBomb,
        });
      }
    }
    return bricks;
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        life: 25 + Math.random() * 15,
      });
    }
  };

  const resetBallAndPaddle = useCallback(() => {
    paddleRef.current.x = CANVAS_WIDTH / 2 - paddleRef.current.w / 2;
    ballsRef.current = [
      {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 48,
        vx: 3.5 * (Math.random() > 0.5 ? 1 : -1),
        vy: -4.5,
        radius: 6,
      },
    ];
    ballServedRef.current = false;
  }, []);

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsVictory(false);
    setHasSavedScore(false);
    bricksRef.current = createLevelBricks(1);
    powerUpsRef.current = [];
    lasersRef.current = [];
    particlesRef.current = [];
    paddleRef.current.w = 90;
    paddleRef.current.isLaserActive = false;
    resetBallAndPaddle();
    setIsPlaying(true);
    sound.playBounce();
  };

  // Main game update & render loop
  useEffect(() => {
    let animId: number;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // 1. UPDATE STATE
      if (isPlaying && !isGameOver && !isVictory) {
        const paddle = paddleRef.current;
        const keys = keysRef.current;

        // Move paddle
        if (keys.left && paddle.x > 0) paddle.x -= paddle.speed;
        if (keys.right && paddle.x + paddle.w < CANVAS_WIDTH) paddle.x += paddle.speed;

        // Handle powerup expiration
        if (paddle.expandExpiresAt > 0 && Date.now() > paddle.expandExpiresAt) {
          paddle.w = 90;
          paddle.expandExpiresAt = 0;
          setActivePowerUp(null);
        }
        if (paddle.isLaserActive && Date.now() > paddle.laserExpiresAt) {
          paddle.isLaserActive = false;
          setActivePowerUp(null);
        }

        // Fire lasers
        if (paddle.isLaserActive && keys.fire) {
          if (!lasersRef.current.some(l => l.y > paddle.y - 40)) {
            sound.playLaser();
            lasersRef.current.push(
              { x: paddle.x + 8, y: paddle.y - 6, vy: -7 },
              { x: paddle.x + paddle.w - 8, y: paddle.y - 6, vy: -7 }
            );
          }
        }

        // Update lasers
        lasersRef.current.forEach(l => {
          l.y += l.vy;
        });
        lasersRef.current = lasersRef.current.filter(l => l.y > 0);

        // Laser collisions with bricks
        lasersRef.current.forEach((laser, lIdx) => {
          bricksRef.current.forEach(brick => {
            if (
              laser.x >= brick.x &&
              laser.x <= brick.x + brick.w &&
              laser.y >= brick.y &&
              laser.y <= brick.y + brick.h
            ) {
              brick.hp -= 1;
              laser.y = -100; // destroy laser
              spawnParticles(laser.x, laser.y, brick.color, 6);
              sound.playBrickHit();
              setScore(s => s + 20);
            }
          });
        });

        // Balls update
        const balls = ballsRef.current;
        if (!ballServedRef.current) {
          // Ball rides on paddle before serve
          if (balls[0]) {
            balls[0].x = paddle.x + paddle.w / 2;
            balls[0].y = paddle.y - balls[0].radius - 1;
          }
        } else {
          for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Wall collisions
            if (ball.x - ball.radius <= 0) {
              ball.x = ball.radius;
              ball.vx = Math.abs(ball.vx);
              sound.playBounce();
            } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
              ball.x = CANVAS_WIDTH - ball.radius;
              ball.vx = -Math.abs(ball.vx);
              sound.playBounce();
            }

            if (ball.y - ball.radius <= 0) {
              ball.y = ball.radius;
              ball.vy = Math.abs(ball.vy);
              sound.playBounce();
            }

            // Paddle bounce with deflection angle
            if (
              ball.y + ball.radius >= paddle.y &&
              ball.y - ball.radius <= paddle.y + paddle.h &&
              ball.x >= paddle.x &&
              ball.x <= paddle.x + paddle.w &&
              ball.vy > 0
            ) {
              sound.playBounce();
              const hitOffset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
              const maxAngle = (Math.PI / 3) * 0.95; // ~55 deg
              const angle = hitOffset * maxAngle;
              const speed = Math.hypot(ball.vx, ball.vy);
              const nextSpeed = Math.min(speed * 1.02, 8.5); // slight acceleration

              ball.vx = nextSpeed * Math.sin(angle);
              ball.vy = -nextSpeed * Math.cos(angle);
              ball.y = paddle.y - ball.radius - 1;
            }

            // Brick collision
            for (let b = bricksRef.current.length - 1; b >= 0; b--) {
              const brick = bricksRef.current[b];
              if (
                ball.x + ball.radius >= brick.x &&
                ball.x - ball.radius <= brick.x + brick.w &&
                ball.y + ball.radius >= brick.y &&
                ball.y - ball.radius <= brick.y + brick.h
              ) {
                // Determine collision side
                const overlapLeft = ball.x + ball.radius - brick.x;
                const overlapRight = brick.x + brick.w - (ball.x - ball.radius);
                const overlapTop = ball.y + ball.radius - brick.y;
                const overlapBottom = brick.y + brick.h - (ball.y - ball.radius);

                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                  ball.vx = -ball.vx;
                } else {
                  ball.vy = -ball.vy;
                }

                brick.hp -= 1;
                sound.playBrickHit();
                spawnParticles(ball.x, ball.y, brick.color, 10);
                setScore(s => s + 30);

                // Handle Bomb brick explosion
                if (brick.isBomb && brick.hp <= 0) {
                  sound.playGameOver();
                  bricksRef.current.forEach(other => {
                    const dist = Math.hypot(other.x - brick.x, other.y - brick.y);
                    if (dist < 80) {
                      other.hp = 0;
                      spawnParticles(other.x + other.w / 2, other.y + other.h / 2, other.color, 6);
                      setScore(s => s + 40);
                    }
                  });
                }

                // Chance to drop power-up
                if (brick.hp <= 0 && Math.random() < 0.28) {
                  const types: ('expand' | 'multi' | 'laser' | 'life')[] = ['expand', 'multi', 'laser', 'life'];
                  const picked = types[Math.floor(Math.random() * types.length)];
                  powerUpsRef.current.push({
                    x: brick.x + brick.w / 2,
                    y: brick.y + brick.h / 2,
                    type: picked,
                    vy: 2.2,
                  });
                }

                break;
              }
            }

            // Ball fell off bottom
            if (ball.y - ball.radius > CANVAS_HEIGHT) {
              balls.splice(i, 1);
            }
          }

          // Check if all balls lost
          if (balls.length === 0) {
            const nextLives = lives - 1;
            setLives(nextLives);
            sound.playGameOver();
            if (nextLives <= 0) {
              setIsGameOver(true);
              setIsPlaying(false);
            } else {
              resetBallAndPaddle();
            }
          }
        }

        // Clean up broken bricks
        bricksRef.current = bricksRef.current.filter(b => b.hp > 0);

        // Check level win
        if (bricksRef.current.length === 0) {
          if (level < 3) {
            const nextLvl = level + 1;
            setLevel(nextLvl);
            sound.playVictory();
            bricksRef.current = createLevelBricks(nextLvl);
            resetBallAndPaddle();
          } else {
            setIsVictory(true);
            setIsPlaying(false);
            sound.playVictory();
            confetti({ particleCount: 120, spread: 70 });
          }
        }

        // Update powerups
        for (let p = powerUpsRef.current.length - 1; p >= 0; p--) {
          const pow = powerUpsRef.current[p];
          pow.y += pow.vy;

          // Catch powerup with paddle
          if (
            pow.y + 8 >= paddle.y &&
            pow.y - 8 <= paddle.y + paddle.h &&
            pow.x >= paddle.x &&
            pow.x <= paddle.x + paddle.w
          ) {
            sound.playGoldenEat();
            if (pow.type === 'expand') {
              paddle.w = 135;
              paddle.expandExpiresAt = Date.now() + 10000;
              setActivePowerUp('Wide Paddle');
            } else if (pow.type === 'multi') {
              setActivePowerUp('Multi-Ball');
              const b = ballsRef.current[0];
              if (b) {
                ballsRef.current.push(
                  { x: b.x, y: b.y, vx: b.vx * 0.9 - 2, vy: b.vy, radius: 6 },
                  { x: b.x, y: b.y, vx: b.vx * 0.9 + 2, vy: b.vy, radius: 6 }
                );
              }
            } else if (pow.type === 'laser') {
              paddle.isLaserActive = true;
              paddle.laserExpiresAt = Date.now() + 8000;
              setActivePowerUp('Laser Blaster');
            } else if (pow.type === 'life') {
              setLives(l => Math.min(l + 1, 5));
              setActivePowerUp('+1 Life');
            }
            powerUpsRef.current.splice(p, 1);
          } else if (pow.y > CANVAS_HEIGHT) {
            powerUpsRef.current.splice(p, 1);
          }
        }

        // Update particles
        particlesRef.current.forEach(pt => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.alpha = pt.life / 40;
          pt.life -= 1;
        });
        particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);
      }

      // 2. RENDER CANVAS
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle background grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < CANVAS_WIDTH; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Draw bricks
      bricksRef.current.forEach(brick => {
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3);
        ctx.fill();

        // Brick top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(brick.x, brick.y, brick.w, 3);

        // Armor indicator for multi-hit bricks
        if (brick.hp > 1) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(brick.x + 2, brick.y + 2, brick.w - 4, brick.h - 4);
        }
        if (brick.isBomb) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', brick.x + brick.w / 2, brick.y + brick.h / 2);
        }
      });

      // Draw Lasers
      lasersRef.current.forEach(l => {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(l.x - 1.5, l.y, 3, 12);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(l.x - 0.5, l.y + 2, 1, 8);
      });

      // Draw Paddle
      const paddle = paddleRef.current;
      ctx.fillStyle = paddle.isLaserActive ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
      ctx.fill();

      // Paddle grip stripes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(paddle.x + paddle.w / 2 - 8, paddle.y + 3, 16, paddle.h - 6);

      // Draw Balls
      ballsRef.current.forEach(ball => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ball subtle cyan aura
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw PowerUps
      powerUpsRef.current.forEach(pow => {
        ctx.fillStyle =
          pow.type === 'expand'
            ? '#38bdf8'
            : pow.type === 'multi'
            ? '#f59e0b'
            : pow.type === 'laser'
            ? '#ef4444'
            : '#ec4899';
        ctx.beginPath();
        ctx.roundRect(pow.x - 12, pow.y - 7, 24, 14, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label =
          pow.type === 'expand'
            ? 'WIDE'
            : pow.type === 'multi'
            ? '3X'
            : pow.type === 'laser'
            ? 'GUN'
            : '+1HP';
        ctx.fillText(label, pow.x, pow.y);
      });

      // Draw Particles
      particlesRef.current.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, isVictory, lives, level, resetBallAndPaddle, createLevelBricks]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === ' ') {
        ballServedRef.current = true;
        keysRef.current.fire = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === ' ') keysRef.current.fire = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse / Pointer direct paddle tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clientX = (e.clientX - rect.left) * scaleX;
    paddleRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - paddleRef.current.w, clientX - paddleRef.current.w / 2));
  };

  const handlePointerDown = () => {
    ballServedRef.current = true;
    keysRef.current.fire = true;
  };

  const handlePointerUp = () => {
    keysRef.current.fire = false;
  };

  const submitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (score <= 0 || hasSavedScore) return;
    saveHighScore('bounce', playerName, score, `Stage ${level} Cleared · Brick Breaker`);
    setHasSavedScore(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* Canvas Court */}
      <div className="flex flex-col items-center w-full lg:w-auto">
        <div className="relative p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="w-full max-w-[440px] aspect-square rounded-lg bg-slate-950 block cursor-crosshair touch-none"
          />

          {/* Title Start Overlay */}
          {!isPlaying && !isGameOver && !isVictory && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-sky-400 font-mono mb-1">Arcade 1976 Classic</span>
              <h3 className="text-2xl font-bold text-white mb-2">Bounce Ball & Brick Breaker</h3>
              <p className="text-sm text-slate-300 max-w-xs mb-6">
                Control the paddle with mouse or arrow keys. Deflect the kinetic sphere to shatter colorful bricks and collect powerups!
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch Ball
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-red-400 font-mono mb-1">Out of Reserves</span>
              <h3 className="text-2xl font-bold text-white mb-1">Game Over</h3>
              <div className="my-3 text-center">
                <div className="text-xs text-slate-400">Final Score</div>
                <div className="text-3xl font-extrabold text-sky-400 font-mono tabular-nums">{score}</div>
                <div className="text-xs text-slate-500 mt-1">Reached Stage {level}</div>
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
                className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          )}

          {/* Victory Overlay */}
          {isVictory && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-mono mb-1">Sector Cleared</span>
              <h3 className="text-2xl font-bold text-white mb-1">Arcade Victory!</h3>
              <div className="my-3 text-center">
                <div className="text-xs text-slate-400">Total Score</div>
                <div className="text-3xl font-extrabold text-amber-400 font-mono tabular-nums">{score}</div>
                <div className="text-xs text-emerald-400 mt-1">All 3 Stages Completed!</div>
              </div>

              <button
                onClick={startGame}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Mobile touch paddle slider */}
        <div className="mt-3 flex items-center justify-center gap-3 md:hidden w-full max-w-[440px]">
          <button
            onPointerDown={() => (keysRef.current.left = true)}
            onPointerUp={() => (keysRef.current.left = false)}
            className="flex-1 py-3 bg-slate-800 active:bg-slate-700 text-white rounded-lg border border-slate-700 font-bold text-center"
          >
            ◀ Left
          </button>
          <button
            onClick={() => {
              ballServedRef.current = true;
              keysRef.current.fire = true;
              setTimeout(() => (keysRef.current.fire = false), 150);
            }}
            className="px-4 py-3 bg-sky-500 text-slate-950 rounded-lg font-bold"
          >
            Launch / Fire
          </button>
          <button
            onPointerDown={() => (keysRef.current.right = true)}
            onPointerUp={() => (keysRef.current.right = false)}
            className="flex-1 py-3 bg-slate-800 active:bg-slate-700 text-white rounded-lg border border-slate-700 font-bold text-center"
          >
            Right ▶
          </button>
        </div>
      </div>

      {/* Side HUD */}
      <div className="flex-1 flex flex-col gap-4 w-full">
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div>
            <div className="text-xs text-slate-400">Score</div>
            <div className="text-2xl font-mono font-bold text-sky-400 tabular-nums">{score}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Stage</div>
            <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">{level} / 3</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Lives</div>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${
                    i < lives ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Active Powerup Badge */}
        {activePowerUp && (
          <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl flex items-center gap-3">
            <Zap className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-xs text-sky-300 font-semibold">{activePowerUp} Active</div>
              <div className="text-xs text-slate-400">Temporary equipment upgrade</div>
            </div>
          </div>
        )}

        {/* Physics & Mechanics Note */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Bounce Ball Mechanics
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The ball deflection angle is calculated from where it strikes the paddle. Hit near the edges for sharp horizontal cuts; hit the center for high vertical rebounds!
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-800/60 rounded border border-slate-700/60">
              <span className="text-sky-400 font-medium">Wide Paddle:</span> 1.5x width
            </div>
            <div className="p-2 bg-slate-800/60 rounded border border-slate-700/60">
              <span className="text-amber-400 font-medium">Multi-Ball:</span> 3x spheres
            </div>
            <div className="p-2 bg-slate-800/60 rounded border border-slate-700/60">
              <span className="text-rose-400 font-medium">Laser Gun:</span> Spacebar to shoot
            </div>
            <div className="p-2 bg-slate-800/60 rounded border border-slate-700/60">
              <span className="text-red-400 font-medium">Bomb Brick:</span> 3x3 blast
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
