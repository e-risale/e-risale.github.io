import React from 'react';

const ToolsMenu = ({
    isOpen,
    onClose,
    onOpenSearch,
    onOpenBookmarks,
    onQuickBookmark,
    onOpenSettings,
    onOpenAdmin,
    isAdmin,
    unreadCount,
    bookmarksCount,
    darkMode,
    toggleDarkMode,
    user,
    onLogin,
    onLogout
}) => {
    if (!isOpen) return null;

    const menuItemClass = `w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-medium text-sm rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-amber-50 text-[#5c4033]'}`;

    return (
        <>
            <div
                onClick={(e) => e.stopPropagation()}
                className={`fixed top-[70px] right-4 md:right-8 w-64 p-2 rounded-2xl shadow-2xl flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 border z-[100] ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-amber-100'}`}
            >
                {/* Giriş Yap (Sadece çıkış yapmışsa en üstte) */}
                {!user && (
                    <button onClick={() => { onLogin(); onClose(); }} className={menuItemClass}>
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-100 border-gray-300'}`}>
                            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                        </div>
                        <span>Giriş Yap</span>
                    </button>
                )}

                {/* Arama */}
                <button onClick={() => { onOpenSearch(); onClose(); }} className={menuItemClass}>
                    <span className="text-xl w-6 flex justify-center">🔍</span>
                    <span>Arama</span>
                </button>

                {/* Ayraçlar */}
                <button onClick={() => { onOpenBookmarks(); onClose(); }} className={menuItemClass}>
                    <div className="relative w-6 flex justify-center">
                        <span className="text-xl">🔖</span>
                        {bookmarksCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>}
                    </div>
                    <span>Ayraçlar</span>
                </button>

                {/* Gece/Gündüz Modu */}
                <button onClick={() => { toggleDarkMode(); onClose(); }} className={menuItemClass}>
                    <span className="text-xl w-6 flex justify-center">{darkMode ? '☀️' : '🌙'}</span>
                    <span>{darkMode ? 'Gündüz Modu' : 'Gece Modu'}</span>
                </button>

                {/* Diğer Ayarlar */}
                <button onClick={() => { onOpenSettings(); onClose(); }} className={menuItemClass}>
                    <span className="text-xl w-6 flex justify-center">⚙️</span>
                    <span>Diğer Ayarlar</span>
                </button>

                {/* Admin */}
                {isAdmin && (
                    <>
                        <div className={`my-1 h-px w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                        <button onClick={() => { onOpenAdmin(); onClose(); }} className={`${menuItemClass} ${darkMode ? 'text-amber-500 hover:text-amber-400' : 'text-amber-600 hover:text-amber-700'}`}>
                            <div className="relative w-6 flex justify-center">
                                <span className="text-xl">🛡️</span>
                                {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                            </div>
                            <span>Yönetim Paneli</span>
                        </button>
                    </>
                )}

                {/* Çıkış Yap (Sadece giriş yapmışsa en altta) */}
                {user && (
                    <>
                        <div className={`my-1 h-px w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                        <button onClick={() => { onLogout(); onClose(); }} className={`${menuItemClass} text-red-500 hover:bg-red-50 hover:text-red-600`}>
                            <span className="text-xl w-6 flex justify-center">🚪</span>
                            <span>Çıkış Yap</span>
                        </button>
                    </>
                )}

            </div>
            {/* Backdrop for closing */}
            <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose}></div>
        </>
    );
};

export default ToolsMenu;
