import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from './firebaseAdmin'; // Импортируем наш настроенный admin

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Проверяем, что это POST-запрос
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешён' });
  }

  try {
    // 2. Проверяем токен авторизации администратора
    const { authorization } = req.headers;
    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Токен не предоставлен или имеет неверный формат.' });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 3. Проверяем, что у вызывающего есть роль 'admin'
    const callerDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    if (callerDoc.data()?.role !== 'admin') {
      return res.status(403).json({ message: 'У вас нет прав на это действие.' });
    }

    // 4. Создаём нового пользователя
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email обязателен' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
    });

    // 5. Создаём запись для пользователя в Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      role: 'user',
      isNewUser: true,
    });

    // 6. Отправляем временный пароль обратно на клиент
    res.status(200).json({ password: tempPassword });

  } catch (error: any) {
    console.error("Ошибка в /api/createUser:", error);
    res.status(500).json({ 
      message: 'Внутренняя ошибка сервера.', 
      error: error.message 
    });
  }
}
