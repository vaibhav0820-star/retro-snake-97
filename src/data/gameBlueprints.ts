import { GameBlueprint } from '../types/game';

export const GAME_BLUEPRINTS: GameBlueprint[] = [
  {
    id: 'snake',
    title: 'Retro Snake 97',
    year: 1976,
    category: 'arcade',
    tagline: 'Classic discrete grid growth & collision avoidance',
    difficulty: 'Beginner',
    estimatedDevTime: '2 - 4 hours',
    coreMechanic: 'Discrete grid movement where the snake body follows head coordinates history; consuming items increments length and score while colliding with walls or self triggers game over.',
    physicsFormula: 'Position update: (x_new, y_new) = (x_head + dx, y_head + dy). Collision: body.some(segment => segment.x === x_new && segment.y === y_new).',
    controlsLayout: ['Arrow Keys or WASD for 4-directional steer', 'Space to pause/resume', 'Touch swipe or D-pad on mobile'],
    loopSteps: [
      'Capture input and buffer next direction (prevent 180° instant suicide)',
      'Accumulate delta time; tick when tickAccumulator >= speedMs',
      'Compute new head coordinate with direction vector',
      'Check boundary wrap or collision; check body collision',
      'Check food collision: if hit, spawn new random vacant coordinate & increase score; else pop tail',
      'Render 2D grid matrix with distinct head/eye orientation and food pulse'
    ],
    whyItWorks: 'Minimalist zero-latency rules; clear causality; spatial tension grows linearly with every point earned.',
    twistIdeas: [
      'Twin-Snake: control two snakes simultaneously with mirrored controls',
      'Portal Fruit: eating blue apple creates a temporary wormhole across the board',
      'Predator Ghost: a slow AI hunter roams the grid that you must encircle or evade'
    ],
    playableInApp: 'snake',
    starterSnippet: `// Minimal Snake Tick Loop
function tickSnake(state) {
  const newHead = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };
  // Check self collision
  if (state.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) return gameOver();
  const eating = newHead.x === state.food.x && newHead.y === state.food.y;
  const newBody = [newHead, ...state.snake];
  if (!eating) newBody.pop();
  return { ...state, snake: newBody, score: state.score + (eating ? 10 : 0) };
}`
  },
  {
    id: 'bounce',
    title: 'Brick Breaker & Bounce Ball',
    year: 1976,
    category: 'physics',
    tagline: 'Dynamic angle deflection, brick destruction & powerup cascades',
    difficulty: 'Intermediate',
    estimatedDevTime: '4 - 6 hours',
    coreMechanic: 'A projectile bounces within an enclosed court with angle reflection modulated by strike distance from paddle center; breaking bricks drops collectible modifier capsules.',
    physicsFormula: 'Deflection angle: θ = ((ball.x - paddle.x) / (paddle.width / 2)) * (π / 3). Velocity: vx = speed * sin(θ), vy = -speed * cos(θ).',
    controlsLayout: ['Left / Right Arrow or A / D to steer paddle', 'Mouse / Pointer track paddle position directly', 'Spacebar to launch served ball'],
    loopSteps: [
      'Update paddle position constrained to canvas viewport [0, width - paddleWidth]',
      'Integrate ball position: ball.x += ball.vx * dt, ball.y += ball.vy * dt',
      'Reflect against left, right, and top boundaries (invert velocity axis)',
      'AABB sweep test against paddle; calculate strike offset for angled deflection',
      'Broadphase/narrowphase test against active bricks; resolve bounce & trigger HP/break',
      'Update falling powerup capsules; check bottom boundary for life loss'
    ],
    whyItWorks: 'Instant satisfaction of kinetic destruction; the player exercises fine analog steering to calculate rebound trajectories.',
    twistIdeas: [
      'Curved magnetic paddle: hold button to apply rotational curve (Magnus effect) to ball',
      'Gravity Wells: black hole bricks that bend the ball trajectory mid-flight',
      'Boss Core: multi-segmented robotic boss at the top firing counter-lasers'
    ],
    playableInApp: 'bounce',
    starterSnippet: `// Angle deflection math based on paddle center offset
function deflectFromPaddle(ball, paddle) {
  const hitOffset = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
  const maxAngle = Math.PI / 3; // 60 degrees
  const angle = Math.max(-maxAngle, Math.min(maxAngle, hitOffset * maxAngle));
  const speed = Math.hypot(ball.vx, ball.vy);
  return { vx: speed * Math.sin(angle), vy: -speed * Math.cos(angle) };
}`
  },
  {
    id: 'mario',
    title: 'Mini Mario Platformer / Pixel Runner',
    year: 1985,
    category: 'timing',
    tagline: 'Kinetic platform physics, jump arcs, coin collection & stomp combat',
    difficulty: 'Intermediate',
    estimatedDevTime: '6 - 10 hours',
    coreMechanic: 'Physics-based platformer with acceleration, variable-height jump arcs governed by gravity, ground friction, obstacle hazards, and enemy stomping.',
    physicsFormula: 'Euler integration: vy += gravity * dt; y += vy * dt; vx *= friction; x += vx * dt. Stomp condition: player.vy > 0 && player.bottom intersects enemy.top.',
    controlsLayout: ['Arrow Left/Right or A/D to run with inertia', 'Space / Up Arrow to jump (hold for higher arc)', 'Shift to dash / run faster'],
    loopSteps: [
      'Apply horizontal input force and ground friction / air resistance',
      'Apply gravitational downward acceleration (dt-scaled)',
      'Separate horizontal and vertical axis collision checks against tile platforms',
      'Update enemy patrol positions; detect stomp (bounce player up) vs side damage',
      'Camera tracks player x-coordinate with smooth horizontal parallax scroll',
      'Check goal flagpole or victory threshold for stage clear'
    ],
    whyItWorks: 'Visceral control feel; variable jump height gives player expressive micro-control over trajectories; tight risk/reward in timing jumps.',
    twistIdeas: [
      'Grappling Hook: shoot rope to swing across giant bottomless chasms',
      'Phase Shift: switch between red and blue dimensions to solidify alternate platforms',
      'Time Rewind: press R to rewind player trajectory 3 seconds to recover missed jumps'
    ],
    playableInApp: 'mario',
    starterSnippet: `// Variable Jump & Gravity Integration
function updatePlayer(p, onGround, jumpHeld) {
  const gravity = jumpHeld && p.vy < 0 ? 980 : 1800; // lower gravity while holding jump
  p.vy += gravity * 0.016;
  p.y += p.vy * 0.016;
  if (p.y >= 320) { p.y = 320; p.vy = 0; onGround = true; }
  return { ...p, onGround };
}`
  },
  {
    id: 'tetris',
    title: 'Tetra Blocks (Falling Polyominoes)',
    year: 1984,
    category: 'puzzle',
    tagline: 'Geometric spatial packing, matrix row-clearing & speed progression',
    difficulty: 'Intermediate',
    estimatedDevTime: '5 - 8 hours',
    coreMechanic: 'Falling 4-block geometric shapes that can be translated, rotated, and soft/hard dropped into a 10x20 grid; completing solid horizontal rows clears them and awards points.',
    physicsFormula: 'Matrix rotation: (r_new, c_new) = (c, N - 1 - r). SRS Wall Kicks: test offset vectors [(0,0), (-1,0), (1,0), (0,-1)] upon rotation collision.',
    controlsLayout: ['Left / Right Arrow to shift column', 'Up Arrow or X to rotate clockwise', 'Down Arrow for soft drop', 'Spacebar for instant hard drop', 'C or Shift to Hold piece'],
    loopSteps: [
      'Drop active piece by 1 cell every dropInterval milliseconds',
      'Listen for lateral shifts & rotation with wall/floor boundary checks',
      'Project ghost piece to lowest valid landing row to guide player placement',
      'When piece settles on surface, wait lockDelay before solidifying into grid matrix',
      'Scan grid rows: identify all 10-block complete rows, flash animation, remove & shift down',
      'Check game-over condition: spawn cell occupied; spawn next piece from 7-bag randomizer'
    ],
    whyItWorks: 'Pure cognitive flow state (Zeigarnik effect + Tetris effect); visual clarity; satisfying tidying-up mechanic.',
    twistIdeas: [
      'Bomb Blocks: random polyomino contains a fuse that detonates surrounding 3x3 cells',
      'Gravity Physics Tetris: blocks break apart into sand grains or bouncy physics chunks',
      'Puzzle Duel: clearing lines sends gray garbage rows to an AI opponent'
    ],
    playableInApp: 'tetris',
    starterSnippet: `// 2D Array Matrix Row Clearing
function clearCompletedRows(grid) {
  const remaining = grid.filter(row => row.some(cell => cell === 0));
  const clearedCount = grid.length - remaining.length;
  const emptyRows = Array.from({ length: clearedCount }, () => Array(10).fill(0));
  return { newGrid: [...emptyRows, ...remaining], linesCleared: clearedCount };
}`
  },
  {
    id: 'lunar-lander',
    title: 'Lunar Lander Vector Thruster',
    year: 1979,
    category: 'physics',
    tagline: 'Subtle inertia management, fuel conservation & gentle touchdown',
    difficulty: 'Beginner',
    estimatedDevTime: '3 - 5 hours',
    coreMechanic: 'Navigating a lander module in low gravity by applying directional rocket burns; landing within maximum velocity thresholds on designated rocky pads.',
    physicsFormula: 'Thrust vector: ax = (thrust / mass) * sin(θ), ay = gravity - (thrust / mass) * cos(θ). Touchdown safe if |vx| < 1.5 && vy < 2.0 && |θ| < 5°.',
    controlsLayout: ['A / D or Left/Right to rotate lander angle', 'W or Up Arrow to fire main thruster (burns fuel)', 'Spacebar for emergency RCS stabilizing burst'],
    loopSteps: [
      'Apply lunar gravity (downward constant ~1.62 m/s²)',
      'If thrust active & fuel > 0: compute vector components and subtract fuel',
      'Integrate position with velocity; draw exhaust particle stream',
      'Line-segment intersection between lander hull and procedural terrain heightmap',
      'Evaluate touchdown: pad zone? safe velocity? upright orientation? -> SUCCESS or EXPLOSION'
    ],
    whyItWorks: 'Captures the raw physical dread of Newtonian inertia in a frictionless vacuum; every burn counts.',
    twistIdeas: [
      'Wind Shears: atmospheric thermal currents pushing the lander sideways',
      'Cargo Delivery: tether a heavy fragile pendulum container beneath the lander',
      'Procedural Craters: generate infinite procedural planetary surfaces using Perlin noise'
    ],
    starterSnippet: `// Thrust Vector & Fuel Consumption
function updateLander(lander, keys, dt) {
  let { x, y, vx, vy, angle, fuel } = lander;
  const GRAVITY = 80;
  vy += GRAVITY * dt;
  if (keys.thrust && fuel > 0) {
    const POWER = 220;
    vx += Math.sin(angle) * POWER * dt;
    vy -= Math.cos(angle) * POWER * dt;
    fuel = Math.max(0, fuel - 25 * dt);
  }
  return { ...lander, x: x + vx * dt, y: y + vy * dt, vx, vy, fuel };
}`
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders / Galaga Wave Shooter',
    year: 1978,
    category: 'arcade',
    tagline: 'Marching grid formations, defensive bunker degradation & rhythmic tension',
    difficulty: 'Intermediate',
    estimatedDevTime: '4 - 6 hours',
    coreMechanic: 'A cannon at the bottom defends against marching rows of invaders that advance back-and-forth, descending one step every edge collision and accelerating as their numbers decrease.',
    physicsFormula: 'Marching tempo: stepInterval = minStep + (currentInvaders / totalInvaders) * (maxStep - minStep). Bullet travel: y -= bulletSpeed * dt.',
    controlsLayout: ['Left / Right Arrow to slide cannon horizontally', 'Spacebar to fire single rocket (only 1 or 2 bullets on screen)', 'P to pause'],
    loopSteps: [
      'Move invader formation horizontally; check edge boundary for wall hit',
      'On wall hit, reverse direction vector and step all aliens downward by 1 row',
      'Invaders periodically drop random bombs downwards',
      'Player fires laser; detect collision against alien bounding boxes & bunker masks',
      'Degrade destructible shield bunkers pixel-by-pixel or quadrant-by-quadrant',
      'Invaders reaching bottom row triggers immediate planetary invasion defeat'
    ],
    whyItWorks: 'The organic acceleration mechanic: as you kill more invaders, the remaining ones move faster, generating natural musical and kinetic crescendo.',
    twistIdeas: [
      'Capture Beam: boss alien tractor beam can suck up player ship; free it to control dual twin cannons',
      'Shield Deflector: player can time a parry shield to reflect enemy bombs right back',
      'Invader Mutations: shot invaders split into two agile micro-drones'
    ],
    starterSnippet: `// Invader Formation March
function updateInvaders(invaders, bounds, state) {
  let hitWall = false;
  invaders.forEach(inv => {
    if ((inv.x <= bounds.left && state.dir < 0) || (inv.x + inv.w >= bounds.right && state.dir > 0)) {
      hitWall = true;
    }
  });
  if (hitWall) {
    return { dir: -state.dir, dropDown: true };
  }
  return { dir: state.dir, dropDown: false };
}`
  },
  {
    id: 'pacman',
    title: 'Pac Maze & Ghost State Machine',
    year: 1980,
    category: 'arcade',
    tagline: 'Grid navigation, pellet collection & personality-driven AI state machines',
    difficulty: 'Advanced',
    estimatedDevTime: '8 - 14 hours',
    coreMechanic: 'Navigate a symmetric 2D tile maze consuming dots while hunted by 4 ghosts, each operating an individual target tile heuristic (Blinky chases, Pinky ambushes, Inky flanks, Clyde roams).',
    physicsFormula: 'Manhattan distance target tile: dist = |ghost.x - target.x| + |ghost.y - target.y|. Ghost chooses open grid neighbor minimizing target distance.',
    controlsLayout: ['Arrow keys or WASD to buffer turn at next junction', 'Swipe on mobile screens', 'P to pause'],
    loopSteps: [
      'Tile intersection check: can player turn in buffered direction? If wall, continue current vector',
      'Eat pellet: increase score, play audio chirp, check if all pellets cleared',
      'Eat Energizer (Power Pellet): switch ghost AI global state to FRIGHTENED mode (blue vulnerable)',
      'Update ghosts: run Chase/Scatter timer cycle; compute target tile; move towards open path',
      'Check entity overlap: if ghost is normal -> player dies; if ghost is frightened -> ghost eyes retreat to pen'
    ],
    whyItWorks: 'Asymmetric cat-and-mouse AI personalities create recognizable emergent drama without any random wandering.',
    twistIdeas: [
      'Play as the Ghost: switch roles and coordinate 4 ghosts to trap an AI Pac-Man',
      'Dynamic Fog of War: only the illuminated radius around the player is visible',
      'Maze Builder: place walls and traps in real-time while being pursued'
    ],
    starterSnippet: `// Manhattan Distance Ghost Navigation
function chooseBestNextTile(ghostPos, targetPos, validNeighbors) {
  return validNeighbors.reduce((best, cur) => {
    const dist = Math.hypot(cur.x - targetPos.x, cur.y - targetPos.y);
    return dist < best.dist ? { tile: cur, dist } : best;
  }, { tile: validNeighbors[0], dist: Infinity }).tile;
}`
  },
  {
    id: 'frogger',
    title: 'Frogger Highway & River Crossing',
    year: 1981,
    category: 'timing',
    tagline: 'Multi-lane traffic timing, river log hopping & spatial memory',
    difficulty: 'Beginner',
    estimatedDevTime: '3 - 5 hours',
    coreMechanic: 'Hop tile-by-tile across a multi-lane highway filled with speeding vehicles, then ride moving logs and turtles across a dangerous river into home lily pads before the timer runs out.',
    physicsFormula: 'River drift coupling: if player on log: player.x += log.speed * dt. Highway death: AABB overlap between player and any car.',
    controlsLayout: ['Up/Down/Left/Right arrow keys to jump exactly 1 grid square', 'Touch swipe in 4 directions'],
    loopSteps: [
      'Player hops instantaneously 1 tile in chosen direction on keypress',
      'Update lanes of cars moving left and right with variable speeds',
      'Update river lanes of logs and diving turtles',
      'Test highway collision: car touches frog -> squash',
      'Test river collision: if on river row, must overlap a log/turtle or player drowns',
      'Occupy 5 destination bays to complete level and reset with higher traffic speed'
    ],
    whyItWorks: 'Clear discrete rhythm; visual danger is obvious; player learns to read flow patterns across multiple simultaneous conveyors.',
    twistIdeas: [
      'Traffic Jam: honking vehicles slow down and speed up dynamically',
      'Submarine Turtles: turtles submerge underwater periodically, forcing quick leaps',
      'Night Mode: headlights illuminate only narrow traffic bands'
    ],
    starterSnippet: `// River Log Drift Check
function checkRiverSafety(frog, logs) {
  const currentLog = logs.find(log => (
    frog.y === log.y && frog.x >= log.x - 10 && frog.x <= log.x + log.w - 10
  ));
  if (currentLog) {
    frog.x += currentLog.speed; // drift with log
    return true; // safe!
  }
  return false; // splash! drowned
}`
  },
  {
    id: 'flappy',
    title: 'Flappy Impulse Pilot',
    year: 2013,
    category: 'timing',
    tagline: 'Single-button upward impulse, steep gravity & narrow pipe gates',
    difficulty: 'Beginner',
    estimatedDevTime: '1 - 2 hours',
    coreMechanic: 'A bird constantly pulled downward by steep gravity; each screen tap or keypress delivers an upward impulse velocity; thread through narrow vertical pipe gaps.',
    physicsFormula: 'vy += gravity * dt; y += vy * dt. On tap: vy = -jumpImpulse; angle = -25° (smoothly tilts downward as vy increases).',
    controlsLayout: ['Spacebar, Click, or Screen Tap for jump impulse', 'R to restart immediately'],
    loopSteps: [
      'Scroll background and pipe obstacles leftwards at constant horizontal velocity',
      'Apply gravity to bird vertical velocity; clamp maximum fall speed',
      'On user click/tap, assign negative impulse velocity and trigger wing flap animation',
      'Calculate tilt angle: Math.min(Math.PI / 2, Math.max(-0.4, bird.vy * 0.08))',
      'AABB circle-to-box collision against top and bottom pipe segments; ceiling & ground check',
      'Increment score when bird x-coordinate crosses pipe center threshold'
    ],
    whyItWorks: 'Dead-simple single-input mechanic; instantaneous death with zero buffer; addictive sub-second retry loop.',
    twistIdeas: [
      'Wind Tunnels: gusts of headwind and tailwind that alter pipe approach speed',
      'Flappy Jetpack: hold to ascend gradually with limited fuel gauge',
      'Flappy Dual: control two birds simultaneously with two different buttons'
    ],
    starterSnippet: `// Flappy Gravity & Tilt
function updateBird(bird, dt, didTap) {
  let vy = bird.vy + 850 * dt;
  if (didTap) vy = -280;
  const y = bird.y + vy * dt;
  const rotation = Math.max(-0.5, Math.min(1.2, vy * 0.003));
  return { ...bird, y, vy, rotation };
}`
  },
  {
    id: 'sokoban',
    title: 'Sokoban Warehouse Box Pusher',
    year: 1982,
    category: 'puzzle',
    tagline: 'Irreversible moves, spatial deadlock logic & warehouse logistics',
    difficulty: 'Intermediate',
    estimatedDevTime: '4 - 7 hours',
    coreMechanic: 'Push boxes onto storage targets inside a warehouse; boxes can only be pushed (never pulled), creating irreversible deadlock traps if shoved into corners.',
    physicsFormula: 'Target cell inspection: next = grid[r+dr][c+dc]. If next is box, check behind = grid[r+2*dr][c+2*dc]. Can push only if behind is floor/target.',
    controlsLayout: ['Arrow keys or WASD to step in 4 cardinal directions', 'Z or U to Undo last move', 'R to reset puzzle level'],
    loopSteps: [
      'Inspect destination tile in requested move vector',
      'If floor or empty target: move player immediately and record history state',
      'If box: inspect the tile directly behind the box in the same vector',
      'If behind tile is wall or another box: move is blocked (illegal move sound)',
      'If behind tile is open: push box forward, move player into vacated tile, record state',
      'Check victory: every target marker contains a crate'
    ],
    whyItWorks: 'Pure deductive logic with no reflex demands; high mental payoff when a multi-step sequence resolves without corner traps.',
    twistIdeas: [
      'Sticky Crates: crates that stick together if placed adjacent',
      'Color-Coded Switches: crates activate matching colored door barriers',
      'Multi-Level Portals: push a crate into a teleporter pad to materialize elsewhere'
    ],
    starterSnippet: `// Sokoban Push Verification
function tryMove(player, dir, map) {
  const pNext = { x: player.x + dir.x, y: player.y + dir.y };
  if (map.isWall(pNext)) return null;
  if (map.isBox(pNext)) {
    const bNext = { x: pNext.x + dir.x, y: pNext.y + dir.y };
    if (map.isWall(bNext) || map.isBox(bNext)) return null; // Blocked
    map.moveBox(pNext, bNext);
  }
  return pNext;
}`
  },
  {
    id: 'lunar-asteroids',
    title: 'Asteroids Inertial Space Drifter',
    year: 1979,
    category: 'physics',
    tagline: 'Frictionless vector inertia, toroidal screen wrapping & fragment splitting',
    difficulty: 'Intermediate',
    estimatedDevTime: '4 - 6 hours',
    coreMechanic: 'A triangular ship rotates and thrusts in zero-friction space; shooting large asteroids splits them into smaller, faster fragments; all entities wrap toroidally around screen edges.',
    physicsFormula: 'Toroidal wrap: x = (x + width) % width; y = (y + height) % height. Asteroid split: 1 large -> 2 medium, 1 medium -> 2 small + randomized velocity bursts.',
    controlsLayout: ['Left / Right Arrow to rotate ship heading', 'Up Arrow to fire forward thrust thrusters', 'Spacebar to shoot photon torpedoes', 'Down Arrow for hyperspace jump'],
    loopSteps: [
      'Rotate ship angle based on steering inputs',
      'Apply acceleration in direction of ship heading vector when thrusting',
      'Integrate position: x += vx * dt, y += vy * dt (apply small 0.995 space friction)',
      'Toroidal coordinate wrap on all ships, bullets, and asteroids',
      'Check bullet-to-asteroid circle collision; spawn child fragments with offset velocities',
      'Check ship-to-asteroid collision for shield loss and explosion'
    ],
    whyItWorks: 'The kinetic elegance of drifting backwards while firing forwards; screen wrapping turns misses into surprise threats.',
    twistIdeas: [
      'Tractor Beam: pull smaller asteroids into enemy formations as kinetic missiles',
      'Black Hole Core: central gravity source bending all laser shots and ship paths',
      'Shield Overload: ramming asteroids destroys them at cost of shield energy'
    ],
    starterSnippet: `// Toroidal Screen Wrap
function wrapCoordinates(pos, width, height) {
  return {
    x: (pos.x % width + width) % width,
    y: (pos.y % height + height) % height
  };
}`
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper & Recursive Flood-Fill',
    year: 1989,
    category: 'puzzle',
    tagline: 'Probability deduction, flag risk management & zero-tile cascade unveiling',
    difficulty: 'Beginner',
    estimatedDevTime: '3 - 5 hours',
    coreMechanic: 'Uncover grid cells without triggering hidden landmines; revealed cells display the count of adjacent mines (0 to 8); uncovering a 0-cell recursively reveals all neighboring cells.',
    physicsFormula: 'Adjacent mine count: count = sum(isMine(r + dr, c + dc)) for dr, dc in [-1, 0, 1]. Flood fill: DFS/BFS queue reveals all contiguous 0-tiles.',
    controlsLayout: ['Left Click to reveal tile', 'Right Click to place / remove flag', 'Double Click / Chord on revealed number to auto-open neighbors'],
    loopSteps: [
      'First click guarantee: generate mine positions strictly after player clicks first cell',
      'Calculate 8-directional neighbor mine count matrices',
      'If clicked cell has mine count > 0: reveal cell',
      'If clicked cell has mine count == 0: run recursive flood fill queue revealing adjacent cells until numbered boundaries are reached',
      'If clicked cell is mine: trigger detonation and reveal all remaining mines (Game Over)',
      'Win check: all non-mine cells revealed or all mines flagged'
    ],
    whyItWorks: 'Pure analytical deduction and spatial deduction with sudden bursts of dopamine when an entire quadrant cascades open.',
    twistIdeas: [
      'Hexagonal Minesweeper: 6 adjacent neighbors creating totally fresh geometric deductions',
      'Moving Mines: earthquakes cause unflagged mines to shift by 1 tile periodically',
      'Time-Bomb Mines: specific mines display a countdown timer before auto-detonation'
    ],
    starterSnippet: `// Recursive Flood Fill for 0-count cells
function revealTile(grid, r, c) {
  if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
  const tile = grid[r][c];
  if (tile.revealed || tile.flagged) return;
  tile.revealed = true;
  if (tile.count === 0 && !tile.mine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) revealTile(grid, r + dr, c + dc);
      }
    }
  }
}`
  },
  {
    id: 'pong',
    title: 'Pong Classic / Dual Paddle Arena',
    year: 1972,
    category: 'physics',
    tagline: 'The Genesis of video games: 2 paddles, a square ball & English deflection',
    difficulty: 'Beginner',
    estimatedDevTime: '1 - 2 hours',
    coreMechanic: 'Two vertical paddles hit a bouncing square ball back and forth; failing to return the ball awards a point to the opponent; paddle velocity imparts English (spin/speed).',
    physicsFormula: 'English spin calculation: ball.vy += paddle.vy * 0.3. Ball acceleration: speed *= 1.05 after each successful rally volley.',
    controlsLayout: ['W / S for Player 1 (Left)', 'Up / Down Arrow for Player 2 / AI (Right)', 'Space to serve ball'],
    loopSteps: [
      'Update paddle positions from player input or tracking AI',
      'Integrate ball movement: x += vx * dt, y += vy * dt',
      'Bounce off top and bottom walls (vy = -vy)',
      'Paddle collision: check if ball hits paddle front face, calculate deflection angle, increase volley speed',
      'Goal detection: ball passes x = 0 (P2 scores) or x = width (P1 scores)',
      'First to reach target score (e.g. 11 or 7 points) wins the match'
    ],
    whyItWorks: 'Zero cognitive barrier; tension scales naturally as the ball speed increases with every volley rally.',
    twistIdeas: [
      'Multi-Ball Chaos: each 5-volley milestone spawns an extra ball into the court',
      'Obstacle Pillars: spinning bumpers in the center court that launch the ball at wild angles',
      'Shrinking Paddles: each paddle shrinks by 5% every point earned'
    ],
    starterSnippet: `// Simple Pong AI Follow
function updatePongAI(aiPaddle, ball, maxSpeed) {
  const paddleCenter = aiPaddle.y + aiPaddle.h / 2;
  const diff = ball.y - paddleCenter;
  if (Math.abs(diff) > 10) {
    aiPaddle.y += Math.sign(diff) * Math.min(Math.abs(diff), maxSpeed);
  }
}`
  },
  {
    id: 'pipe-dream',
    title: 'Pipe Dream & Fluid Flow',
    year: 1989,
    category: 'puzzle',
    tagline: 'Real-time grid connection against an advancing fluid wave',
    difficulty: 'Intermediate',
    estimatedDevTime: '5 - 7 hours',
    coreMechanic: 'Place randomized pipe segments (straight, elbows, cross-sections) onto a grid to build a continuous path before the green ooze starts flowing from the dispenser.',
    physicsFormula: 'Flow vector transition: current_dir -> tile_exit_dir. Cross-piece allows perpendicular passage: if horizontal, advance horizontal; if vertical, advance vertical.',
    controlsLayout: ['Click grid cell to place upcoming pipe from hopper queue', 'Fast forward button to release fluid early for bonus points'],
    loopSteps: [
      'Queue of 5 upcoming randomized pipe tiles shown in sidebar',
      'Player clicks grid cell to place next piece (can overwrite existing empty pipes at point penalty)',
      'Fluid timer counts down, then begins advancing through pipe network cell by cell',
      'At each pipe joint, check if pipe matches incoming direction: if connected, continue; if dead end, spill',
      'Reach required pipeline loop length threshold to advance to next level'
    ],
    whyItWorks: 'High cognitive tension balancing spatial planning with an inexorably advancing physical timer.',
    twistIdeas: [
      'Color Mixers: red and blue fluid must be routed into matching colored reservoir tanks',
      'Porous Filters: pipes that slow down fluid rate to buy valuable thinking time',
      'Dual Springs: two competing fluid streams flowing simultaneously'
    ],
    starterSnippet: `// Pipe Entrance/Exit Mapping
const PIPE_EXITS = {
  'horizontal': { left: 'right', right: 'left' },
  'vertical': { up: 'down', down: 'up' },
  'elbow_tr': { up: 'right', right: 'up' }, // Top to Right
  'elbow_bl': { down: 'left', left: 'down' }
};`
  }
];
