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
      
      // Generate tones directly since we don't have sound files
      // This avoids 404 errors and provides consistent audio feedback
      this.sounds.set('transaction', this.generateTone('transaction'));
      this.sounds.set('success', this.generateTone('success'));
      this.sounds.set('error', this.generateTone('error'));
      this.sounds.set('deposit', this.generateTone('deposit'));
      this.sounds.set('coin', this.generateTone('coin'));
      this.sounds.set('notification', this.generateTone('notification'));
      
      console.log('Sound system initialized with generated tones');
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private async loadSound(name: string, url: string, fallbackUrl?: string): Promise<void> {
    if (!this.audioContext) return;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      
      // Check if the file is empty (0 bytes)
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio file');
      }
      
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
      console.log(`Loaded sound: ${name}`);
    } catch (error) {
      console.warn(`Failed to load sound ${name} from ${url}, trying fallback...`);
      
      // Try fallback URL if provided
      if (fallbackUrl) {
        try {
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const arrayBuffer = await fallbackResponse.arrayBuffer();
            
            // Check if fallback is also empty
            if (arrayBuffer.byteLength === 0) {
              throw new Error('Fallback file is also empty');
            }
            
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
            console.log(`Loaded fallback sound for ${name}`);
            return;
          }
        } catch (fallbackError) {
          console.warn(`Fallback sound also failed for ${name}:`, fallbackError);
        }
      }
      
      // Generate a simple tone as last resort
      try {
        const audioBuffer = this.generateTone(name);
        this.sounds.set(name, audioBuffer);
        console.log(`Generated tone for ${name} (fallback to generated audio)`);
      } catch (toneError) {
        console.error(`Failed to generate tone for ${name}:`, toneError);
      }
    }
  }

  private generateTone(name: string): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not available');
    
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.4; // 400ms
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Different frequencies and patterns for different sounds
    let frequency = 800; // Default
    let pattern = 'single'; // single, double, triple
    
    switch (name) {
      case 'deposit':
        frequency = 1000;
        pattern = 'double';
        break;
      case 'coin':
        frequency = 1200;
        pattern = 'triple';
        break;
      case 'notification':
        frequency = 600;
        pattern = 'single';
        break;
      case 'success':
        frequency = 800;
        pattern = 'double';
        break;
      case 'error':
        frequency = 400;
        pattern = 'single';
        break;
      case 'transaction':
        frequency = 900;
        pattern = 'single';
        break;
    }
    
    // Generate different patterns
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let amplitude = 0;
      
      if (pattern === 'single') {
        // Single tone
        amplitude = Math.sin(2 * Math.PI * frequency * t);
      } else if (pattern === 'double') {
        // Two quick tones
        const tone1 = Math.sin(2 * Math.PI * frequency * t);
        const tone2 = Math.sin(2 * Math.PI * frequency * (t - 0.1));
        amplitude = (tone1 + tone2 * 0.5) / 1.5;
      } else if (pattern === 'triple') {
        // Three quick tones
        const tone1 = Math.sin(2 * Math.PI * frequency * t);
        const tone2 = Math.sin(2 * Math.PI * frequency * (t - 0.08));
        const tone3 = Math.sin(2 * Math.PI * frequency * (t - 0.16));
        amplitude = (tone1 + tone2 * 0.7 + tone3 * 0.4) / 2.1;
      }
      
      // Apply envelope with smooth fade in/out
      const fadeIn = Math.min(1, t * 15); // Quick fade in
      const fadeOut = Math.min(1, (duration - t) * 15); // Quick fade out
      const envelope = fadeIn * fadeOut;
      
      data[i] = amplitude * envelope * 0.25; // Lower volume for generated tones
    }
    
    return buffer;
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

export function playTransactionSound(type: 'deposit' | 'withdrawal' | 'success' | 'error' | 'notification' = 'success') {
  // Play different sounds based on transaction type
  switch (type) {
    case 'deposit':
      soundManager.playSound('deposit', 0.7);
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
    case 'notification':
      soundManager.playSound('notification', 0.6);
      break;
    default:
      soundManager.playSound('transaction');
  }
}

// Enhanced function for wallet deposit notifications
export function playDepositNotification(amount: number, isLargeDeposit = false) {
  if (isLargeDeposit) {
    // Play coin sound for large deposits
    soundManager.playSound('coin', 0.8);
  } else {
    // Play deposit sound for regular deposits
    soundManager.playSound('deposit', 0.7);
  }
  
  // Also play notification sound
  setTimeout(() => {
    soundManager.playSound('notification', 0.5);
  }, 200);
}
