import * as admin from 'firebase-admin';

// Читаем переменные напрямую из среды хостинга (Vercel, Netlify и т.д.)
// БЕЗ префикса VITE_, чтобы они НЕ попадали в клиентский код.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

// Проверяем, инициализировано ли уже приложение
if (!admin.apps.length) {
  // Проверяем, что все переменные на месте
  if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: serviceAccount.projectId,
          clientEmail: serviceAccount.clientEmail,
          // Важно: заменяем \n на реальные переносы строк
          privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
        }),
      });
      // Этот лог будет виден только на сервере (в логах Vercel), а не в браузере
      console.log("Firebase Admin SDK успешно инициализирован.");
    } catch (error) {
      console.error("Ошибка инициализации Firebase Admin SDK:", error);
    }
  } else {
    console.error("КРИТИЧЕСКАЯ ОШИБКА: Переменные окружения для Firebase Admin не найдены. Убедитесь, что они установлены в настройках вашего хостинга (Vercel и т.д.) и вы перезапустили развертывание.");
  }
}

export default admin;
