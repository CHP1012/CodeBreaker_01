
import { GoogleGenAI, Type } from "@google/genai";
import { CipherType, Puzzle } from '../types';
import { encrypt } from './ciphers';
import { CIPHER_SCHEDULE } from '../constants';

export function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export function getWeeklySeed(): number {
  const d = new Date();
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return d.getFullYear() * 100 + weekNum;
}

function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffledSchedule(seed: number): CipherType[] {
  const schedule = [...CIPHER_SCHEDULE];
  const rng = mulberry32(seed);
  for (let i = schedule.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [schedule[i], schedule[j]] = [schedule[j], schedule[i]];
  }
  return schedule;
}

export async function generateDailyPuzzle(seed: number): Promise<Puzzle> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Today's seed is ${seed}. Generate a common English word related to spy, hacker, or intelligence theme. 
               The word length should be between 4 and 7 letters. 
               Return only the word in uppercase.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "A spy-themed English word, 4-7 chars." }
        },
        required: ["word"]
      }
    }
  });

  const data = JSON.parse(response.text);
  const word = data.word.toUpperCase().replace(/[^A-Z]/g, '');
  
  const rng = mulberry32(seed);
  const weeklySeed = getWeeklySeed();
  const weekSchedule = shuffledSchedule(weeklySeed);
  const day = new Date().getDay(); 
  const type = weekSchedule[day];
  
  const { ciphertext, key } = encrypt(word, type, rng);
  
  const descriptions: Record<CipherType, string> = {
    [CipherType.CAESAR]: "알파벳을 일정한 칸수만큼 옆으로 밀어버린 암호입니다.",
    [CipherType.ATBASH]: "알파벳 판을 반으로 접어 대칭시킨 '거울' 암호입니다.",
    [CipherType.A1Z26]: "알파벳을 A=1, B=2 처럼 순서 숫자로 치환했습니다.",
    [CipherType.KEYWORD]: "특정 단어를 암호표의 시작점으로 잡은 변칙 암호입니다.",
    [CipherType.PIGPEN]: "도형 격자와 점의 위치로 글자를 기호화했습니다.",
    [CipherType.RAIL_FENCE]: "글자를 위아래 지그재그로 써서 순서를 섞었습니다.",
    [CipherType.VIGENERE]: "글자마다 서로 다른 칸수만큼 밀어내는 고난도 암호입니다."
  };

  const tips: Record<CipherType, string> = {
    [CipherType.CAESAR]: "모든 글자가 똑같은 간격(예: 전부 +3칸)으로 밀려있습니다.",
    [CipherType.ATBASH]: "A는 Z로, B는 Y로 바뀝니다. 알파벳 끝에서부터 거꾸로 세보세요.",
    [CipherType.A1Z26]: "숫자가 몇 번째 알파벳인지 '분석 데이터' 표에서 찾아보세요.",
    [CipherType.KEYWORD]: "키워드가 암호표 맨 앞에 오고, 나머지 글자들이 뒤를 따릅니다.",
    [CipherType.PIGPEN]: "기호의 테두리 모양과 점의 유무가 핵심 단서입니다.",
    [CipherType.RAIL_FENCE]: "암호문의 앞부분 절반과 뒷부분 절반을 번갈아 합치세요.",
    [CipherType.VIGENERE]: "반복되는 '비밀 키워드'를 찾아야만 해독할 수 있습니다."
  };

  const guides: Record<CipherType, string> = {
    [CipherType.CAESAR]: "■ 해독법:\n1. 암호문의 첫 글자가 'D'이고, 정답이 'A'라고 추측한다면 간격은 +3입니다.\n2. 나머지 글자들도 똑같이 알파벳 순서에서 3칸씩 앞으로 당겨보세요.",
    [CipherType.ATBASH]: "■ 해독법:\n1. '분석 데이터'의 알파벳 표를 봅니다.\n2. A(00)는 Z(25)로, B(01)는 Y(24)로 바뀝니다. 인덱스 번호를 합쳐서 25가 되는 글자를 찾으세요.",
    [CipherType.A1Z26]: "■ 해독법:\n1. '19-16-25' 같은 숫자를 봅니다.\n2. 19번째는 S, 16번째는 P, 25번째는 Y입니다. 숫자를 하나씩 글자로 바꾸면 됩니다.",
    [CipherType.KEYWORD]: "■ 해독법:\n1. 만약 키워드가 'AGENT'라면, 암호표는 A,G,E,N,T 다음 나머지 B,C,D,F... 순서가 됩니다.\n2. 이 커스텀 암호표를 알파벳 A-Z와 1:1로 매칭해 읽으세요.",
    [CipherType.PIGPEN]: "■ 해독법:\n1. # 모양 칸은 A~I, 점이 찍힌 #은 J~R입니다.\n2. X 모양 칸은 S~V, 점이 찍힌 X는 W~Z입니다. 기호의 모양을 잘 대조하세요.",
    [CipherType.RAIL_FENCE]: "■ 해독법:\n1. 암호문이 'S E R P Y'라면, 앞의 두 글자(SE)는 윗줄, 뒤의 세 글자(RPY)는 아랫줄입니다.\n2. '윗줄 1번 - 아랫줄 1번 - 윗줄 2번 - 아랫줄 2번...' 순서로 지그재그로 읽어보세요.",
    [CipherType.VIGENERE]: "■ 비제네르 암호의 원리:\n키워드가 'DOG'라면 글자마다 밀어내는 칸수가 변합니다.\n\n1. 첫 글자: 키워드 'D'는 4번째 글자이므로 원래 글자를 +3칸(D-A=3) 밀어냅니다.\n2. 둘째 글자: 키워드 'O'는 15번째이므로 원래 글자를 +14칸 밀어냅니다.\n3. 셋째 글자: 키워드 'G'만큼 밀어냅니다.\n4. 넷째 글자: 다시 'D'만큼 밀어냅니다. (D-O-G 순서 반복)\n\n※ 즉, 글자마다 서로 다른 카이사르 암호가 적용된 것과 같습니다."
  };

  return {
    ciphertext,
    answer: word,
    type,
    description: descriptions[type],
    decryptionTips: tips[type],
    beginnerGuide: guides[type],
    key
  };
}
