
// /api/gemini.ts
// Этот код будет выполняться на сервере Vercel, а не в браузере.

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Импортируем официальный SDK от Google
// Возможно, его нужно будет добавить в зависимости: npm install @google/generative-ai
import { GoogleGenerativeAI } from '@google/generative-ai';

// Безопасно получаем API ключ из переменных окружения Vercel.
// Важно: эта переменная НЕ должна иметь префикс VITE_
const apiKey = process.env.GEMINI_API_KEY;

// Проверяем, что ключ вообще существует.
if (!apiKey) {
  // Эта ошибка будет видна только в логах сервера Vercel, не пользователю.
  throw new Error("Переменная окружения GEMINI_API_KEY не установлена");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro"});

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

    // Если фронтенд не прислал prompt, возвращаем ошибку
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Отправляем запрос в Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Отправляем успешный ответ обратно на фронтенд
    return res.status(200).json({ text });

  } catch (error) {
    // Если что-то пошло не так при обращении к Gemini
    console.error('Ошибка при вызове Gemini API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
