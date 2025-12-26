import React from 'react';

const ReaderHeader = ({
    showControls,
    sidebarOpen,
    setSidebarOpen,
    activeChapterTitle,
    textMode, // 'original' | 'tagged' | 'modern'
    setTextMode,
    isAdmin,
    unreadCount,
    isToolsMenuOpen,
    setIsToolsMenuOpen,
    onSwitchMode, // Editor modu için - ARTIK Header'dan çağırılmıyor (KALDIRILDI) ama prop kalsın mı? User "onSwitchMode'u iptal edelim" dedi görsel olarak. Prop kalabilir.
    darkMode,
    user,
    onQuickBookmark,
    activeBookTitle,
    onBack
}) => {

    const handleModeCycle = () => {
        const modes = ['original', 'tagged', 'modern']; // Cycle order
        const currentIdx = modes.indexOf(textMode);
        const nextMode = modes[(currentIdx + 1) % modes.length];
        setTextMode(nextMode);
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

    // Style logic based on mode
    const getModeClasses = (mode) => {
        if (textMode !== mode) return darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600';
        // Active styles
        if (mode === 'original') return darkMode ? 'bg-amber-900/40 text-amber-200 border border-amber-800' : 'bg-amber-50 text-amber-900 border border-amber-200';
        if (mode === 'tagged') return darkMode ? 'bg-blue-900/40 text-blue-200 border border-blue-800' : 'bg-blue-50 text-blue-900 border border-blue-200';
        if (mode === 'modern') return darkMode ? 'bg-purple-900/40 text-purple-200 border border-purple-800' : 'bg-purple-50 text-purple-900 border border-purple-200';
        return '';
    };

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

                        {/* MODE TOGGLE: DESKTOP (Segmented Control style) */}
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

                        {/* MODE TOGGLE: MOBILE (Cycle Button) */}
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

                        {/* EDIT BUTTON REMOVED as requested */}

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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaderHeader;
