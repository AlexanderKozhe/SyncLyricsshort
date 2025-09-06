import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { get } from '@vercel/edge-config';

// Используем top-level await для асинхронного получения ключей из Edge Config
const projectId = await get('FIREBASE_PROJECT_ID');
const clientEmail = await get('FIREBASE_CLIENT_EMAIL');
const privateKey = await get('FIREBASE_PRIVATE_KEY');

// Проверяем, что все переменные на месте
if (!projectId || !clientEmail || !privateKey) {
  // Эта ошибка теперь будет видна в логах, если ключи не найдены в Edge Config
  console.error("КРИТИЧЕСКАЯ ОШИБКА: Один или несколько ключей Firebase не найдены в Vercel Edge Config.");
} else {
  // Проверяем, инициализировано ли уже приложение
  if (!getApps().length) {
    try {
      initializeApp({
        credential: cert({
          projectId: projectId as string,
          clientEmail: clientEmail as string,
          // В Edge Config приватный ключ должен быть одной строкой с \n
          // но firebase-admin sdk сам заменит \n на переносы строк
          privateKey: privateKey as string,
        }),
      });
      console.log("Firebase Admin SDK успешно инициализирован из Edge Config.");
    } catch (error) {
      console.error("Ошибка инициализации Firebase Admin SDK:", error);
    }
  }
}

// Экспортируем функции, которые нам понадобятся в других файлах
export const auth = getAuth();
export const firestore = getFirestore();
