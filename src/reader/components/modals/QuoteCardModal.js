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
                <div className="flex justify-center bg-[#1a1b1e] p-8 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
                    {/* THE CARD ITSELF */}
                    <div
                        ref={cardRef}
                        className="w-[1080px] max-w-full aspect-square md:aspect-[4/5] lg:aspect-[1.91/1] bg-gradient-to-br from-[#2c1a12] to-[#0f0f0f] relative flex flex-col items-center justify-center p-12 text-center"
                        style={{ background: 'linear-gradient(135deg, #1c1917 0%, #451a03 100%)' }}
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                            style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/arabesque.png")' }}>
                        </div>
                        <div className="absolute top-6 left-6 w-24 h-24 border-t-2 border-l-2 border-amber-500/30 rounded-tl-3xl"></div>
                        <div className="absolute bottom-6 right-6 w-24 h-24 border-b-2 border-r-2 border-amber-500/30 rounded-br-3xl"></div>

                        {/* Content */}
                        <div className="relative z-10 max-w-3xl">
                            <span className="text-6xl text-amber-500/20 font-serif block mb-4">“</span>
                            <p className="text-2xl md:text-3xl lg:text-4xl leading-relaxed text-[#eee] font-serif tracking-wide drop-shadow-md">
                                {text}
                            </p>
                            <div className="mt-8 flex flex-col items-center gap-2">
                                <div className="h-px w-24 bg-amber-500/50 mb-2"></div>
                                <span className="text-amber-400 font-bold text-xl uppercase tracking-widest">{author}</span>
                                {source && <span className="text-amber-200/60 text-sm tracking-wider font-light">{source}</span>}
                            </div>
                        </div>

                        {/* Branding */}
                        <div className="absolute bottom-6 flex items-center gap-2 opacity-40">
                            <div className="w-6 h-6 bg-white rounded-full"></div>
                            <span className="text-white text-xs font-bold tracking-widest uppercase">Risale-i Nur Reader</span>
                        </div>
                    </div>
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
