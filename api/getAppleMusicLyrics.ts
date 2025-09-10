import { get } from '@vercel/edge-config';
import type { NextApiRequest, NextApiResponse } from 'next';

const appleMusicUrlRegex = /music\.apple\.com\/([a-z]{2})\/album\/[^/]+\/(\d+)/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '\"url\" является обязательным полем.' });
  }

  const match = url.match(appleMusicUrlRegex);
  if (!match) {
    return res.status(400).json({ error: 'Неверный формат URL Apple Music.' });
  }
  const [, country, songId] = match;

  try {
    const devToken = await get('APPLE_DEV_TOKEN');
    const mediaUserToken = await get('APPLE_MEDIA_USER_TOKEN');

    if (!devToken || !mediaUserToken) {
      console.error('Переменные окружения APPLE_DEV_TOKEN или APPLE_MEDIA_USER_TOKEN не установлены.');
      return res.status(500).json({ error: 'Ошибка конфигурации сервера.' });
    }

    const appleApiUrl = `https://amp-api.music.apple.com/v1/catalog/${country}/songs/${songId}/lyrics`;

    const response = await fetch(appleApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${devToken}`,
        'media-user-token': mediaUserToken as string,
        'Origin': 'https://music.apple.com',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Ошибка от API Apple: ${response.status}`, errorBody);
      return res.status(response.status).json({ error: `Ошибка при запросе к Apple Music: ${response.statusText}` });
    }

    const appleData = await response.json();

    const ttml = appleData?.data?.[0]?.attributes?.ttml;
    if (!ttml) {
      return res.status(404).json({ error: 'Текст песни не найден для этого трека.' });
    }

    const formattedTtml = ttml.replace(/>/g, '>\n');

    return res.status(200).json({ lyrics: formattedTtml });

  } catch (error) {
    console.error('Внутренняя ошибка сервера:', error);
    return res.status(500).json({ error: 'Произошла внутренняя ошибка сервера.' });
  }
}
