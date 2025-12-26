import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '../../context/ToastContext';

const THEMES = [
    { id: 'classic', name: 'Klasik', from: '#1a0f0a', via: '#2c1a12', to: '#0f0502', label: 'Klasik' },
    { id: 'royal', name: 'Asil', from: '#1e1b4b', via: '#312e81', to: '#0f0529', label: 'Mor' },
    { id: 'ocean', name: 'Okyanus', from: '#022c22', via: '#0f766e', to: '#042f2e', label: 'Turkuaz' },
    { id: 'sunset', name: 'Gün Batımı', from: '#450a0a', via: '#7f1d1d', to: '#2a0a0a', label: 'Kızıl' },
    { id: 'midnight', name: 'Gece', from: '#000000', via: '#18181b', to: '#000000', label: 'Siyah' }
];

const QuoteCardModal = ({ isOpen, onClose, text, source, author = "Bediüzzaman Said Nursi" }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 3, // Daha yüksek kalite
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
            });

            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement('a');
            link.href = image;
            link.download = `risale-i-nur-soz-kart-${Date.now()}.png`;
            link.click();

            showToast("Kart başarıyla galerine kaydedildi.", "success");
        } catch (error) {
            console.error("Kart oluşturulurken hata:", error);
            showToast("Görsel oluşturulamadı, tekrar deneyin.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-lg flex flex-col gap-8" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-center text-white/90 px-2">
                    <h3 className="text-xl font-bold flex items-center gap-2 tracking-wide">📷 Söz Paylaş</h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95 text-xl">✕</button>
                </div>

                {/* VISIBLE PREVIEW WRAPPER */}
                <div className="flex justify-center w-full">
                    {/* Size Warning */}
                    {text.length > 800 ? (
                        <div className="text-white text-center p-12 bg-red-900/40 border border-red-500/50 rounded-2xl w-full">
                            <div className="text-5xl mb-6">⚠️</div>
                            <h3 className="text-2xl font-bold mb-3">Metin Çok Uzun</h3>
                            <p className="opacity-80 text-lg">Lütfen daha kısa bir bölüm seçin.<br />(Maksimum 800 karakter)</p>
                        </div>
                    ) : (
                        /* CARD CONTAINER SCALED DOWN FOR PREVIEW BUT RENDERED FULL SIZE */
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ maxHeight: '70vh', aspectRatio: '4/5' }}>
                            <div className="w-full h-full transform origin-top-left" style={{
                                width: '1080px',
                                height: '1350px',
                                transform: 'scale(calc(min(90vw, 500px) / 1080))', // Responsive scaling
                            }}>
                                {/* ACTUAL CARD TEXTURE & CONTENT */}
                                <div
                                    ref={cardRef}
                                    className="w-[1080px] h-[1350px] relative flex flex-col items-center justify-between p-[120px] text-center"
                                    style={{
                                        background: `linear-gradient(135deg, ${selectedTheme.from} 0%, ${selectedTheme.via} 60%, ${selectedTheme.to} 100%)`
                                    }}
                                >
                                    {/* Texture Overlay */}
                                    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                                        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")' }}>
                                    </div>

                                    {/* Ornamental Borders */}
                                    <div className="absolute top-12 left-12 w-48 h-48 border-t-[3px] border-l-[3px] border-amber-500/30 rounded-tl-[4rem]"></div>
                                    <div className="absolute bottom-12 right-12 w-48 h-48 border-b-[3px] border-r-[3px] border-amber-500/30 rounded-br-[4rem]"></div>

                                    {/* CONTENT */}
                                    <div className="flex-1 flex flex-col items-center justify-center w-full z-10 pt-16">
                                        <span className="text-[140px] text-amber-500/10 font-serif leading-none mb-8 select-none">“</span>

                                        <p className={`font-serif text-[#f8fafc] leading-[1.6] tracking-wide drop-shadow-xl text-shadow-sm
                                            ${text.length < 150 ? 'text-[58px] px-8' :
                                                text.length < 300 ? 'text-[48px] px-4' :
                                                    text.length < 500 ? 'text-[42px]' : 'text-[36px]'}
                                        `} style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                            {text}
                                        </p>

                                        <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-16 mb-12"></div>
                                    </div>

                                    {/* FOOTER */}
                                    <div className="flex flex-col items-center gap-6 z-10 w-full">
                                        <h3 className="text-amber-500 font-bold text-[32px] uppercase tracking-[0.25em] drop-shadow-lg font-sans">
                                            {author}
                                        </h3>

                                        {source && (
                                            <div className="px-8 py-3 border border-amber-500/20 rounded-full bg-black/30 backdrop-blur-sm mt-2">
                                                <span className="text-amber-100/90 text-[26px] font-light tracking-wider font-serif italic">
                                                    {source}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-col items-center mt-12 opacity-80">
                                            <span className="text-amber-100/50 text-[22px] font-serif italic mb-3 tracking-wider">...devamı ve daha fazlası</span>
                                            <div className="flex items-center gap-4 bg-black/20 px-6 py-3 rounded-xl border border-white/5">
                                                <img src="/said.png" alt="" className="w-12 h-12 rounded-full ring-2 ring-white/10 shadow-lg" />
                                                <span className="text-white text-[24px] font-mono tracking-[0.15em] lowercase font-medium">e-risale.github.io</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* CONTROLS */}
                <div className="flex flex-col items-center gap-6 mt-4">
                    {/* Theme Selector */}
                    <div className="flex gap-4 p-3 bg-white/5 rounded-full backdrop-blur-xl border border-white/10 shadow-xl overflow-x-auto w-full justify-center max-w-sm">
                        {THEMES.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => setSelectedTheme(theme)}
                                className={`w-12 h-12 rounded-full transition-all duration-300 relative flex-shrink-0 group ${selectedTheme.id === theme.id ? 'ring-4 ring-amber-600 scale-110 shadow-lg shadow-amber-900/40' : 'ring-2 ring-transparent hover:scale-110 opacity-70 hover:opacity-100'}`}
                                title={theme.name}
                            >
                                <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.via})` }}></div>
                                {selectedTheme.id === theme.id && <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">✓</div>}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full max-w-sm py-4 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white rounded-2xl font-bold text-xl shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {isGenerating ? <span className="animate-spin">⏳</span> : <span>⬇️</span>}
                        Kartı İndir & Paylaş
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuoteCardModal;
