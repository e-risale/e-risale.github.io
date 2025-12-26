import React from 'react';

export default function LicenseModal({ isOpen, onClose, darkMode }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-[#1a1b1e] text-gray-200 border border-gray-700' : 'bg-white text-gray-800'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-5 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <h3 className="font-serif font-bold text-xl">Kaynak ve Lisans Bilgisi</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-500/10 transition-colors">
                        <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 leading-relaxed text-sm md:text-base">
                    <p>
                        <strong>Bedîüzzaman Said Nursî Hazretlerinin Risale-i Nur Külliyatı</strong>, tahrifattan muhafaza için Diyanet İşleri Başkanlığınca incelemeye alınmış ve bir tahkik heyeti kurularak “asıl nüsha metni” hazırlanmaya başlanmıştı.
                    </p>
                    <p>
                        DİB, bu metnin hazırlanmasında, 1956-1960 seneleri arasında yeni yazıyla matbaalarda basılan eserleri esas aldı. Bu dönemde, basılacak her bir kitabın formaları Bediüzzaman’a getiriliyor ve müellifince gerekli tashihlerden sonra matbaaya gönderilip basılıyordu. Bediüzzaman’ın vefatına kadar Külliyat’ın ekseriyeti, bu şekilde yeni yazıyla matbaalarda basılıp neşredilmişti.
                    </p>
                    <p>
                        Üstadın yakın talebe ve vârislerinin de ilgilendikleri bu çalışma neticesi hazırlanan eserler, 2015 senesinin başından itibaren yayınevlerince basılmaya başladı.
                    </p>
                    <p>
                        Hizmet Vakfı, <a href="http://www.risaleinur.hizmetvakfi.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">www.risaleinur.hizmetvakfi.org</a> adresinde Risale-i Nurların yeni baskılarda kullanılan asıl nüsha metnini yayımlayarak okumak veya çalışmalarında kullanmak isteyenlerin istifadesine sunuyor.
                    </p>

                    <div className={`mt-6 p-4 rounded-lg flex items-start gap-4 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <div className="text-3xl">⚖️</div>
                        <div>
                            <p className="font-bold mb-1">Lisans</p>
                            <p className="text-xs opacity-80 mb-2">
                                Bu eser <strong>Creative Commons Atıf-Türetilemez 4.0 Uluslararası Lisansı</strong> ile lisanslanmıştır.
                            </p>
                            <a
                                href="http://creativecommons.org/licenses/by-nd/4.0/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs inline-flex items-center gap-1 hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                            >
                                Lisansı Görüntüle ↗
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t text-center text-xs opacity-50 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    Allah (c.c) emeği geçenlerden razı olsun.
                </div>
            </div>
        </div>
    );
}
