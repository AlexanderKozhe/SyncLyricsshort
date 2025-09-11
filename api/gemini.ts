// /api/gemini.ts - Используем Vercel Edge Config
import { get } from '@vercel/edge-config';

export const config = {
  runtime: 'edge', // Обязательно для работы с Edge Config
};

export default async function handler(req) {
  // Используем `Request` объект вместо `VercelRequest` в edge-runtime
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: `Method ${req.method} Not Allowed` }), {
      status: 405,
      headers: { 'Allow': 'POST', 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Получаем ключ из Vercel Edge Config
    const apiKey = await get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error("FATAL: Не удалось получить GEMINI_API_KEY из Vercel Edge Config.");
      return new Response(JSON.stringify({ error: 'Ошибка конфигурации сервера: API-ключ не найден.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Получаем prompt из тела запроса
    const { prompt: userText } = await req.json();
    if (!userText) {
      return new Response(JSON.stringify({ error: '"prompt" является обязательным полем.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Создаем строгий промпт для Gemini
    const systemPrompt = `Ты — редактор текстов песен. Твоя задача — исправить орфографию, грамматику и расставить знаки препинания в тексте ниже.

КЛЮЧЕВЫЕ ТРЕБОВАНИЯ:
1. **Сохраняй структуру:** Количество строк в твоем ответе должно строго соответствовать количеству строк в исходном тексте. Не добавляй и не удаляй строки.
2. **Без лишнего:** Не добавляй пустые строки в начале или в конце ответа.
3. **Только текст:** Верни исключительно исправленный текст, без каких-либо комментариев или объяснений.
4. **Пунктуация:** Расставь запятые, тире и другие знаки препинания там, где это необходимо по правилам русского языка, но не добавляй точки в конце строк, если их там не было.

Текст для обработки:
---
${userText}
---`;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // 4. Отправляем запрос к Google Gemini
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
      }),
    });

    const responseData = await geminiResponse.json();

    // 5. Обрабатываем ошибки от Gemini API
    if (!geminiResponse.ok || responseData.error) {
      console.error("Ошибка от Gemini API:", responseData.error);
      return new Response(JSON.stringify({ 
        error: "Ошибка при обращении к сервису ИИ.",
        details: responseData.error?.message || "Причина не указана."
      }), {
        status: geminiResponse.status || 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. Извлекаем и ОБРАБАТЫВАЕМ успешный ответ
    let text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        return new Response(JSON.stringify({ error: 'Не удалось извлечь текст из ответа ИИ.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    
    // Дополнительная защита: обрезаем лишние пробелы и переносы по краям
    text = text.trim();

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 7. Общий обработчик ошибок
    console.error('Критическая ошибка в Edge Function:', error);
    const details = (error instanceof Error) ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: 'Произошла внутренняя ошибка сервера.',
      details: details
    }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}
