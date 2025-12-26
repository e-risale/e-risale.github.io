
// --- SABİTLER: KATEGORİ ETİKETLERİ ---
export const CATEGORY_LABELS = {
    suggestion: "💡 Çeviri Önerisi",
    typo: "📝 Yazım Hatası",
    bug: "🐛 Teknik Sorun",
    general: "💬 Genel Görüş"
};

// --- YARDIMCI 1: PARLATMA ---
export const highlightText = (text, query, isModernMode) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-amber-200 text-red-900 rounded px-1">$1</mark>');
};

// --- YARDIMCI 2: SNIPPET ---
export const generateSnippet = (text, query = null) => {
    if (!query) return text.substring(0, 100) + "...";
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text.substring(0, 100) + "...";
    const start = Math.max(0, index - 40);
    const end = Math.min(text.length, index + query.length + 60);
    return (start > 0 ? "..." : "") + text.substring(start, end) + (end < text.length ? "..." : "");
};

// --- YARDIMCI 3: TARİH FORMATLAYICI ---
export const formatLastUpdated = (isoDateString) => {
    if (!isoDateString) return null;
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

export const formatDateWithTime = (isoDateString) => {
    if (!isoDateString) return null;
    const date = new Date(isoDateString);
    const d = new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
    const t = new Intl.DateTimeFormat('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
    return `${d} - ${t}`;
};

// --- YARDIMCI 4: ARAPÇA KONTROLÜ ---
export const isArabicText = (text) => {
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicPattern.test(text);
};
