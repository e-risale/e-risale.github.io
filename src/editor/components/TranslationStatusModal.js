import React, { useEffect, useState } from 'react';

export const TranslationStatusModal = ({ isOpen, onClose, library, activeBookId }) => {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && activeBookId) {
            checkStatuses();
        }
    }, [isOpen, activeBookId]);

    const checkStatuses = async () => {
        setLoading(true);
        const book = library.find(b => b.id === activeBookId);
        if (!book) {
            setLoading(false);
            return;
        }

        const newStatuses = [];

        // Parallel check for all chapters
        // We assume file naming convention matches what DataService expects.
        // Usually: folderName + "/" + chapterId + ".json"

        const folder = book.folderName || book.id;

        for (const chapter of book.chapters) {
            let status = {
                id: chapter.id,
                title: chapter.title,
                exists: false,
                pageCount: 0,
                lastUpdated: null,
                model: '-'
            };

            if (window.api && window.api.readRawFile) {
                try {
                    // Try to read the file
                    const filename = `${folder}/${chapter.id}.json`;
                    const result = await window.api.readRawFile({ filename });

                    if (result.success) {
                        status.exists = true;
                        const data = JSON.parse(result.content);
                        let pages = [];
                        if (Array.isArray(data)) pages = data;
                        else if (data.pages) pages = data.pages;

                        status.pageCount = pages.length;

                        // Check for metadata in the file
                        // If pages have 'lastUpdated', pick the latest
                        if (pages.length > 0) {
                            const updates = pages.map(p => p.lastUpdated).filter(d => d).sort();
                            if (updates.length > 0) status.lastUpdated = updates[updates.length - 1];

                            // Check for model info (if we start saving it)
                            // Maybe check the first page?
                            if (pages[0].aiModel) status.model = pages[0].aiModel;
                        }
                    }
                } catch (e) {
                    console.error("Status check error", e);
                }
            }
            newStatuses.push(status);
        }

        setStatuses(newStatuses);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border dark:border-gray-700">

                {/* Header */}
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-xl">
                    <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        📊 Çeviri Durum Raporu
                        <span className="text-xs font-normal opacity-60 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {activeBookId}
                        </span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-0 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-gray-900/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm">Dosyalar taranıyor...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="p-3 font-semibold border-b dark:border-gray-700">Bölüm</th>
                                    <th className="p-3 font-semibold border-b dark:border-gray-700 text-center">Durum</th>
                                    <th className="p-3 font-semibold border-b dark:border-gray-700 text-center">Sayfa</th>
                                    <th className="p-3 font-semibold border-b dark:border-gray-700">Son Güncelleme</th>
                                    <th className="p-3 font-semibold border-b dark:border-gray-700">AI Model</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                                {statuses.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-3 font-medium text-gray-800 dark:text-gray-200">
                                            {item.title}
                                            <div className="text-[10px] opacity-40 font-mono">{item.id}</div>
                                        </td>
                                        <td className="p-3 text-center">
                                            {item.exists ? (
                                                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded text-xs font-bold">
                                                    Mevcut
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded text-xs">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center text-gray-600 dark:text-gray-400 font-mono">
                                            {item.exists ? item.pageCount : "-"}
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">
                                            {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('tr-TR') : "-"}
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400 text-xs font-mono">
                                            {item.model !== '-' ? (
                                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{item.model}</span>
                                            ) : (
                                                <span className="opacity-30">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
};
