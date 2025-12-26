import React from 'react';

const AdminDashboard = ({ onNavigate, onBack }) => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                            title="Ana Sayfaya Dön"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Yönetici Paneli</h1>
                    </div>
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
                        onClick={() => onNavigate('ai_editor')}
                    />

                    {/* CARD 2: EDITOR */}
                    <AdminCard
                        title="Metin Editörü"
                        desc="İşlenmiş metinleri düzenle, tashih et ve biçimlendir."
                        icon="✍️"
                        color="bg-blue-100 text-blue-700"
                        onClick={() => onNavigate('editor')}
                    />

                    {/* CARD 3: MESSAGE MANAGER */}
                    <AdminCard
                        title="Mesaj & Geri Bildirim"
                        desc="Kullanıcılardan gelen hataları, önerileri ve yorumları yönet."
                        icon="💬"
                        color="bg-amber-100 text-amber-700"
                        onClick={() => onNavigate('admin_messages')}
                    />

                    {/* CARD 4: DICTIONARY MANAGER */}
                    <AdminCard
                        title="Sözlük Yönetimi"
                        desc="Sözlük veritabanını ara, düzenle, sil veya yeni kelime ekle."
                        icon="📚"
                        color="bg-emerald-100 text-emerald-700"
                        onClick={() => onNavigate('admin_dictionary')}
                    />
                    {/* CARD 5: PUBLICATION MANAGER */}
                    <AdminCard
                        title="Yayın Yönetimi"
                        desc="Hangi kitapların ve bölümlerin yayında olacağını kontrol et."
                        icon="📢"
                        color="bg-rose-100 text-rose-700"
                        onClick={() => onNavigate('admin_publication')}
                    />
                </div>
            </main>
        </div>
    );
};

const AdminCard = ({ title, desc, icon, color, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-start p-8 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group h-full"
        >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-6 ${color} group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">{desc}</p>
        </button>
    );
};

export default AdminDashboard;
