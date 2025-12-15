import React, { useEffect, useRef, useState, useCallback } from 'react';
import { generateCommentary } from '../services/geminiService';
import { AudioController } from '../services/audioService';
import { Particle, Target, GameState, AudioVisuals } from '../types';

interface GameCanvasProps {
  onScoreUpdate: (score: number, combo: number) => void;
  onAIComment: (comment: string) => void;
  audioFile: File | null;
  isPlaying: boolean;
  onGameOver: () => void;
}

const POSE_CONNECTIONS = [
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  [11, 12], // Shoulders
  [11, 23], [12, 24], // Torso
  [23, 24], // Hips
  [23, 25], [25, 27], // Left leg
  [24, 26], [26, 28]  // Right leg
];

const EMOJIS = ['🍭', '🍬', '⚡️', '💎', '🎵', '🌟'];
const HIGH_ENERGY_EMOJIS = ['🔥', '💣', '🚀', '🎸', '💿', '👑'];

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  onScoreUpdate, 
  onAIComment, 
  audioFile,
  isPlaying,
  onGameOver
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioController = useRef(new AudioController());
  
  // Keep track of latest isPlaying state without triggering effect re-runs
  const isPlayingRef = useRef(isPlaying);

  // Game State Refs (mutable to avoid re-renders in loop)
  const particles = useRef<Particle[]>([]);
  const targets = useRef<Target[]>([]);
  const score = useRef(0);
  const combo = useRef(0);
  const lastCommentScore = useRef(0);
  const lastTargetSpawn = useRef(0);
  const poseRef = useRef<any>(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Sync isPlaying prop to ref
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // --- Helpers ---
  const spawnTarget = (width: number, height: number, isHighEnergy: boolean = false) => {
    // Limit total targets to 30
    if (targets.current.length >= 30) return;

    const margin = 50;
    
    // Select properties based on energy level
    const emojiList = isHighEnergy ? HIGH_ENERGY_EMOJIS : EMOJIS;
    
    // Radius reduced by half (15-25 instead of 30-50)
    const baseRadius = 15 + Math.random() * 10;
    
    const sizeMultiplier = isHighEnergy ? 1.4 : 1.0;
    const points = isHighEnergy ? 50 : 10;
    
    // Determine movement speed
    const speedBase = isHighEnergy ? 4 : 2;

    const newTarget: Target = {
      id: Math.random().toString(36).substr(2, 9),
      x: margin + Math.random() * (width - margin * 2),
      y: margin + Math.random() * (height - margin * 2),
      vx: (Math.random() - 0.5) * speedBase,
      vy: (Math.random() - 0.5) * speedBase,
      radius: baseRadius * sizeMultiplier,
      emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
      scoreValue: points,
      createdAt: performance.now(),
      // Random Hue (0-360)
      hue: Math.floor(Math.random() * 360),
    };
    targets.current.push(newTarget);
  };

  const spawnExplosion = (x: number, y: number, color: string, intensity: number = 1) => {
    const count = 15 * intensity;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 5) * intensity;
      particles.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
        size: (5 + Math.random() * 10) * intensity,
        type: Math.random() > 0.5 ? 'star' : 'circle'
      });
    }
  };

  const checkCollisions = (landmarks: any[], width: number, height: number) => {
    const activeTargets = targets.current;
    if (activeTargets.length === 0) return;

    // Interesting landmarks: Nose(0), Index Fingers(19, 20), Wrists(15, 16)
    const interactionPoints = [0, 19, 20, 15, 16];
    
    for (let tIndex = activeTargets.length - 1; tIndex >= 0; tIndex--) {
      const target = activeTargets[tIndex];
      let hit = false;

      for (const idx of interactionPoints) {
        const point = landmarks[idx];
        if (!point) continue;
        // Landmarks are 0-1 normalized
        const px = point.x * width;
        const py = point.y * height;

        const dx = px - target.x;
        const dy = py - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < target.radius) {
          hit = true;
          break;
        }
      }

      if (hit) {
        // Impact!
        const isSpecial = target.scoreValue > 10;
        score.current += target.scoreValue;
        combo.current += 1;
        onScoreUpdate(score.current, combo.current);
        
        // Explosion matches target color
        const explosionColor = `hsl(${target.hue}, 100%, 60%)`;
        spawnExplosion(
          target.x, 
          target.y, 
          explosionColor, 
          isSpecial ? 2.0 : 1.0
        );
        
        // Remove target
        targets.current.splice(tIndex, 1);

        // Trigger AI?
        if (score.current - lastCommentScore.current >= 50) {
          lastCommentScore.current = score.current;
          generateCommentary(score.current, combo.current).then(onAIComment);
        }
      }
    }
  };

  // --- Drawing ---
  const draw = (landmarks: any[]) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Force strict resolution sync
    // This fixes issues where canvas is initialized with 0 size or default 300x150
    if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Safety check for 0 dimensions
    if (canvas.width === 0 || canvas.height === 0) return;

    // Visual Analysis
    const audioData = audioController.current.getAnalysis();
    const beatScale = 1 + audioData.bass * 0.5; // Pulse effect

    // Reset State
    ctx.globalAlpha = 1.0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Targets
    targets.current.forEach(target => {
      // --- Physics Update ---
      target.x += target.vx;
      target.y += target.vy;

      // Bounce off walls with margin for radius
      if (target.x - target.radius < 0) {
         target.x = target.radius;
         target.vx *= -1;
      }
      if (target.x + target.radius > canvas.width) {
         target.x = canvas.width - target.radius;
         target.vx *= -1;
      }
      if (target.y - target.radius < 0) {
         target.y = target.radius;
         target.vy *= -1;
      }
      if (target.y + target.radius > canvas.height) {
         target.y = canvas.height - target.radius;
         target.vy *= -1;
      }

      // --- Rendering ---
      const isSpecial = target.scoreValue > 10;
      
      // Pulse targets with beat
      const currentRadius = target.radius * (1 + audioData.mid * 0.3);
      
      ctx.beginPath();
      ctx.arc(target.x, target.y, currentRadius, 0, 2 * Math.PI);
      
      // Dynamic Rendering with Random Hue
      // Use the stored hue from target state
      const hue = target.hue;
      
      // Fill: High saturation, 60% opacity
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.6)`;
      
      // Stroke: Lighter version
      ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
      
      ctx.lineWidth = isSpecial ? 4 : 3;
      
      // Glow: Matches color
      ctx.shadowBlur = isSpecial ? 25 : 15;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      
      ctx.fill();
      ctx.stroke();

      // Reset shadow for emoji text (keep text crisp)
      ctx.shadowBlur = 0;

      // Draw Emoji
      // Explicitly reset fillStyle for text to white to ensure visibility
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${14 * beatScale}px serif`; // Adjusted font size for smaller targets
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(target.emoji, target.x, target.y);
    });

    // 2. Draw Skeleton
    if (landmarks) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Connectors
      POSE_CONNECTIONS.forEach(([start, end]) => {
        const p1 = landmarks[start];
        const p2 = landmarks[end];
        if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
          ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
          
          // Neon Style - Brighter
          const hue = (Date.now() / 10) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`; // Lighter lightness
          ctx.lineWidth = 6 * beatScale; // Thicker lines
          ctx.shadowBlur = 20 * beatScale; // Stronger glow
          ctx.shadowColor = `hsl(${hue}, 100%, 75%)`;
          ctx.stroke();
          
          // Reset shadow for performance
          ctx.shadowBlur = 0;
        }
      });
      
      // Joints
      landmarks.forEach((lm: any) => {
        if (lm.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 6 * beatScale, 0, 2 * Math.PI);
          // White core for maximum brightness, cyan glow
          ctx.fillStyle = '#ffffff'; 
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ffff';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Check collisions logic inline here
      checkCollisions(landmarks, canvas.width, canvas.height);
    }

    // 3. Draw Particles
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      
      if (p.life <= 0) {
        particles.current.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, 2 * Math.PI);
      ctx.shadowBlur = 10; // Glowing particles
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    }

    // --- Dynamic Spawning Logic ---
    const now = performance.now();
    
    // Beat Detection: 0.7 is a fairly strong bass hit
    const isStrongBeat = audioData.bass > 0.7; 
    
    // Adjust spawn rate based on music intensity
    // Standard: 2000ms. High Energy: 400ms.
    const spawnRate = isStrongBeat ? 400 : 2000;
    
    if (now - lastTargetSpawn.current > spawnRate) {
      spawnTarget(canvas.width, canvas.height, isStrongBeat);
      lastTargetSpawn.current = now;
    }
  };

  // --- Audio Setup ---
  useEffect(() => {
    if (audioFile && audioRef.current) {
      const url = URL.createObjectURL(audioFile);
      audioRef.current.src = url;
      audioRef.current.load();
      
      audioController.current.initialize(audioRef.current).then(() => {
        setIsAudioReady(true);
      });

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioFile]);

  // Handle Play/Pause
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioController.current.resume();
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // --- MediaPipe Setup ---
  useEffect(() => {
    const initPose = async () => {
      if (typeof window.Pose === 'undefined') {
        // Wait a bit if script hasn't loaded (fallback)
        setTimeout(initPose, 100);
        return;
      }

      const pose = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults((results: any) => {
        if (!canvasRef.current || !videoRef.current) return;
        // Drawing logic is triggered by frame update
        // We draw the results immediately
        draw(results.poseLandmarks);
      });

      poseRef.current = pose;

      if (videoRef.current) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            // Check ref current value to avoid stale closures and re-renders
            if (poseRef.current && isPlayingRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720
        });
        camera.start().then(() => setIsCameraReady(true));
      }
    };

    initPose();

    // Resize handler (Backup)
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (poseRef.current) poseRef.current.close();
    };
  }, []); // Run once on mount, DO NOT depend on isPlaying

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {/* Hidden Video Feed for MediaPipe */}
      <video 
        ref={videoRef} 
        // Ensure video is behind canvas
        className="absolute top-0 left-0 w-full h-full object-cover opacity-50 transform scale-x-[-1] z-0" 
        playsInline 
        muted
      />
      
      {/* Drawing Canvas */}
      <canvas 
        ref={canvasRef}
        // Ensure canvas is strictly above video
        className="absolute top-0 left-0 w-full h-full transform scale-x-[-1] z-10" 
      />

      {/* Audio Element */}
      <audio ref={audioRef} loop onEnded={onGameOver} className="hidden" />
      
      {(!isCameraReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
          <div className="text-cyan-400 animate-pulse text-2xl font-mono">
            INITIALIZING NEURAL LINK...
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;