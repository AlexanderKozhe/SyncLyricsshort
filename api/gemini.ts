
// /api/gemini.ts
// Этот код будет выполняться на сервере Vercel, а не в браузере.

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Импортируем официальный SDK от Google
import { GoogleGenerativeAI } from '@google/generative-ai';

// Безопасно получаем API ключ из переменных окружения Vercel.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Переменная окружения GEMINI_API_KEY не установлена");
}

const genAI = new GoogleGenerativeAI(apiKey);

// ИСПРАВЛЕНО: Используем современную и быструю модель
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"});

// Основная функция-обработчик
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Принимаем только POST запросы
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Получаем `prompt` из тела запроса, который прислал фронтенд
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Отправляем запрос в Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Отправляем успешный ответ обратно на фронтенд
    return res.status(200).json({ text });

  } catch (error: any) {
    // Улучшаем логирование ошибок
    console.error('Ошибка при вызове Gemini API:', error);
    
    // Возвращаем более детальную информацию об ошибке, если она доступна
    const errorMessage = error.message || 'Internal Server Error';
    const errorStatus = error.status || 500;
    
    return res.status(errorStatus).json({ 
      error: 'Ошибка на стороне сервера при вызове Gemini API',
      details: errorMessage
    });
  }
}
