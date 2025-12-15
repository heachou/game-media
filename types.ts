export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number; // 0 to 1
  size: number;
  type: 'star' | 'note' | 'circle';
}

export interface Target {
  id: string;
  x: number;
  y: number;
  vx: number; // Velocity X
  vy: number; // Velocity Y
  radius: number;
  emoji: string;
  scoreValue: number;
  createdAt: number;
  hue: number; // Added for random color
}

export interface GameState {
  score: number;
  isPlaying: boolean;
  isGameOver: boolean;
  combo: number;
}

export interface AudioVisuals {
  bass: number; // 0-1 scale for pulsing
  mid: number;
  treble: number;
}

// Declare global MediaPipe types
declare global {
  interface Window {
    Pose: any;
    Camera: any;
  }
}