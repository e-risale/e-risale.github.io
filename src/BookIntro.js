import React, { useState, useEffect } from 'react';
import { library } from './data/library';
import { auth } from './firebase';
import UserMenu from './components/UserMenu';

export default function BookIntro({ bookId, onStartReading, onBack, onOpenBookmarks, onOpenSearch, darkMode, toggleDarkMode, onLogout, onLogin, isAdmin, onOpenAdmin, publishedChapters = {} }) {
    const book = library.find(b => b.id === bookId);
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [savedProgress, setSavedProgress] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });

        // Check reading progress
        try {
            const saved = JSON.parse(localStorage.getItem('reading_progress') || '{}');
            if (saved && saved.bookId === bookId && typeof saved.chapterIndex === 'number') {
                setSavedProgress(saved);
            }
        } catch (e) {
            console.error("Error parsing reading progress", e);
        }

        return () => unsubscribe();
    }, [bookId]);

    if (!book) return null;

    return (
        <div className={`h-full overflow-y-auto custom-scrollbar flex flex-col ${darkMode ? 'bg-[#111214] text-gray-200' : 'bg-[#fdfbf7] text-gray-800'}`}>
            {/* STANDARDIZED HEADER */}
            <div className="sticky top-0 z-30 w-full transition-all duration-300">
                <div className={`shadow-sm backdrop-blur-md border-b transition-colors ${darkMode ? 'bg-[#1a1b1e]/95 border-gray-700' : 'bg-[#fdfbf7]/95 border-[#edeae6]'}`}>
                    <div className="px-4 md:px-6 py-3 flex justify-between items-center max-w-7xl mx-auto">

                        {/* LEFT: Back Button & Title */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onBack}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/5 text-[#5c4033]'}`}
                                title="Kütüphaneye Dön"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <span className={`font-serif font-bold text-lg truncate max-w-[200px] md:max-w-none ${darkMode ? 'text-gray-200' : 'text-[#5c4033]'}`}>
                                {book.title}
                            </span>
                        </div>

                        {/* RIGHT: User Profile */}
                        <div className="flex items-center gap-3 relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 border relative ${isMenuOpen ? (darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-amber-200 text-amber-900 shadow-inner') : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white' : 'bg-white border-[#e6e0d2] text-[#5c4033] hover:border-amber-200 hover:text-amber-800')}`}
                                title={user ? user.displayName : "Misafir"}
                            >
                                {user && user.photoURL ? (
                                    <img src={user.photoURL} alt="Profil" className="w-full h-full rounded-full object-cover p-0.5" />
                                ) : (
                                    <span className="text-xl leading-none mb-1">⋮</span>
                                )}
                            </button>
                            <UserMenu
                                isOpen={isMenuOpen}
                                onClose={() => setIsMenuOpen(false)}
                                user={user}
                                darkMode={darkMode}
                                toggleDarkMode={toggleDarkMode}
                                onOpenBookmarks={onOpenBookmarks}
                                onOpenSearch={onOpenSearch}
                                onLogout={onLogout}
                                onLogin={onLogin}
                                isAdmin={isAdmin}
                                onOpenAdmin={onOpenAdmin}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-12 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                    {/* Sol Taraf: Görsel ve Başlık */}
                    <div className="w-full md:w-1/3 flex flex-col items-center text-center md:sticky md:top-24">
                        <div className="w-48 h-72 bg-blue-900 rounded-lg shadow-2xl flex items-center justify-center mb-6 relative overflow-hidden border-r-4 border-b-4 border-gray-800 group">
                            {book.intro?.image ? (
                                <img
                                    src={book.intro.image}
                                    alt={book.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                    <span className="text-white font-serif text-2xl font-bold z-10 p-4">{book.title}</span>
                                </>
                            )}
                        </div>

                        {savedProgress ? (
                            <button
                                onClick={() => onStartReading(savedProgress.chapterIndex)}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>📖</span> Okumaya Devam Et
                            </button>
                        ) : (
                            <div className={`text-sm italic p-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                Okumaya başlamak için aşağıdan bir bölüm seçin.
                            </div>
                        )}
                    </div>

                    {/* Sağ Taraf: İçerik */}
                    <div className="w-full md:w-2/3">
                        <h1 className={`text-4xl font-serif font-bold mb-6 border-b pb-4 ${darkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>{book.title}</h1>

                        <div className={`prose prose-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-blue-900 uppercase tracking-widest mb-3">Eser Hakkında</h3>
                                <p className="leading-relaxed">
                                    {book.intro?.fullSummary || "Bu kitap için detaylı özet hazırlanıyor..."}
                                </p>
                            </div>

                            <div className={`p-6 rounded-xl border shadow-sm ${darkMode ? 'bg-[#1a1b1e] border-gray-700' : 'bg-white border-gray-200'}`}>
                                <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    <span className="text-2xl">🕰️</span> Tarihçe-i Hayat'tan Notlar
                                </h3>
                                <p className={`text-sm italic leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {book.intro?.history || "Tarihçe bilgisi hazırlanıyor..."}
                                </p>
                            </div>
                        </div>

                        {/* CHAPTER LIST (Table of Contents) */}
                        <div className="mt-12">
                            <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2 border-b pb-2 border-gray-200">
                                <span className="text-2xl">📑</span> İçindekiler
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {book.chapters.map((chapter, index) => {
                                    // Publication Logic
                                    const publishedDateStr = publishedChapters[chapter.id];
                                    const isPublished = !!publishedDateStr;
                                    let isNew = false;

                                    if (isPublished) {
                                        const pubDate = new Date(publishedDateStr);
                                        const now = new Date();
                                        const diffTime = Math.abs(now - pubDate);
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                        isNew = diffDays <= 30;
                                    }

                                    return (
                                        <button
                                            key={chapter.id}
                                            onClick={() => {
                                                if (isPublished) {
                                                    // Start reading from this chapter explicitly
                                                    onStartReading(index);
                                                }
                                            }}
                                            disabled={!isPublished}
                                            className={`group flex items-center justify-between p-4 rounded-xl border transition-all text-left relative overflow-hidden
                                                    ${isPublished
                                                    ? (darkMode ? 'bg-[#1a1b1e] border-gray-700 hover:border-gray-500 hover:bg-gray-800' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5')
                                                    : (darkMode ? 'bg-gray-900 border-gray-800 opacity-50 grayscale cursor-not-allowed' : 'bg-gray-50 border-gray-100 opacity-60 grayscale cursor-not-allowed')
                                                }
                                                `}
                                        >
                                            <div className="flex items-center gap-4 z-10 w-full">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                                        ${isPublished
                                                        ? (darkMode ? 'bg-gray-700 text-gray-200 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white')
                                                        : 'bg-gray-200 text-gray-400'
                                                    } transition-colors`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-bold truncate ${isPublished ? (darkMode ? 'text-gray-200' : 'text-gray-800') : 'text-gray-500'}`}>
                                                        {chapter.title}
                                                    </h4>
                                                    {!isPublished && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Yapım Aşamasında</span>}
                                                </div>

                                                {isPublished && (
                                                    <div className={`text-gray-400 group-hover:text-blue-500 transition-colors ${darkMode ? 'group-hover:text-blue-400' : ''}`}>
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* NEW BADGE */}
                                            {isNew && isPublished && (
                                                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-md shadow-sm z-20">
                                                    YENİ
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}