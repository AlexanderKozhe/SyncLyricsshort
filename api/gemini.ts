
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
    const { prompt } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: '"prompt" является обязательным полем.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    // 3. Отправляем запрос к Google Gemini
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const responseData = await geminiResponse.json();

    // 4. Обрабатываем ошибки от Gemini API
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

    // 5. Извлекаем и отправляем успешный ответ
    const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        return new Response(JSON.stringify({ error: 'Не удалось извлечь текст из ответа ИИ.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 6. Общий обработчик ошибок
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
