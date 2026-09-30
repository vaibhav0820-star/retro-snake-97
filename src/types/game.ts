export type GameId = 'snake' | 'bounce' | 'mario' | 'tetris';

export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export interface HighScoreRecord {
  id: string;
  gameId: GameId;
  playerName: string;
  score: number;
  date: string;
  details?: string;
}

export type BlueprintCategory = 'arcade' | 'puzzle' | 'physics' | 'timing';

export interface GameBlueprint {
  id: string;
  title: string;
  year: number;
  category: BlueprintCategory;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedDevTime: string;
  coreMechanic: string;
  physicsFormula: string;
  controlsLayout: string[];
  loopSteps: string[];
  whyItWorks: string;
  twistIdeas: string[];
  playableInApp?: GameId;
  starterSnippet: string;
}
