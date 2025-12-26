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

const ORNAMENTS = [
    { id: 'none', src: null, label: 'Yok' },
    { id: 'sus1', src: '/sus1.png', label: 'Motif 1' },
    { id: 'sus2', src: '/sus2.png', label: 'Motif 2' },
    { id: 'sus3', src: '/sus3.png', label: 'Motif 3' },
    { id: 'sus4', src: '/sus4.png', label: 'Motif 4' },
    { id: 'sus5', src: '/sus5.png', label: 'Motif 5' },
];

// Sub-component for the card content to ensure identical rendering
const QuoteCardTemplate = ({ text, source, author, theme, ornament, isExport = false }) => {
    return (
        <div
            className="w-full h-full relative flex flex-col justify-between p-[80px] overflow-hidden"
            style={{
                background: `linear-gradient(180deg, ${theme.from} 0%, ${theme.via} 50%, ${theme.to} 100%)`
            }}
        >
            {/* 1. NOISE TEXTURE (Paper feel) */}
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}>
            </div>

            {/* 2. VIGNETTE */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.5) 100%)' }}>
            </div>

            {/* SELECTED ORNAMENT (TOP HEADER - FULL WIDTH) */}
            {ornament && ornament.src && (
                <div className="absolute top-0 left-0 w-full h-[400px] pointer-events-none z-0">
                    <img
                        src={ornament.src}
                        alt="motif"
                        className="w-full h-full object-contain object-top opacity-90 drop-shadow-xl"
                        style={{ filter: 'brightness(1.2) sepia(0.3)' }}
                    />
                </div>
            )}

            {/* 3. ELEGANT BORDER */}
            <div className="absolute top-6 left-6 right-6 bottom-6 border-2 border-amber-200/20 rounded-[1rem] pointer-events-none z-20"></div>
            <div className="absolute top-9 left-9 right-9 bottom-9 border border-amber-100/30 rounded-[0.5rem] pointer-events-none z-20">
            </div>

            {/* 4. BOTTOM HORIZON (Subtle Landscape) */}
            <div className="absolute bottom-0 left-0 w-full h-[250px] pointer-events-none z-0 opacity-30">
                <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-[-40px] left-[-10%] w-[120%] h-[150px] rounded-[100%] bg-black/40 blur-2xl"></div>
            </div>

            {/* TOP LEFT: Book & Chapter Info */}
            <div className="absolute top-16 left-16 max-w-[700px] text-left z-20 pl-4 pt-4">
                {source && (
                    <div className="flex flex-col">
                        <span className="text-amber-100/95 text-[40px] font-bold font-serif leading-tight drop-shadow-xl tracking-wide">
                            {source.split(' / ')[0]}
                        </span>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-amber-100/70 text-[26px] font-light font-serif italic">
                                {source.split(' / ')[1] || ''}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-24 mt-20 mb-12">

                {/* Visual Quote Mark */}
                <span className="text-[140px] text-amber-500/15 font-serif leading-none select-none mb-6 self-start transform -translate-x-12 translate-y-8 font-normal">
                    “
                </span>

                <div className="relative w-full">
                    <p className={`font-serif text-[#fdfdfd] leading-[1.8] tracking-wide drop-shadow-2xl text-center
                        ${text.length < 150 ? 'text-[56px]' :
                            text.length < 300 ? 'text-[46px]' :
                                text.length < 500 ? 'text-[40px]' : 'text-[36px]'}
                    `} style={{
                            textShadow: '0 4px 12px rgba(0,0,0,0.7)',
                        }}>
                        {text}
                    </p>
                </div>

                {/* SIGNATURE */}
                <div className="w-full flex justify-end mt-16 pr-8">
                    <div className="flex flex-col items-end gap-2">
                        <span
                            className="text-amber-400 font-serif italic text-[36px] tracking-wide"
                            style={{
                                textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                            }}
                        >
                            {author}
                        </span>
                        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col items-center gap-6 z-10 w-full shrink-0 pb-16">
                <div className="flex flex-col items-center opacity-80 scale-100">
                    <span className="text-amber-100/50 text-[22px] font-serif italic mb-3 tracking-widest">...devamı ve daha fazlası</span>
                    <div className="flex items-center gap-4 bg-white/5 px-8 py-3 rounded-full border border-white/10 backdrop-blur-sm shadow-xl">
                        <span className="text-amber-50 text-[18px] font-mono tracking-[0.25em] font-light opacity-90">E-RISALE.GITHUB.IO</span>
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
    const [selectedOrnament, setSelectedOrnament] = useState(ORNAMENTS[2]); // Default to Motif 2/3 maybe? Or 2.
    const { showToast } = useToast();

    // Ensure text is safe
    const safeText = text || "Metin seçilmedi.";

    // Responsive Scale Calculation
    const [scaleFactor, setScaleFactor] = useState(0.4);

    useEffect(() => {
        const calculateScale = () => {
            const cardW = 1080;
            const cardH = 1350;
            const availableH = window.innerHeight * 0.70; // Slightly reduced to fit controls
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
            // Capture the HIDDEN export element
            const canvas = await html2canvas(exportRef.current, {
                scale: 1,
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
            <div className="w-full max-w-md flex justify-between items-center text-white mb-2 px-2" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold flex items-center gap-2">📷 Önizleme</h3>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-xl">✕</button>
            </div>

            {/* PREVIEW CONTAINER (Scaled for View) */}
            <div
                className="relative flex items-center justify-center shadow-2xl rounded-2xl ring-1 ring-white/10 bg-[#1a1a1a] touch-none mb-4"
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
                        ornament={selectedOrnament}
                    />
                </div>
            </div>

            {/* OFF-SCREEN EXPORT CONTAINER */}
            <div style={{ position: 'fixed', left: '-10000px', top: 0, width: '1080px', height: '1350px', zIndex: -1 }}>
                <div ref={exportRef} style={{ width: '1080px', height: '1350px' }}>
                    {/* RENDER TEMPLATE FOR EXPORT */}
                    <QuoteCardTemplate
                        text={safeText}
                        source={source}
                        author={author}
                        theme={selectedTheme}
                        ornament={selectedOrnament}
                        isExport={true}
                    />
                </div>
            </div>

            {/* CONTROLS */}
            <div className="w-full max-w-md flex flex-col gap-3 mt-auto z-[120] pb-4" onClick={e => e.stopPropagation()}>

                {/* 1. Theme Selector */}
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

                {/* 2. Ornament Selector (NUMBERS ONLY) */}
                <div className="flex justify-center gap-2 p-2 bg-white/10 rounded-2xl backdrop-blur-md overflow-x-auto">
                    {ORNAMENTS.map((ornament) => (
                        <button
                            key={ornament.id}
                            onClick={() => setSelectedOrnament(ornament)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative shrink-0 border ${selectedOrnament.id === ornament.id ? 'bg-white text-black border-white scale-110' : 'bg-black/40 text-white border-transparent hover:bg-black/60'}`}
                        >
                            <span className="text-sm font-bold">
                                {ornament.id === 'none' ? 'Ø' : ornament.id.replace('sus', '')}
                            </span>
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
