import React from 'react';

const FONTS = ['Lora', 'Merriweather', 'Roboto', 'Open Sans'];

const SettingsModal = ({ isOpen, onClose, darkMode, toggleDarkMode, fontSize, changeFontSize, fontFamily, setFontFamily }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
            <div className={`w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 ${darkMode ? 'bg-[#1a1b1e] border-t sm:border border-gray-700 text-gray-100' : 'bg-[#fffbf5] text-gray-800'}`} onClick={e => e.stopPropagation()}>
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-amber-100'}`}>
                    <h3 className="font-bold text-lg flex items-center gap-2">⚙️ Ayarlar</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">✕</button>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-3">Yazı Tipi</h4>
                        <div className={`grid grid-cols-2 gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-[#f5f0e6]'}`}>
                            {FONTS.map(font => (
                                <button
                                    key={font}
                                    onClick={() => setFontFamily(font)}
                                    className={`py-2 px-3 rounded-md text-sm transition-all border ${fontFamily === font ? (darkMode ? 'bg-amber-600 text-white border-amber-500 shadow' : 'bg-white text-black border-amber-200 shadow') : (darkMode ? 'border-transparent opacity-70 hover:bg-gray-700' : 'border-transparent opacity-70 hover:bg-white')}`}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-3">Yazı Boyutu</h4>
                        <div className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-[#f5f0e6]'}`}>
                            <button onClick={() => changeFontSize(-2)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors font-bold text-lg">A-</button>
                            <span className="text-xl font-serif font-bold">{fontSize}</span>
                            <button onClick={() => changeFontSize(2)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors font-bold text-lg">A+</button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-3">Görünüm</h4>
                        <div className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-[#f5f0e6] hover:bg-[#ebe5da]'}`} onClick={toggleDarkMode}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{darkMode ? '🌙' : '☀️'}</span>
                                <span className="font-medium">{darkMode ? 'Gece Modu' : 'Gündüz Modu'}</span>
                            </div>
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-amber-600' : 'bg-gray-300'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
