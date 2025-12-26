import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '../../context/ToastContext';

const THEMES = [
    { id: 'classic', name: 'Klasik', from: '#1a0f0a', via: '#2c1a12', to: '#0f0502', label: 'Klasik' },
    { id: 'royal', name: 'Asil', from: '#1e1b4b', via: '#312e81', to: '#0f0529', label: 'Mor' },
    { id: 'ocean', name: 'Okyanus', from: '#022c22', via: '#0f766e', to: '#042f2e', label: 'Turkuaz' },
    { id: 'sunset', name: 'Gün Batımı', from: '#450a0a', via: '#7f1d1d', to: '#2a0a0a', label: 'Kızıl' },
    { id: 'amber', name: 'Altın', from: '#b45309', via: '#d97706', to: '#78350f', label: 'Altın' } // Replacing Black with Amber
];

const QuoteCardModal = ({ isOpen, onClose, text, source, author = "Bediüzzaman Said Nursi" }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const { showToast } = useToast();

    // Responsive Scale Calculation
    const [scaleFactor, setScaleFactor] = useState(0.4); // Default start smaller

    useEffect(() => {
        const calculateScale = () => {
            // Target Height: We want the card to fit in roughly 60vh of the screen height
            // 1080x1350 is the source
            const hScale = (window.innerHeight * 0.60) / 1350;
            const wScale = (Math.min(window.innerWidth * 0.9, 360)) / 1080; // Limit preview width

            // Choose the smaller scale to ensure fit
            setScaleFactor(Math.min(hScale, wScale));
        };

        if (isOpen) {
            calculateScale();
            window.addEventListener('resize', calculateScale);
        }
        return () => window.removeEventListener('resize', calculateScale);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            await new Promise(r => setTimeout(r, 100)); // Render wait
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // 4K output
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                logging: false,
                onclone: (clonedDoc) => {
                    // Ensure the cloned element is visible and standard size
                    // html2canvas handles this via the element ref, but transforms on parent might affect it?
                    // We are capturing 'cardRef.current' which works fine even if scaled via CSS transform parent
                    // BUT, sometimes transform affects coordinates.
                    // If needed, we could clone the node into a hidden absolute div at scale 1.
                    // For now, let's trust html2canvas with transform handling or the fact it reads valid DOM.
                }
            });

            const image = canvas.toDataURL("image/png", 0.9);
            const link = document.createElement('a');
            link.href = image;
            link.download = `risale-soz-${Date.now()}.png`;
            link.click();

            showToast("Kart galeriye kaydedildi.", "success");
        } catch (error) {
            console.error("Hata:", error);
            showToast("Kaydedilemedi.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>

            {/* Top Bar */}
            <div className="w-full max-w-md flex justify-between items-center text-white mb-2 px-2" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold flex items-center gap-2">📷 Önizleme</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">✕</button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div
                className="relative flex items-center justify-center shadow-2xl overflow-hidden rounded-xl ring-1 ring-white/10 bg-black touch-none"
                style={{
                    width: `${1080 * scaleFactor}px`,
                    height: `${1350 * scaleFactor}px`,
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* TRANSFORM WRAPPER: Matches the 1080x1350 card exactly but scaled down visually */}
                <div style={{
                    width: '1080px',
                    height: '1350px',
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top left',
                }}>
                    <div
                        ref={cardRef}
                        className="w-[1080px] h-[1350px] relative flex flex-col items-center justify-between p-[100px] text-center"
                        style={{
                            background: `linear-gradient(135deg, ${selectedTheme.from} 0%, ${selectedTheme.via} 60%, ${selectedTheme.to} 100%)`
                        }}
                    >
                        {/* Texture */}
                        <div className="absolute inset-0 opacity-[0.10] mix-blend-overlay pointer-events-none"
                            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")' }}>
                        </div>

                        {/* Borders */}
                        <div className="absolute top-12 left-12 w-48 h-48 border-t-[3px] border-l-[3px] border-amber-500/30 rounded-tl-[4rem]"></div>
                        <div className="absolute bottom-12 right-12 w-48 h-48 border-b-[3px] border-r-[3px] border-amber-500/30 rounded-br-[4rem]"></div>

                        {/* MAIN CONTENT AREA */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full z-10 overflow-hidden px-8">
                            <span className="text-[120px] text-amber-500/10 font-serif leading-none select-none mb-4">“</span>

                            <div className="relative w-full">
                                <p className={`font-serif text-[#f8fafc] leading-[1.5] tracking-wide drop-shadow-xl
                                    ${text.length < 150 ? 'text-[56px]' :
                                        text.length < 300 ? 'text-[46px]' :
                                            text.length < 500 ? 'text-[40px]' : 'text-[34px]'}
                                `} style={{ textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
                                    {text}
                                </p>
                            </div>

                            <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-12 mb-8"></div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex flex-col items-center gap-4 z-10 w-full shrink-0 pb-8">
                            <h3 className="text-amber-500 font-bold text-[36px] uppercase tracking-[0.2em] drop-shadow-lg font-sans">
                                {author}
                            </h3>

                            {source && (
                                <div className="px-6 py-2 border border-amber-500/20 rounded-full bg-black/20 backdrop-blur-sm">
                                    <span className="text-amber-100/90 text-[24px] font-light tracking-wide font-serif italic">
                                        {source}
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-col items-center mt-8 opacity-90 scale-90 origin-bottom">
                                <span className="text-amber-100/40 text-[20px] font-serif italic mb-2 tracking-wider">...devamı ve daha fazlası</span>
                                <div className="flex items-center gap-3 bg-black/20 px-5 py-2 rounded-xl border border-white/5">
                                    <img src="/said.png" alt="" className="w-10 h-10 rounded-full ring-2 ring-white/10 shadow-lg object-cover" />
                                    <span className="text-white text-[22px] font-mono tracking-[0.1em] lowercase font-medium">e-risale.github.io</span>
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
