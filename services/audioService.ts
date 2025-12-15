import { AudioVisuals } from "../types";

export class AudioController {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    // Lazy init to respect browser autoplay policies
  }

  async initialize(audioElement: HTMLAudioElement) {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    this.audioElement = audioElement;
    this.source = this.audioContext.createMediaElementSource(audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  resume() {
    this.audioContext?.resume();
  }

  getAnalysis(): AudioVisuals {
    if (!this.analyser || !this.dataArray) {
      return { bass: 0, mid: 0, treble: 0 };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    // Simple frequency banding
    const bassRange = this.dataArray.slice(0, 10);
    const midRange = this.dataArray.slice(10, 50);
    const trebleRange = this.dataArray.slice(50, 100);

    const getAvg = (arr: Uint8Array) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      bass: getAvg(bassRange) / 255,
      mid: getAvg(midRange) / 255,
      treble: getAvg(trebleRange) / 255,
    };
  }
}
