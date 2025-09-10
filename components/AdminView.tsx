
import React, { useState } from 'react';
import AdminUsers from './AdminUsers';
import WandIcon from './icons/WandIcon';

// Импортируем наши новые, разделенные компоненты
import TextFromAMConverter from './admin/TextFromAMConverter';
import MusixmatchConverter from './admin/MusixmatchConverter';
import LrcToTtmlConverter from './admin/LrcToTtmlConverter';
import DraftToLrcConverter from './admin/DraftToLrcConverter';

// --- Main Admin View Component ---

type Tool = 'musixmatch' | 'lrc2ttml' | 'draft2lrc' | 'textfromam';

const AdminView: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool | null>(null);

    // Определения инструментов теперь просто данные
    const tools = [
        { 
          id: 'textfromam' as Tool,
          title: 'Get Text from Apple Music',
          description: 'Получает и конвертирует тексты из Apple Music в TTML, LRC и TXT.',
        },
        { 
          id: 'musixmatch' as Tool,
          title: 'Musixmatch (LRC → Draft JSON)',
          description: 'Объединяет таймкоды из LRC с JSON-черновиком Musixmatch.',
        },
        { 
          id: 'draft2lrc' as Tool,
          title: 'Musixmatch (Draft JSON → LRC)',
          description: 'Конвертирует JSON-черновик Musixmatch в стандартный LRC-файл.',
        },
        { 
          id: 'lrc2ttml' as Tool,
          title: 'LRC → TTML Конвертер',
          description: 'Конвертирует стандартный LRC-файл в формат TTML.',
        },
    ];

    const renderContent = () => {
        // Рендеринг нужного компонента в зависимости от выбора
        switch (activeTool) {
            case 'textfromam':
                return <TextFromAMConverter onBack={() => setActiveTool(null)} />;
            case 'musixmatch':
                return <MusixmatchConverter onBack={() => setActiveTool(null)} />;
            case 'lrc2ttml':
                return <LrcToTtmlConverter onBack={() => setActiveTool(null)} />;
            case 'draft2lrc':
                return <DraftToLrcConverter onBack={() => setActiveTool(null)} />;
            default:
                return (
                    // Главное меню и список пользователей
                    <>
                        <div className="mb-12">
                            <h3 className="text-xl font-semibold text-white mb-4">Инструменты</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tools.map((tool) => (
                                <div 
                                    key={tool.id} 
                                    onClick={() => setActiveTool(tool.id)}
                                    className="bg-black/20 rounded-lg shadow-lg p-6 flex flex-col hover:bg-black/30 transition-all duration-200 cursor-pointer border border-transparent hover:border-[#FF553E]"
                                >
                                    <div className="flex items-center mb-4">
                                        <div className="bg-orange-500/20 text-[#FF553E] p-3 rounded-lg mr-4">
                                            <WandIcon className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-lg font-bold text-white">{tool.title}</h4>
                                    </div>
                                    <p className="text-gray-300 text-sm flex-grow">{tool.description}</p>
                                </div>
                            ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">Управление пользователями</h3>
                            <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/20 shadow-lg">
                                <AdminUsers />
                            </div>
                        </div>
                    </>
                );
        }
    }
    
    return (
        <div className="h-full p-4 sm:p-6 lg:p-8">
            {activeTool === null && <h2 className="text-3xl font-bold text-white mb-8">Панель администратора</h2>}
            {renderContent()}
        </div>
    );
};

export default AdminView;
