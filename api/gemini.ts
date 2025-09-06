
// /api/gemini.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Используем `export default` для совместимости с новой конфигурацией tsconfig.
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Устанавливаем заголовок, чтобы все ответы были в формате JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    // 1. Проверяем метод запроса
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // 2. Проверяем наличие API ключа
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Переменная окружения GEMINI_API_KEY не установлена");
      return res.status(500).json({ error: 'Ошибка конфигурации сервера: отсутствует API-ключ.' });
    }

    // 3. Проверяем наличие `prompt` в теле запроса
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Плохой запрос: "prompt" является обязательным в теле запроса.' });
    }

    // Инициализируем модель ИИ
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // 4. Вызываем Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Отправляем успешный ответ
    return res.status(200).json({ text });

  } catch (error: any) {
    // 6. Общий обработчик для всех остальных ошибок
    console.error('Ошибка в обработчике Gemini API:', error);
    
    return res.status(500).json({ 
      error: 'Произошла внутренняя ошибка сервера при обращении к сервису ИИ.',
      details: error.message || 'Дополнительные сведения отсутствуют.'
    });
  }
}
