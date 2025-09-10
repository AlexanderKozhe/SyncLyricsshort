import { get } from '@vercel/edge-config';
import { NextRequest, NextResponse } from 'next/server';

const appleMusicUrlRegex = /music\.apple\.com\/([a-z]{2})\/album\/[^/]+\/(\d+)/;

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(`Method ${req.method} Not Allowed`, { status: 405, headers: { Allow: 'POST' } });
  }

  const { url } = await req.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: '\"url\" является обязательным полем.' }, { status: 400 });
  }

  const match = url.match(appleMusicUrlRegex);
  if (!match) {
    return NextResponse.json({ error: 'Неверный формат URL Apple Music.' }, { status: 400 });
  }
  const [, country, songId] = match;

  try {
    const devToken = await get('APPLE_DEV_TOKEN');
    const mediaUserToken = await get('APPLE_MEDIA_USER_TOKEN');

    if (!devToken || !mediaUserToken) {
      console.error('Переменные окружения APPLE_DEV_TOKEN или APPLE_MEDIA_USER_TOKEN не установлены.');
      return NextResponse.json({ error: 'Ошибка конфигурации сервера.' }, { status: 500 });
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
      return NextResponse.json({ error: `Ошибка при запросе к Apple Music: ${response.statusText}` }, { status: response.status });
    }

    const appleData = await response.json();

    const ttml = appleData?.data?.[0]?.attributes?.ttml;
    if (!ttml) {
      return NextResponse.json({ error: 'Текст песни не найден для этого трека.' }, { status: 404 });
    }

    const formattedTtml = ttml.replace(/>/g, '>\n');

    return NextResponse.json({ lyrics: formattedTtml }, { status: 200 });

  } catch (error) {
    console.error('Внутренняя ошибка сервера:', error);
    return NextResponse.json({ error: 'Произошла внутренняя ошибка сервера.' }, { status: 500 });
  }
}
