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

// Sub-component for the card content to ensure identical rendering
const QuoteCardTemplate = ({ text, source, author, theme, isExport = false }) => {
    return (
        <div
            className="w-full h-full relative flex flex-col justify-between p-[80px] overflow-hidden"
            style={{
                background: `linear-gradient(180deg, ${theme.from} 0%, ${theme.via} 50%, ${theme.to} 100%)`
            }}
        >
            {/* 1. SOPHISTICATED BACKGROUND PATTERN (CSS Only - Islamic Geometric Style) */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-screen"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 100% 50%, transparent 20%, #ffffff 21%, #ffffff 34%, transparent 35%, transparent),
                        radial-gradient(circle at 0% 50%, transparent 20%, #ffffff 21%, #ffffff 34%, transparent 35%, transparent)
                    `,
                    backgroundSize: '60px 120px',
                    backgroundPosition: '0 0, 30px 60px'
                }}>
            </div>

            {/* Vignette Overlay for Depth */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }}>
            </div>

            {/* 2. BOTTOM SILHOUETTE (CSS Shapes) */}
            <div className="absolute bottom-0 left-0 w-full h-[300px] pointer-events-none z-0 opacity-40">
                {/* Rolling Hills / Domes Layer 1 */}
                <div className="absolute bottom-[-50px] left-[-20%] w-[140%] h-[200px] rounded-[100%] bg-black/30 blur-xl"></div>
                <div className="absolute bottom-[-20px] left-0 w-full h-[150px] bg-gradient-to-t from-black/60 to-transparent"></div>

                {/* Decorative Vector-like Element at bottom right */}
                <div className="absolute bottom-0 right-0 w-[400px] h-[300px] opacity-20"
                    style={{
                        background: 'radial-gradient(circle at 100% 100%, white 0%, transparent 60%)',
                        clipPath: 'polygon(50% 100%, 100% 100%, 100% 50%, 80% 60%, 60% 80%)'
                    }}>
                </div>
            </div>


            {/* TOP LEFT: Book & Chapter Info */}
            <div className="absolute top-12 left-12 max-w-[700px] text-left z-20">
                {source && (
                    <div className="flex flex-col">
                        {/* Removed the disconnected line */}
                        <span className="text-amber-100/95 text-[40px] font-bold font-serif leading-tight drop-shadow-xl tracking-wide">
                            {source.split(' / ')[0]}
                        </span>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="h-[1px] w-12 bg-amber-200/40"></div>
                            <span className="text-amber-100/70 text-[26px] font-light font-serif italic">
                                {source.split(' / ')[1] || ''}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* TOP RIGHT: Removed Image, Added Minimal Decorative corner */}
            <div className="absolute top-10 right-10 opacity-30">
                <div className="w-20 h-20 border-t-2 border-r-2 border-amber-100/50 rounded-tr-3xl"></div>
            </div>

            {/* BORDERS around content */}
            <div className="absolute top-8 left-8 w-[calc(100%-64px)] h-[calc(100%-64px)] border border-amber-500/10 rounded-[3rem] pointer-events-none"></div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-16 mt-20 mb-12">

                {/* Visual Quote Mark */}
                <span className="text-[160px] text-amber-500/20 font-serif leading-none select-none mb-4 self-start transform -translate-x-8 translate-y-8">
                    “
                </span>

                <div className="relative w-full">
                    <p className={`font-serif text-[#fefefe] leading-[1.7] tracking-wider drop-shadow-2xl text-center
                        ${text.length < 150 ? 'text-[60px]' :
                            text.length < 300 ? 'text-[50px]' :
                                text.length < 500 ? 'text-[42px]' : 'text-[38px]'}
                    `} style={{
                            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                            fontVariantLigatures: 'common-ligatures'
                        }}>
                        {text}
                    </p>
                </div>

                {/* SIGNATURE */}
                <div className="w-full flex justify-end mt-14 pr-8">
                    <div className="flex flex-col items-end">
                        <span
                            className="text-amber-400 font-serif italic text-[38px] tracking-wide"
                            style={{
                                fontFamily: 'cursive', // Trying to look more like signature/handwriting style if font matches
                                textShadow: '0 2px 10px rgba(0,0,0,0.9)'
                            }}
                        >
                            {author}
                        </span>
                        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mt-2"></div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col items-center gap-6 z-10 w-full shrink-0 pb-16">
                <div className="flex flex-col items-center opacity-80 scale-100">
                    <span className="text-amber-100/50 text-[24px] font-serif italic mb-3 tracking-widest">...devamı ve daha fazlası</span>
                    <div className="flex items-center gap-4 bg-black/20 px-6 py-3 rounded-full border border-white/5 backdrop-blur-sm shadow-xl">
                        <span className="text-amber-50 text-[20px] font-mono tracking-[0.2em] font-light opacity-90">E-RISALE.GITHUB.IO</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuoteCardModal = ({ isOpen, onClose, text, source, author = "Bediüzzaman Said Nursi" }) => {
    const exportRef = useRef(null); // Ref for the hidden export element
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const { showToast } = useToast();

    // Ensure text is safe
    const safeText = text || "Metin seçilmedi.";

    // Responsive Scale Calculation
    const [scaleFactor, setScaleFactor] = useState(0.4);

    useEffect(() => {
        const calculateScale = () => {
            const cardW = 1080;
            const cardH = 1350;
            const availableH = window.innerHeight * 0.75;
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
        if (!exportRef.current) return;
        setIsGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 200));
            // Capture the HIDDEN export element, not the scaled preview
            const canvas = await html2canvas(exportRef.current, {
                scale: 1, // Already 1080p in DOM, no need to scale up much
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: 1080,
                height: 1350,
                scrollX: 0,
                scrollY: 0,
                windowWidth: 1080,
                windowHeight: 1350
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

            {/* PREVIEW CONTAINER (Scaled for View) */}
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
                    {/* RENDER TEMPLATE FOR PREVIEW */}
                    <QuoteCardTemplate
                        text={safeText}
                        source={source}
                        author={author}
                        theme={selectedTheme}
                    />
                </div>
            </div>

            {/* OFF-SCREEN EXPORT CONTAINER (Full Resolution, Unscaled) */}
            <div style={{ position: 'fixed', left: '-10000px', top: 0, width: '1080px', height: '1350px', zIndex: -1 }}>
                <div ref={exportRef} style={{ width: '1080px', height: '1350px' }}>
                    {/* RENDER TEMPLATE FOR EXPORT */}
                    <QuoteCardTemplate
                        text={safeText}
                        source={source}
                        author={author}
                        theme={selectedTheme}
                        isExport={true}
                    />
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
