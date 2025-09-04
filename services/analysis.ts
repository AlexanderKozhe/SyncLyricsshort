import { SyncedLine, AnalysisResult, AnalysisIssue, IssueType } from "../types";

const replacements: { [key: string]: string } = {
    '[‘’′]': "'",
    '[“”„«»″]': '"',
    '…': '...'
};

const fixers: { [key in IssueType]: (text: string) => string } = {
    trim: (text) => text.trim(),
    punctuation: (text) => text.replace(/[.,;:]$/, ''),
    symbols: (text) => {
        let newText = text;
        for (const [pattern, replacement] of Object.entries(replacements)) {
            newText = newText.replace(new RegExp(pattern, 'g'), replacement);
        }
        return newText;
    },
    capitalization: (text) => {
        const firstCharIndex = text.search(/\S/);
        if (firstCharIndex !== -1) {
            return text.substring(0, firstCharIndex) +
                   text[firstCharIndex].toUpperCase() +
                   text.substring(firstCharIndex + 1);
        }
        return text;
    },
    doubleSpaces: (text) => text.replace(/\s{2,}/g, ' '),
    tags: (text) => text.replace(/[*+/%&№@–]/g, ''),
    emptyLines: (text) => text, // This is handled by removal, not transformation
    startEmpty: (text) => text, // Handled by removal
    endEmpty: (text) => text,   // Handled by removal
};


export const analyzeText = (lines: SyncedLine[]): AnalysisResult => {
    const results: AnalysisResult = {
        trim: [],
        punctuation: [],
        symbols: [],
        capitalization: [],
        doubleSpaces: [],
        emptyLines: [],
        startEmpty: [],
        endEmpty: [],
        tags: [],
    };
    
    if (lines.length > 0 && lines[0].text.trim() === '') {
        results.startEmpty.push({ type: 'startEmpty', lineIndex: 0, lineId: lines[0].id, text: 'Пустая строка', message: 'Первая строка не должна быть пустой' });
    }
    if (lines.length > 1 && lines[lines.length - 1].text.trim() === '') {
        const lastIndex = lines.length - 1;
        results.endEmpty.push({ type: 'endEmpty', lineIndex: lastIndex, lineId: lines[lastIndex].id, text: 'Пустая строка', message: 'Последняя строка не должна быть пустой' });
    }


    let consecutiveEmptyCount = 0;

    lines.forEach((line, index) => {
        const { id, text } = line;
        const trimmedText = text.trim();

        if (trimmedText !== text) {
            results.trim.push({ type: 'trim', lineIndex: index, lineId: id, text, message: 'Лишние пробелы в начале или конце' });
        }
        if (/[.,;:]$/.test(trimmedText) && !/['")!?]$/.test(trimmedText)) {
            results.punctuation.push({ type: 'punctuation', lineIndex: index, lineId: id, text, message: 'Лишняя пунктуация в конце строки' });
        }
         if (/[*+/%&№@–]/g.test(text)) {
            results.tags.push({ type: 'tags', lineIndex: index, lineId: id, text, message: 'Найдены спец. символы (*, +, /, –, и др.)' });
        }
        if (/[‘’′“”„«»…]/g.test(text)) {
            results.symbols.push({ type: 'symbols', lineIndex: index, lineId: id, text, message: 'Нестандартные кавычки или символы' });
        }
        if (/\s{2,}/.test(text)) {
            results.doubleSpaces.push({ type: 'doubleSpaces', lineIndex: index, lineId: id, text, message: 'Найдены двойные пробелы' });
        }
        if (trimmedText) {
            const firstCharIndex = text.search(/\S/);
            if (firstCharIndex !== -1 && /^[a-zA-Zа-яА-ЯёЁ]/.test(text[firstCharIndex]) && text[firstCharIndex] !== text[firstCharIndex].toUpperCase()) {
                results.capitalization.push({ type: 'capitalization', lineIndex: index, lineId: id, text, message: 'Строка должна начинаться с заглавной буквы' });
            }
        }
        
        // Empty lines logic
        if (trimmedText === '') {
            consecutiveEmptyCount++;
        } else {
            if (consecutiveEmptyCount > 1) {
                // We mark the beginning of the consecutive empty block
                const startOfEmptyBlockIndex = index - consecutiveEmptyCount;
                results.emptyLines.push({
                    type: 'emptyLines',
                    lineIndex: startOfEmptyBlockIndex,
                    lineId: lines[startOfEmptyBlockIndex].id,
                    text: `Лишние пустые строки (${consecutiveEmptyCount})`,
                    message: `Более одной пустой строки подряд`,
                });
            }
            consecutiveEmptyCount = 0;
        }
    });

    if (consecutiveEmptyCount > 1) {
        const startOfEmptyBlockIndex = lines.length - consecutiveEmptyCount;
        results.emptyLines.push({
            type: 'emptyLines',
            lineIndex: startOfEmptyBlockIndex,
            lineId: lines[startOfEmptyBlockIndex].id,
            text: `Лишние пустые строки (${consecutiveEmptyCount})`,
            message: `Более одной пустой строки подряд`,
        });
    }


    return results;
};

export const applyFix = (lines: SyncedLine[], lineId: string, issueType: IssueType): SyncedLine[] => {
    const fixer = fixers[issueType];
    if (!fixer) return lines;
    return lines.map(line => 
        line.id === lineId ? { ...line, text: fixer(line.text) } : line
    );
};

export const applyFixAll = (lines: SyncedLine[], issueType: IssueType): SyncedLine[] => {
    if (issueType === 'emptyLines') {
        const fixedLines: SyncedLine[] = [];
        let wasPreviousLineEmpty = false;
        for (const line of lines) {
            const isCurrentLineEmpty = line.text.trim() === '';
            if (isCurrentLineEmpty) {
                if (!wasPreviousLineEmpty) {
                    fixedLines.push(line);
                }
                wasPreviousLineEmpty = true;
            } else {
                fixedLines.push(line);
                wasPreviousLineEmpty = false;
            }
        }
        return fixedLines;
    }

    if (issueType === 'startEmpty') {
        if (lines.length > 0 && lines[0].text.trim() === '') {
            return lines.slice(1);
        }
        return [...lines];
    }
    
    if (issueType === 'endEmpty') {
        if (lines.length > 1 && lines[lines.length - 1].text.trim() === '') {
            return lines.slice(0, -1);
        }
        return [...lines];
    }
    
    const fixer = fixers[issueType];
    if (!fixer) return lines;
    return lines.map(line => ({ ...line, text: fixer(line.text) }));
};