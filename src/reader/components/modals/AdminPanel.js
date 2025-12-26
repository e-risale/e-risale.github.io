import React from 'react';
import { CATEGORY_LABELS } from '../../utils/readerUtils';

const AdminPanel = ({
    isOpen,
    onClose,
    feedbacks,
    isLoading,
    onDelete,
    onMarkRead,
    onDeleteAll,
    onExport,
    darkMode
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
            <div className={`w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-[#1a1b1e] text-gray-200' : 'bg-white text-gray-800'}`} onClick={e => e.stopPropagation()}>
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl flex items-center gap-2">🛡️ Yönetim Paneli</h3>
                        <div className="flex gap-2 ml-4">
                            <button onClick={onExport} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1" title="Excel (CSV) Olarak İndir">📊 Excel</button>
                            <button onClick={onDeleteAll} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1" title="Tüm Verileri Temizle">🗑️ Tümünü Sil</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full opacity-50">Yükleniyor...</div>
                    ) : feedbacks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-40">
                            <span className="text-4xl mb-2">📭</span>
                            <p>Henüz geri bildirim yok.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {feedbacks.map(fb => (
                                <div key={fb.id} className={`p-4 rounded-xl border relative group transition-all ${fb.status === 'read' ? 'opacity-60' : ''} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {fb.photo && <img src={fb.photo} alt="User" className="w-6 h-6 rounded-full" />}
                                            <span className="font-bold text-sm">{fb.name}</span>
                                            <span className="text-xs opacity-50">({fb.email})</span>
                                        </div>
                                        <div className="text-xs font-mono opacity-50">{fb.date?.toDate ? fb.date.toDate().toLocaleString('tr-TR') : ""}</div>
                                    </div>
                                    <div className="mb-2">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded mr-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>{CATEGORY_LABELS[fb.category] || fb.category || "GENEL"}</span>
                                        <span className="text-xs opacity-60 font-mono">{fb.page}</span>
                                    </div>
                                    <p className={`text-sm p-3 rounded-lg mb-3 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>{fb.feedback}</p>
                                    <div className="flex justify-end gap-2">
                                        {fb.status !== 'read' && (<button onClick={() => onMarkRead(fb.id)} className="text-xs px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold">Okundu İşaretle</button>)}
                                        <button onClick={() => onDelete(fb.id)} className="text-xs px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 font-bold">Sil</button>
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

export default AdminPanel;
