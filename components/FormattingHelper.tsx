import React, { useMemo, useState } from 'react';
import { SyncedLine, AnalysisIssue, IssueType } from '../types';
import { analyzeText } from '../services/analysis';
import CloseIcon from './icons/CloseIcon';
import WandIcon from './icons/WandIcon';

interface FormattingHelperProps {
  lines: SyncedLine[];
  onClose: () => void;
  onGoToIssue: (lineIndex: number) => void;
  onFixIssue: (lineId: string, issueType: IssueType) => void;
  onFixAll: (issueType: IssueType) => void;
  onTextChange: (newText: string) => void;
}

const analysisSections: { key: IssueType, title: string, description: string }[] = [
    { key: 'startEmpty', title: 'Пустая строка в начале', description: 'Первая строка не должна быть пустой.' },
    { key: 'endEmpty', title: 'Пустая строка в конце', description: 'Последняя строка не должна быть пустой.' },
    { key: 'emptyLines', title: 'Лишние пустые строки', description: 'Более одной пустой строки подряд.' },
    { key: 'trim', title: 'Пробелы по краям', description: 'Лишние пробелы в начале/конце строк.' },
    { key: 'doubleSpaces', title: 'Двойные пробелы', description: 'Несколько пробелов подряд внутри строки.' },
    { key: 'capitalization', title: 'Заглавные буквы', description: 'Строка должна начинаться с заглавной.' },
    { key: 'punctuation', title: 'Пунктуация в конце', description: 'Лишние точки, запятые и др.' },
    { key: 'tags', title: 'Спец. символы', description: 'Найдены символы типа *, +, / и др.' },
    { key: 'symbols', title: 'Нестандартные символы', description: 'Неправильные кавычки, тире и т.д.' },
];

const AnalysisSection: React.FC<{
    title: string;
    description: string;
    issues: AnalysisIssue[];
    issueType: IssueType;
    onGoToIssue: (lineIndex: number) => void;
    onFixIssue: (lineId: string, issueType: IssueType) => void;
    onFixAll: (issueType: IssueType) => void;
}> = ({ title, description, issues, issueType, onGoToIssue, onFixIssue, onFixAll }) => {
    if (issues.length === 0) {
        return null;
    }

    const structuralIssues: IssueType[] = ['emptyLines', 'startEmpty', 'endEmpty'];

    return (
        <div className="bg-slate-800/50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h4 className="font-bold text-base text-sky-400">{title} <span className="text-sm text-slate-300">({issues.length})</span></h4>
                    <p className="text-xs text-slate-400">{description}</p>
                </div>
                <button
                    onClick={() => onFixAll(issueType)}
                    className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-1 px-2 rounded-md"
                >
                    <WandIcon /> Все
                </button>
            </div>
            <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {issues.map(issue => (
                    <li key={issue.lineId + issue.type} className="text-xs bg-slate-900/50 p-2 rounded-md flex justify-between items-center gap-2">
                        <span
                            className="font-mono truncate cursor-pointer hover:text-sky-300 flex-grow"
                            title={issue.text}
                            onClick={() => onGoToIssue(issue.lineIndex)}
                        >
                          {issue.text || 'Пустая строка'}
                        </span>
                        {!structuralIssues.includes(issueType) && (
                             <button
                                onClick={() => onFixIssue(issue.lineId, issue.type)}
                                className="text-xs text-green-400 hover:text-white shrink-0"
                            >
                                Исправить
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const FormattingHelper: React.FC<FormattingHelperProps> = ({ lines, onClose, onGoToIssue, onFixIssue, onFixAll, onTextChange }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const analysisResults = useMemo(() => analyzeText(lines), [lines]);
  const totalIssues = useMemo(() => Object.values(analysisResults).reduce((acc, issues) => acc + issues.length, 0), [analysisResults]);
  const isTextEmpty = useMemo(() => lines.length === 0 || lines.every(line => line.text.trim() === ''), [lines]);

  const handleAiFix = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
        const fullText = lines.map(line => line.text).join('\n');

        // Отправляем запрос на нашу серверную функцию, которая теперь содержит всю логику
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Просто отправляем "сырой" текст. Сервер сам сформирует нужный промпт.
            body: JSON.stringify({ prompt: fullText }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const newText = data.text;

        if (!newText) {
            throw new Error("AI did not return any text.");
        }
        
        const originalLineCount = lines.length;
        // Убрал (newText || '') - проверка на newText есть выше
        const newLineCount = newText.split('\n').length;

        // Эта проверка очень важна, чтобы не рассинхронизировать субтитры
        if (originalLineCount !== newLineCount) {
             throw new Error(`AI вернул ${newLineCount} строк вместо ${originalLineCount}. Попробуйте снова.`);
        }
        
        onTextChange(newText);

    } catch (error) {
        console.error("AI fix failed:", error);
        setAiError(error instanceof Error ? error.message : "Произошла неизвестная ошибка.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const renderBody = () => {
    if (isTextEmpty) {
        return (
            <div className="text-center p-8 text-slate-400">
                <p className="text-sm">Введите текст в редакторе, чтобы начать анализ и исправление ошибок.</p>
            </div>
        );
    }
    if (totalIssues > 0) {
        return analysisSections.map(section => (
            <AnalysisSection
                key={section.key}
                title={section.title}
                description={section.description}
                issues={analysisResults[section.key]}
                issueType={section.key}
                onGoToIssue={onGoToIssue}
                onFixIssue={onFixIssue}
                onFixAll={onFixAll}
            />
        ));
    }
    return (
        <div className="text-center p-8 text-slate-400">
            <h4 className="font-semibold text-lg text-green-400 mb-2">Все отлично!</h4>
            <p className="text-sm">Проблем с форматированием не найдено.</p>
        </div>
    );
  }

  return (
    <aside className="w-full max-w-sm flex-shrink-0 bg-slate-800 rounded-lg p-1 flex flex-col gap-4 h-full">
      <header className="flex items-center justify-between p-3 border-b border-slate-700/50 flex-shrink-0">
        <h3 className="text-lg font-semibold text-slate-200">Помощник</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <CloseIcon />
        </button>
      </header>
      <div className="flex-grow overflow-y-auto space-y-4 px-3 pb-3 custom-scrollbar">
        <div className="bg-slate-900/50 p-4 rounded-lg">
            <h4 className="font-bold text-base text-teal-400 mb-2">AI Помощник</h4>
            <p className="text-xs text-slate-400 mb-3">Автоматическое исправление грамматики, пунктуации и заглавных букв во всём тексте.</p>
             <button
                onClick={handleAiFix}
                disabled={isAiLoading || isTextEmpty}
                className="w-full flex items-center justify-center gap-2 bg-teal-600/80 hover:bg-teal-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
                <WandIcon />
                <span>{isAiLoading ? 'Обработка...' : 'Улучшить весь текст'}</span>
            </button>
            {aiError && <p className="text-xs text-red-400 mt-2 text-center">{aiError}</p>}
        </div>
        {renderBody()}
      </div>
    </aside>
  );
};

export default FormattingHelper;
