
// /api/gemini.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Определяем интерфейс для тела запроса
interface GeminiRequestBody {
  prompt: string;
}

// Определяем интерфейс для ответа от Google Gemini API
interface GeminiApiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: {
    message: string;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Всегда возвращаем JSON
  res.setHeader('Content-Type', 'application/json');

  // 1. Проверяем метод запроса
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 2. Проверяем наличие и валидность API ключа
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("FATAL: Переменная окружения GEMINI_API_KEY не найдена на сервере.");
      return res.status(500).json({ error: 'Ошибка конфигурации сервера: API-ключ не предоставлен.' });
    }

    // 3. Проверяем тело запроса
    const { prompt } = req.body as GeminiRequestBody;
    if (!prompt) {
      return res.status(400).json({ error: '"prompt" является обязательным полем в теле запроса.' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    // 4. Отправляем запрос к Google Gemini REST API
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type', 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const responseData: GeminiApiResponse = await geminiResponse.json();

    // 5. Обрабатываем ошибку от самого Gemini API (например, невалидный ключ)
    if (!geminiResponse.ok || responseData.error) {
      console.error("Ошибка от Gemini API:", responseData.error);
      return res.status(geminiResponse.status || 500).json({ 
        error: "Ошибка при обращении к сервису ИИ.",
        details: responseData.error?.message || "Причина не указана."
      });
    }

    // 6. Извлекаем и отправляем успешный ответ
    const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        return res.status(500).json({ error: 'Не удалось извлечь текст из ответа ИИ.' });
    }

    return res.status(200).json({ text });

  } catch (error: any) {
    // 7. Общий обработчик для непредвиденных ошибок (например, проблем с сетью)
    console.error('Критическая ошибка в обработчике API:', error);
    return res.status(500).json({ 
      error: 'Произошла внутренняя ошибка сервера.',
      details: error.message || 'Дополнительные сведения отсутствуют.'
    });
  }
}
