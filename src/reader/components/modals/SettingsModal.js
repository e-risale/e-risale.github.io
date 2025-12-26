import React from 'react';

const FONTS = ['Lora', 'Merriweather', 'Roboto', 'Open Sans'];

const SettingsModal = ({ isOpen, onClose, darkMode, fontSize, changeFontSize, fontFamily, setFontFamily }) => {
    if (!isOpen) return null;

    const currentFontIndex = FONTS.indexOf(fontFamily);

    const cycleFont = (direction) => {
        let newIndex = currentFontIndex + direction;
        if (newIndex < 0) newIndex = FONTS.length - 1;
        if (newIndex >= FONTS.length) newIndex = 0;
        setFontFamily(FONTS[newIndex]);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
            <div className={`w-full sm:max-w-xs rounded-2xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-[#1a1b1e] border border-gray-700 text-gray-100' : 'bg-[#fffbf5] text-gray-800'}`} onClick={e => e.stopPropagation()}>

                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-800' : 'border-amber-100'}`}>
                    <h3 className="font-bold text-lg flex items-center gap-2">Ayarlar</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors text-lg">✕</button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Font Selection - Carousel Style */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 text-center">Yazı Tipi</h4>
                        <div className={`flex items-center justify-between p-2 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-amber-100'}`}>
                            <button
                                onClick={() => cycleFont(-1)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-xl ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-amber-50 active:bg-amber-100'}`}
                            >
                                ‹
                            </button>

                            <span className="text-lg font-medium select-none min-w-[120px] text-center" style={{ fontFamily: `'${fontFamily}', serif` }}>
                                {fontFamily}
                            </span>

                            <button
                                onClick={() => cycleFont(1)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-xl ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-amber-50 active:bg-amber-100'}`}
                            >
                                ›
                            </button>
                        </div>
                    </div>

                    {/* Font Size Selection */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3 text-center">Yazı Boyutu</h4>
                        <div className={`flex items-center justify-between p-2 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-amber-100'}`}>
                            <button
                                onClick={() => changeFontSize(-2)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors font-bold text-lg ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-amber-50 active:bg-amber-100'}`}
                            >
                                A-
                            </button>

                            <span className="text-xl font-bold font-serif w-12 text-center">{fontSize}</span>

                            <button
                                onClick={() => changeFontSize(2)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors font-bold text-lg ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-amber-50 active:bg-amber-100'}`}
                            >
                                A+
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
