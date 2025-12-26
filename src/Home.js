import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle } from './firebase';
import useGoogleOneTap from './reader/hooks/useGoogleOneTap';
import UserMenu from './components/UserMenu';
import LicenseModal from './components/modals/LicenseModal';

export default function Home({ onNavigate, isAdmin, darkMode, toggleDarkMode, onOpenBookmarks, onOpenSearch, onLogout, onLogin }) {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLicenseOpen, setIsLicenseOpen] = useState(false);

    // Google One Tap Hook'u (Kullanıcı yoksa çalışır)
    useGoogleOneTap(user);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Scroll Down Handler
    const scrollToNext = () => {
        const container = document.getElementById('home-container');
        const height = window.innerHeight;
        if (container) {
            container.scrollBy({ top: height, behavior: 'smooth' });
        }
    };

    return (
        // MAIN SCROLL CONTAINER
        <div
            id="home-container"
            className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-[#fdfbf7] text-gray-800 font-sans"
        >

            {/* 1. HERO SECTION (Full Page) */}
            <div className="relative snap-start h-screen w-full flex items-center justify-center bg-gray-900 overflow-hidden shrink-0">

                {/* User Menu - Top Right */}
                <div className="absolute top-6 right-6 z-50">
                    {user && (
                        <div className="relative flex items-center gap-3">
                            {isAdmin && (
                                <button
                                    onClick={() => onNavigate('admin')}
                                    className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-bold text-sm hover:bg-yellow-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-xl border-2 border-transparent hover:border-white/20"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    Yönetici Paneli
                                </button>
                            )}

                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-lg transition-transform active:scale-95">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white">
                                        <span className="text-lg font-bold">{user.displayName ? user.displayName.charAt(0) : 'U'}</span>
                                    </div>
                                )}
                            </button>

                            <UserMenu
                                isOpen={isMenuOpen}
                                onClose={() => setIsMenuOpen(false)}
                                user={user}
                                darkMode={darkMode}
                                toggleDarkMode={toggleDarkMode}
                                onOpenBookmarks={onOpenBookmarks}
                                onOpenSearch={onOpenSearch}
                                onLogout={onLogout}
                                isAdmin={isAdmin}
                                onOpenAdmin={() => onNavigate('admin')}
                            />
                        </div>
                    )}
                </div>

                {/* Arkaplan Resmi - Fixed path and z-index */}
                <div
                    className="absolute inset-0 opacity-40 bg-cover bg-center pointer-events-none"
                    style={{
                        backgroundImage: "url('/hero_bg.png')",
                        backgroundColor: '#111827' // Fallback color
                    }}
                ></div>

                {/* Gradient Overlay for Readability - Inverted: Light Top -> Dark Bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/40 to-gray-950 pointer-events-none"></div>

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-full pt-10">
                    <h1 className="text-4xl md:text-7xl font-serif text-white mb-6 tracking-wide drop-shadow-2xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Risale-i Nur
                    </h1>
                    <p className="text-lg md:text-2xl text-gray-100 font-light mb-12 leading-relaxed opacity-0 animate-fade-in-up drop-shadow-md" style={{ animationDelay: '0.3s' }}>
                        "Zaman ihtiyarladıkça, Kur'an gençleşiyor." <br />
                        <div className="flex items-center justify-center gap-3 mt-4 opacity-90">
                            <img src="/said.png" alt="Bediüzzaman Said Nursi" className="w-12 h-12 rounded-full border-2 border-white/30 shadow-lg object-cover" />
                            <span className="text-sm font-medium text-yellow-500">Bediüzzaman Said Nursi</span>
                        </div>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                        <button
                            onClick={() => onNavigate('library')}
                            className="w-full sm:w-auto px-10 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-yellow-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-xl border-2 border-transparent hover:border-white/20"
                        >
                            {user ? 'Külliyata Git' : 'Okumaya Başla'}
                        </button>

                        {!user && (
                            <button
                                onClick={loginWithGoogle}
                                className="w-full sm:w-auto px-8 py-4 bg-[#4285F4] text-white rounded-full font-bold text-lg hover:bg-[#3367D6] transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6 bg-white rounded-full p-1 text-[#4285F4]" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 8.84-4.15 8.84-8.83 0-.63-.09-1.25-.13-1.84z" /></svg>
                                Google ile Giriş
                            </button>
                        )}
                    </div>

                    {/* Admin Button Mobile View (Below Main Buttons) */}
                    {isAdmin && (
                        <div className="mt-6 md:hidden animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                            <button onClick={() => onNavigate('admin')} className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/20 transition-all text-sm font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Yönetici Paneli
                            </button>
                        </div>
                    )}

                    {/* Scroll Down Indicator */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer opacity-80 hover:opacity-100 transition-opacity z-20" onClick={scrollToNext}>
                        <svg className="w-10 h-10 text-white/50 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    </div>
                </div>
            </div>

            {/* 2. AVANTAJLAR SECTION (Full Page) */}
            <div className={`snap-start min-h-screen w-full flex items-center justify-center border-b py-20 shrink-0 ${darkMode ? 'bg-[#1f2937] border-gray-800' : 'bg-white border-[#e6e0d2]'}`}>
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="text-center mb-16">
                        <h2 className={`text-3xl md:text-5xl font-serif font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Özellikler</h2>
                        <div className="w-24 h-1 bg-yellow-500 mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <FeatureCard
                            icon={<svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                            title="İlerleme Takibi"
                            desc="Kaldığınız yeri otomatik hatırlar, cihazlarınız arası senkronize eder."
                            darkMode={darkMode}
                        />
                        <FeatureCard
                            icon={<svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
                            title="Favorileme"
                            desc="Önemli vecizeleri ve bölümleri kaydedin, kolayca tekrar ulaşın."
                            darkMode={darkMode}
                        />
                        <FeatureCard
                            icon={<svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                            title="Katkıda Bulun"
                            desc="Çeviri önerisi yapın, hataları bildirin. Külliyatı birlikte geliştirelim."
                            darkMode={darkMode}
                        />
                        <FeatureCard
                            icon={<svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                            title="Kişiselleştirme"
                            desc="Gece modu, font boyutu ve tipi seçenekleriyle okuma konforunuzu artırın."
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            </div>

            {/* 3. NEDEN & FOOTER SECTION (Full Page) */}
            <div className={`snap-start min-h-screen w-full flex flex-col justify-between shrink-0 ${darkMode ? 'bg-[#0f1012]' : 'bg-[#fdfbf7]'}`}>
                <div className="flex-grow flex items-center justify-center py-20">
                    <div className="max-w-7xl mx-auto px-6 w-full">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl md:text-5xl font-serif font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Neden Buradayız?</h2>
                            <div className="w-24 h-1 bg-yellow-500 mx-auto rounded-full"></div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                            <WhyCard
                                icon={<svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                title="Mana Odaklı Okuma"
                                desc="Ağır Osmanlıca kelimeler arasında kaybolmayın. Anlık sözlük ve sadeleştirilmiş metin seçenekleriyle manaya odaklanın."
                                darkMode={darkMode}
                            />
                            <WhyCard
                                icon={<svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                title="Topluluk Destekli"
                                desc="Anlamadığınız yerleri sorun, daha iyi bir çeviri önerin. Bu külliyatı hep birlikte geleceğe taşıyoruz."
                                darkMode={darkMode}
                            />
                            <WhyCard
                                icon={<svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                                title="Modern Arayüz"
                                desc="Göz yormayan tasarım, gece modu ve akıllı ayraç sistemi ile okuma deneyiminizi kişiselleştirin."
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <footer className={`py-12 text-center border-t w-full shrink-0 ${darkMode ? 'bg-[#0a0a0c] border-gray-800 text-gray-500' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>
                    <div className="max-w-4xl mx-auto px-6">
                        <p className={`mb-4 text-lg font-serif ${darkMode ? 'text-gray-300' : 'text-gray-300'}`}>Risale-i Nur Dijital Platformu</p>
                        <p className="text-sm opacity-60 max-w-2xl mx-auto leading-relaxed">
                            Bu çalışma Allah rızası için hazırlanmıştır ve tamamen ücretsizdir. <br />
                            Kaynak kodları açıktır ve geliştirilmeye açıktır.
                        </p>
                        <div className="mt-8 text-xs opacity-70 flex flex-col md:flex-row justify-center items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span>2025 v0.1.0 Beta</span>
                                <span className="w-1 h-1 bg-current rounded-full"></span>
                                <span>Mustafa Turan Canbeyli</span>
                            </div>

                            <button
                                onClick={() => setIsLicenseOpen(true)}
                                className={`px-3 py-1 rounded border transition-colors ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-700 hover:bg-gray-800 hover:text-white'}`}
                            >
                                📜 Kaynak ve Lisans
                            </button>
                        </div>
                    </div>
                </footer>
            </div>

            <LicenseModal
                isOpen={isLicenseOpen}
                onClose={() => setIsLicenseOpen(false)}
                darkMode={darkMode}
            />
        </div>
    );
}

function FeatureCard({ icon, title, desc, darkMode }) {
    return (
        <div className={`p-8 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group h-full ${darkMode ? 'bg-[#1a1b1e] border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`mb-6 inline-block p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {icon}
            </div>
            <h4 className={`font-bold text-xl mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{title}</h4>
            <p className={`leading-relaxed text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
        </div>
    );
}

function WhyCard({ icon, title, desc, darkMode }) {
    return (
        <div className={`flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-300 group ${darkMode ? 'hover:bg-[#1a1b1e]' : 'hover:bg-white hover:shadow-xl'}`}>
            <div className={`mb-6 p-4 rounded-full shadow-md text-gray-800 transition-colors ${darkMode ? 'bg-gray-800 group-hover:text-yellow-500' : 'bg-white group-hover:text-yellow-600'}`}>
                {icon}
            </div>
            <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{title}</h3>
            <p className={`leading-relaxed text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {desc}
            </p>
        </div>
    );
}