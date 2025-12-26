import React from 'react';

// --- YARDIMCI: KELİME PARLATMA (JSX) ---
const HighlightMatch = ({ text, match }) => {
    if (!text || !match) return <span>{text}</span>;
    // Temizle
    const cleanText = text.replace(/\[\[(.*?)\|.*?\]\]/g, '$1').replace(/\(\((.*?)\)\)/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1');
    const parts = cleanText.split(new RegExp(`(${match})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === match.toLowerCase()
                    ? <span key={i} className="bg-yellow-400 text-black font-bold px-1 rounded">{part}</span>
                    : part
            )}
        </>
    );
};

export const GlobalSearchModal = ({ isOpen, onClose, query, setQuery, onSearch, results, onUpdate, darkMode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className={`w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-2xl">🌐</span>
                        <div className="flex-1 relative">
                            <input autoFocus type="text" className={`w-full p-3 rounded border outline-none text-lg ${darkMode ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} placeholder="Külliyatta ara (Örn: saltanat)" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} />
                            <button onClick={onSearch} className="absolute right-2 top-2 bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-bold">ARA</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="ml-4 text-2xl hover:text-red-500">✕</button>
                </div>
                <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                    {results.length === 0 ? (<div className="flex flex-col items-center justify-center h-full opacity-50"><span className="text-4xl mb-4">🔍</span><p>Tüm kitaplarda arama yapar.</p></div>) : (
                        <div className="space-y-4">
                            {results.map((res, idx) => (
                                <div key={idx} className={`p-4 rounded-lg border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-500/20">
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>{res.bookTitle} &bull; {res.chapterTitle}</span>
                                    </div>
                                    <div className={`text-base mb-4 font-serif leading-relaxed opacity-90 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>...<HighlightMatch text={res.snippetRaw} match={res.original} />...</div>
                                    <div className="flex gap-4 items-end bg-black/5 p-3 rounded-lg">
                                        <div className="flex-1"><label className="text-[10px] uppercase font-bold opacity-50 block mb-1">Orijinal (Sabit)</label><div className={`w-full p-2 rounded border font-bold opacity-70 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-200 border-gray-300'}`}>{res.original}</div></div>
                                        <div className="flex-1"><label className="text-[10px] uppercase font-bold opacity-50 block mb-1">Kısa Anlam</label><input value={res.short} onChange={(e) => onUpdate(idx, 'short', e.target.value)} className={`w-full p-2 rounded border font-bold text-green-600 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /></div>
                                        <div className="flex-[2]"><label className="text-[10px] uppercase font-bold opacity-50 block mb-1">Uzun Anlam</label><input value={res.long} onChange={(e) => onUpdate(idx, 'long', e.target.value)} className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /></div>
                                        <button onClick={() => onUpdate(idx, 'save')} className={`px-6 py-2 rounded-lg font-bold shadow h-[42px] transition-transform active:scale-95 text-white ${res.isUpdated ? 'bg-green-700 cursor-default' : 'bg-green-600 hover:bg-green-500'}`}>{res.isUpdated ? '✅ GÜNCELLENDİ' : 'GÜNCELLE'}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const BatchAIModal = ({ isOpen, onClose, darkMode, startPage, endPage, setStart, setEnd, currentIndex, onNext, onPrev, onApply, onCopyPrompt, onClear, results, setResults, promptText }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className={`w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">⚡ Seri AI Sihirbazı</h2>
                        <div className="flex items-center gap-2 bg-gray-500/10 p-1 rounded-lg">
                            <label className="text-xs font-bold opacity-60 ml-2">Aralık:</label>
                            <input type="number" min="1" value={startPage} onChange={(e) => setStart(parseInt(e.target.value))} className={`w-12 text-center rounded border ${darkMode ? 'bg-gray-700' : 'bg-white'}`} />
                            <span>-</span>
                            <input type="number" min="1" value={endPage} onChange={(e) => setEnd(parseInt(e.target.value))} className={`w-12 text-center rounded border ${darkMode ? 'bg-gray-700' : 'bg-white'}`} />
                        </div>
                        <button onClick={onClear} className="text-xs text-red-500 hover:underline ml-4">🗑️ Temizle</button>
                    </div>
                    <div className="flex items-center gap-3"><span className="text-sm font-mono opacity-60">Şu an: Sayfa {currentIndex + 1}</span><button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl">✕</button></div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className={`flex-1 flex flex-col border-r p-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex justify-between mb-2"><h3 className="font-bold text-sm uppercase opacity-50">1. Prompt'u Kopyala</h3><button onClick={onCopyPrompt} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">📋 Kopyala</button></div>
                        <textarea readOnly className={`w-full flex-1 p-3 rounded text-xs font-mono outline-none resize-none opacity-60 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`} value={promptText} />
                    </div>
                    <div className="flex-1 flex flex-col p-4">
                        <div className="flex justify-between mb-2"><h3 className="font-bold text-sm uppercase opacity-50">2. Cevabı Yapıştır</h3><span className="text-xs opacity-40">AI cevabını buraya yapıştırın</span></div>
                        <textarea autoFocus className={`w-full flex-1 p-3 rounded text-sm font-mono outline-none resize-none border-2 focus:border-green-500 transition-colors ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="AI cevabını buraya yapıştır..." value={results[currentIndex] || ""} onChange={(e) => setResults(currentIndex, e.target.value)} />
                    </div>
                </div>
                <div className={`p-4 border-t flex justify-between items-center ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                    <button onClick={onPrev} disabled={currentIndex <= startPage - 1} className="px-6 py-3 rounded-lg font-bold bg-gray-600 text-white disabled:opacity-30 hover:bg-gray-500">⬅️ Önceki</button>
                    <div className="flex flex-col items-center"><div className="w-64 h-2 bg-gray-300 rounded-full overflow-hidden mb-1"><div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${((currentIndex - startPage + 1) / (endPage - startPage + 1)) * 100}%` }}></div></div><span className="text-xs opacity-50">{currentIndex - startPage + 1} / {endPage - startPage + 1} Tamamlandı</span></div>
                    {currentIndex < endPage - 1 ? (<button onClick={onNext} className="px-8 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg transform active:scale-95 transition-all">Sonraki Sayfa ➡️</button>) : (<button onClick={onApply} className="px-8 py-3 rounded-lg font-bold bg-green-600 text-white hover:bg-green-500 shadow-lg transform active:scale-95 transition-all animate-bounce">✅ BİTİR VE KAYDET</button>)}
                </div>
            </div>
        </div>
    );
};

export const WordPopup = ({ data, setData, dictionary, darkMode, onSave, onRemoveTag, onDeleteDict }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    // Reset delete confirm state when word changes or modal closes
    React.useEffect(() => {
        if (!data.show || data.word) {
            setShowDeleteConfirm(false);
        }
    }, [data.show, data.word]);

    if (!data.show) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className={`p-4 rounded-xl shadow-2xl flex flex-col gap-3 w-[400px] transform transition-all ${darkMode ? 'bg-gray-800 border border-gray-600 text-gray-200' : 'bg-white text-black border-gray-300'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-2 mb-1 border-gray-500/30">
                    <h4 className="font-bold text-sm select-none">{data.isEdit ? "Düzenle" : "Ekle"}</h4>
                    <span className="text-[10px] opacity-50 font-mono ml-auto mr-3 border px-1 rounded">Kaynak: {data.source || 'AI'}</span>
                    <button onClick={() => setData({ ...data, show: false })} className="text-xs hover:text-red-500">✕</button>
                </div>
                <div className="relative"> <input className={`w-full font-bold text-center p-2 rounded border-b-2 outline-none text-lg ${darkMode ? 'bg-blue-900/30 text-blue-200 border-blue-500' : 'bg-blue-50 text-blue-900 border-blue-300'}`} value={data.word} onChange={(e) => { const newWord = e.target.value; const existingEntry = dictionary[newWord]; setData(prev => ({ ...prev, word: newWord, short: existingEntry?.short || prev.short, long: existingEntry?.long || prev.long })); }} /> {dictionary[data.word] && (<span className="absolute right-2 top-2 flex h-3 w-3"> <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span> <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" title="Kayıtlı"></span> </span>)} </div>
                <div className="space-y-1"> <label className="text-[10px] uppercase font-bold opacity-60">Kısa Anlam</label> <input className={`w-full border p-2 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} value={data.short} onChange={(e) => setData({ ...data, short: e.target.value })} /> </div>
                <div className="space-y-1"> <label className="text-[10px] uppercase font-bold opacity-60">Uzun Anlam</label> <textarea className={`w-full border p-2 rounded text-sm outline-none h-24 resize-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} value={data.long} onChange={(e) => setData({ ...data, long: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSave(); } }} /> </div>

                {/* Actions Row */}
                <div className="flex justify-end gap-2 mt-2 border-t pt-3 border-gray-500/30">
                    <button onClick={() => setData({ ...data, show: false })} className="px-4 py-2 text-xs rounded border border-gray-500 hover:bg-gray-500/20">İptal</button>
                    <button onClick={onSave} className="px-6 py-2 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-500 shadow active:scale-95 transition-transform">Kaydet</button>
                </div>

                {/* Secondary Actions / Delete Confirmation */}
                {data.isEdit && (
                    <div className="mt-1 pt-1 border-t border-gray-500/10">
                        {showDeleteConfirm ? (
                            <div className="flex items-center justify-between bg-red-50 p-2 rounded border border-red-200">
                                <span className="text-xs text-red-700 font-bold">Silinsin mi?</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-gray-600 hover:underline">Hayır</button>
                                    <button onClick={onDeleteDict} className="text-xs font-bold text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 shadow">EVET</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between opacity-80">
                                <button onClick={onRemoveTag} className="text-[10px] text-orange-500 hover:underline">Etiketi Kaldır</button>
                                <button onClick={() => setShowDeleteConfirm(true)} className="text-[10px] text-red-500 hover:underline">Sözlükten Sil</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};