
import React, { useMemo, useState } from 'react';
import { SyncedLine, AnalysisIssue, IssueType } from '../types';
import { analyzeText } from '../services/analysis';
import CloseIcon from './icons/CloseIcon';
import WandIcon from './icons/WandIcon';
import Modal from './Modal';

interface FormattingHelperProps {
  lines: SyncedLine[];
  onClose: () => void;
  onGoToIssue: (lineIndex: number) => void;
  onFixIssue: (lineId: string, issueType: IssueType) => void;
  onFixAll: (issueType: IssueType) => void;
}

const analysisSections: { key: IssueType, title: string, description: string }[] = [
    { key: 'startEmpty', title: 'Пустая строка в начале', description: 'Первая строка не должна быть пустой.' },
    { key: 'endEmpty', title: 'Пустая строка в конце', description: 'Последняя строка не должна быть пустой.' },
    { key: 'emptyLines', title: 'Лишние пустые строки', description: 'Более одной пустой строки подряд.' },
    { key: 'trim', title: 'Пробелы по краям', description: 'Лишние пробелы в начале/конце строк.' },
    { key: 'doubleSpaces', title: 'Двойные пробелы', description: 'Несколько пробелов подряд внутри строки.' },
    { key: 'capitalization', title: 'Заглавные буквы', description: 'Строка должна начинаться с заглавной.' },
    { key: 'punctuation', title: 'Пунктуация в конце', description: 'Лишние точки, запятые и др.' },
    { key: 'tags', title: 'Спец. символы', description: 'Найдены символы типа *, +, /, # и др.' },
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
    onShowTagsWarning: () => void;
}> = ({ title, description, issues, issueType, onGoToIssue, onFixIssue, onFixAll, onShowTagsWarning }) => {
    if (issues.length === 0) {
        return null;
    }

    const structuralIssues: IssueType[] = ['emptyLines', 'startEmpty', 'endEmpty'];

    return (
        <div className="bg-black/20 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h4 className="font-bold text-base text-[#FF553E]">{title} <span className="text-sm text-gray-200">({issues.length})</span></h4>
                    <p className="text-xs text-gray-300">{description}</p>
                </div>
                {issueType !== 'tags' && (
                    <button
                        onClick={() => onFixAll(issueType)}
                        className="flex items-center gap-1.5 bg-black/30 hover:bg-black/40 text-gray-200 text-xs font-bold py-1 px-2 rounded-md"
                    >
                        <WandIcon /> Все
                    </button>
                )}
            </div>
            <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {issues.map(issue => (
                    <li key={issue.lineId + issue.type} className="text-xs bg-black/40 p-2 rounded-md flex justify-between items-center gap-2">
                        <span
                            className="font-mono truncate cursor-pointer hover:text-[#ff7b6b] flex-grow"
                            title={issue.text}
                            onClick={() => onGoToIssue(issue.lineIndex)}
                        >
                          {issue.text || 'Пустая строка'}
                        </span>
                        {issueType === 'tags' ? (
                            <button
                                onClick={onShowTagsWarning}
                                className="text-xs text-amber-400 hover:text-amber-300 shrink-0"
                            >
                                Исправьте
                            </button>
                        ) : !structuralIssues.includes(issueType) && (
                             <button
                                onClick={() => onFixIssue(issue.lineId, issue.type)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0"
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

const FormattingHelper: React.FC<FormattingHelperProps> = ({ lines, onClose, onGoToIssue, onFixIssue, onFixAll }) => {
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

  const analysisResults = useMemo(() => analyzeText(lines), [lines]);
  const totalIssues = useMemo(() => Object.values(analysisResults).reduce((acc, issues) => acc + issues.length, 0), [analysisResults]);
  const isTextEmpty = useMemo(() => lines.length === 0 || lines.every(line => line.text.trim() === ''), [lines]);

  const renderBody = () => {
    if (isTextEmpty) {
        return (
            <div className="text-center p-8 text-gray-300">
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
                onShowTagsWarning={() => setIsTagsModalOpen(true)}
            />
        ));
    }
    return (
        <div className="text-center p-8 text-gray-300">
            <h4 className="font-semibold text-lg text-green-400 mb-2">Все отлично!</h4>
            <p className="text-sm">Проблем с форматированием не найдено.</p>
        </div>
    );
  }

  return (
    <>
      <aside className="w-full max-w-sm flex-shrink-0 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-1 flex flex-col gap-4 h-full">
        <header className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">Помощник</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-white">
            <CloseIcon />
          </button>
        </header>
        <div className="flex-grow overflow-y-auto space-y-4 px-3 pb-3 custom-scrollbar">
          {renderBody()}
        </div>
      </aside>
      <Modal
          isOpen={isTagsModalOpen}
          onClose={() => setIsTagsModalOpen(false)}
          title="Замена специальных символов"
          confirmText="Принято"
          onConfirm={() => setIsTagsModalOpen(false)}
          cancelText={null}
      >
          <div className="text-sm text-gray-300 space-y-2">
            <p>Пожалуйста, замените специальные символы вручную, следуя правилам:</p>
            <ul className="list-disc list-inside pl-2">
                <li>Вместо <strong>*</strong> напишите полное слово. Если слово зацензурено в аудио, используйте дефис <strong>-</strong>.</li>
                <li>Вместо <strong>+</strong> напишите "плюс".</li>
                <li>Избегайте использования <strong>/</strong>, <strong>%</strong>, <strong>&</strong>, <strong>№</strong>, <strong>@</strong>. Заменяйте их словами или перефразируйте предложение.</li>
                <li>Вместо <strong>#</strong> пишите конструкцией <strong>хештег — ""</strong>, если хештег не произносится — просто уберите его.</li>
            </ul>
          </div>
      </Modal>
    </>
  );
};

export default FormattingHelper;
