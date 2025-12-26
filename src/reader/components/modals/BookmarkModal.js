import React from 'react';

const BookmarkModal = ({ isOpen, onClose, bookmarks, onNavigate, onDelete, onAdd, darkMode }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
            <div className={`w-full sm:max-w-lg max-h-[80vh] rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 ${darkMode ? 'bg-[#1a1b1e] border-t sm:border border-gray-700' : 'bg-[#fffbf5]'}`} onClick={e => e.stopPropagation()}>
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-amber-100'}`}>
                    <h3 className="font-bold text-lg">🔖 Ayraçlarım</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {bookmarks.length === 0 ? (
                        <div className="text-center py-10 opacity-50 flex flex-col items-center">
                            <span className="text-4xl mb-2">🏷️</span>
                            <p>Henüz ayraç eklemediniz.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {bookmarks.map(bm => (
                                <li key={bm.id} className={`p-4 rounded-xl border relative group transition-all ${darkMode ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-white border-amber-100 hover:shadow-md'}`}>
                                    <button onClick={() => onNavigate(bm)} className="w-full text-left pr-8">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-[10px] uppercase font-bold tracking-wider opacity-60 px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-500/10 text-gray-600'}`}>{bm.bookTitle}</span>
                                            <span className={`text-[10px] opacity-40 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{bm.timestamp}</span>
                                        </div>
                                        <p className={`text-sm font-serif line-clamp-2 leading-relaxed opacity-90 italic ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>"{bm.snippet}"</p>
                                        <div className={`text-xs mt-2 opacity-50 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>📍 {bm.chapterTitle}</div>
                                    </button>
                                    <button onClick={() => onDelete(bm.id)} className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors" title="Sil">🗑️</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div >
    );
};

export default BookmarkModal;
