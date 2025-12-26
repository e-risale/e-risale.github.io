import React from 'react';
import { library } from '../../data/library';

const ReaderSidebar = ({
    isOpen,
    activeBookId,
    activeChapterIndex,
    onSwitchMode,
    onSecretAdminClick,
    onNavigate,
    onChapterChange,
    darkMode,
    publishedChapters = {} // Add default value
}) => {
    return (
        <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-72 transition-transform duration-300 ease-in-out z-40 shadow-2xl border-r pt-20 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-[#f5f0e6] border-[#e6e0d2]'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-500/10">
                    <h2
                        className={`text-xl font-bold font-serif text-center cursor-pointer select-none tracking-tight transition-transform active:scale-95 ${darkMode ? 'text-gray-200 hover:text-white' : 'text-[#5c4033] hover:text-black'}`}
                        onClick={() => { if (onSwitchMode) onSwitchMode('library'); }}
                        title="Kütüphaneye Dön"
                    >
                        Risale-i Nur
                    </h2>
                    <div
                        className="text-center text-[10px] uppercase tracking-[0.2em] opacity-50 mt-1 cursor-default hover:opacity-100 transition-opacity"
                        onClick={onSecretAdminClick}
                    >
                        Külliyatı
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {library.filter(book => book.id === activeBookId).map(book => (
                        <div key={book.id} className="mb-8">
                            <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 pl-3 border-l-2 ${darkMode ? 'text-gray-400 border-gray-600' : 'text-[#8c7b70] border-[#d6cec5]'}`}>{book.title}</h3>
                            <ul className="space-y-1.5">
                                {book.chapters.map((chapter, idx) => {
                                    const isPublished = !!publishedChapters[chapter.id];
                                    return (
                                        <React.Fragment key={chapter.id}>
                                            <li>
                                                <button
                                                    onClick={() => {
                                                        if (isPublished) onChapterChange(book.id, idx);
                                                    }}
                                                    disabled={!isPublished}
                                                    className={`w-full text-left px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium relative overflow-hidden group flex justify-between items-center
                                                    ${activeBookId === book.id && activeChapterIndex === idx
                                                            ? (darkMode ? 'bg-rose-900/30 text-rose-200 shadow-inner' : 'bg-white text-[#8c4f4f] shadow-sm border border-[#e6e0d2]')
                                                            : (darkMode ? 'text-gray-400' : 'text-gray-600')
                                                        }
                                                    ${!isPublished
                                                            ? 'opacity-50 grayscale cursor-not-allowed hover:bg-transparent'
                                                            : (darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-white/60 hover:text-[#5c4033]')
                                                        }
                                                `}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {activeBookId === book.id && activeChapterIndex === idx && <div className={`w-1 h-3 rounded-full ${darkMode ? 'bg-rose-500' : 'bg-[#c28686]'}`}></div>}
                                                        <span>{chapter.title}</span>
                                                    </div>
                                                    {!isPublished && <span className="text-[9px] uppercase font-bold text-amber-500 ml-2">Yapımda</span>}
                                                </button>
                                            </li>

                                            {isPublished && chapter.subsections && chapter.subsections.map((sub, sIdx) => (
                                                <li key={`${chapter.id}-sub-${sIdx}`}>
                                                    <button
                                                        onClick={() => onNavigate(book.id, idx, sub.chunkIndex, "", sub.anchorText)}
                                                        className={`w-full text-left pl-9 pr-3 py-1.5 rounded transition-all duration-200 text-xs font-medium flex items-center gap-2 
                                                            ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/30' : 'text-[#9e9185] hover:text-[#5c4033] hover:bg-black/5'}
                                                        `}
                                                    >
                                                        <span className="opacity-40 text-[10px]">↳</span> {sub.title}
                                                    </button>
                                                </li>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReaderSidebar;
