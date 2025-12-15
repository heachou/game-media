import React, { useState, useRef } from 'react';
import GameCanvas from './components/GameCanvas';

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [commentary, setCommentary] = useState("Ready to dance? 💃");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    if (!audioFile) {
      alert("Please upload a music track first!");
      return;
    }
    setHasStarted(true);
    setIsPlaying(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleScoreUpdate = (newScore: number, newCombo: number) => {
    setScore(newScore);
    setCombo(newCombo);
  };

  const handleAIComment = (comment: string) => {
    setCommentary(comment);
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(#00ffcc 1px, transparent 1px), linear-gradient(90deg, #ff00ff 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }}>
        </div>

        <div className="z-10 bg-white/5 backdrop-blur-lg border border-white/10 p-12 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.3)] text-center max-w-lg w-full mx-4">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2 tracking-tighter">
            NEON PULSE
          </h1>
          <p className="text-cyan-200 mb-8 text-lg">AI Motion Rhythm Game</p>

          <div className="space-y-6">
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 px-6 border-2 border-dashed border-cyan-500/50 rounded-xl text-cyan-400 hover:bg-cyan-500/10 transition-all flex flex-col items-center justify-center gap-2"
              >
                <span className="text-2xl">🎵</span>
                {audioFile ? (
                  <span className="text-white font-bold">{audioFile.name}</span>
                ) : (
                  <span>Select Music Track</span>
                )}
              </button>
            </div>

            <button
              onClick={handleStart}
              disabled={!audioFile}
              className={`w-full py-4 rounded-xl text-xl font-bold tracking-widest transition-all transform hover:scale-105 ${
                audioFile 
                  ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.7)]' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              INITIATE SYSTEM
            </button>
          </div>
          
          <div className="mt-8 text-xs text-gray-500">
            <p>Powered by Gemini AI • MediaPipe • Web Audio</p>
            <p className="mt-1">Allows camera access to play.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden font-mono text-white">
      <GameCanvas 
        onScoreUpdate={handleScoreUpdate}
        onAIComment={handleAIComment}
        audioFile={audioFile}
        isPlaying={isPlaying}
        onGameOver={() => setIsPlaying(false)}
      />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          {/* Score Board */}
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg shadow-[0_0_15px_rgba(0,255,255,0.2)]">
            <div className="text-xs text-cyan-400 uppercase tracking-widest mb-1">Score</div>
            <div className="text-4xl font-black text-white tabular-nums tracking-tight">
              {score.toString().padStart(6, '0')}
            </div>
          </div>

          {/* AI Commentary */}
          <div className="max-w-md text-right">
             <div className="inline-block bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-md border border-pink-500/30 p-4 rounded-lg shadow-[0_0_20px_rgba(236,72,153,0.3)] transform transition-all duration-300">
                <div className="text-xs text-pink-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
                  <span>Gemini Live Feed</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <div className="text-lg md:text-xl font-bold text-white italic">
                  "{commentary}"
                </div>
             </div>
          </div>
        </div>

        {/* Center - Combo */}
        {combo > 1 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-[0_0_10px_rgba(255,165,0,0.8)] animate-bounce">
              {combo}x
            </div>
            <div className="text-orange-300 text-xl tracking-[0.5em] font-bold uppercase mt-2">Combo</div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          <div className="bg-black/30 backdrop-blur px-4 py-2 rounded border border-white/10 text-xs text-gray-400">
            {audioFile?.name.substring(0, 30)}...
          </div>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 rounded-full p-4 transition-colors"
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
