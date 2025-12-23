
import { CipherType } from './types';

export const DICTIONARY = [
  "AGENT", "ALIBI", "CIPHER", "COVERT", "DECODE", 
  "ENIGMA", "ESCAPE", "HIDDEN", "INTEL", "LISTEN",
  "MATRIX", "MYSTERY", "PARITY", "PHOENIX", "POCKET",
  "RADAR", "SECRET", "SHIELD", "SIGNAL", "SPYING",
  "TARGET", "TRACKS", "TUNNEL", "VECTOR", "VISION",
  "WEAPON", "WHISPER", "WINDOW", "ZEROED", "ZODIAC"
];

export const CIPHER_SCHEDULE: CipherType[] = [
  CipherType.VIGENERE,   // Sunday (0)
  CipherType.CAESAR,     // Monday (1)
  CipherType.ATBASH,     // Tuesday (2)
  CipherType.A1Z26,      // Wednesday (3)
  CipherType.KEYWORD,    // Thursday (4)
  CipherType.PIGPEN,     // Friday (5)
  CipherType.RAIL_FENCE  // Saturday (6)
];

export const COLORS = {
  paper: '#F0F0F0',
  ink: '#111111',
  alert: '#FF3333',
  success: '#00CC66',
  muted: '#E5E5E5'
};
