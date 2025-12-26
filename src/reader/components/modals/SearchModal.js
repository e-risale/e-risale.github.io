import React from 'react';

const SearchModal = ({ isOpen, onClose, query, onQueryChange, results, onNavigate, darkMode }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
            <div className={`w-full sm:max-w-2xl max-h-[85vh] h-auto rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 ${darkMode ? 'bg-[#1a1b1e] border-t sm:border border-gray-700' : 'bg-[#fffbf5]'}`} onClick={e => e.stopPropagation()}>
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-amber-100'}`}>
                    <div className="relative w-full">
                        <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Külliyatta ara..."
                            className={`w-full pl-10 pr-4 py-3 rounded-lg outline-none text-lg ${darkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-[#f5f0e6] text-gray-900 placeholder-[#8c7b70]'}`}
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                        />
                    </div>
                    <button onClick={onClose} className="ml-4 text-gray-400 hover:text-red-500 sm:hidden">▼</button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {results.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            {query.length > 1 ? "Sonuç bulunamadı." : "Aramak için yazmaya başlayın..."}
                        </div>
                    ) : (
                        results.map(bookRes => (
                            <div key={bookRes.id} className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2 border-b border-amber-200 pb-1">
                                    {bookRes.title} <span className="opacity-60 ml-2">({bookRes.total})</span>
                                </h3>
                                <div className="space-y-4">
                                    {bookRes.chapters.map(chapRes => (
                                        <div key={chapRes.index} className="pl-2 border-l-2 border-amber-200/50">
                                            <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-[#5c4033]'}`}>{chapRes.title}</h4>
                                            <div className="space-y-2">
                                                {chapRes.matches.map((match, mIdx) => (
                                                    <button
                                                        key={mIdx}
                                                        onClick={() => onNavigate(bookRes.id, chapRes.index, match.chunkIndex, query)}
                                                        className={`w-full text-left p-3 rounded text-sm transition-colors group ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-[#f5f0e6] hover:bg-[#ebe5da] text-[#5c4033]'}`}
                                                    >
                                                        <div className="line-clamp-2 font-serif opacity-80 group-hover:opacity-100 leading-relaxed">
                                                            <span dangerouslySetInnerHTML={{ __html: match.preview.replace(new RegExp(`(${query})`, 'gi'), '<mark class="bg-amber-200 text-red-900 rounded px-1">$1</mark>') }}></span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
