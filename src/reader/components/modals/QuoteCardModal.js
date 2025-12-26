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

const TOP_ORNAMENTS = [
    { id: 'none', src: null, label: 'Yok' },
    { id: 'sus1', src: '/sus1.png', label: 'Motif 1' },
    { id: 'sus2', src: '/sus2.png', label: 'Motif 2' },
    { id: 'sus3', src: '/sus3.png', label: 'Motif 3' },
    { id: 'sus4', src: '/sus4.png', label: 'Motif 4' },
    { id: 'sus5', src: '/sus5.png', label: 'Motif 5' },
];

const BOTTOM_ORNAMENTS = [
    { id: 'none', src: null, label: 'Yok' },
    { id: 'alt1', src: '/alt1.png', label: 'Alt 1' },
    { id: 'alt2', src: '/alt2.png', label: 'Alt 2' },
    { id: 'alt3', src: '/alt3.png', label: 'Alt 3' },
    { id: 'alt4', src: '/alt4.png', label: 'Alt 4' },
    { id: 'alt5', src: '/alt5.png', label: 'Alt 5' },
    { id: 'alt6', src: '/alt6.png', label: 'Alt 6' },
];

// Sub-component for the card content to ensure identical rendering
const QuoteCardTemplate = ({ text, source, author, theme, topOrnament, bottomOrnament, isExport = false }) => {
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

            {/* TOP ORNAMENT (HEADER) */}
            {topOrnament && topOrnament.src && (
                <div className="absolute top-0 left-0 w-full h-[350px] pointer-events-none z-0">
                    <img
                        src={topOrnament.src}
                        alt="top-motif"
                        className="w-full h-full object-contain object-top opacity-15 drop-shadow-xl"
                        style={{ filter: 'brightness(1.2) sepia(0.3)' }}
                    />
                </div>
            )}

            {/* BOTTOM ORNAMENT (FOOTER DECORATION) */}
            {bottomOrnament && bottomOrnament.src && (
                <div className="absolute bottom-0 left-0 w-full h-[350px] pointer-events-none z-0">
                    <img
                        src={bottomOrnament.src}
                        alt="bottom-motif"
                        className="w-full h-full object-contain object-bottom opacity-15 drop-shadow-xl"
                        style={{ filter: 'brightness(1.2) sepia(0.3)' }}
                    />
                </div>
            )}

            {/* 3. ELEGANT BORDER */}
            <div className="absolute top-6 left-6 right-6 bottom-6 border-2 border-amber-200/20 rounded-[1rem] pointer-events-none z-20"></div>
            <div className="absolute top-9 left-9 right-9 bottom-9 border border-amber-100/30 rounded-[0.5rem] pointer-events-none z-20">
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

    // States
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const [selectedTopOrnament, setSelectedTopOrnament] = useState(TOP_ORNAMENTS[2]);
    const [selectedBottomOrnament, setSelectedBottomOrnament] = useState(BOTTOM_ORNAMENTS[0]);

    const { showToast } = useToast();

    // Ensure text is safe
    const safeText = text || "Metin seçilmedi.";

    // Responsive Scale Calculation
    const [scaleFactor, setScaleFactor] = useState(0.4);

    useEffect(() => {
        const calculateScale = () => {
            const cardW = 1080;
            const cardH = 1350;
            const isDesktop = window.innerWidth >= 768;

            let availableH, availableW;

            if (isDesktop) {
                availableH = window.innerHeight * 0.85;
                // Reserve space for sidebar (300px)
                availableW = Math.min(window.innerWidth - 350, 600);
            } else {
                availableH = window.innerHeight * 0.60;
                availableW = Math.min(window.innerWidth * 0.95, 480);
            }

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
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-start md:justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto" onClick={onClose}>

            {/* TOP HEADER (Mobile Close Button) */}
            <div className="absolute top-4 right-4 z-[130] md:hidden">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-xl text-white">✕</button>
            </div>

            {/* MAIN LAYOUT WRAPPER */}
            <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-8 h-full md:h-auto" onClick={e => e.stopPropagation()}>

                {/* 1. PREVIEW SIDE (Left/Center) */}
                <div className="flex-col items-center justify-center relative flex-shrink-0">
                    <div className="hidden md:flex w-full justify-between items-center text-white mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">📷 Önizleme</h3>
                    </div>

                    {/* PREVIEW CONTAINER */}
                    <div
                        className="relative flex items-center justify-center shadow-2xl rounded-2xl ring-1 ring-white/10 bg-[#1a1a1a] touch-none"
                        style={{
                            width: `${1080 * scaleFactor}px`,
                            height: `${1350 * scaleFactor}px`,
                        }}
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
                            <QuoteCardTemplate
                                text={safeText}
                                source={source}
                                author={author}
                                theme={selectedTheme}
                                topOrnament={selectedTopOrnament}
                                bottomOrnament={selectedBottomOrnament}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. CONTROLS SIDEBAR (Right on Desktop, Bottom on Mobile) */}
                <div className="w-full max-w-md md:w-[320px] flex flex-col gap-5 z-[120] bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-xl md:h-[80vh] md:overflow-y-auto md:justify-center">

                    <div className="flex justify-between items-center text-white md:hidden">
                        <h3 className="font-bold">Ayarlar</h3>
                    </div>

                    <div className="hidden md:flex justify-between items-center text-white mb-2">
                        <h3 className="font-bold text-xl">Ayarlar</h3>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-sm">✕</button>
                    </div>

                    {/* Controls Group */}
                    <div className="space-y-6">
                        {/* Theme Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Renk Teması</label>
                            <div className="flex flex-wrap gap-2 p-1">
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
                        </div>

                        {/* Top Ornament Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Üst Motif</label>
                            <div className="flex flex-wrap gap-2 p-1">
                                {TOP_ORNAMENTS.map((ornament) => (
                                    <button
                                        key={ornament.id}
                                        onClick={() => setSelectedTopOrnament(ornament)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative shrink-0 border ${selectedTopOrnament.id === ornament.id ? 'bg-amber-500 text-black border-amber-400 font-bold' : 'bg-white/10 text-white/70 border-transparent hover:bg-white/20'}`}
                                    >
                                        <span className="text-xs">
                                            {ornament.id === 'none' ? 'Ø' : ornament.id.replace('sus', '')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Ornament Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Alt Motif</label>
                            <div className="flex flex-wrap gap-2 p-1">
                                {BOTTOM_ORNAMENTS.map((ornament) => (
                                    <button
                                        key={ornament.id}
                                        onClick={() => setSelectedBottomOrnament(ornament)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative shrink-0 border ${selectedBottomOrnament.id === ornament.id ? 'bg-amber-500 text-black border-amber-400 font-bold' : 'bg-white/10 text-white/70 border-transparent hover:bg-white/20'}`}
                                    >
                                        <span className="text-xs">
                                            {ornament.id === 'none' ? 'Ø' : ornament.id.replace('alt', '')}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Download Btn */}
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full py-4 bg-white text-black hover:bg-amber-50 rounded-xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-auto"
                    >
                        {isGenerating ? 'Hazırlanıyor...' : 'İndir & Paylaş'}
                    </button>
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
                        topOrnament={selectedTopOrnament}
                        bottomOrnament={selectedBottomOrnament}
                        isExport={true}
                    />
                </div>
            </div>

        </div>
    );
};

export default QuoteCardModal;
