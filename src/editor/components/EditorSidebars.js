import React, { useState } from 'react';
import { AnalysisPanel } from './AnalysisPanel';

export const UnifiedSidebar = ({
    isOpen, width, darkMode,
    // File Browser Props
    library, activeChapterId, modifiedChapters, onLoadChapter, onDownloadAll,
    // Dictionary & Analysis Props
    dictionary, onDownloadChapter, onDownloadDictionary, searchTerm, setSearchTerm, filterLen, setFilterLen, onSelectWord,
    pages, activeBookId, onFixAll, onNavigate,
    activeTab, setActiveTab // Hoisted State
}) => {
    const [expandedBooks, setExpandedBooks] = useState({});

    if (!isOpen) return null;

    return (
        <div className={`flex flex-col h-full overflow-hidden border-r shadow-xl z-20 shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} style={{ width: `${width}%` }}>
            {/* TABS */}
            <div className={`flex text-xs font-bold border-b shrink-0 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
                <button
                    onClick={() => setActiveTab('files')}
                    className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'files' ? 'border-blue-500 text-blue-600 bg-white dark:bg-gray-800' : 'border-transparent opacity-60 hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                    📂 Dosya
                </button>
                <button
                    onClick={() => setActiveTab('dictionary')}
                    className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'dictionary' ? 'border-green-500 text-green-600 bg-white dark:bg-gray-800' : 'border-transparent opacity-60 hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700'}`}

                >
                    📖 Sözlük
                </button>
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'analysis' ? 'border-purple-500 text-purple-600 bg-white dark:bg-gray-800' : 'border-transparent opacity-60 hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                    📊 Analiz
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative flex flex-col">

                {/* 1. FILE BROWSER TAB */}
                {activeTab === 'files' && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {library.map(book => {
                                const isExpanded = expandedBooks[book.id];
                                return (
                                    <div key={book.id} className="mb-2">
                                        <div
                                            onClick={() => setExpandedBooks(prev => ({ ...prev, [book.id]: !prev[book.id] }))}
                                            className={`flex items-center gap-2 px-2 py-1 mb-1 cursor-pointer select-none rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}
                                        >
                                            <span className={`text-[10px] transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                                            <h3 className="text-[10px] font-bold uppercase opacity-80">{book.title}</h3>
                                        </div>
                                        {isExpanded && (
                                            <ul className="space-y-0.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-1 animation-expand">
                                                {book.chapters.map(chap => (
                                                    <li key={chap.id}>
                                                        <button onClick={() => onLoadChapter(book.id, chap.id)} className={`w-full text-left px-3 py-1.5 rounded text-xs truncate flex justify-between items-center transition-colors ${activeChapterId === chap.id ? (darkMode ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-900 font-bold') : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700')}`}>
                                                            <span className="truncate">{chap.title}</span>
                                                            {modifiedChapters.includes(chap.id) && <span className="ml-2 text-[8px] text-orange-500 animate-pulse">●</span>}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className={`p-2 border-t flex flex-col gap-2 shrink-0 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
                            {modifiedChapters.length > 0 && (
                                <button onClick={onDownloadAll} className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 rounded shadow flex items-center justify-center gap-2">
                                    <span>📥</span> Değişenleri İndir ({modifiedChapters.length})
                                </button>
                            )}
                            <button onClick={onDownloadChapter} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded shadow flex items-center justify-center gap-2">
                                <span>📥</span> Bu Bölümü İndir
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. DICTIONARY TAB */}
                {activeTab === 'dictionary' && (
                    <div className="flex flex-col h-full p-2">
                        {/* Removed Top Download Button */}
                        <div className="flex gap-1 mb-2 border-b border-gray-700 pb-2 shrink-0">
                            <div className="relative flex-1">
                                <input
                                    className={`w-full p-1 pr-6 text-xs rounded border outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                    placeholder="Sözlükte bul..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <select
                                className={`p-1 text-xs rounded border outline-none w-14 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                value={filterLen}
                                onChange={(e) => setFilterLen(e.target.value)}
                            >
                                <option value="all">Tümü</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {/* Header Row */}
                            <div className="grid grid-cols-12 gap-1 text-[10px] font-bold opacity-50 mb-1 px-1">
                                <span className="col-span-2">KAYNAK</span>
                                <span className="col-span-3">ORJ</span>
                                <span className="col-span-3">KISA</span>
                                <span className="col-span-4">UZUN</span>
                            </div>
                            <ul className="text-xs space-y-1">
                                {Object.entries(dictionary).filter(([k]) => {
                                    if (!searchTerm) return true;
                                    let term = searchTerm.toLocaleLowerCase('tr');
                                    let word = k.toLocaleLowerCase('tr');
                                    if (filterLen !== 'all') { term = term.slice(0, parseInt(filterLen)); }
                                    return word.startsWith(term);
                                }).slice(0, 100).map(([k, v]) => {
                                    const s = v.short || v;
                                    const l = v.long || "";
                                    const src = v.source || "AI";
                                    return (
                                        <li key={k} onClick={() => onSelectWord(s, l)} className={`grid grid-cols-12 gap-1 border-b pb-1 p-1 rounded group cursor-pointer ${darkMode ? 'text-gray-300 border-gray-700 hover:bg-white/10' : 'text-gray-800 border-gray-200 hover:bg-blue-50'}`}>
                                            <span className="col-span-2 truncate font-mono text-[10px] opacity-60 flex items-center">{src}</span>
                                            <span className="col-span-3 truncate font-semibold text-green-600" title={k}>{k}</span>
                                            <span className="col-span-3 truncate opacity-80" title={s}>{s}</span>
                                            <span className="col-span-4 truncate opacity-60 text-[10px]" title={l}>{l}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                            {Object.keys(dictionary).length > 100 && !searchTerm && <div className="text-[10px] text-center opacity-50 mt-2">Daha fazlası için arama yapın...</div>}
                        </div>
                        {/* Bottom Download Button */}
                        <div className={`p-2 border-t shrink-0 mt-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <button onClick={onDownloadDictionary} className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded shadow flex items-center justify-center gap-2">
                                <span>📥</span> Bu Sözlüğü İndir
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. ANALYSIS TAB */}
                {activeTab === 'analysis' && (
                    <AnalysisPanel pages={pages} activeBookId={activeBookId} activeChapterId={activeChapterId} darkMode={darkMode} onFixAll={onFixAll} dictionary={dictionary} onNavigate={onNavigate} />
                )}
            </div>
        </div>
    );
};