import React from 'react';

const AdminDashboard = ({ onNavigate, onBack, darkMode, toggleDarkMode }) => {
    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#1a1b1e] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-30 border-b transition-colors duration-300 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className={`p-2 -ml-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="Ana Sayfaya Dön"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Yönetici Paneli</h1>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-amber-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        title={darkMode ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* CARD 1: AI EDITOR */}
                    <AdminCard
                        title="AI Kelime İşlemci"
                        desc="Ham metinleri işaretlemek ve işlemek için AI destekli editör."
                        icon="🤖"
                        color="bg-purple-100 text-purple-700"
                        darkMode={darkMode}
                        onClick={() => onNavigate('ai_editor')}
                    />

                    {/* CARD 2: EDITOR */}
                    <AdminCard
                        title="Metin Editörü"
                        desc="İşlenmiş metinleri düzenle, tashih et ve biçimlendir."
                        icon="✍️"
                        color="bg-blue-100 text-blue-700"
                        darkMode={darkMode}
                        onClick={() => onNavigate('editor')}
                    />

                    {/* CARD 3: MESSAGE MANAGER */}
                    <AdminCard
                        title="Mesaj & Geri Bildirim"
                        desc="Kullanıcılardan gelen hataları, önerileri ve yorumları yönet."
                        icon="💬"
                        color="bg-amber-100 text-amber-700"
                        darkMode={darkMode}
                        onClick={() => onNavigate('admin_messages')}
                    />

                    {/* CARD 4: DICTIONARY MANAGER */}
                    <AdminCard
                        title="Sözlük Yönetimi"
                        desc="Sözlük veritabanını ara, düzenle, sil veya yeni kelime ekle."
                        icon="📚"
                        color="bg-emerald-100 text-emerald-700"
                        darkMode={darkMode}
                        onClick={() => onNavigate('admin_dictionary')}
                    />
                    {/* CARD 5: PUBLICATION MANAGER */}
                    <AdminCard
                        title="Yayın Yönetimi"
                        desc="Hangi kitapların ve bölümlerin yayında olacağını kontrol et."
                        icon="📢"
                        color="bg-rose-100 text-rose-700"
                        darkMode={darkMode}
                        onClick={() => onNavigate('admin_publication')}
                    />
                    {/* CARD 6: STATISTICS */}
                    <AdminCard
                        title="İstatistikler"
                        desc="Ziyaretçi sayılarını ve popüler içerikleri analiz et."
                        icon="📊"
                        color="bg-indigo-100 text-indigo-700"
                        darkMode={darkMode}
                        onClick={() => onNavigate('admin_stats')}
                    />

                    {/* CARD 7: UPDATES MANAGER */}
                    <AdminCard
                        title="Duyuru & Yenilikler"
                        desc="Ana sayfadaki güncelleme ve duyuru panosunu yönet."
                        icon="🔔"
                        color="bg-orange-100 text-orange-700"
                        darkMode={darkMode}
                        onClick={() => onNavigate('admin_updates')}
                    />
                </div>
            </main>
        </div>
    );
};

const AdminCard = ({ title, desc, icon, color, onClick, darkMode }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-start p-8 rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group h-full ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}
        >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 ${color} group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className={`text-xl font-bold mb-3 transition-colors ${darkMode ? 'text-gray-200 group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'}`}>{title}</h3>
            <p className={`text-sm leading-relaxed font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
        </button>
    );
};

export default AdminDashboard;
