import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

// Проверяем, что все переменные на месте
if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error("КРИТИЧЕСКАЯ ОШИБКА: Переменные окружения для Firebase Admin не найдены. Убедитесь, что они установлены в настройках Vercel и вы перезапустили развертывание.");
} else {
  // Проверяем, инициализировано ли уже приложение
  if (!getApps().length) {
    try {
      initializeApp({
        credential: cert({
          projectId: serviceAccount.projectId,
          clientEmail: serviceAccount.clientEmail,
          privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log("Firebase Admin SDK успешно инициализирован.");
    } catch (error) {
      console.error("Ошибка инициализации Firebase Admin SDK:", error);
    }
  }
}

// Экспортируем функции, которые нам понадобятся в других файлах
export const auth = getAuth();
export const firestore = getFirestore();
