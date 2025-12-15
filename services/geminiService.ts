// Replaced AI generation with randomized preset commentary for performance and style control
const NEON_COMMENTS = [
  "Laser sharp moves! ⚡️",
  "Neon legend rising! 🎸",
  "System overload! Amazing! 🔥",
  "Unstoppable! 🚀",
  "Perfect sync! ✨",
  "Cyberpunk god! 💎",
  "Maximum energy! 🔋",
  "Rhythm master! 🎵",
  "In the zone! 👁️",
  "Electric feel! 🎹",
  "Pure adrenaline! 💉",
  "Glitch perfect! 👾",
  "Sonic boom! 💥",
  "Lightning fast! 🌩️",
  "Bass drop detected! 🎧",
  "Pixel perfect! 🕹️"
];

export const generateCommentary = async (score: number, combo: number): Promise<string> => {
  // Return a random comment from the preset list
  const randomIndex = Math.floor(Math.random() * NEON_COMMENTS.length);
  return Promise.resolve(NEON_COMMENTS[randomIndex]);
};