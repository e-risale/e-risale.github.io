import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, db } from './firebase';
import { collection, query, orderBy, getDocs, limit, addDoc, serverTimestamp, where, deleteDoc, doc } from 'firebase/firestore';
import useGoogleOneTap from './reader/hooks/useGoogleOneTap';
import UserMenu from './components/UserMenu';
import LicenseModal from './components/modals/LicenseModal';
import { CONFIG } from './config';
import emailjs from '@emailjs/browser';

export default function Home({ onNavigate, isAdmin, darkMode, toggleDarkMode, onOpenBookmarks, onOpenSearch, onLogout, onLogin }) {
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLicenseOpen, setIsLicenseOpen] = useState(false);

    // --- YENİ: Dinamik Güncellemeler State'i ---
    const [updates, setUpdates] = useState([]);
    const [loadingUpdates, setLoadingUpdates] = useState(true);

    // Google One Tap Hook
    useGoogleOneTap(user);

    // Auth Listener
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // --- YENİ: Firebase'den Güncellemeleri Çek ---
    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                // Son 10 güncellemeyi, tarihe göre yeniden eskiye çek
                const q = query(collection(db, "updates"), orderBy("date", "desc"), limit(10));
                const querySnapshot = await getDocs(q);
                const updatesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                if (updatesData.length > 0) {
                    setUpdates(updatesData);
                }
            } catch (error) {
                console.error("Error fetching updates:", error);
            } finally {
                setLoadingUpdates(false);
            }
        };

        fetchUpdates();
    }, []);

    return (
        // MAIN CONTAINER - Standard Scroll, Theme Awareness
        <div
            id="home-container"
            className={`min-h-screen w-full font-sans overflow-x-hidden flex flex-col ${darkMode ? 'bg-[#111827] text-gray-200' : 'bg-[#fdfbf7] text-gray-800'}`}
        >

            {/* 1. HERO SECTION - Always Dark/Impactful but fits theme */}
            <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-900 py-20 lg:py-0 shrink-0">

                {/* Background Image */}
                <div
                    className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none transform scale-105"
                    style={{
                        backgroundImage: "url('/hero_bg.png')",
                        backgroundColor: '#111827'
                    }}
                ></div>

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/80 to-gray-900/20 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent md:hidden pointer-events-none"></div>

                {/* Top Right Menu */}
                <div className="absolute top-6 right-6 z-50">
                    {user && (
                        <div className="relative flex items-center gap-3">
                            {isAdmin && (
                                <button
                                    onClick={() => onNavigate('admin')}
                                    className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-bold text-sm hover:bg-yellow-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-xl border-2 border-transparent hover:border-white/20"
                                >
                                    <span>Yönetici Paneli</span>
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

                {/* Hero Content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

                        {/* LEFT: Text & CTA */}
                        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
                            <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-sm text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2 shadow-lg shadow-black/20">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                    </span>
                                    Yeni Dijital Deneyim
                                </div>

                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white font-bold leading-tight drop-shadow-2xl">
                                    Risale-i Nur <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">Külliyatı</span>
                                </h1>
                            </div>

                            <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl leading-relaxed animate-fade-in-up drop-shadow-md" style={{ animationDelay: '0.3s' }}>
                                "Zaman ihtiyarladıkça, Kur'an gençleşiyor." hakikatinin ışığında; <br className="hidden md:block" />
                                kelime, lügat ve tefsir destekli modern okuma platformu.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                                <button
                                    onClick={() => onNavigate('library')}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-bold text-lg hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-yellow-500/20 flex items-center justify-center gap-2"
                                >
                                    <span>{user ? 'Külliyata Git' : 'Okumaya Başla'}</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </button>

                                {!user && (
                                    <button
                                        onClick={loginWithGoogle}
                                        className="w-full sm:w-auto px-8 py-4 bg-white/5 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3 hover:border-white/40"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12.5S6.42 23 12.1 23c5.83 0 8.84-4.15 8.84-8.83 0-.63-.09-1.25-.13-1.84z" /></svg>
                                        Giriş Yap
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Updates Panel */}
                        <div className="lg:col-span-5 w-full animate-fade-in-up flex flex-col h-[500px] mt-8 lg:mt-0" style={{ animationDelay: '0.6s' }}>
                            <div className="bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col h-full ring-1 ring-white/5 hover:ring-white/10 transition-all duration-500 hover:bg-gray-800/50">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        <span className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-500 p-2 rounded-lg border border-yellow-500/10">✨</span>
                                        Son Yenilikler
                                    </h3>
                                    <span className="text-[10px] font-mono text-gray-400 bg-black/30 px-2 py-1 rounded border border-white/5">v0.1.0 Beta</span>
                                </div>

                                <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {loadingUpdates ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
                                            <div className="w-5 h-5 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                                            Yükleniyor...
                                        </div>
                                    ) : updates.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                                            Henüz bir duyuru yok.
                                        </div>
                                    ) : (
                                        updates.map((update) => (
                                            <div key={update.id} className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-2 relative z-10">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${update.type === 'book' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' :
                                                            update.type === 'feature' ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' :
                                                                'bg-green-500/10 border-green-500/20 text-green-300'
                                                        }`}>
                                                        {update.type === 'book' ? 'KİTAP' : update.type === 'feature' ? 'ÖZELLİK' : 'DUYURU'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-mono">{update.date}</span>
                                                </div>
                                                <h4 className="text-white font-bold text-sm mb-1 group-hover:text-yellow-400 transition-colors relative z-10">{update.title}</h4>
                                                <p className="text-xs text-gray-400 leading-relaxed mb-3 relative z-10">{update.desc}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/10 relative z-20">
                                    <h4 className="text-white font-bold text-xs mb-2">Güncellemelerden Haberdar Ol</h4>
                                    <NewsletterForm user={user} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* 2. AVANTAJLAR SECTION - Distinct Background for Separatiom */}
            <div className={`w-full py-24 border-b transition-colors duration-500 ${darkMode ? 'bg-[#1f2937] border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="text-center mb-16">
                        <h2 className={`text-3xl md:text-5xl font-serif font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Özellikler</h2>
                        <div className="w-24 h-1 bg-yellow-500 mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <FeatureCard
                            icon={<svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                            title="İlerleme Takibi"
                            desc="Kaldığınız yeri otomatik hatırlar, cihazlarınız arası senkronize eder."
                            darkMode={darkMode}
                        />
                        <FeatureCard
                            icon={<svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
                            title="Favorileme"
                            desc="Önemli vecizeleri ve bölümleri kaydedin, kolayca tekrar ulaşın."
                            darkMode={darkMode}
                        />
                        <FeatureCard
                            icon={<svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                            title="Katkıda Bulun"
                            desc="Çeviri önerisi yapın, hataları bildirin. Külliyatı birlikte geliştirelim."
                            darkMode={darkMode}
                        />
                        <FeatureCard
                            icon={<svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                            title="Kişiselleştirme"
                            desc="Gece modu, font boyutu ve tipi seçenekleriyle okuma konforunuzu artırın."
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            </div>

            {/* 3. NEDEN & FOOTER SECTION */}
            <div className={`w-full flex-grow flex flex-col justify-between transition-colors duration-500 ${darkMode ? 'bg-[#111827]' : 'bg-[#fdfbf7]'}`}>
                <div className="flex-grow flex items-center justify-center py-24">
                    <div className="max-w-7xl mx-auto px-6 w-full">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl md:text-5xl font-serif font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Neden Buradayız?</h2>
                            <div className="w-24 h-1 bg-yellow-500 mx-auto rounded-full"></div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                            <WhyCard
                                icon={<svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                                title="Mana Odaklı Okuma"
                                desc="Ağır Osmanlıca kelimeler arasında kaybolmayın. Anlık sözlük ve sadeleştirilmiş metin seçenekleriyle manaya odaklanın."
                                darkMode={darkMode}
                            />
                            <WhyCard
                                icon={<svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                title="Topluluk Destekli"
                                desc="Anlamadığınız yerleri sorun, daha iyi bir çeviri önerin. Bu külliyatı hep birlikte geleceğe taşıyoruz."
                                darkMode={darkMode}
                            />
                            <WhyCard
                                icon={<svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                                title="Modern Arayüz"
                                desc="Göz yormayan tasarım, gece modu ve akıllı ayraç sistemi ile okuma deneyiminizi kişiselleştirin."
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <footer className={`py-12 text-center border-t w-full ${darkMode ? 'bg-[#0a0a0c] border-gray-800 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                    <div className="max-w-4xl mx-auto px-6">
                        <p className={`mb-4 text-lg font-serif ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Risale-i Nur Dijital Platformu</p>
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
                                className="px-3 py-1 rounded border border-gray-500/30 hover:bg-gray-500/20 transition-colors"
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

// Sub-components with Conditional Styling for Light/Dark
function FeatureCard({ icon, title, desc, darkMode }) {
    return (
        <div className={`p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 group h-full shadow-sm hover:shadow-xl ${darkMode
                ? 'bg-[#1a1b1e] border-gray-800 hover:bg-[#25282e]'
                : 'bg-white border-gray-100 hover:border-yellow-100'
            }`}>
            <div className={`mb-6 inline-block p-4 rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110 ${darkMode ? 'bg-[#25282e]' : 'bg-gray-50'
                }`}>
                {icon}
            </div>
            <h4 className={`font-bold text-xl mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h4>
            <p className={`leading-relaxed text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
        </div>
    );
}

function WhyCard({ icon, title, desc, darkMode }) {
    return (
        <div className={`flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-300 group ${darkMode ? 'hover:bg-[#1f2937]' : 'hover:bg-white hover:shadow-xl bg-transparent'
            }`}>
            <div className={`mb-6 p-4 rounded-full shadow-lg transition-colors group-hover:scale-110 duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white text-yellow-600'
                }`}>
                {icon}
            </div>
            <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
            <p className={`leading-relaxed text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {desc}
            </p>
        </div>
    );
}

function NewsletterForm({ user }) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, checking, sending, success, error, exists
    const [subscriptionData, setSubscriptionData] = useState(null); // { id, date } if subscribed

    // 1. Kullanıcı değiştiğinde veya bileşen yüklendiğinde abonelik kontrolü yap
    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
            checkSubscription(user.email);
        } else {
            setSubscriptionData(null);
            setEmail('');
        }
    }, [user]);

    const checkSubscription = async (emailToCheck) => {
        setStatus('checking');
        try {
            const q = query(collection(db, "subscribers"), where("email", "==", emailToCheck));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docData = snapshot.docs[0];
                setSubscriptionData({
                    id: docData.id,
                    date: docData.data().date?.toDate ? docData.data().date.toDate().toLocaleDateString('tr-TR') : 'Tarih yok'
                });
            } else {
                setSubscriptionData(null);
            }
            setStatus('idle');
        } catch (error) {
            console.error("Abonelik kontrol hatası:", error);
            setStatus('idle');
        }
    };

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus('sending');

        try {
            // Mükerrer kontrolü (Manuel girişler için extra güvenlik)
            const q = query(collection(db, "subscribers"), where("email", "==", email));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                setStatus('exists');
                setTimeout(() => setStatus('idle'), 3000);
                return;
            }

            const docRef = await addDoc(collection(db, "subscribers"), {
                email: email,
                date: serverTimestamp()
            });

            // Admin bildirimi
            const templateParams = {
                to_email: 'kolay.risale@gmail.com',
                subject: 'Yeni Bülten Abonesi',
                message: `Yeni abone: ${email}`
            };
            emailjs.send(
                CONFIG.EMAILJS_CONFIG.SERVICE_ID,
                CONFIG.EMAILJS_CONFIG.TEMPLATE_ID,
                templateParams,
                CONFIG.EMAILJS_CONFIG.PUBLIC_KEY
            ).catch(err => console.error("Mail error", err));

            // Başarılı durumu güncelle
            setSubscriptionData({
                id: docRef.id,
                date: new Date().toLocaleDateString('tr-TR')
            });
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);

        } catch (error) {
            console.error(error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const handleUnsubscribe = async () => {
        if (!subscriptionData?.id) return;
        if (!window.confirm("Bülten aboneliğinden ayrılmak istiyor musunuz?")) return;

        setStatus('sending');
        try {
            // ID'ye göre sil
            await deleteDoc(doc(db, "subscribers", subscriptionData.id));
            setSubscriptionData(null); // State'i temizle -> Form geri gelir
            setStatus('idle');
            // Eğer giriş yapmış kullanıcıysa maili geri doldur
            if (user?.email) setEmail(user.email);
        } catch (error) {
            console.error("Abonelikten çıkma hatası:", error);
            setStatus('error');
        }
    };

    // RENDERING
    if (status === 'checking') {
        return <div className="text-xs text-gray-400 animate-pulse">Abonelik durumu kontrol ediliyor...</div>;
    }

    // Durum: Zaten Abone
    if (subscriptionData) {
        return (
            <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span>{subscriptionData.date} tarihinden beri abonesiniz.</span>
                </div>
                <button
                    onClick={handleUnsubscribe}
                    className="text-xs text-red-400 hover:text-red-300 underline text-left w-fit"
                >
                    Abonelikten Çık
                </button>
            </div>
        );
    }

    // Durum: Abone Değil (Form Göster)
    return (
        <form onSubmit={handleSubscribe} className="flex items-center gap-2">
            <input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!!user?.email}
                className={`flex-grow bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500/50 transition-colors ${user?.email ? 'opacity-80 cursor-not-allowed' : ''}`}
                disabled={!!user?.email} // Disable user email to prevent confusion
            />
            <button
                type="submit"
                disabled={status === 'sending' || status === 'success' || status === 'exists'}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${status === 'success' ? 'bg-green-500 text-white' :
                        status === 'exists' ? 'bg-orange-500 text-white' :
                            status === 'error' ? 'bg-red-500 text-white' :
                                'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                    }`}
            >
                {status === 'sending' ? '...' :
                    status === 'success' ? '✓' :
                        status === 'exists' ? 'Kayıtlı!' :
                            status === 'error' ? 'Hata!' :
                                'Abone Ol'}
            </button>
        </form>
    );
}