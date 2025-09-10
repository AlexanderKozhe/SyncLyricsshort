
// /api/gemini.ts - Используем Vercel Edge Config и NextResponse
import { get } from '@vercel/edge-config';
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge', // Обязательно для работы с Edge Config
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: `Method ${req.method} Not Allowed` }, {
      status: 405,
      headers: { 'Allow': 'POST' },
    });
  }

  try {
    // 1. Получаем ключ из Vercel Edge Config
    const apiKey = await get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error("FATAL: Не удалось получить GEMINI_API_KEY из Vercel Edge Config.");
      return NextResponse.json({ error: 'Ошибка конфигурации сервера: API-ключ не найден.' }, {
        status: 500,
      });
    }

    // 2. Получаем prompt из тела запроса
    const { prompt: userText } = await req.json();
    if (!userText) {
      return NextResponse.json({ error: '"prompt" является обязательным полем.' }, {
        status: 400,
      });
    }

    // 3. Создаем строгий промпт для Gemini
    const systemPrompt = `Ты — редактор текстов песен. Исправь орфографию и грамматику в тексте ниже.
СТРОГИЕ ПРАВИЛА:
1. Количество строк в ответе должно ТОЧНО совпадать с количеством строк в исходном тексте.
2. НЕ добавляй и НЕ удаляй строки.
3. НЕ добавляй знаки препинания (точки, запятые) в конце строк, если их там не было.
4. НЕ добавляй пустые строки в начале или в конце ответа.
5. Верни ТОЛЬКО исправленный текст без каких-либо объяснений.

Текст для исправления:
---
${userText}
---`;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

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
    if (!geminiResponse.ok || !responseData.candidates) {
      console.error("Ошибка от Gemini API:", responseData.error);
      return NextResponse.json({ 
        error: "Ошибка при обращении к сервису ИИ.",
        details: responseData.error?.message || "Причина не указана."
      }, {
        status: geminiResponse.status || 500,
      });
    }

    // 6. Извлекаем и ОБРАБАТЫВАЕМ успешный ответ
    let text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
        return NextResponse.json({ error: 'Не удалось извлечь текст из ответа ИИ.' }, {
            status: 500,
        });
    }
    
    // Дополнительная защита: обрезаем лишние пробелы и переносы по краям
    text = text.trim();

    return NextResponse.json({ text });

  } catch (error) {
    // 7. Общий обработчик ошибок
    console.error('Критическая ошибка в Edge Function:', error);
    const details = (error instanceof Error) ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Произошла внутренняя ошибка сервера.',
      details: details
    }, {
        status: 500,
    });
  }
}
