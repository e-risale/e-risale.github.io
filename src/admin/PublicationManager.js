import React, { useState, useEffect } from 'react';
import { library } from '../data/library';
import { getPublicationStatus, savePublicationStatus } from '../services/DataService';
import { useToast } from '../reader/context/ToastContext';

const PublicationManager = ({ onBack, darkMode, toggleDarkMode }) => {
    const [publishedMap, setPublishedMap] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    const [expandedBooks, setExpandedBooks] = useState({});

    // Toggle Book Expand
    const toggleBook = (bookId) => {
        setExpandedBooks(prev => ({
            ...prev,
            [bookId]: !prev[bookId]
        }));
    };

    // Load initial status
    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        setIsLoading(true);
        const status = await getPublicationStatus();
        setPublishedMap(status);
        setIsLoading(false);
    };

    const handleToggle = (chapterId) => {
        setPublishedMap(prev => {
            const current = prev[chapterId];
            const newMap = { ...prev };

            if (current) {
                // If currently published (has date), remove it (unpublish)
                delete newMap[chapterId];
            } else {
                // If unpublished, set to ISO date string
                newMap[chapterId] = new Date().toISOString();
            }
            return newMap;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const success = await savePublicationStatus(publishedMap);
        if (success) {
            showToast('Yayın durumu başarıyla güncellendi.', 'success');
        } else {
            showToast('Kaydetme başarısız oldu.', 'error');
        }
        setIsSaving(false);
    };

    const isPublished = (id) => !!publishedMap[id];

    const handleBulkToggle = (e, book) => {
        e.stopPropagation(); // Prevent folding toggle
        const allPublished = book.chapters.every(c => isPublished(c.id));
        const targetState = !allPublished; // If currently all published, turn off. Else turn on.

        setPublishedMap(prev => {
            const newMap = { ...prev };
            book.chapters.forEach(c => {
                if (targetState) {
                    if (!newMap[c.id]) newMap[c.id] = new Date().toISOString();
                } else {
                    delete newMap[c.id];
                }
            });
            return newMap;
        });
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#1a1b1e] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-30 border-b transition-colors duration-300 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className={`p-2 -ml-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Yayın Yönetimi</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleDarkMode} className={`p-2 rounded-lg text-xl transition-colors ${darkMode ? 'bg-gray-700 text-amber-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isLoading}
                            className={`px-6 py-2 rounded-lg font-bold text-white transition-all shadow-md ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:scale-105'}`}
                        >
                            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10">
                {isLoading ? (
                    <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div></div>
                ) : (
                    <div className="space-y-8">
                        {library.map(book => {
                            const isExpanded = expandedBooks[book.id];
                            const allPublished = book.chapters.every(c => isPublished(c.id));
                            // Partial check: if some but not all are published?
                            // For simplicity, switch is ON only if ALL are on.

                            return (
                                <div key={book.id} className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <div
                                        onClick={() => toggleBook(book.id)}
                                        className={`px-6 py-4 border-b flex justify-between items-center cursor-pointer transition-colors select-none group ${darkMode ? 'bg-[#2c2e33] border-gray-700 hover:bg-[#32343a]' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>▼</span>
                                            <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{book.title}</h2>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{book.chapters.length} Bölüm</span>
                                            <div className={`w-px h-4 ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                            {/* MASTER SWITCH */}
                                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase opacity-50">{allPublished ? 'Tümünü Kapat' : 'Tümünü Aç'}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={allPublished}
                                                        onChange={(e) => handleBulkToggle(e, book)}
                                                    />
                                                    <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${darkMode ? 'bg-gray-600 after:border-gray-600' : 'bg-gray-300'}`}></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className={`divide-y animate-fade-in-down ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                            {book.chapters.map(chapter => {
                                                const published = isPublished(chapter.id);
                                                const dateStr = publishedMap[chapter.id];
                                                const dateDisplay = dateStr ? new Date(dateStr).toLocaleDateString('tr-TR') : '-';

                                                return (
                                                    <div key={chapter.id} className={`px-6 py-4 flex items-center justify-between transition-colors ${published ? (darkMode ? 'bg-[#25262b]' : 'bg-white') : (darkMode ? 'bg-gray-900/30' : 'bg-gray-50/50')} ${darkMode ? 'hover:bg-[#2c2e33]' : 'hover:bg-gray-50'}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-3 h-3 rounded-full ${published ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></div>
                                                            <div>
                                                                <p className={`font-medium ${published ? (darkMode ? 'text-gray-200' : 'text-gray-900') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>{chapter.title}</p>
                                                                {published && <p className="text-xs text-gray-400 mt-0.5">Yayınlanma: {dateDisplay}</p>}
                                                            </div>
                                                        </div>

                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only peer"
                                                                checked={published}
                                                                onChange={() => handleToggle(chapter.id)}
                                                            />
                                                            <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${darkMode ? 'bg-gray-600 after:border-gray-600' : 'bg-gray-200'}`}></div>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PublicationManager;
