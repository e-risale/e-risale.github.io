import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '../../context/ToastContext'; // YENİ

const QuoteCardModal = ({ isOpen, onClose, text, source, author = "Bediüzzaman Said Nursi" }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const { showToast } = useToast(); // YENİ

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // Yüksek çözünürlük için
                backgroundColor: null,
                logging: false,
                useCORS: true
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `risale-i-nur-soz-kart-${Date.now()}.png`;
            link.click();

            // Opsiyonel: İndirdikten sonra kapat
            // onClose();
            showToast("Kart başarıyla indirildi.", "success");
        } catch (error) {
            console.error("Kart oluşturulurken hata:", error);
            showToast("Görsel oluşturulamadı.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
            <div className="w-full max-w-2xl flex flex-col gap-6" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-center text-white">
                    <h3 className="text-xl font-bold flex items-center gap-2">📷 Söz Kartı Paylaş</h3>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">✕</button>
                </div>

                {/* Card Preview Wrapper */}
                {/* Card Preview Wrapper */}
                <div className="flex justify-center bg-[#1a1b1e] p-4 rounded-xl shadow-2xl border border-gray-800 overflow-hidden relative">

                    {/* Size Warning */}
                    {text.length > 800 ? (
                        <div className="text-white text-center p-12 bg-red-900/20 border border-red-500/50 rounded-xl">
                            <div className="text-4xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold mb-2">Metin Çok Uzun</h3>
                            <p className="opacity-80">Lütfen daha kısa bir bölüm seçin. (Sınır: 800 karakter)</p>
                        </div>
                    ) : (
                        /* THE CARD ITSELF - Rendered at 4:5 Ratio (Portrait) */
                        <div className="relative">
                            <div
                                ref={cardRef}
                                className="w-[1080px] h-[1350px] bg-gradient-to-br from-[#1c1917] via-[#2c1a12] to-[#000000] relative flex flex-col items-center justify-between p-16 text-center select-none"
                                style={{
                                    zoom: '0.35', // Preview Zoom (User sees small version)
                                }}
                            >
                                {/* Background Patterns */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
                                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")' }}>
                                </div>

                                {/* Decor Corners */}
                                <div className="absolute top-8 left-8 w-32 h-32 border-t-4 border-l-4 border-amber-500/40 rounded-tl-[3rem]"></div>
                                <div className="absolute bottom-8 right-8 w-32 h-32 border-b-4 border-r-4 border-amber-500/40 rounded-br-[3rem]"></div>

                                {/* Top Spacer (for balance) */}
                                <div className="h-16"></div>

                                {/* MAIN CONTENT AREA */}
                                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl z-10">
                                    <span className="text-8xl text-amber-500/20 font-serif leading-none mb-6">“</span>

                                    <p className={`font-serif text-[#f2f2f2] leading-relaxed tracking-wide drop-shadow-lg
                                        ${text.length < 150 ? 'text-6xl px-8' :
                                            text.length < 300 ? 'text-5xl px-4' :
                                                text.length < 500 ? 'text-4xl' : 'text-3xl'}
                                    `}>
                                        {text}
                                    </p>

                                    {/* Separator */}
                                    <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mt-12 mb-8"></div>
                                </div>

                                {/* FOOTER AREA (Author + Source + Branding) */}
                                <div className="flex flex-col items-center gap-4 z-10 pb-12">
                                    <h3 className="text-amber-500 font-bold text-3xl uppercase tracking-[0.2em] drop-shadow-md">
                                        {author}
                                    </h3>

                                    {source && (
                                        <div className="px-6 py-2 border border-amber-500/30 rounded-full bg-black/20 backdrop-blur-sm">
                                            <span className="text-amber-100/90 text-2xl font-light tracking-wider font-serif italic">
                                                {source}
                                            </span>
                                        </div>
                                    )}

                                    {/* Website Branding */}
                                    <div className="flex items-center gap-3 mt-6 opacity-60">
                                        {/* Mock Logo if local file missing in rendering context, handled via text backup */}
                                        <img src="/said.png" alt="" className="w-10 h-10 rounded-full border border-white/20" />
                                        <span className="text-white text-lg font-mono tracking-widest lowercase">e-risale.github.io</span>
                                    </div>
                                </div>
                            </div>

                            {/* Overlay for "Preview Mode" interaction prevention */}
                            <div className="absolute inset-0 z-20 bg-transparent"></div>
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-bold text-lg shadow-lg shadow-amber-900/50 transition-all flex items-center gap-3 transform active:scale-95"
                    >
                        {isGenerating ? (
                            <>
                                <span className="animate-spin text-2xl">⏳</span> Hazırlanıyor...
                            </>
                        ) : (
                            <>
                                <span className="text-2xl">⬇️</span> İndir & Paylaş
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuoteCardModal;
