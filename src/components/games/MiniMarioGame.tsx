import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { getHighScores, saveHighScore } from '../../utils/storage';
import { Play, RotateCcw, Heart, Flag, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Player extends Entity {
  vx: number;
  vy: number;
  onGround: boolean;
  isSuper: boolean;
  facing: 'left' | 'right';
  invincibleTimer: number;
}

interface Enemy extends Entity {
  vx: number;
  alive: boolean;
  squashTimer: number;
}

interface Block extends Entity {
  type: 'brick' | 'question' | 'empty';
  bumpOffset: number;
  hasCoin: boolean;
}

interface CoinEffect {
  x: number;
  y: number;
  vy: number;
  alpha: number;
}

const VIEW_W = 480;
const VIEW_H = 340;
const LEVEL_LENGTH = 3200;
const GRAVITY = 1100;

export const MiniMarioGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [distance, setDistance] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState('AAA');
  const [hasSavedScore, setHasSavedScore] = useState(false);

  // Mutable Game Entities
  const playerRef = useRef<Player>({
    x: 80,
    y: 220,
    w: 22,
    h: 28,
    vx: 0,
    vy: 0,
    onGround: true,
    isSuper: false,
    facing: 'right',
    invincibleTimer: 0,
  });

  const cameraXRef = useRef(0);
  const blocksRef = useRef<Block[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const coinEffectsRef = useRef<CoinEffect[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean; run: boolean }>({
    left: false,
    right: false,
    jump: false,
    run: false,
  });

  // Load high scores
  useEffect(() => {
    const scores = getHighScores('mario');
    if (scores.length > 0) {
      setHighScore(scores[0].score);
    }
  }, []);

  const initLevel = useCallback(() => {
    playerRef.current = {
      x: 80,
      y: 220,
      w: 22,
      h: 28,
      vx: 0,
      vy: 0,
      onGround: true,
      isSuper: false,
      facing: 'right',
      invincibleTimer: 0,
    };
    cameraXRef.current = 0;
    coinEffectsRef.current = [];

    // Build stage platforms & question blocks
    const blocks: Block[] = [];
    // Floor is default y >= 270

    // Cluster 1
    blocks.push(
      { x: 320, y: 190, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true },
      { x: 380, y: 190, w: 28, h: 28, type: 'brick', bumpOffset: 0, hasCoin: false },
      { x: 408, y: 190, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true },
      { x: 436, y: 190, w: 28, h: 28, type: 'brick', bumpOffset: 0, hasCoin: false },
      { x: 464, y: 190, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true }
    );

    // High platform cluster 2
    blocks.push(
      { x: 650, y: 130, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true },
      { x: 740, y: 180, w: 28, h: 28, type: 'brick', bumpOffset: 0, hasCoin: false },
      { x: 768, y: 180, w: 28, h: 28, type: 'brick', bumpOffset: 0, hasCoin: false }
    );

    // Pipe barriers & floating bridges
    for (let x = 1000; x <= 1180; x += 30) {
      blocks.push({ x, y: 160, w: 28, h: 28, type: 'brick', bumpOffset: 0, hasCoin: false });
    }
    blocks.push(
      { x: 1090, y: 100, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true },
      { x: 1400, y: 200, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true },
      { x: 1428, y: 200, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true },
      { x: 1650, y: 150, w: 28, h: 28, type: 'brick', bumpOffset: 0, hasCoin: false },
      { x: 1678, y: 150, w: 28, h: 28, type: 'brick', bumpOffset: 0, hasCoin: false },
      { x: 1850, y: 180, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true },
      { x: 2100, y: 160, w: 28, h: 28, type: 'brick', bumpOffset: 0, hasCoin: false },
      { x: 2350, y: 140, w: 28, h: 28, type: 'question', bumpOffset: 0, hasCoin: true }
    );

    blocksRef.current = blocks;

    // Enemies (walking Goombas)
    const enemies: Enemy[] = [
      { x: 420, y: 246, w: 24, h: 24, vx: -1.2, alive: true, squashTimer: 0 },
      { x: 780, y: 246, w: 24, h: 24, vx: -1.2, alive: true, squashTimer: 0 },
      { x: 920, y: 246, w: 24, h: 24, vx: -1.4, alive: true, squashTimer: 0 },
      { x: 1250, y: 246, w: 24, h: 24, vx: -1.3, alive: true, squashTimer: 0 },
      { x: 1550, y: 246, w: 24, h: 24, vx: -1.5, alive: true, squashTimer: 0 },
      { x: 1800, y: 246, w: 24, h: 24, vx: -1.4, alive: true, squashTimer: 0 },
      { x: 2150, y: 246, w: 24, h: 24, vx: -1.5, alive: true, squashTimer: 0 },
      { x: 2500, y: 246, w: 24, h: 24, vx: -1.6, alive: true, squashTimer: 0 },
    ];
    enemiesRef.current = enemies;
  }, []);

  const startGame = () => {
    initLevel();
    setScore(0);
    setCoins(0);
    setLives(3);
    setDistance(0);
    setIsGameOver(false);
    setIsVictory(false);
    setHasSavedScore(false);
    setIsPlaying(true);
    sound.playJump();
  };

  // Main game physics loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // cap delta
      lastTime = currentTime;

      if (isPlaying && !isGameOver && !isVictory) {
        const player = playerRef.current;
        const keys = keysRef.current;

        // Horizontal movement & inertia
        const accel = keys.run ? 750 : 500;
        const maxSpeed = keys.run ? 260 : 180;
        const friction = player.onGround ? 0.82 : 0.92;

        if (keys.left) {
          player.vx -= accel * dt;
          player.facing = 'left';
        } else if (keys.right) {
          player.vx += accel * dt;
          player.facing = 'right';
        } else {
          player.vx *= friction;
        }

        player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

        // Jump physics (variable height: lower gravity while holding jump)
        if (keys.jump && player.onGround) {
          player.vy = -450;
          player.onGround = false;
          sound.playJump();
        }

        const effGravity = keys.jump && player.vy < 0 ? GRAVITY * 0.75 : GRAVITY;
        player.vy += effGravity * dt;

        // Horizontal integrate & block collision
        player.x += player.vx * dt;
        player.x = Math.max(0, player.x);

        // Vertical integrate
        player.y += player.vy * dt;

        // Ground floor check (y = 242 is ground level where height = 28 -> bottom is 270)
        const groundY = 270 - player.h;
        if (player.y >= groundY) {
          player.y = groundY;
          player.vy = 0;
          player.onGround = true;
        } else {
          player.onGround = false;
        }

        // Platform block collisions
        blocksRef.current.forEach(block => {
          // Check collision
          const pLeft = player.x;
          const pRight = player.x + player.w;
          const pTop = player.y;
          const pBottom = player.y + player.h;

          const bLeft = block.x;
          const bRight = block.x + block.w;
          const bTop = block.y + block.bumpOffset;
          const bBottom = block.y + block.h + block.bumpOffset;

          const isOverlapping = pRight > bLeft && pLeft < bRight && pBottom > bTop && pTop < bBottom;

          if (isOverlapping) {
            // Did player hit from beneath?
            if (player.vy < 0 && pTop <= bBottom && pTop >= bTop) {
              player.y = bBottom;
              player.vy = 50; // rebound downward
              block.bumpOffset = -8; // visual bump

              if (block.type === 'question' && block.hasCoin) {
                block.hasCoin = false;
                block.type = 'empty';
                sound.playEat();
                setCoins(c => c + 1);
                setScore(s => s + 100);
                coinEffectsRef.current.push({
                  x: block.x + block.w / 2,
                  y: block.y - 10,
                  vy: -4,
                  alpha: 1,
                });
              } else {
                sound.playBrickHit();
              }
            }
            // Landed on top of block
            else if (player.vy > 0 && pBottom >= bTop && pTop < bTop) {
              player.y = bTop - player.h;
              player.vy = 0;
              player.onGround = true;
            }
          }

          // Return bump animation
          if (block.bumpOffset < 0) {
            block.bumpOffset += 0.8;
            if (block.bumpOffset > 0) block.bumpOffset = 0;
          }
        });

        // Invincibility countdown
        if (player.invincibleTimer > 0) {
          player.invincibleTimer -= dt;
        }

        // Enemy patrol & stomp collision
        enemiesRef.current.forEach(enemy => {
          if (!enemy.alive) {
            if (enemy.squashTimer > 0) enemy.squashTimer -= dt;
            return;
          }

          // Patrol back and forth
          enemy.x += enemy.vx;
          if (enemy.x < 100 || enemy.x > LEVEL_LENGTH - 200) {
            enemy.vx = -enemy.vx;
          }

          // Collision test with player
          const pLeft = player.x;
          const pRight = player.x + player.w;
          const pTop = player.y;
          const pBottom = player.y + player.h;

          const eLeft = enemy.x;
          const eRight = enemy.x + enemy.w;
          const eTop = enemy.y;
          const eBottom = enemy.y + enemy.h;

          const overlaps = pRight > eLeft && pLeft < eRight && pBottom > eTop && pTop < eBottom;

          if (overlaps) {
            // STOMP: player falling onto top third of enemy
            if (player.vy > 0 && pBottom <= eTop + 14) {
              enemy.alive = false;
              enemy.squashTimer = 0.5;
              player.vy = -320; // bounce player
              sound.playStomp();
              setScore(s => s + 200);
            } else if (player.invincibleTimer <= 0) {
              // Hurt player
              sound.playGameOver();
              setLives(l => {
                const next = l - 1;
                if (next <= 0) {
                  setIsGameOver(true);
                  setIsPlaying(false);
                } else {
                  player.invincibleTimer = 2.0; // 2 seconds flashing
                }
                return next;
              });
            }
          }
        });

        // Update coin pop animations
        coinEffectsRef.current.forEach(c => {
          c.y += c.vy;
          c.alpha -= dt * 1.5;
        });
        coinEffectsRef.current = coinEffectsRef.current.filter(c => c.alpha > 0);

        // Update camera position to follow player smoothly
        const targetCamX = player.x - VIEW_W * 0.35;
        cameraXRef.current = Math.max(0, Math.min(LEVEL_LENGTH - VIEW_W, targetCamX));

        // Distance & Flagpole
        setDistance(Math.floor(player.x / 10));

        // Victory flagpole threshold
        if (player.x >= 2850) {
          setIsVictory(true);
          setIsPlaying(false);
          sound.playVictory();
          setScore(s => s + 1000);
          confetti({ particleCount: 120, spread: 80 });
        }
      }

      // 2. RENDER STAGE
      const camX = cameraXRef.current;

      // Sky gradient
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      // Distant Parallax Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 15; i++) {
        const cloudX = (i * 320 - camX * 0.2) % (VIEW_W + 200) - 100;
        ctx.beginPath();
        ctx.arc(cloudX, 60 + (i % 3) * 25, 26, 0, Math.PI * 2);
        ctx.arc(cloudX + 22, 54 + (i % 3) * 25, 32, 0, Math.PI * 2);
        ctx.arc(cloudX + 48, 60 + (i % 3) * 25, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant Hills
      ctx.fillStyle = '#065f46';
      for (let i = 0; i < 8; i++) {
        const hillX = i * 400 - (camX * 0.4) % 400 - 50;
        ctx.beginPath();
        ctx.ellipse(hillX + 150, 270, 180, 80, 0, Math.PI, 0);
        ctx.fill();
      }

      // Ground (Dirt & Grass)
      ctx.fillStyle = '#15803d'; // Green top
      ctx.fillRect(0, 270, VIEW_W, 10);
      ctx.fillStyle = '#78350f'; // Brown earth
      ctx.fillRect(0, 280, VIEW_W, VIEW_H - 280);

      // Blocks
      blocksRef.current.forEach(block => {
        const drawX = block.x - camX;
        if (drawX + block.w < 0 || drawX > VIEW_W) return;
        const drawY = block.y + block.bumpOffset;

        if (block.type === 'question') {
          ctx.fillStyle = '#eab308'; // Golden question block
          ctx.fillRect(drawX, drawY, block.w, block.h);
          ctx.strokeStyle = '#a16207';
          ctx.strokeRect(drawX, drawY, block.w, block.h);

          // Question mark
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', drawX + block.w / 2, drawY + block.h / 2);
        } else if (block.type === 'empty') {
          ctx.fillStyle = '#a16207';
          ctx.fillRect(drawX, drawY, block.w, block.h);
          ctx.strokeStyle = '#78350f';
          ctx.strokeRect(drawX, drawY, block.w, block.h);
        } else {
          // Brick block
          ctx.fillStyle = '#b45309';
          ctx.fillRect(drawX, drawY, block.w, block.h);
          ctx.strokeStyle = '#78350f';
          ctx.strokeRect(drawX, drawY, block.w, block.h);
          // Brick pattern
          ctx.fillStyle = '#78350f';
          ctx.fillRect(drawX, drawY + block.h / 2, block.w, 1.5);
          ctx.fillRect(drawX + block.w / 2, drawY, 1.5, block.h / 2);
        }
      });

      // Coin pop animations
      coinEffectsRef.current.forEach(c => {
        const drawX = c.x - camX;
        ctx.fillStyle = `rgba(234, 179, 8, ${c.alpha})`;
        ctx.beginPath();
        ctx.arc(drawX, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${c.alpha})`;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('★', drawX, c.y + 3);
      });

      // Enemies (Goombas)
      enemiesRef.current.forEach(enemy => {
        const drawX = enemy.x - camX;
        if (drawX + enemy.w < 0 || drawX > VIEW_W) return;

        if (enemy.alive) {
          ctx.fillStyle = '#991b1b'; // Red-brown Goomba
          ctx.beginPath();
          ctx.ellipse(drawX + enemy.w / 2, enemy.y + 12, enemy.w / 2, enemy.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(drawX + 5, enemy.y + 6, 4, 6);
          ctx.fillRect(drawX + 15, enemy.y + 6, 4, 6);
          ctx.fillStyle = '#000000';
          ctx.fillRect(drawX + 6, enemy.y + 8, 2, 4);
          ctx.fillRect(drawX + 16, enemy.y + 8, 2, 4);
        } else if (enemy.squashTimer > 0) {
          // Squashed flat
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(drawX, enemy.y + 16, enemy.w, 8);
        }
      });

      // Goal Flagpole at 2850
      const flagX = 2850 - camX;
      if (flagX > -50 && flagX < VIEW_W + 50) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(flagX, 80, 6, 190);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(flagX + 6, 80);
        ctx.lineTo(flagX + 38, 95);
        ctx.lineTo(flagX + 6, 110);
        ctx.fill();
      }

      // Player Sprite
      const player = playerRef.current;
      const drawPlayerX = player.x - camX;
      const isBlinking = player.invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;

      if (!isBlinking) {
        // Red cap & shirt
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(drawPlayerX + 3, player.y, 16, 10);
        // Face
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(drawPlayerX + 4, player.y + 6, 14, 8);
        // Eye
        ctx.fillStyle = '#000000';
        const eyeX = player.facing === 'right' ? drawPlayerX + 13 : drawPlayerX + 5;
        ctx.fillRect(eyeX, player.y + 8, 2, 3);
        // Blue overalls
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(drawPlayerX + 3, player.y + 14, 16, 10);
        // Yellow buttons
        ctx.fillStyle = '#facc15';
        ctx.fillRect(drawPlayerX + 6, player.y + 16, 2, 2);
        ctx.fillRect(drawPlayerX + 14, player.y + 16, 2, 2);
        // Shoes
        ctx.fillStyle = '#78350f';
        ctx.fillRect(drawPlayerX + 2, player.y + 24, 7, 4);
        ctx.fillRect(drawPlayerX + 13, player.y + 24, 7, 4);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, isVictory, lives, initLevel]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keysRef.current.jump = true;
      if (e.key === 'Shift') keysRef.current.run = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keysRef.current.jump = false;
      if (e.key === 'Shift') keysRef.current.run = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const submitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (score <= 0 || hasSavedScore) return;
    saveHighScore('mario', playerName, score, `Stage 1 · ${coins} Coins · Flagpole`);
    setHasSavedScore(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* Game Stage Canvas */}
      <div className="flex flex-col items-center w-full lg:w-auto">
        <div className="relative p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
          <canvas
            ref={canvasRef}
            width={VIEW_W}
            height={VIEW_H}
            className="w-full max-w-[480px] aspect-[48/34] rounded-lg bg-slate-950 block"
          />

          {/* Title Overlay */}
          {!isPlaying && !isGameOver && !isVictory && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-rose-400 font-mono mb-1">Platformer 1985 Classic</span>
              <h3 className="text-2xl font-bold text-white mb-2">Mini Mario Pixel Platformer</h3>
              <p className="text-sm text-slate-300 max-w-xs mb-6">
                Run, jump onto mystery blocks to collect coins, stomp Goombas, and reach the green flagpole at the end of the stage!
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Adventure
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-red-400 font-mono mb-1">Fell in Action</span>
              <h3 className="text-2xl font-bold text-white mb-1">Game Over</h3>
              <div className="my-3 text-center">
                <div className="text-xs text-slate-400">Total Score</div>
                <div className="text-3xl font-extrabold text-rose-400 font-mono tabular-nums">{score}</div>
                <div className="text-xs text-slate-500 mt-1">Coins: {coins} · Distance: {distance}m</div>
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
                className="px-6 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg transition-transform active:scale-95 flex items-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Victory Overlay */}
          {isVictory && (
            <div className="absolute inset-0 m-2 rounded-lg bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono mb-1">Flagpole Reached!</span>
              <h3 className="text-2xl font-bold text-white mb-1">Course Clear!</h3>
              <div className="my-3 text-center">
                <div className="text-xs text-slate-400">Total Score</div>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">{score}</div>
                <div className="text-xs text-amber-400 mt-1">Collected {coins} Coins!</div>
              </div>

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

        {/* Mobile touch controls */}
        <div className="mt-3 flex items-center justify-between gap-3 md:hidden w-full max-w-[480px]">
          <div className="flex gap-2">
            <button
              onPointerDown={() => (keysRef.current.left = true)}
              onPointerUp={() => (keysRef.current.left = false)}
              className="w-14 h-12 bg-slate-800 text-white rounded-lg border border-slate-700 font-bold"
            >
              ◀
            </button>
            <button
              onPointerDown={() => (keysRef.current.right = true)}
              onPointerUp={() => (keysRef.current.right = false)}
              className="w-14 h-12 bg-slate-800 text-white rounded-lg border border-slate-700 font-bold"
            >
              ▶
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onPointerDown={() => (keysRef.current.run = true)}
              onPointerUp={() => (keysRef.current.run = false)}
              className="px-4 h-12 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/40 text-xs font-bold"
            >
              Dash
            </button>
            <button
              onPointerDown={() => (keysRef.current.jump = true)}
              onPointerUp={() => (keysRef.current.jump = false)}
              className="px-6 h-12 bg-rose-500 text-white rounded-lg font-bold"
            >
              Jump ⬆
            </button>
          </div>
        </div>
      </div>

      {/* Side HUD */}
      <div className="flex-1 flex flex-col gap-4 w-full">
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div>
            <div className="text-xs text-slate-400">Score</div>
            <div className="text-2xl font-mono font-bold text-rose-400 tabular-nums">{score}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Coins</div>
            <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">{coins} ★</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Lives</div>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 3 }).map((_, i) => (
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

        {/* Physics Note */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Platformer Physics Rules
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <div>
              <span className="font-semibold text-rose-400">Variable Jump Arc:</span> Holding the Spacebar / Up Arrow applies reduced gravity while ascending, giving you fine control between short hops and soaring leaps.
            </div>
            <div>
              <span className="font-semibold text-amber-400">Stomp Combat:</span> Landing on Goombas eliminates them and gives you an extra rebound boost to reach high secret blocks.
            </div>
            <div>
              <span className="font-semibold text-emerald-400">Dash Momentum:</span> Hold <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Shift</kbd> to build sprint momentum over long gaps.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
