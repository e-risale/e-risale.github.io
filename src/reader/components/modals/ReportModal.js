import React, { useState } from 'react';

const ReportModal = ({ isOpen, onClose, onSubmit, darkMode }) => {
    const [reason, setReason] = useState('inappropriate');
    const [customReason, setCustomReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        let finalReason = '';
        if (reason === 'inappropriate') finalReason = 'Uygunsuz, küfür, argo, kaba';
        else if (reason === 'hate') finalReason = 'Nefret söylemi';
        else if (reason === 'other') finalReason = customReason ? `Diğer: ${customReason}` : 'Diğer';

        onSubmit(finalReason);
        setReason('inappropriate');
        setCustomReason('');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 relative ${darkMode ? 'bg-[#1a1b1e] border border-gray-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Bildir</h3>

                <div className="space-y-3 mb-6">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${reason === 'inappropriate' ? (darkMode ? 'bg-amber-900/20 border-amber-500' : 'bg-amber-50 border-amber-500') : (darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50')}`}>
                        <input type="radio" name="reason" value="inappropriate" checked={reason === 'inappropriate'} onChange={(e) => setReason(e.target.value)} className="text-amber-600 focus:ring-amber-500" />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Uygunsuz, küfür, argo, kaba</span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${reason === 'hate' ? (darkMode ? 'bg-amber-900/20 border-amber-500' : 'bg-amber-50 border-amber-500') : (darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50')}`}>
                        <input type="radio" name="reason" value="hate" checked={reason === 'hate'} onChange={(e) => setReason(e.target.value)} className="text-amber-600 focus:ring-amber-500" />
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Nefret söylemi</span>
                    </label>

                    <label className={`flex flex-col gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${reason === 'other' ? (darkMode ? 'bg-amber-900/20 border-amber-500' : 'bg-amber-50 border-amber-500') : (darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50')}`}>
                        <div className="flex items-center gap-3">
                            <input type="radio" name="reason" value="other" checked={reason === 'other'} onChange={(e) => setReason(e.target.value)} className="text-amber-600 focus:ring-amber-500" />
                            <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Diğer</span>
                        </div>
                        {reason === 'other' && (
                            <input
                                type="text"
                                maxLength={50}
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Açıklama (maks 50 karakter)"
                                className={`w-full text-xs p-2 rounded border mt-2 outline-none ${darkMode ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                            />
                        )}
                    </label>
                </div>

                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-bold ${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>İptal</button>
                    <button onClick={handleSubmit} className="px-6 py-2 rounded-lg text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-sm">Bildir</button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
