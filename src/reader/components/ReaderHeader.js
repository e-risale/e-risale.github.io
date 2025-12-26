import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const FONTS = ['Lora', 'Merriweather', 'Roboto', 'Open Sans'];

const ReaderHeader = ({
    showControls,
    sidebarOpen,
    setSidebarOpen,
    activeChapterTitle,
    textMode,
    setTextMode,
    isAdmin,
    unreadCount,
    isToolsMenuOpen,
    setIsToolsMenuOpen,
    darkMode,
    toggleDarkMode, // Added
    user,
    onQuickBookmark,
    activeBookTitle,
    onBack,
    fontSize,
    changeFontSize,
    fontFamily,
    setFontFamily,
    onOpenQuoteModal,
    onOpenFeedback,
    onLogout,
    onGoToAdmin,
    onSwitchMode,
    onOpenSearch, // Added
    onOpenBookmarks // Added
}) => {

    const handleModeCycle = () => {
        const modes = ['original', 'tagged', 'modern'];
        const currentIdx = modes.indexOf(textMode);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        setTextMode(nextMode);
    };

    const cycleFont = (direction) => {
        const currentFontIndex = FONTS.indexOf(fontFamily);
        let newIndex = currentFontIndex + direction;
        if (newIndex < 0) newIndex = FONTS.length - 1;
        if (newIndex >= FONTS.length) newIndex = 0;
        setFontFamily(FONTS[newIndex]);
    };

    const getModeLabel = (mode) => {
        switch (mode) {
            case 'original': return 'Orijinal';
            case 'tagged': return 'Etiketli';
            case 'modern': return 'Güncel';
            default: return 'Etiketli';
        }
    };

    const getModeIcon = (mode) => {
        switch (mode) {
            case 'original': return '📜';
            case 'tagged': return '🏷️';
            case 'modern': return '✨';
            default: return '🏷️';
        }
    };

    const getModeClasses = (mode) => {
        if (textMode !== mode) return darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600';
        if (mode === 'original') return darkMode ? 'bg-amber-900/40 text-amber-200 border border-amber-800' : 'bg-amber-50 text-amber-900 border border-amber-200';
        if (mode === 'tagged') return darkMode ? 'bg-blue-900/40 text-blue-200 border border-blue-800' : 'bg-blue-50 text-blue-900 border border-blue-200';
        if (mode === 'modern') return darkMode ? 'bg-purple-900/40 text-purple-200 border border-purple-800' : 'bg-purple-50 text-purple-900 border border-purple-200';
        return '';
    };

    const menuItemClass = `w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-amber-50 text-[#5c4033]'}`;

    return (
        <div className={`relative w-full z-30 transition-all duration-300 ${showControls ? '' : '-mt-16'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`shadow-sm backdrop-blur-md border-b transition-all duration-300 ${darkMode ? 'bg-[#1a1b1e]/95 border-gray-700' : 'bg-[#fdfbf7]/95 border-[#edeae6]'}`}>
                <div className={`px-4 md:px-6 py-3 flex justify-between items-center max-w-7xl mx-auto transition-all duration-300 ${sidebarOpen ? 'md:pl-80' : 'pl-4'}`}>

                    <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 md:flex-none">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-lg transition-colors shrink-0 ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-[#5c4033]'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>

                        <div className={`font-serif font-bold truncate text-lg flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-[#5c4033]'}`}>
                            {activeBookTitle && (
                                <>
                                    {onBack ? (
                                        <button
                                            onClick={onBack}
                                            className="hover:underline hover:opacity-80 transition-opacity whitespace-nowrap"
                                            title={`${activeBookTitle} Giriş Sayfasına Git`}
                                        >
                                            {activeBookTitle}
                                        </button>
                                    ) : (
                                        <span className="opacity-70">{activeBookTitle}</span>
                                    )}
                                    <span className="opacity-40 mx-1">|</span>
                                </>
                            )}
                            <span className="truncate">{activeChapterTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative shrink-0 ml-2">

                        {/* MODE TOGGLE: DESKTOP */}
                        <div className={`hidden sm:flex items-center p-1 rounded-full border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                            {['original', 'tagged', 'modern'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setTextMode(mode)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${getModeClasses(mode)}`}
                                >
                                    <span className="mr-1">{getModeIcon(mode)}</span>
                                    {getModeLabel(mode)}
                                </button>
                            ))}
                        </div>

                        {/* MODE TOGGLE: MOBILE */}
                        <button
                            onClick={handleModeCycle}
                            className={`sm:hidden w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 border ${textMode === 'original' ? (darkMode ? 'bg-amber-900/30 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-300') :
                                textMode === 'tagged' ? (darkMode ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-100 text-blue-800 border-blue-300') :
                                    (darkMode ? 'bg-purple-900/30 text-purple-300 border-purple-700' : 'bg-purple-100 text-purple-800 border-purple-300')
                                }`}
                        >
                            <span className="text-lg">{getModeIcon(textMode)}</span>
                        </button>

                        <button
                            onClick={onQuickBookmark}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 border mr-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-rose-400 hover:bg-gray-700' : 'bg-white border-rose-200 text-rose-600 hover:border-rose-400'}`}
                            title="Hızlı Ayraç Ekle"
                        >
                            <span className="text-sm">🔖</span>
                        </button>

                        <button
                            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 border relative ${isToolsMenuOpen ? (darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-amber-200 text-amber-900 shadow-inner') : (darkMode ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white' : 'bg-white border-[#e6e0d2] text-[#5c4033] hover:border-amber-200 hover:text-amber-800')}`}
                        >
                            {user && user.photoURL ? (
                                <img src={user.photoURL} alt="Profil" className="w-full h-full rounded-full object-cover p-0.5" />
                            ) : (
                                <span className="text-xl leading-none mb-1">⋮</span>
                            )}

                            {isAdmin && unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold border border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* TOOLS DROPDOWN MENU */}
                        <AnimatePresence>
                            {isToolsMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    className={`absolute top-12 right-0 w-72 rounded-xl shadow-2xl border overflow-hidden origin-top-right z-50 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-[#fffbf5] border-amber-100'}`}
                                >
                                    <div className="p-2 space-y-1">
                                        {/* ARAMA */}
                                        <button onClick={() => { onOpenSearch(); setIsToolsMenuOpen(false); }} className={menuItemClass}>
                                            <span className="text-xl w-6 flex justify-center">🔍</span>
                                            <span className="font-medium text-sm">Arama</span>
                                        </button>

                                        {/* AYRAÇLAR */}
                                        <button onClick={() => { onOpenBookmarks(); setIsToolsMenuOpen(false); }} className={menuItemClass}>
                                            <span className="text-xl w-6 flex justify-center">🔖</span>
                                            <span className="font-medium text-sm">Ayraçlar</span>
                                        </button>

                                        {/* GECE MODU */}
                                        <button onClick={() => { toggleDarkMode(); setIsToolsMenuOpen(false); }} className={menuItemClass}>
                                            <span className="text-xl w-6 flex justify-center">{darkMode ? '☀️' : '🌙'}</span>
                                            <span className="font-medium text-sm">{darkMode ? 'Gündüz Modu' : 'Gece Modu'}</span>
                                        </button>

                                        {/* FONT SETTINGS AREA (Replacing 'Diğer Ayarlar') */}
                                        <div className={`mt-2 mb-2 pt-3 pb-2 px-2 border-t border-b ${darkMode ? 'border-gray-700 bg-black/10' : 'border-amber-100 bg-amber-50/50'}`}>
                                            <div className="space-y-3">
                                                {/* Font Family Carousel */}
                                                <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10 p-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); cycleFont(-1); }}
                                                        className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-amber-100 text-amber-800'}`}
                                                    >
                                                        ‹
                                                    </button>
                                                    <span
                                                        className={`text-sm font-medium select-none truncate px-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
                                                        style={{ fontFamily: `'${fontFamily}', serif` }}
                                                    >
                                                        {fontFamily}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); cycleFont(1); }}
                                                        className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-amber-100 text-amber-800'}`}
                                                    >
                                                        ›
                                                    </button>
                                                </div>

                                                {/* Font Size */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); changeFontSize(-2); }}
                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${darkMode ? 'border-gray-600 hover:bg-white/10 text-gray-300' : 'bg-white border-amber-200 hover:bg-amber-50 text-amber-900 shadow-sm'}`}
                                                    >
                                                        A-
                                                    </button>
                                                    <span className={`text-sm font-bold font-serif w-8 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fontSize}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); changeFontSize(2); }}
                                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${darkMode ? 'border-gray-600 hover:bg-white/10 text-gray-300' : 'bg-white border-amber-200 hover:bg-amber-50 text-amber-900 shadow-sm'}`}
                                                    >
                                                        A+
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <>
                                                <button onClick={() => { onGoToAdmin(); setIsToolsMenuOpen(false); }} className={`${menuItemClass} ${darkMode ? 'text-amber-500' : 'text-amber-600'}`}>
                                                    <span className="text-xl w-6 flex justify-center">🛡️</span>
                                                    <span className="font-medium text-sm">Yönetim Paneli</span>
                                                </button>
                                                <button onClick={() => { onSwitchMode(); setIsToolsMenuOpen(false); }} className={menuItemClass}>
                                                    <span className="text-xl w-6 flex justify-center">📝</span>
                                                    <span className="font-medium text-sm">Editör Modu</span>
                                                </button>
                                            </>
                                        )}

                                        {user && (
                                            <button onClick={() => { onLogout(); setIsToolsMenuOpen(false); }} className={`${menuItemClass} text-red-500 hover:bg-red-50 hover:text-red-600`}>
                                                <span className="text-xl w-6 flex justify-center">🚪</span>
                                                <span className="font-medium text-sm">Çıkış Yap</span>
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaderHeader;
