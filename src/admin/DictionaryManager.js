import React, { useState, useEffect } from 'react';
import { sortDictionaryByKey } from '../utils/editorHelpers';
import defaultDictionary from '../sozluk.json';
import { getDictionary, saveDictionary } from '../services/DataService';
import { useToast } from '../reader/context/ToastContext';

const DictionaryManager = ({ onBack, user, darkMode, toggleDarkMode }) => {
    // Dictionary State
    const [dictionary, setDictionary] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [shortSearchTerm, setShortSearchTerm] = useState("");
    const [filteredKeys, setFilteredKeys] = useState([]);
    const { showToast } = useToast();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Editing State
    const [editKey, setEditKey] = useState(null); // Key being edited
    const [editData, setEditData] = useState({ short: "", long: "" });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newEntry, setNewEntry] = useState({ word: "", short: "", long: "" });

    const getInitials = (u) => {
        if (!u) return 'AI';
        if (u.displayName) return u.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
        return u.email ? u.email.substring(0, 2).toUpperCase() : 'AI';
    };

    // Load Data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const loaded = await getDictionary();
        if (loaded) {
            // Check if we also have localStorage data to merge (for web backward compat)
            try {
                const savedDict = localStorage.getItem('risaleDictionary');
                if (savedDict) {
                    const final = { ...loaded, ...JSON.parse(savedDict) };
                    setDictionary(sortDictionaryByKey(final));
                } else {
                    setDictionary(sortDictionaryByKey(loaded));
                }
            } catch (e) {
                setDictionary(sortDictionaryByKey(loaded));
            }
        } else {
            // Standard Web Fallback
            let finalDict = { ...defaultDictionary };
            const savedDict = localStorage.getItem('risaleDictionary');
            if (savedDict) {
                try {
                    finalDict = { ...finalDict, ...JSON.parse(savedDict) };
                } catch (e) {
                    console.error("Failed to parse local dictionary", e);
                }
            }
            setDictionary(sortDictionaryByKey(finalDict));
        }
    };

    // Filter Logic
    useEffect(() => {
        const term = searchTerm.toLowerCase('tr');
        const shortTerm = shortSearchTerm.toLowerCase('tr');
        const keys = Object.keys(dictionary);

        if (!term && !shortTerm) {
            setFilteredKeys(keys);
        } else {
            setFilteredKeys(keys.filter(k => {
                const matchesOriginal = !term || k.toLowerCase('tr').includes(term);
                const entry = dictionary[k];
                const matchesShort = !shortTerm || (entry.short && entry.short.toLowerCase('tr').includes(shortTerm));
                return matchesOriginal && matchesShort;
            }));
        }
        setCurrentPage(1); // Reset page on search
    }, [searchTerm, shortSearchTerm, dictionary]);

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Save Helper
    const saveToMemory = async (newDict) => {
        const sorted = sortDictionaryByKey(newDict);
        setDictionary(sorted);

        // Save using DataService (supports both Electron and Web)
        const success = await saveDictionary(sorted);

        if (success) {
            if (window.api?.isElectron) {
                showToast('Sözlük başarıyla kaydedildi.', 'success');
            }
            // For web, we still update localStorage as a cache/backup
            localStorage.setItem('risaleDictionary', JSON.stringify(sorted));
        } else {
            showToast('Kaydetme başarısız oldu.', 'error');
        }
    };

    // Actions
    const handleDelete = (key) => {
        setDeleteConfirm(key);
    };

    const executeDelete = () => {
        if (!deleteConfirm) return;
        const newDict = { ...dictionary };
        delete newDict[deleteConfirm];
        saveToMemory(newDict);
        setDeleteConfirm(null);
    };

    const handleStartEdit = (key) => {
        setEditKey(key);
        setEditData({ ...dictionary[key] });
    };

    const handleCancelEdit = () => {
        setEditKey(null);
        setEditData({ short: "", long: "" });
    };

    const handleSaveEdit = (key) => {
        const newDict = { ...dictionary };
        // Update source to current user when editing
        newDict[key] = { ...editData, source: getInitials(user) };
        saveToMemory(newDict);
        setEditKey(null);
    };

    const handleAddNew = () => {
        const { word, short, long } = newEntry;
        if (!word || !short) return alert("Kelime ve Kısa Anlam zorunludur.");
        const newDict = { ...dictionary };
        newDict[word] = { short, long, source: getInitials(user) };
        saveToMemory(newDict);
        setIsAddModalOpen(false);
        setNewEntry({ word: "", short: "", long: "" });
        setSearchTerm(word); // Focus on new word
    };

    // Manual Save / Download trigger
    const handleManualSave = async () => {
        const success = await saveDictionary(dictionary);
        if (success && window.api?.isElectron) {
            showToast('Dosyaya yazıldı: sozluk.json', 'success');
        }
    };

    // Pagination Calculation
    const totalPages = Math.ceil(filteredKeys.length / ITEMS_PER_PAGE);
    const currentKeys = filteredKeys.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#1a1b1e] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-30 border-b transition-colors duration-300 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className={`p-2 -ml-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="Geri Dön"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Sözlük Yönetimi</h1>
                        <span className={`text-xs px-2 py-1 rounded font-mono ml-2 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Top: {Object.keys(dictionary).length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleDarkMode} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-amber-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button onClick={handleManualSave} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${darkMode ? 'bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/40' : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'}`}>
                            {window.api?.isElectron ? '💾 Dosyayı Kaydet' : '💾 İndir (JSON)'}
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                            + Yeni Kelime
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className={`fixed top-20 left-0 right-0 z-20 border-b shadow-sm transition-colors duration-300 ${darkMode ? 'bg-[#1a1b1e] border-gray-700' : 'bg-white'}`}>
                <div className="max-w-7xl mx-auto px-6 py-3 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Orjinal Kelime Ara..."
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-[#25262b] border-gray-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute left-3 top-2.5 text-gray-400">📖</span>
                        <input
                            type="text"
                            placeholder="Kısa Anlam Ara..."
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-[#25262b] border-gray-600 text-white' : 'bg-gray-50 border-gray-300'}`}
                            value={shortSearchTerm}
                            onChange={(e) => setShortSearchTerm(e.target.value)}
                        />
                        {shortSearchTerm && (
                            <button
                                onClick={() => setShortSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="pt-40 pb-12 px-6 max-w-7xl mx-auto">
                <div className={`rounded-xl shadow border overflow-hidden ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                    <table className="w-full text-left border-collapse">
                        <thead className={`text-xs uppercase font-bold ${darkMode ? 'bg-[#1a1b1e] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                            <tr>
                                <th className="p-4 border-b w-16 text-center">KAYNAK</th>
                                <th className="p-4 border-b w-1/4">Kelime</th>
                                <th className="p-4 border-b w-1/4">Kısa Anlam</th>
                                <th className="p-4 border-b">Uzun Anlam</th>
                                <th className="p-4 border-b text-right w-24">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y text-sm ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                            {currentKeys.map(key => {
                                const entry = dictionary[key];
                                if (!entry) return null;
                                const isEditing = editKey === key;
                                const src = entry.source || "AI";

                                return (
                                    <tr key={key} className={`transition-colors ${darkMode ? 'hover:bg-blue-900/10' : 'hover:bg-blue-50/50'}`}>
                                        <td className={`p-4 border-r text-center font-mono text-xs select-none ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'}`}>{src}</td>

                                        <td className={`p-4 font-bold border-r ${darkMode ? 'border-gray-700 text-gray-200' : 'border-gray-100 text-gray-900'}`}>{key}</td>

                                        <td className={`p-4 border-r ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                            {isEditing ? (
                                                <input className="w-full p-2 border rounded bg-white text-black" value={editData.short} onChange={(e) => setEditData({ ...editData, short: e.target.value })} autoFocus />
                                            ) : (
                                                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{entry.short}</span>
                                            )}
                                        </td>

                                        <td className={`p-4 border-r ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                            {isEditing ? (
                                                <textarea className="w-full p-2 border rounded bg-white text-black" rows={2} value={editData.long} onChange={(e) => setEditData({ ...editData, long: e.target.value })} />
                                            ) : (
                                                <span className={`line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{entry.long}</span>
                                            )}
                                        </td>

                                        <td className="p-4 text-right">
                                            {isEditing ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleSaveEdit(key)} className="text-green-600 font-bold hover:underline">Kaydet</button>
                                                    <button onClick={handleCancelEdit} className="text-gray-500 hover:underline">İptal</button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleStartEdit(key)} className="text-blue-500 font-bold hover:underline">Düzenle</button>
                                                    <button onClick={() => handleDelete(key)} className="text-red-500 hover:underline">Sil</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {currentKeys.length === 0 && (
                        <div className="p-12 text-center text-gray-500">Kelime bulunamadı.</div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded disabled:opacity-50 bg-white">Önceki</button>
                        <span className="px-4 py-2 bg-gray-100 rounded text-gray-600 font-bold">{currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded disabled:opacity-50 bg-white">Sonraki</button>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Yeni Kelime Ekle</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">KELİME (ORJİNAL)</label>
                                <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={newEntry.word} onChange={e => setNewEntry({ ...newEntry, word: e.target.value })} placeholder="Örn: Müdakkik" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">KISA ANLAM</label>
                                <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={newEntry.short} onChange={e => setNewEntry({ ...newEntry, short: e.target.value })} placeholder="Örn: Dikkatli inceleyen" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">UZUN ANLAM</label>
                                <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={newEntry.long} onChange={e => setNewEntry({ ...newEntry, long: e.target.value })} placeholder="Detaylı açıklama..." />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded">İptal</button>
                            <button onClick={handleAddNew} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Ekle</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🗑️</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Kelimeyi Sil?</h3>
                        <p className="text-gray-600 mb-6">"<span className="font-bold text-black">{deleteConfirm}</span>" sözlükten kalıcı olarak silinecek. Emin misiniz?</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded border">Vazgeç</button>
                            <button onClick={executeDelete} className="px-6 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 shadow-lg">Evet, Sil</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DictionaryManager;
