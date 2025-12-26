import React, { useState, useEffect } from 'react';
import { library } from './data/library';
import { auth } from './firebase';
import UserMenu from './components/UserMenu';

export default function Library({ onBookSelect, onBack, onOpenBookmarks, onOpenSearch, darkMode, toggleDarkMode, onLogout, onLogin, isAdmin, onOpenAdmin }) {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className={`h-[100dvh] overflow-y-auto custom-scrollbar pb-24 md:pb-0 ${darkMode ? 'bg-[#111214] text-gray-200' : 'bg-[#fdfbf7]'}`}>
            {/* STANDARDIZED HEADER (Matches ReaderHeader.js) */}
            <div className="sticky top-0 z-30 w-full transition-all duration-300">
                <div className={`shadow-sm backdrop-blur-md border-b transition-colors ${darkMode ? 'bg-[#1a1b1e]/95 border-gray-700' : 'bg-[#fdfbf7]/95 border-[#edeae6]'}`}>
                    <div className="px-4 md:px-6 py-3 flex justify-between items-center max-w-7xl mx-auto">

                        {/* LEFT: Back Button & Title */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onBack}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/5 text-[#5c4033]'}`}
                                title="Ana Sayfaya Dön"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                            <span className={`font-serif font-bold text-lg ${darkMode ? 'text-gray-200' : 'text-[#5c4033]'}`}>
                                Külliyat
                            </span>
                        </div>

                        {/* RIGHT: User Profile / Menu */}
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

            <div className="p-6 md:p-12 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {library.map((book) => (
                        <div
                            key={book.id}
                            onClick={() => onBookSelect(book.id)}
                            className={`group cursor-pointer rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 ${darkMode ? 'bg-[#1a1b1e] border-gray-700' : 'bg-white border-gray-100'}`}
                        >
                            <div className="aspect-[2/3] bg-gray-800 flex items-center justify-center relative overflow-hidden">
                                {book.intro?.image ? (
                                    <img
                                        src={book.intro.image}
                                        alt={book.title}
                                        className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <>
                                        {/* Kitap Kapağı Efekti Placeholder */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 to-gray-800 opacity-90 group-hover:scale-110 transition-transform duration-500"></div>
                                        <span className="relative z-10 text-3xl font-serif text-white font-bold tracking-widest border-b-2 border-yellow-500 pb-1">
                                            {book.title}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="p-6">
                                <p className={`text-sm line-clamp-3 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {book.intro?.shortDesc || "Bu eser için henüz kısa açıklama eklenmedi."}
                                </p>
                                <div className={`mt-4 flex items-center font-bold text-sm group-hover:translate-x-2 transition-transform ${darkMode ? 'text-yellow-500' : 'text-yellow-600'}`}>
                                    İncele & Oku →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}