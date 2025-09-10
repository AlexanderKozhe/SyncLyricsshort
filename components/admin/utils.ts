
// Единый парсер LRC, который обрабатывает пустые строки
export const parseLrcText = (lrc: string): { time: number; text: string }[] => {
    const lines = lrc.split(/\r?\n/);
    const result: { time: number; text: string }[] = [];
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const match = trimmedLine.match(regex);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const centiseconds = parseInt(match[3], 10);
            const text = match[4].trim();
            const totalSeconds = minutes * 60 + seconds + centiseconds / (match[3].length === 2 ? 100 : 1000);
            
            result.push({ time: parseFloat(totalSeconds.toFixed(3)), text });
        }
    }
    return result;
};
