import { todayKey } from '@shared/date/day.util';
import type { NewPomodoroTaskData } from './api-client';

// Peor caso realista de las tareas del pomodoro (003 T060, skill break-ui): una URL pegada como título (sin espacios
// donde partir), texto tailandés (no separa palabras con espacios), un título que empieza con emojis, vietnamita con
// diacríticos y la descripción más larga que acepta la API (1000 caracteres, 001 RF-05)
const PASTED_URL =
  'https://docs.google.com/document/d/1x9QmZr7KpLwT4vYbN2cHsJ8eUoF3gAiD6tRkVnM5qEz/edit?usp=sharing&ouid=104857392847561029384&rtpof=true&sd=true#heading=h.k3j9x2';
const THAI = 'ทบทวนบทที่สามของวิชาประวัติศาสตร์และสรุปประเด็นสำคัญทั้งหมดก่อนสอบปลายภาค';
const EMOJI_FIRST = '🍅🔥📚 Repasar el tema 3 antes del examen';
const VIETNAMESE = 'Ôn tập chương 3 – Lịch sử Việt Nam thời kỳ cận đại';
const LONGEST_DESCRIPTION = 'Leer los apuntes del capítulo y subrayar las ideas principales. '.repeat(16).slice(0, 1000);

export function worstCaseTasks(): NewPomodoroTaskData[] {
  const date = todayKey();
  return [
    { title: PASTED_URL, description: LONGEST_DESCRIPTION, date },
    { title: THAI, date },
    { title: EMOJI_FIRST, date },
    { title: VIETNAMESE, description: PASTED_URL, date },
  ];
}
