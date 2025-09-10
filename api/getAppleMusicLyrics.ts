
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

// Helper to convert various TTML time formats (e.g., H:M:S.ms, M:S.ms, S.ms) to total seconds
function ttmlTimeToSeconds(time: string): number {
    const timeParts = time.split(':');
    let totalSeconds = 0;
    
    // Handles formats like SS.mmm, MM:SS.mmm, and HH:MM:SS.mmm
    try {
        if (timeParts.length === 1) { // SS.mmm
            totalSeconds = parseFloat(timeParts[0]);
        } else if (timeParts.length === 2) { // MM:SS.mmm
            totalSeconds = (parseInt(timeParts[0], 10) * 60) + parseFloat(timeParts[1]);
        } else if (timeParts.length === 3) { // HH:MM:SS.mmm
            totalSeconds = (parseInt(timeParts[0], 10) * 3600) + (parseInt(timeParts[1], 10) * 60) + parseFloat(timeParts[2]);
        }
    } catch (error) {
        console.error(`Could not parse time: ${time}`, error);
        return 0;
    }

    return isNaN(totalSeconds) ? 0 : totalSeconds;
}


// Helper to convert total seconds to LRC time ([mm:ss.xx])
function secondsToLrcTime(timeInSeconds: number): string {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '[00:00.00]';

    const totalMilliseconds = Math.round(timeInSeconds * 1000);
    const totalCentiseconds = Math.floor(totalMilliseconds / 10);
    
    const minutes = Math.floor(totalCentiseconds / 6000);
    const remainingCentiseconds = totalCentiseconds % 6000;
    
    const seconds = Math.floor(remainingCentiseconds / 100);
    const centiseconds = remainingCentiseconds % 100;

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');
    const paddedCentiseconds = String(centiseconds).padStart(2, '0');

    return `[${paddedMinutes}:${paddedSeconds}.${paddedCentiseconds}]`;
}

// Main converter function from TTML to LRC and TXT
function convertTtml(ttml: string): { lrc: string; txt: string } {
    const timedLines: { begin: number; end: number; text: string }[] = [];
    const lyricLineRegex = /<p begin="([^"]+)" end="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g;
    let match;

    // First, remove the songwriters block entirely, regardless of sync
    const ttmlWithoutSongwriters = ttml.replace(/<songwriters>[\s\S]*?<\/songwriters>/gi, '');

    while ((match = lyricLineRegex.exec(ttmlWithoutSongwriters)) !== null) {
        const [, beginStr, endStr, rawText] = match;

        const textWithNewlines = rawText.replace(/<br\s*\/?>/gi, '\n');
        const cleanText = decodeHtmlEntities(textWithNewlines.replace(/<[^>]+>/g, '').trim());

        timedLines.push({
            begin: ttmlTimeToSeconds(beginStr),
            end: ttmlTimeToSeconds(endStr),
            text: cleanText,
        });
    }

    if (timedLines.length === 0) {
        // Fallback for non-synced lyrics
        const plainText = decodeHtmlEntities(
            ttmlWithoutSongwriters
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<p[^>]*>/gi, '')
                .replace(/<\/p>/gi, '\n')
                .replace(/<[^>]+>/g, '') // Clean up any remaining tags
                .replace(/\n\s*\n/g, '\n') // Collapse multiple newlines
                .trim()
        );
        return { lrc: '', txt: plainText };
    }
    
    timedLines.sort((a, b) => a.begin - b.begin);

    const lrcOutputLines: string[] = [];
    const txtLines: string[] = timedLines.map(line => line.text);

    for (let i = 0; i < timedLines.length; i++) {
        const currentLine = timedLines[i];

        let lrcText = currentLine.text.replace(/\n/g, ' ');
        const upperText = lrcText.trim().toUpperCase();
        if (upperText === '#INSTRUMENTAL' || upperText === 'END') {
            lrcText = '';
        }
        lrcOutputLines.push(`${secondsToLrcTime(currentLine.begin)}${lrcText}`);

        const nextLine = timedLines[i + 1];
        if (nextLine) {
            const pauseDuration = nextLine.begin - currentLine.end;
            if (pauseDuration >= 13) {
                lrcOutputLines.push(`${secondsToLrcTime(currentLine.end)}`);
            }
        }
    }

    const lastLine = timedLines[timedLines.length - 1];
    if (lastLine) {
        const lastTextUpper = lastLine.text.trim().toUpperCase();
        if (lastTextUpper !== 'END') {
             lrcOutputLines.push(`${secondsToLrcTime(lastLine.end)}`);
        }
    }

    return {
        lrc: lrcOutputLines.join('\n'),
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
    return res.status(400).json({ error: '"url" является обязательным полем.' });
  }

  const match = url.match(appleMusicUrlRegex);
  if (!match) {
    return res.status(400).json({ error: 'Неверный формат URL Apple Music.' });
  }
  const [, country, , songId] = match;

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
