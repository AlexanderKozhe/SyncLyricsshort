import { get } from '@vercel/edge-config';
import type { NextApiRequest, NextApiResponse } from 'next';

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
    return text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
}

// Helper function to convert TTML time (HH:MM:SS.mmm) to LRC time ([mm:ss.xx])
function formatTtmlTimeToLrc(time: string): string {
  const timeRegex = /(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
  const match = time.match(timeRegex);
  if (!match) return '[00:00.00]';

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const milliseconds = parseInt(match[4], 10);

  const totalMinutes = hours * 60 + minutes;
  const centiseconds = Math.floor(milliseconds / 10);

  const paddedMinutes = String(totalMinutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  const paddedCentiseconds = String(centiseconds).padStart(2, '0');

  return `[${paddedMinutes}:${paddedSeconds}.${paddedCentiseconds}]`;
}

// Main converter function from TTML to LRC and TXT
function convertTtml(ttml: string): { lrc: string; txt: string } {
  const lines: { time: string; text: string }[] = [];
  const lyricLineRegex = /<p begin="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;

  while ((match = lyricLineRegex.exec(ttml)) !== null) {
    const time = match[1];
    const rawText = match[2];

    // Handle <br> tags for multiline lyrics within one timestamp
    const textWithNewlines = rawText.replace(/<br\s*\/?>/gi, '\n');
    // Strip all remaining HTML tags and decode entities
    const cleanText = decodeHtmlEntities(textWithNewlines.replace(/<[^>]+>/g, '').trim());
    
    lines.push({ time, text: cleanText });
  }

  // Fallback if no timed lines were found (e.g., plain text lyrics)
  if (lines.length === 0) {
    const plainText = decodeHtmlEntities(
        ttml
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\n\s*\n/g, '\n')
            .trim()
    );
    return { lrc: '', txt: plainText };
  }

  // For LRC, join multiline text with spaces as the standard is one line per timestamp.
  const lrcLines = lines.map(line => {
    const lrcText = line.text.replace(/\n/g, ' ');
    return `${formatTtmlTimeToLrc(line.time)}${lrcText}`;
  });

  // For TXT, preserve the newlines.
  const txtLines = lines.map(line => line.text);

  return {
    lrc: lrcLines.join('\n'),
    txt: txtLines.join('\n'),
  };
}

const appleMusicUrlRegex = /music\.apple\.com\/([a-z]{2})\/(song|album)\/[^/]+\/(\d+)/;

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
  const [, country, , songId] = match; // a song or an album

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

    const { lrc, txt } = convertTtml(ttml);
    const formattedTtml = ttml.replace(/>/g, '>\n');

    return res.status(200).json({ ttml: formattedTtml, lrc, txt });

  } catch (error) {
    console.error('Внутренняя ошибка сервера:', error);
    return res.status(500).json({ error: 'Произошла внутренняя ошибка сервера.' });
  }
}
