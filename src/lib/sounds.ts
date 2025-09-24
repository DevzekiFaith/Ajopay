// Sound effects for wallet notifications
class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private initialized = false;

  private constructor() {
    // Initialize audio context on user interaction
    if (typeof window !== 'undefined') {
      window.addEventListener('click', this.init.bind(this), { once: true });
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private async init() {
    if (this.initialized) return;
    
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Preload sounds
      await this.loadSound('transaction', '/sounds/transaction-complete.mp3');
      await this.loadSound('success', '/sounds/success.mp3');
      await this.loadSound('error', '/sounds/error.mp3');
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound ${name}:`, error);
    }
  }

  public playSound(name: string, volume = 0.5): void {
    if (!this.initialized || !this.audioContext || !this.sounds.has(name)) {
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = this.sounds.get(name) || null;
      if (!source.buffer) return;
      
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }
}

export const soundManager = SoundManager.getInstance();

export function playTransactionSound(type: 'deposit' | 'withdrawal' | 'success' | 'error' = 'success') {
  // Play different sounds based on transaction type
  switch (type) {
    case 'deposit':
      soundManager.playSound('transaction');
      break;
    case 'withdrawal':
      soundManager.playSound('transaction');
      break;
    case 'success':
      soundManager.playSound('success');
      break;
    case 'error':
      soundManager.playSound('error');
      break;
    default:
      soundManager.playSound('transaction');
  }
}
