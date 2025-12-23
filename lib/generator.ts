
import { GoogleGenAI, Type } from "@google/genai";
import { CipherType, Puzzle } from '../types';
import { encrypt } from './ciphers';
import { CIPHER_SCHEDULE, DICTIONARY } from '../constants';

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
  const rng = mulberry32(seed);
  let word = "AGENT"; 
  
  try {
    // Initializing with named parameter as per @google/genai guidelines
    if (process.env.API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Today's seed is ${seed}. Generate a common English word related to spy, hacker, or intelligence theme. 
                   The word length should be between 4 and 7 letters. 
                   Return as a JSON object with a key "word".`,
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

      // Extract text output from property directly and trim whitespace
      const jsonStr = response.text?.trim() || "{}";
      const data = JSON.parse(jsonStr);
      if (data.word) {
        word = data.word.toUpperCase().replace(/[^A-Z]/g, '');
      }
    } else {
      word = DICTIONARY[Math.floor(rng() * DICTIONARY.length)];
    }
  } catch (e) {
    word = DICTIONARY[Math.floor(rng() * DICTIONARY.length)];
  }
  
  const weeklySeed = getWeeklySeed();
  const weekSchedule = shuffledSchedule(weeklySeed);
  const day = new Date().getDay(); 
  const type = weekSchedule[day];
  
  const { ciphertext, key } = encrypt(word, type, rng);
  
  const descriptions: Record<CipherType, string> = {
    [CipherType.CAESAR]: "알파벳을 일정한 칸수만큼 옆으로 밀어버린 고전적 암호입니다.",
    [CipherType.ATBASH]: "알파벳 순서를 완전히 뒤집어 대칭시킨 암호입니다.",
    [CipherType.A1Z26]: "알파벳을 순서대로 숫자로 치환한 방식입니다.",
    [CipherType.KEYWORD]: "특정 키워드를 암호표의 시작점으로 사용한 변칙 암호입니다.",
    [CipherType.PIGPEN]: "기하학적 격자와 점의 위치로 글자를 숨긴 기호 암호입니다.",
    [CipherType.RAIL_FENCE]: "글자를 지그재그로 배치한 뒤 가로로 읽어 순서를 섞은 암호입니다.",
    [CipherType.VIGENERE]: "글자마다 다른 칸수만큼 밀어내는 복합 치환 암호입니다."
  };

  const tips: Record<CipherType, string> = {
    [CipherType.CAESAR]: "패턴: 모든 글자가 동일한 간격으로 이동함\n핵심: 'A'가 'D'라면 모든 글자가 +3칸 이동한 상태입니다.",
    [CipherType.ATBASH]: "패턴: 거울 대칭 (A↔Z, B↔Y)\n핵심: 알파벳의 앞순서 글자는 뒷순서 글자로 정확히 반전됩니다.",
    [CipherType.A1Z26]: "패턴: A=01, B=02, ... Z=26\n핵심: 숫자가 알파벳의 몇 번째 위치인지 확인하면 즉시 해독됩니다.",
    [CipherType.KEYWORD]: "패턴: [키워드] + [나머지 알파벳]\n핵심: 키워드 글자가 암호표 맨 앞에 오고 중복되지 않게 배열됩니다.",
    [CipherType.PIGPEN]: "패턴: 격자 모양 + 점의 유무\n핵심: 모양은 격자의 위치를, 점은 두 번째 세트임을 의미합니다.",
    [CipherType.RAIL_FENCE]: "패턴: 지그재그 배치 (순서 섞임)\n핵심: 글자의 위치만 바뀌었을 뿐, 사용된 알파벳 구성은 정답과 같습니다.",
    [CipherType.VIGENERE]: "패턴: 변화하는 이동 간격\n핵심: 비밀 키워드의 각 글자 값이 이동 칸수가 됩니다. (예: 키워드 'A'는 0칸, 'B'는 1칸 이동)"
  };

  const guides: Record<CipherType, string> = {
    [CipherType.CAESAR]: "■ 왕초보 탈출 가이드\n1단계: 첫 번째 암호 글자가 원래 무엇일지 추측해봅니다.\n2단계: 'D'를 'A'라고 가정하면 3칸 차이가 납니다.\n3단계: 나머지 글자들도 알파벳 순서에서 똑같이 3칸씩 앞으로 당겨보세요.\n예) D→A, E→B, F→C",
    [CipherType.ATBASH]: "■ 왕초보 탈출 가이드\n1단계: 알파벳을 반으로 나눕니다 (A-M / N-Z).\n2단계: A는 맨 끝 Z로, B는 끝에서 두 번째 Y로 바뀝니다.\n3단계: 암호문 글자가 알파벳 뒤쪽에 있다면 앞쪽에서 해당 순서를 찾으세요.",
    [CipherType.A1Z26]: "■ 왕초보 탈출 가이드\n1단계: 하이픈(-)으로 연결된 숫자들을 확인합니다.\n2단계: 01은 A, 05는 E, 19는 S입니다.\n3단계: 각 숫자를 해당하는 순서의 알파벳으로 하나씩 바꾸면 단어가 완성됩니다.",
    [CipherType.KEYWORD]: "■ 왕초보 탈출 가이드\n1단계: 암호표 제작에 쓰인 비밀 키워드를 유추해야 합니다.\n2단계: 암호표의 시작이 A B C D 순서가 아니라 특정 단어로 시작합니다.\n3단계: '분석 정보' 탭의 키워드 힌트를 참고하여 알파벳을 매칭해보세요.",
    [CipherType.PIGPEN]: "■ 왕초보 탈출 가이드\n1단계: 기호의 선 모양을 봅니다 (└ , ┘ , ⊓ 등).\n2단계: 점이 없는 모양은 A~I, 점이 하나 찍힌 모양은 J~R입니다.\n3단계: X자 모양의 칸은 S~Z를 나타냅니다. 기호표와 대조해보세요.",
    [CipherType.RAIL_FENCE]: "■ 왕초보 탈출 가이드\n1단계: 이 암호는 글자를 지그재그로 썼다가 가로로 모은 것입니다.\n2단계: 암호문이 'S E R P Y'라면, 앞의 절반과 뒤의 절반을 지그재그로 합쳐봅니다.\n3단계: 1번 글자 - 4번 글자 - 2번 글자 - 5번 글자... 순으로 읽어보세요.",
    [CipherType.VIGENERE]: "■ 왕초보 탈출 가이드\n1단계: 가장 어려운 암호입니다! 반복되는 비밀 단어(키)가 존재합니다.\n2단계: 키가 'DOG'라면 첫 글자는 D(+3), 둘째는 O(+14), 셋째는 G(+6)만큼 밀립니다.\n3단계: 넷째 글자는 다시 D(+3)로 돌아갑니다. 단어의 리듬을 찾아보세요."
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
