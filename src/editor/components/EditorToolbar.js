import React from 'react';

/**
 * EditorToolbar Component
 * Handles all top bar actions: Navigation, Mode Switching, Formatting, etc.
 * Redesigned for a cleaner, professional look (Monochrome + Accent).
 */
export const EditorToolbar = ({
    activeBookId,
    currentFileName,
    pageIndex,
    pages,
    darkMode,
    mode,
    isFormatMode,
    onCyclePanels,
    onPageChange,
    onToggleDarkMode,
    onToggleEditLock,
    onToggleViewMode,
    onApplyFormat,
    onToggleFormatMode,
    onOpenGlobalSearch,
    onCheckStatus,
    onSwitchMode,
    onAutoTag
}) => {

    const handleJumpToPage = (e) => {
        const targetIndex = parseInt(e.target.value, 10);
        onPageChange(targetIndex);
    };

    // Theme Classes
    const theme = {
        bar: darkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700',
        btn: darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600',
        btnActive: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
        btnDanger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
        input: darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700',
        divider: darkMode ? 'border-gray-700' : 'border-gray-200'
    };

    return (
        <div className={`shrink-0 h-14 border-b flex justify-between items-center px-4 font-sans text-sm ${theme.bar}`}>
            {/* LEFT: Navigation & Info */}
            <div className="flex items-center gap-3">
                <IconButton onClick={onCyclePanels} title="Panelleri Aç/Kapa" theme={theme}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </IconButton>

                <div className={`h-6 w-px border-r ${theme.divider}`}></div>

                {activeBookId ? (
                    <div className="flex items-center gap-1">
                        <IconButton onClick={() => onPageChange(pageIndex - 1)} disabled={pageIndex === 0} theme={theme} title="Önceki Sayfa">←</IconButton>
                        <select
                            value={pageIndex}
                            onChange={handleJumpToPage}
                            className={`h-8 rounded px-2 text-xs font-bold border outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer ${theme.input} max-w-[120px]`}
                        >
                            {pages.map((_, idx) => (<option key={idx} value={idx}>{idx + 1} / {pages.length}</option>))}
                        </select>
                        <IconButton onClick={() => onPageChange(pageIndex + 1)} disabled={pageIndex >= pages.length - 1} theme={theme} title="Sonraki Sayfa">→</IconButton>
                    </div>
                ) : (
                    <span className="opacity-50 italic">Dosya seçilmedi</span>
                )}

                {currentFileName && (
                    <span className="font-mono text-xs opacity-60 ml-2 hidden sm:inline-block truncate max-w-[200px]">{currentFileName}</span>
                )}
            </div>

            {/* RIGHT: Tools & Actions */}
            <div className="flex items-center gap-2">

                {/* 1. Global Tools */}
                <div className="flex items-center gap-1">
                    <button onClick={onOpenGlobalSearch} className={`h-8 px-3 rounded flex items-center gap-2 font-medium transition-colors ${theme.btn}`} title="Tüm Külliyatta Ara">
                        <span>🔍</span> <span className="hidden lg:inline">Ara</span>
                    </button>
                    {/* Auto Tag */}
                    <button onClick={onAutoTag} className={`h-8 px-3 rounded flex items-center gap-2 font-medium transition-colors ${theme.btn}`} title="Otomatik İşaretle">
                        <span className="text-amber-500">⚡</span> <span className="hidden lg:inline">Tara</span>
                    </button>
                    <IconButton onClick={onToggleDarkMode} theme={theme} title="Gece/Gündüz Modu">
                        {darkMode ? '🌙' : '☀️'}
                    </IconButton>
                </div>

                <div className={`h-6 w-px border-r ${theme.divider} mx-1`}></div>

                {/* 2. Formatting (Contextual) */}
                {(isFormatMode || mode === 'write') && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded border ${theme.divider} animate-in fade-in slide-in-from-top-1`}>
                        <FormatButton onClick={() => onApplyFormat('bold')} active={false} theme={theme} title="Kalın">B</FormatButton>
                        <FormatButton onClick={() => onApplyFormat('red')} active={false} theme={theme} title="Kırmızı (Arapça)" className="text-red-500">A</FormatButton>
                        <FormatButton onClick={() => onApplyFormat('center')} active={false} theme={theme} title="Ortala">≡</FormatButton>
                        <FormatButton onClick={() => onApplyFormat('header')} active={false} theme={theme} title="Başlık">H</FormatButton>
                    </div>
                )}

                {/* 3. Mode Toggles */}
                {mode !== 'write' && (
                    <button
                        onClick={() => onToggleFormatMode()}
                        className={`h-8 w-8 flex items-center justify-center rounded transition-all ${isFormatMode ? 'text-amber-600 bg-amber-100 ring-2 ring-amber-500/20' : theme.btn}`}
                        title="Hızlı Format Modu"
                    >
                        🛠️
                    </button>
                )}

                <button
                    onClick={onToggleViewMode}
                    className={`h-8 px-3 rounded text-xs font-bold uppercase tracking-wider transition-all border ${mode === 'tag' ? (darkMode ? 'bg-gray-800 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-300') : (darkMode ? 'bg-teal-900/30 text-teal-400 border-teal-800' : 'bg-teal-50 text-teal-700 border-teal-200')}`}
                    disabled={mode === 'write'}
                    title="Görünüm Değiştir"
                >
                    {mode === 'tag' ? 'ORJİNAL' : 'ÇEVİRİ'}
                </button>

                <button
                    onClick={onToggleEditLock}
                    className={`h-8 px-3 rounded text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${mode === 'write' ? theme.btnDanger : theme.btnActive}`}
                    title={mode === 'write' ? "Düzenlemeyi Bitir" : "Düzenlemeyi Aç"}
                >
                    {mode === 'write' ? (
                        <>🔓 <span className="hidden sm:inline">DÜZENLE</span></>
                    ) : (
                        <>🔒 <span className="hidden sm:inline">OKU</span></>
                    )}
                </button>

                <div className={`h-6 w-px border-r ${theme.divider} mx-1`}></div>

                {/* 4. Exit */}
                <button
                    onClick={() => onSwitchMode && onSwitchMode('admin')}
                    className={`h-8 px-3 rounded font-medium transition-colors ${theme.btn} text-xs`}
                    title="Yönetici Paneline Dön"
                >
                    Çıkış
                </button>
            </div>
        </div>
    );
};

// Sub-components for cleaner code
const IconButton = ({ onClick, children, title, disabled, theme }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`h-8 w-8 flex items-center justify-center rounded transition-colors disabled:opacity-30 ${theme.btn}`}
        title={title}
    >
        {children}
    </button>
);

const FormatButton = ({ onClick, children, title, className = "", theme }) => (
    <button
        onClick={onClick}
        className={`h-6 w-6 flex items-center justify-center rounded text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
        title={title}
    >
        {children}
    </button>
);
