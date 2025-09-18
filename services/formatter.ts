import { SyncedLine } from '../types';

const formatTTMLTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "00:00:00.00";
  
  const totalCentiseconds = Math.round(seconds * 100);
  const centiseconds = totalCentiseconds % 100;
  
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const s = totalSeconds % 60;
  
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  
  const h = Math.floor(totalMinutes / 60);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
};

export const formatLRCTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "00:00.00";

  const totalCentiseconds = Math.round(seconds * 100);
  const centiseconds = totalCentiseconds % 100;

  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const s = totalSeconds % 60;
  
  const m = Math.floor(totalSeconds / 60);

  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
};

// XML-экранирование для TTML
export const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            default: return c;
        }
    });
};


export const toTTML = (lines: SyncedLine[], duration: number): string => {
  const bodyContent = lines
    .filter(line => line.begin !== null && line.end !== null)
    .map(line => 
      `    <p begin="${formatTTMLTime(line.begin!)}" end="${formatTTMLTime(line.end!)}">${escapeXml(line.text)}</p>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<tt xmlns="http://www.w3.org/ns/ttml">
  <body>
    <div>
${bodyContent}
    </div>
  </body>
</tt>`;
};

export const toLRC = (lines: SyncedLine[]): string => {
  const lrcLines: string[] = [];
  const sortedLines = [...lines]
    .filter(line => line.begin !== null && line.end !== null)
    .sort((a, b) => a.begin! - b.begin!);
    
  if (sortedLines.length === 0) return "";

  for (let i = 0; i < sortedLines.length; i++) {
    const currentLine = sortedLines[i];
    const prevLine = sortedLines[i - 1];

    if (prevLine && prevLine.end !== null && currentLine.begin !== null) {
      const gap = currentLine.begin - prevLine.end;
      if (gap > 13) {
        lrcLines.push(`[${formatLRCTime(prevLine.end)}]`);
      }
    }
    
    if (currentLine.begin !== null) {
      lrcLines.push(`[${formatLRCTime(currentLine.begin)}]${currentLine.text}`);
    }
  }

  const lastLine = sortedLines[sortedLines.length - 1];
  if (lastLine && lastLine.end !== null) {
    lrcLines.push(`[${formatLRCTime(lastLine.end)}]`);
  }

  return lrcLines.join('\n');
};


export const toTXT = (lines: SyncedLine[]): string => {
  return lines.map(line => line.text).join('\n');
};