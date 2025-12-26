// --- YARDIMCI FONKSİYONLAR ---

export const isArabicText = (text) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

export const generateTranslatedText = (text) => {
    if (!text || typeof text !== 'string') return "";
    return text.replace(/\[\[([\s\S]*?)\|([\s\S]*?)(?:\|([\s\S]*?))?\]\]/g, (match, p1, p2, p3) => {
        const original = p1; const short = p2; const long = p3 || "";
        return `[[${short}|${original}|${long}]]`;
    });
};

export const sortDictionaryByKey = (dict) => {
    const sortedKeys = Object.keys(dict).sort((a, b) => a.localeCompare(b, 'tr'));
    const sortedDict = {};
    sortedKeys.forEach(key => { sortedDict[key] = dict[key]; });
    return sortedDict;
};

// Global aramada bulunan kelimeyi sarı yapmak için temizleme fonksiyonu
// (Not: Bu fonksiyon JSX döndürmez, HTML string döndürür veya React tarafında işlenir. 
// Ancak Editor.js içinde JSX döndüren versiyonu kullanıyoruz, bu raw text temizliği içindir)
export const cleanTextForSearch = (text) => {
    if (!text) return "";
    return text.replace(/\[\[(.*?)\|.*?\]\]/g, '$1')
        .replace(/\(\((.*?)\)\)/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1');
};