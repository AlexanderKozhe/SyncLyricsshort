import { SyncedLine } from '../types';

const parseTTMLTime = (timeString: string | null): number | null => {
  if (!timeString) return null;
  
  // Handle format 00:00:00.00 (or 00:00:00,00)
  const timeParts = timeString.replace(',', '.').split(':');
  
  if (timeParts.length === 3) {
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = parseFloat(timeParts[2]);
    
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
      return hours * 3600 + minutes * 60 + seconds;
    }
  }
  
  return null;
};

export const parseTTML = (ttmlContent: string): SyncedLine[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(ttmlContent, "application/xml");
  
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
      console.error('Error parsing TTML:', parseError.textContent);
      throw new Error('Не удалось разобрать TTML файл. Проверьте его структуру.');
  }
  
  const pElements = Array.from(xmlDoc.getElementsByTagName("p"));
  
  const lines: SyncedLine[] = pElements.map((p, index) => {
    const begin = p.getAttribute("begin");
    const end = p.getAttribute("end");
    const text = p.textContent || "";
    
    return {
      id: `${Date.now()}-${index}`,
      text: text.trim(),
      begin: parseTTMLTime(begin),
      end: parseTTMLTime(end),
    };
  });

  return lines;
};
