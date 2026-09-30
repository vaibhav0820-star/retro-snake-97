import React, { useState } from 'react';
import { GAME_BLUEPRINTS } from '../../data/gameBlueprints';
import { Shuffle, Sparkles, ArrowRight, Dna, Copy, Check } from 'lucide-react';

interface HybridIdea {
  title: string;
  genre: string;
  elevatorPitch: string;
  gameplayLoop: string[];
  hybridPhysics: string;
  controls: string;
  technicalRoadmap: string[];
}

export const MechanicsRemixer: React.FC = () => {
  const [gameAId, setGameAId] = useState<string>('snake');
  const [gameBId, setGameBId] = useState<string>('bounce');
  const [copied, setCopied] = useState(false);

  const gameA = GAME_BLUEPRINTS.find(b => b.id === gameAId) || GAME_BLUEPRINTS[0];
  const gameB = GAME_BLUEPRINTS.find(b => b.id === gameBId) || GAME_BLUEPRINTS[1];

  const generateHybrid = (aId: string, bId: string): HybridIdea => {
    // Curated combinations and generative formula
    const pairKey = [aId, bId].sort().join('+');

    if (pairKey === 'bounce+snake') {
      return {
        title: 'Viper Breaker (Serpent Paddle)',
        genre: 'Kinetic Arcade Fusion',
        elevatorPitch: 'You steer a growing snake around the perimeter of the screen; the snake body itself acts as the living, moving paddle that deflects the bouncing fireball toward clusters of geometric crystal bricks!',
        gameplayLoop: [
          'Steer the snake head along grid boundaries while avoiding obstacles',
          'Deflect the bouncing kinetic orb off any segment of the snake body',
          'Each brick shattered drops nutrition nuggets that make the snake 1 segment longer and faster',
          'A longer body gives more paddle coverage, but creates tighter navigation hazards for self-collisions!'
        ],
        hybridPhysics: 'Collision detection runs a dual pass: (1) Discrete grid stepping for snake movement (x += dx, y += dy), and (2) Continuous circle-to-line segment sweep between the ball and each snake segment pair.',
        controls: 'WASD or Arrow keys to steer the snake; Left Click or Space to launch or curve the bouncing orb.',
        technicalRoadmap: [
          '1. Implement standard 2D vector ball with wall reflection',
          '2. Model snake body as an ordered polyline array of line segments',
          '3. Raycast ball trajectory against each segment to compute normal vector reflection',
          '4. Award points & spawn multi-ball powerups upon clearing brick color sets'
        ]
      };
    }

    if (pairKey === 'mario+tetris') {
      return {
        title: 'Tetra Climber (Tower Builder Platformer)',
        genre: 'Physics Puzzle Platformer',
        elevatorPitch: 'Tetromino blocks drop from the top of the screen; you control a platforming hero who must dodge falling blocks, scramble up completed polyomino ledges, and rescue captive stars before the rising acid tide catches up!',
        gameplayLoop: [
          'Polyominoes tumble downward at steady rhythmic cadence with ghost landing shadows',
          'Run, jump, and wall-slide using the newly formed structures as staircases and footholds',
          'Completing a solid row of 10 blocks clears that layer with an explosion, launching you skyward with bonus jump velocity',
          'Do not get squished directly beneath an incoming falling block!'
        ],
        hybridPhysics: 'Euler gravity platformer integrated onto a discrete 10x24 cellular grid matrix; falling blocks transition from active kinematic states to static rigid ground colliders upon landing.',
        controls: 'A / D to run, Space to jump & wall-kick; optional 1-9 or Q / E to nudge falling piece lanes.',
        technicalRoadmap: [
          '1. Create standard 10x20 Tetris matrix state and 60fps canvas renderer',
          '2. Add player entity with AABB collision against non-empty matrix cells',
          '3. Implement variable jump height and wall-cling physics',
          '4. Trigger particle shockwaves and camera shake when lines clear'
        ]
      };
    }

    if (pairKey === 'lunar-lander+space-invaders') {
      return {
        title: 'Lunar Defender (Orbital Thrust Interceptor)',
        genre: 'Inertial Vector Shooter',
        elevatorPitch: 'Command a nimble lunar hopper ship over alien craters; fire downward precision counter-bombs to destroy descending invader columns while conserving limited fuel and landing safely on refueling pads!',
        gameplayLoop: [
          'Fire vector thrusters to maintain altitude against planetary gravity',
          'Time laser salvos to intercept advancing alien rows marching downward',
          'Touch down smoothly on green landing beacons to replenish rocket fuel and shields',
          'Prevent alien mothership from deploying drop pods onto the lunar colony surface'
        ],
        hybridPhysics: 'Newtonian gravity integration (vy += g * dt) combined with marching grid state machine for alien formation synchrony.',
        controls: 'A / D to rotate ship angle; W to fire rocket thrusters; Spacebar to drop ordnance.',
        technicalRoadmap: [
          '1. Setup 2D vector lander physics with angle heading and fuel meter',
          '2. Spawn marching 5x8 grid of alien bogeys descending every wall collision',
          '3. Check projectile AABB against invaders',
          '4. Safe landing detector comparing touchdown speed and orientation thresholds'
        ]
      };
    }

    if (pairKey === 'flappy+snake') {
      return {
        title: 'Flappy Serpent (Sinusoidal Flight)',
        genre: 'Timing Kinetic Runner',
        elevatorPitch: 'A flying dragon/snake whose body undulates through narrow stone caverns; each screen tap pulses the head upward while the multi-segmented body trails behind in a smooth hydrodynamic wave!',
        gameplayLoop: [
          'Tap or press Space to give the head upward impulse against continuous gravity',
          'Body segments interpolate along historical head positions like a flexible ribbon',
          'Thread through hazardous stalactites and moving laser gates',
          'Collect floating orbs to lengthen your body for higher score multipliers'
        ],
        hybridPhysics: 'Verlet integration or position-history breadcrumb trail for snake body trailing behind a standard gravity impulse head.',
        controls: 'Single input: Spacebar, Click, or Screen Tap.',
        technicalRoadmap: [
          '1. Implement Flappy bird impulse gravity on head node',
          '2. Buffer historical coordinates array (last 60 frames)',
          '3. Draw bezier curved serpent body following recorded path',
          '4. Circular hitbox collision against scrolling obstacle pillars'
        ]
      };
    }

    // Default dynamic procedural hybrid generator
    return {
      title: `${aId.toUpperCase()} × ${bId.toUpperCase()} Hybrid Lab`,
      genre: 'Experimental Retro Hybrid',
      elevatorPitch: `A fusion combining the ${gameA.tagline.toLowerCase()} with ${gameB.tagline.toLowerCase()}. Players balance the core loop of ${gameA.title} while surviving the hazards of ${gameB.title}.`,
      gameplayLoop: [
        `Primary objective driven by ${gameA.title} rules: ${gameA.coreMechanic.slice(0, 100)}...`,
        `Secondary environmental pressure introduced from ${gameB.title}: ${gameB.coreMechanic.slice(0, 100)}...`,
        'Score multipliers unlock when chaining mechanics from both systems simultaneously',
        'Failure triggers if either win/survive condition breaks'
      ],
      hybridPhysics: `Blended physics loop: (${gameA.physicsFormula.split('.')[0]}) coupled with (${gameB.physicsFormula.split('.')[0]}).`,
      controls: `Integrated controls: ${gameA.controlsLayout[0]} alongside ${gameB.controlsLayout[0]}.`,
      technicalRoadmap: [
        `1. Bootstrap canvas loop running at 60fps with delta timing (dt)`,
        `2. Implement ${gameA.title} state model as the primary interactive entity`,
        `3. Overlay ${gameB.title} mechanics as interactive obstacles or bonus phases`,
        `4. Add Web Audio synthesized 8-bit sound effects for unified sensory feedback`
      ]
    };
  };

  const hybrid = generateHybrid(gameAId, gameBId);

  const randomize = () => {
    const list = GAME_BLUEPRINTS;
    const a = list[Math.floor(Math.random() * list.length)].id;
    let b = list[Math.floor(Math.random() * list.length)].id;
    while (b === a) {
      b = list[Math.floor(Math.random() * list.length)].id;
    }
    setGameAId(a);
    setGameBId(b);
  };

  const copyBlueprint = () => {
    const text = `Title: ${hybrid.title}\nGenre: ${hybrid.genre}\nConcept: ${hybrid.elevatorPitch}\n\nGameplay Loop:\n${hybrid.gameplayLoop.map(s => `- ${s}`).join('\n')}\n\nPhysics:\n${hybrid.hybridPhysics}\n\nControls:\n${hybrid.controls}\n\nRoadmap:\n${hybrid.technicalRoadmap.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Selector Deck */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Dna className="w-5 h-5 text-amber-400" />
              Game Mechanics DNA Remixer
            </h2>
            <p className="text-sm text-slate-300">
              Combine two classic game archetypes to generate unique hybrid game mechanics, mathematical physics blueprints, and implementation roadmaps.
            </p>
          </div>

          <button
            onClick={randomize}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition-colors self-start md:self-center"
          >
            <Shuffle className="w-4 h-4 text-amber-400" />
            Random Combination
          </button>
        </div>

        {/* The 2 Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Mechanic Archetype A
            </label>
            <select
              value={gameAId}
              onChange={e => setGameAId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
            >
              {GAME_BLUEPRINTS.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.year}) · {b.category}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400 leading-normal">
              {gameA.tagline}
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Mechanic Archetype B
            </label>
            <select
              value={gameBId}
              onChange={e => setGameBId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
            >
              {GAME_BLUEPRINTS.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.year}) · {b.category}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400 leading-normal">
              {gameB.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* Generated Hybrid Blueprint Card */}
      <div className="p-6 bg-slate-900 border border-amber-500/40 rounded-xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono mb-1">
              <span>{gameA.title}</span>
              <span>+</span>
              <span>{gameB.title}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">{hybrid.genre}</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{hybrid.title}</h3>
          </div>

          <button
            onClick={copyBlueprint}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition-colors self-start"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Spec</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Game Design Document</span>
              </>
            )}
          </button>
        </div>

        {/* Pitch */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
            Concept & Elevator Pitch
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {hybrid.elevatorPitch}
          </p>
        </div>

        {/* Gameplay loop */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Hybrid Core Gameplay Loop
          </div>
          <div className="space-y-1.5">
            {hybrid.gameplayLoop.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-amber-400 shrink-0 mt-0.5">
                  0{idx + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Math & Physics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 font-mono mb-1">
              HYBRID MATHEMATICAL PHYSICS
            </div>
            <p className="text-xs text-amber-300 font-mono leading-relaxed">
              {hybrid.hybridPhysics}
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 font-mono mb-1">
              CONTROLS MAPPING
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {hybrid.controls}
            </p>
          </div>
        </div>

        {/* Step-by-Step Implementation */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Implementation Roadmap in Google AI Studio
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {hybrid.technicalRoadmap.map((step, idx) => (
              <div key={idx} className="p-2.5 bg-slate-950/60 rounded border border-slate-800 text-slate-300">
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
