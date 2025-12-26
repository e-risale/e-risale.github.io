import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '../../context/ToastContext';

const THEMES = [
    { id: 'classic', name: 'Klasik', from: '#1a0f0a', via: '#2c1a12', to: '#0f0502', label: 'Klasik' },
    { id: 'royal', name: 'Asil', from: '#1e1b4b', via: '#312e81', to: '#0f0529', label: 'Mor' },
    { id: 'ocean', name: 'Okyanus', from: '#022c22', via: '#0f766e', to: '#042f2e', label: 'Turkuaz' },
    { id: 'sunset', name: 'Gün Batımı', from: '#450a0a', via: '#7f1d1d', to: '#2a0a0a', label: 'Kızıl' },
    { id: 'amber', name: 'Altın', from: '#b45309', via: '#d97706', to: '#78350f', label: 'Altın' }
];

const QuoteCardModal = ({ isOpen, onClose, text, source, author = "Bediüzzaman Said Nursi" }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const { showToast } = useToast();

    // Ensure text is safe
    const safeText = text || "Metin seçilmedi.";

    // Responsive Scale Calculation
    const [scaleFactor, setScaleFactor] = useState(0.4);

    useEffect(() => {
        const calculateScale = () => {
            if (!cardRef.current) return;
            const cardW = 1080;
            const cardH = 1350;
            const availableH = window.innerHeight * 0.75; // Increased view area
            const availableW = Math.min(window.innerWidth * 0.95, 480);

            const hScale = availableH / cardH;
            const wScale = availableW / cardW;

            setScaleFactor(Math.max(Math.min(hScale, wScale), 0.2));
        };

        if (isOpen) {
            calculateScale();
            setTimeout(calculateScale, 100);
            window.addEventListener('resize', calculateScale);
        }
        return () => window.removeEventListener('resize', calculateScale);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 200));  // Wait a bit longer
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                logging: false,
                ignoreElements: (element) => element.id === 'ignore-me'
            });

            const image = canvas.toDataURL("image/png", 0.9);
            const link = document.createElement('a');
            link.href = image;
            link.download = `risale-soz-${Date.now()}.png`;
            link.click();
            showToast("Kart galeriye kaydedildi.", "success");
        } catch (error) {
            console.error("Download Error:", error);
            showToast("Hata oluştu: " + error.message, "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={onClose}>

            {/* Top Bar */}
            <div className="w-full max-w-md flex justify-between items-center text-white mb-4 px-2" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold flex items-center gap-2">📷 Önizleme</h3>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-xl">✕</button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div
                className="relative flex items-center justify-center shadow-2xl rounded-2xl ring-1 ring-white/10 bg-[#1a1a1a] touch-none"
                style={{
                    width: `${1080 * scaleFactor}px`,
                    height: `${1350 * scaleFactor}px`,
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    width: '1080px',
                    height: '1350px',
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    overflow: 'hidden',
                    borderRadius: '0px'
                }}>
                    <div
                        ref={cardRef}
                        className="w-full h-full relative flex flex-col justify-between p-[80px]"
                        style={{
                            background: `linear-gradient(135deg, ${selectedTheme.from} 0%, ${selectedTheme.via} 60%, ${selectedTheme.to} 100%)`
                        }}
                    >
                        {/* CSS Pattern Texture (No External Image = No CORS Errors) */}
                        <div className="absolute inset-0 opacity-[0.3] pointer-events-none mix-blend-overlay"
                            style={{
                                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px), radial-gradient(circle at 0% 0%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                                backgroundSize: '40px 40px, 24px 24px'
                            }}>
                        </div>
                        {/* Vignette Overlay */}
                        <div className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)' }}>
                        </div>

                        {/* TOP LEFT: Book & Chapter Info */}
                        <div className="absolute top-12 left-12 max-w-[600px] text-left z-20">
                            {source && (
                                <div className="flex flex-col gap-2">
                                    <div className="h-1 w-24 bg-amber-500/50 mb-2"></div>
                                    <span className="text-amber-100/90 text-[32px] font-bold font-serif leading-tight drop-shadow-lg">
                                        {source.split(' / ')[0]}
                                    </span>
                                    <span className="text-amber-100/60 text-[26px] font-light font-serif italic">
                                        {source.split(' / ')[1] || ''}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* TOP RIGHT: Icon or Decorative Element */}
                        <div className="absolute top-12 right-12 opacity-20">
                            <img src="/said.png" alt="" className="w-32 h-32 rounded-full grayscale mix-blend-screen" />
                        </div>

                        {/* BORDERS */}
                        <div className="absolute top-8 left-8 w-[calc(100%-64px)] h-[calc(100%-64px)] border border-amber-500/20 rounded-[3rem] pointer-events-none"></div>

                        {/* MAIN CONTENT AREA */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-12 mt-24 mb-12">
                            <span className="text-[140px] text-amber-500/10 font-serif leading-none select-none mb-6 self-start transform -translate-x-4">“</span>

                            <div className="relative w-full">
                                <p className={`font-serif text-[#f8fafc] leading-[1.6] tracking-wide drop-shadow-lg text-center
                                    ${safeText.length < 150 ? 'text-[58px]' :
                                        safeText.length < 300 ? 'text-[48px]' :
                                            safeText.length < 500 ? 'text-[42px]' : 'text-[36px]'}
                                `} style={{ textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>
                                    {safeText}
                                </p>
                            </div>

                            {/* SIGNATURE */}
                            <div className="w-full flex justify-end mt-12 pr-4">
                                <div className="flex flex-col items-end">
                                    <div className="w-16 h-[1px] bg-amber-500/50 mb-4"></div>
                                    <span
                                        className="text-amber-400 font-serif italic text-[36px] tracking-wide"
                                        style={{ fontFamily: safeText.length > 0 ? 'inherit' : 'serif', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                                    >
                                        {author}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex flex-col items-center gap-5 z-10 w-full shrink-0 pb-12">
                            <div className="flex flex-col items-center opacity-90 scale-100">
                                <span className="text-amber-100/60 text-[26px] font-serif italic mb-4 tracking-wider">...devamı ve daha fazlası</span>
                                <div className="flex items-center gap-5 bg-black/40 px-8 py-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                                    <img src="/said.png" alt="" className="w-16 h-16 rounded-full ring-2 ring-amber-500/30 shadow-lg object-cover" />
                                    <span className="text-amber-50 text-[32px] font-mono tracking-[0.1em] lowercase font-medium drop-shadow-md">e-risale.github.io</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTROLS (Below Preview) */}
            <div className="w-full max-w-md flex flex-col gap-4 mt-6 z-[120]" onClick={e => e.stopPropagation()}>
                {/* Colors */}
                <div className="flex justify-center gap-3 p-2 bg-white/10 rounded-2xl backdrop-blur-md overflow-x-auto">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => setSelectedTheme(theme)}
                            className={`w-10 h-10 rounded-full transition-all relative shrink-0 ${selectedTheme.id === theme.id ? 'scale-110 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'}`}
                        >
                            <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.via})` }}></div>
                            {selectedTheme.id === theme.id && <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>}
                        </button>
                    ))}
                </div>

                {/* Download Btn */}
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="w-full py-3 bg-white text-black hover:bg-amber-50 rounded-xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {isGenerating ? 'Hazırlanıyor...' : 'İndir & Paylaş'}
                </button>
            </div>

        </div>
    );
};

export default QuoteCardModal;
