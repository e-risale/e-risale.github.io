import React, { useState } from 'react';
import { scanBookStatuses } from '../utils/statusScanner';

export const AIReportList = ({ library, onLoadChapter, onClose, darkMode }) => {
    const [expandedBooks, setExpandedBooks] = useState({});
    const [expandedChapters, setExpandedChapters] = useState({});
    const [bookStatuses, setBookStatuses] = useState({});
    const [loadingBooks, setLoadingBooks] = useState({});

    const toggleBook = async (book) => {
        const isExpanding = !expandedBooks[book.id];
        setExpandedBooks(prev => ({ ...prev, [book.id]: isExpanding }));

        // Scan if expanding and not yet scanned
        if (isExpanding && !bookStatuses[book.id]) {
            setLoadingBooks(prev => ({ ...prev, [book.id]: true }));
            const statuses = await scanBookStatuses(book, library);
            setBookStatuses(prev => ({ ...prev, [book.id]: statuses }));

            // AUTO EXPAND ALL CHAPTERS (Requested Behavior)
            const newExpandedChapters = {};
            book.chapters.forEach(chap => {
                newExpandedChapters[`${book.id}-${chap.id}`] = true;
            });
            setExpandedChapters(prev => ({ ...prev, ...newExpandedChapters }));

            setLoadingBooks(prev => ({ ...prev, [book.id]: false }));
        }
    };

    const toggleChapter = (bookId, chapId) => {
        setExpandedChapters(prev => ({ ...prev, [`${bookId}-${chapId}`]: !prev[`${bookId}-${chapId}`] }));
    };

    return (
        <div className={`absolute top-16 right-0 w-[600px] max-h-[calc(100vh-100px)] flex flex-col shadow-2xl rounded-bl-xl border overflow-hidden z-50 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'}`}>
            {/* Header */}
            <div className={`p-3 border-b flex justify-between items-center shrink-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                <h3 className="font-bold text-sm">📋 Çeviri Durum Raporu</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-red-500 font-bold px-2">✕</button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {library.map(book => {
                    const isExpanded = expandedBooks[book.id];
                    const isLoading = loadingBooks[book.id];
                    const statuses = bookStatuses[book.id] || {};

                    return (
                        <div key={book.id} className="mb-2 border-b border-gray-700/30 pb-2 last:border-0">
                            <button
                                onClick={() => toggleBook(book)}
                                className={`w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}
                            >
                                <span className={`text-[10px] transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                                <span className="text-xs font-bold uppercase">{book.title}</span>
                                {isLoading && <span className="text-[10px] animate-pulse ml-auto">Taranıyor...</span>}
                            </button>

                            {isExpanded && (
                                <div className="ml-4 mt-1 space-y-1">
                                    {/* Chapter List */}
                                    {book.chapters.map(chap => {
                                        const status = statuses[chap.id];
                                        const exists = status?.exists;
                                        const pageCount = status?.pageCount || 0;
                                        const pages = status?.pages || [];
                                        const isChapExpanded = expandedChapters[`${book.id}-${chap.id}`];

                                        return (
                                            <div key={chap.id} className="mb-1">
                                                <div className="flex items-center gap-2 group">
                                                    <button
                                                        onClick={() => toggleChapter(book.id, chap.id)}
                                                        className={`flex-1 grid grid-cols-12 gap-2 items-center text-[11px] px-2 py-1.5 rounded text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
                                                    >
                                                        <span className={`col-span-1 text-[8px] transform transition-transform duration-200 ${isChapExpanded ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                                                        <span className="col-span-11 truncate font-medium">{chap.title} <span className="opacity-50 text-[10px]">({exists ? pageCount + ' Sayfa' : 'Dosya Yok'})</span></span>
                                                    </button>
                                                    <button
                                                        onClick={() => { onLoadChapter(book.id, chap.id); onClose(); }}
                                                        className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-500 transition-opacity"
                                                    >
                                                        AÇ
                                                    </button>
                                                </div>

                                                {/* Pages List */}
                                                {isChapExpanded && exists && (
                                                    <div className="ml-6 mt-1 border-l border-gray-700/50 pl-2 space-y-0.5">
                                                        {/* Table Header */}
                                                        <div className="grid grid-cols-12 gap-1 text-[9px] font-bold opacity-40 px-2 mb-1">
                                                            <span className="col-span-1">Sayfa</span>
                                                            <span className="col-span-5">Model</span>
                                                            <span className="col-span-4 text-right">Güncelleme</span>
                                                            <span className="col-span-2 text-right">Durum</span>
                                                        </div>
                                                        {pages.map((page, idx) => (
                                                            <div key={idx} className="grid grid-cols-12 gap-1 items-center text-[10px] px-2 py-1 hover:bg-white/5 rounded border-b border-white/5">
                                                                <span className="col-span-1 opacity-70">#{page.id + 1}</span>
                                                                <span className="col-span-5 truncate text-blue-300" title={page.aiModel}>
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="text-yellow-500 text-[8px]">⚡</span>
                                                                        {page.aiModel?.replace('PREVIEW', '').trim() || '-'}
                                                                    </span>
                                                                </span>
                                                                <span className="col-span-4 opacity-50 truncate text-[9px] text-right font-mono" title={page.lastUpdated}>{page.lastUpdated?.split('T')[0]} <span className="opacity-50">{page.lastUpdated?.split('T')[1]?.substring(0, 5)}</span></span>
                                                                <span className={`col-span-2 text-right font-bold ${page.hasText ? 'text-green-400' : 'text-gray-500'}`}>
                                                                    {page.hasText ? 'Tamam' : 'Beklemede'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
