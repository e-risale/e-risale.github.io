import React, { useState, useRef } from 'react';
import { library } from '../data/library';
import { generateTranslatedText } from '../utils/editorHelpers';
// YENİ: Ayarları config dosyasından çekiyoruz
import { CONFIG, AVAILABLE_MODELS, getWebPrompt, getApiPrompt } from '../config';
import { AIReportList } from './components/AIReportList'; // Import

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export default function AIEditor({ onSwitchMode }) {
    // eslint-disable-next-line no-unused-vars
    const [activeBookId, setActiveBookId] = useState(null);
    const [activeChapterId, setActiveChapterId] = useState(null);
    const [currentTitle, setCurrentTitle] = useState("Lütfen Sol Menüden Bir Bölüm Seçin");
    const [pages, setPages] = useState([]);

    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
    const [showReport, setShowReport] = useState(false); // Report State
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isGlobalProcessing, setIsGlobalProcessing] = useState(false);
    const isProcessingRef = useRef(false);
    const [processingQueue, setProcessingQueue] = useState([]);
    const [darkMode] = useState(true); // setDarkMode removed as unused

    // Sidebar Expansion State
    const [expandedBooks, setExpandedBooks] = useState({});

    // --- YARDIMCI METODLAR ---
    const getCurrentTimestamp = () => {
        const now = new Date();
        return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    };

    const getSelectedModelName = () => {
        const model = AVAILABLE_MODELS.find(m => m.id === selectedModel);
        return model ? model.name : selectedModel;
    };

    const cleanAIResponse = (text) => {
        if (!text) return "";
        // Remove code blocks but DO NOT touch \n literals or other escapes, as that breaks JSON structure
        return text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    };

    const stripTags = (text) => {
        if (!text) return "";
        // Extract the ORIGINAL word (left side of the first pipe)
        return text.replace(/\[\[([^|]+)\|.*?\]\]/g, '$1');
    };

    const normalizeText = (text) => {
        if (!text) return "";
        // NFC normalization checks for canonical equivalence (composed vs decomposed chars)
        // Also handling potential zero-width spaces or different whitespace chars
        return text.normalize("NFC").replace(/\s+/g, ' ').trim();
    };

    const repairJsonString = (str) => {
        // Fallback repair: escape unescaped control characters inside the string
        // This is aggressive and might break formatting, so only use if direct parse fails
        // eslint-disable-next-line no-control-regex
        return str.replace(/[\u0000-\u001F]/g, (match) => {
            const map = { '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f' };
            return map[match] || '';
        });
    };

    // --- API ÇAĞRISI ---
    const callGeminiAPI = async (prompt) => {
        const keyToUse = API_KEY;
        if (!keyToUse) throw new Error("API Anahtarı bulunamadı!");

        if (selectedModel.includes("web")) {
            throw new Error("Seçili model ('Web') otomatik API desteklemez.\nLütfen 'Web' butonunu kullanarak manuel kopyalayın veya API destekli bir model (Flash/Lite) seçin.");
        }

        const dynamicUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;

        try {
            const response = await fetch(`${dynamicUrl}?key=${keyToUse}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            const responseText = await response.text();
            if (responseText.trim().startsWith("<")) throw new Error(`⚠️ HTML Hatası (Model erişimi yok).`);

            if (!response.ok) {
                const errorJson = JSON.parse(responseText);
                if (errorJson.error?.code === 429) throw new Error("KOTA DOLDU (429)");
                throw new Error(errorJson.error?.message || "Hata");
            }
            const data = JSON.parse(responseText);
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error("Boş cevap.");

            return cleanAIResponse(rawText);

        } catch (error) {
            console.error("API HATASI:", error);
            throw error;
        }
    };

    // --- WEB MANUEL KOPYALAMA ---
    const handleManualCopy = async (idx) => {
        try {
            // Document focus check for Electron/Browsers
            if (!document.hasFocus()) window.focus();

            const cleanText = stripTags(pages[idx].originalRaw);
            const prompt = getWebPrompt(cleanText, idx);
            await navigator.clipboard.writeText(prompt);
        } catch (err) {
            console.error("Kopyalama hatası:", err);
            prompt("Otomatik kopyalama başarısız. Lütfen manuel kopyalayın:", getWebPrompt(stripTags(pages[idx].originalRaw), idx));
        }
    };

    // --- TOPLU İŞLEME (API) ---
    const handleProcessAll = async () => {
        const pendingPages = pages.map((p, i) => ({ ...p, originalIndex: i })).filter(p => !p.isDone);
        if (pendingPages.length === 0) { alert("Tüm sayfalar zaten hazır!"); return; }

        if (selectedModel.includes("web")) {
            alert("⚠️ 'Web' modeli seçili!\nBu modelle otomatik çeviri yapılamaz. Lütfen listeden 'Flash' veya 'Lite' seçin.\nYa da tek tek '📋 Web' butonunu kullanarak manuel işlem yapın.");
            return;
        }

        const batchSize = CONFIG.BATCH_SIZE;
        const countToProcess = Math.min(pendingPages.length, batchSize);

        if (!window.confirm(`SEÇİLİ MODEL: ${selectedModel}\n\nToplam Bekleyen: ${pendingPages.length} sayfa.\nBu işlemle sıradaki ${countToProcess} sayfalık paket (vagon) işlenecek.\n\nDevam?`)) return;

        setIsGlobalProcessing(true);
        isProcessingRef.current = true;

        // Take only the first batch
        const chunk = pendingPages.slice(0, batchSize);
        const chunkIds = chunk.map(p => p.originalIndex);
        setProcessingQueue(prev => [...prev, ...chunkIds]);

        try {
            // Config.js'den gelen fonksiyonu kullanıyoruz
            const inputJson = JSON.stringify(chunk.map(p => ({
                id: String(p.originalIndex),
                metin: stripTags(p.originalRaw) // Temizlik yapılıyor
            })));

            const batchPrompt = getApiPrompt(inputJson);

            let resultRaw = await callGeminiAPI(batchPrompt);
            console.log("📩 HAM JSON CEVABI:", resultRaw);

            let processedPages = [];
            try {
                const jsonStart = resultRaw.indexOf('{');
                const arrayStart = resultRaw.indexOf('[');
                const startIdx = (jsonStart !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) ? jsonStart : arrayStart;

                if (startIdx !== -1) {
                    const lastBrace = resultRaw.lastIndexOf('}');
                    const lastBracket = resultRaw.lastIndexOf(']');
                    const endIdx = Math.max(lastBrace, lastBracket) + 1;

                    const jsonPart = resultRaw.substring(startIdx, endIdx);

                    // Attempt 1: Direct Parse (Works for valid/pretty JSON)
                    try {
                        const jsonData = JSON.parse(jsonPart);
                        if (Array.isArray(jsonData)) processedPages = jsonData;
                        else if (jsonData.sayfalar) processedPages = jsonData.sayfalar;
                        else if (jsonData.pages) processedPages = jsonData.pages;
                        else processedPages = [jsonData];
                    } catch (directError) {
                        console.warn("Direct parse failed, attempting repair...", directError);
                        // Attempt 2: Repair (Works for unescaped content, but breaks pretty print)
                        const safeJson = repairJsonString(jsonPart);
                        const jsonData = JSON.parse(safeJson);

                        if (Array.isArray(jsonData)) processedPages = jsonData;
                        else if (jsonData.sayfalar) processedPages = jsonData.sayfalar;
                        else if (jsonData.pages) processedPages = jsonData.pages;
                        else processedPages = [jsonData];
                    }

                } else {
                    throw new Error("JSON yapısı bulunamadı.");
                }
            } catch (parseErr) {
                console.error("JSON Parse Hatası:", parseErr);
                // Yedek parse denemesi (basit temizlik)
                try {
                    // eslint-disable-next-line no-control-regex
                    const cleaned = resultRaw.replace(/[\u0000-\u001F]+/g, "");
                    const start = cleaned.indexOf('{');
                    const end = cleaned.lastIndexOf('}') + 1;
                    const data = JSON.parse(cleaned.substring(start, end));
                    if (data.sayfalar) processedPages = data.sayfalar;
                } catch (e) { }
            }

            if (processedPages.length > 0) {
                const receivedIds = new Set();
                processedPages.forEach(item => {
                    const targetId = Number(item.id);
                    const text = item.metin || item.text || item.processed_text;
                    if (!isNaN(targetId) && text) {
                        updatePageContent(targetId, text, getSelectedModelName());
                        receivedIds.add(targetId);
                    }
                });

                // Check for missing pages in this batch
                const missingIds = chunkIds.filter(id => !receivedIds.has(id));
                if (missingIds.length > 0) {
                    const missingPageNumbers = missingIds.map(id => id + 1).join(", ");
                    console.warn(`⚠️ Eksik Sayfalar: ${missingPageNumbers} (AI cevap vermedi)`);
                    alert(`DİKKAT: AI, gönderilen ${chunk.length} sayfadan sadece ${receivedIds.size} tanesini işledi.\n\nİşlenmeyen Sayfalar: ${missingPageNumbers}\n\nBu sayfalar "beklemede" kalacak.`);
                }

                // Alert success for this batch
                // alert(`${receivedIds.size} sayfa başarıyla işlendi.`); // Opsiyonel, kullanıcı zaten görüyor

            } else {
                console.warn("Bu paketten veri çıkmadı.");
                alert("UYARI: Bu paketten (vagon) hiç anlamlı veri çıkmadı. AI boş veya bozuk cevap döndü.");
            }

        } catch (error) {
            if (error.message.includes("KOTA") || error.message.includes("429")) {
                alert(`🚨 ${selectedModel} KOTASI DOLDU!\n\nLütfen sağ üstten başka bir model seçin.`);
            } else {
                console.error("Paket hatası:", error);
                alert(`HATA: ${error.message}`);
            }
        } finally {
            setProcessingQueue(prev => prev.filter(id => !chunkIds.includes(id)));
            setIsGlobalProcessing(false);
            isProcessingRef.current = false;
        }
    };

    const updatePageContent = (idx, newText, modelName) => {
        setPages(prev => {
            const newPages = [...prev];
            if (!newPages[idx]) return newPages;
            newPages[idx].newRaw = newText;
            newPages[idx].status = 'modified';
            newPages[idx].isDone = true;
            if (modelName) newPages[idx].processedBy = `${modelName} on ${getCurrentTimestamp()}`;
            newPages[idx].lastUpdated = getCurrentTimestamp();
            return newPages;
        });
        setHasUnsavedChanges(true);
    };

    const prepareChapterForAI = async (bookId, chapId, title) => {
        if (hasUnsavedChanges && !window.confirm("Kaydetmeden çık?")) return;
        const book = library.find(b => b.id === bookId);
        const chapter = book.chapters.find(c => c.id === chapId);

        if (chapter) {
            // Loader ile veriyi çek (Eğer yoksa)
            if (!chapter.data && chapter.loader) {
                try {
                    const module = await chapter.loader();
                    chapter.data = module.default || [];
                } catch (error) {
                    console.error("Yükleme Hatası:", error);
                    alert("Bölüm içeriği yüklenemedi.");
                    return;
                }
            }

            const rawData = Array.isArray(chapter.data) ? chapter.data : [];
            setPages(rawData.map((p, idx) => {
                // Check oldText for existing tags (since rawText is now always clean)
                const isAlreadyTagged = (p.oldText && p.oldText.includes('[[')) || (p.newRaw && p.newRaw.includes('[['));
                // rawText is now GUARANTEED clean from source, so no stripTags needed
                // But for safety, stripTags won't hurt if clean.
                // However, we must ensure we use the CLEAN RAW one for the left panel.
                return {
                    id: idx,
                    originalRaw: p.rawText, // CLEAN INPUT
                    newRaw: p.oldText || "", // TAGGED WORK (or empty)
                    isDone: isAlreadyTagged,
                    status: isAlreadyTagged ? 'completed' : 'pending',
                    processedBy: p.processedBy || (isAlreadyTagged ? "Önceki İşlem" : null),
                    lastUpdated: p.lastUpdated || null
                };
            }));
            setActiveBookId(bookId);
            setActiveChapterId(chapId);
            setCurrentTitle(title);
            setHasUnsavedChanges(false);
            setProcessingQueue([]);
        }
    };

    const downloadFile = () => {
        if (!activeChapterId) return;
        const pagesData = pages.map(p => ({
            pageId: p.id + 1,
            // rawText: PRESERVE CLEAN (originalRaw)
            rawText: p.originalRaw,
            // oldText: SAVE TAGGED WORK (newRaw)
            oldText: (p.status === 'modified' || (p.isDone && p.newRaw)) ? p.newRaw : (p.newRaw || ""),
            modernText: generateTranslatedText((p.status === 'modified' || (p.isDone && p.newRaw)) ? p.newRaw : (p.newRaw || "")),
            processedBy: p.processedBy || "Belirsiz",
            lastUpdated: p.lastUpdated || getCurrentTimestamp()
        }));
        const a = document.createElement('a');
        a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pagesData, null, 2));
        a.download = `${activeChapterId}.json`;
        a.click();
        setHasUnsavedChanges(false);
        setPages(prev => prev.map(p => ({ ...p, status: 'completed' })));
        alert(`Dosya indirildi: ${activeChapterId}.json`);
    };



    // --- DIFF CONTROLLER ---
    const getDiffWords = (original, newText) => {
        const wordsOrig = original ? normalizeText(original).split(" ").filter(w => w.length > 0) : [];
        const wordsNew = newText ? normalizeText(stripTags(newText)).split(" ").filter(w => w.length > 0) : [];

        const countFreq = (arr) => arr.reduce((acc, w) => { acc[w] = (acc[w] || 0) + 1; return acc; }, {});
        const freqOrig = countFreq(wordsOrig);
        const freqNew = countFreq(wordsNew);

        const missing = [];
        const extra = [];

        Object.keys(freqOrig).forEach(w => {
            const diff = freqOrig[w] - (freqNew[w] || 0);
            if (diff > 0) for (let i = 0; i < diff; i++) missing.push(w);
        });

        Object.keys(freqNew).forEach(w => {
            const diff = freqNew[w] - (freqOrig[w] || 0);
            if (diff > 0) for (let i = 0; i < diff; i++) extra.push(w);
        });

        return { missing, extra };
    };

    return (
        <div className={`flex h-screen w-screen overflow-hidden font-sans ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`w-64 border-r flex flex-col shrink-0 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <div className="p-4 border-b border-gray-700 font-bold text-center text-xl tracking-wider text-purple-400 flex items-center justify-center gap-2">🤖 AI EDİTÖR</div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {library.map(book => {
                        const isExpanded = expandedBooks[book.id];
                        return (
                            <div key={book.id} className="mb-2">
                                <div
                                    onClick={() => setExpandedBooks(prev => ({ ...prev, [book.id]: !prev[book.id] }))}
                                    className={`flex items-center gap-2 px-2 py-1.5 mb-1 cursor-pointer select-none rounded hover:bg-white/5 transition-colors ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}
                                >
                                    <span className={`text-[10px] transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                                    <h3 className="text-xs font-bold uppercase opacity-80">{book.title}</h3>
                                </div>
                                {isExpanded && (
                                    <ul className="space-y-1 ml-2 border-l border-gray-700 pl-2 animation-expand">
                                        {book.chapters.map(chap => (
                                            <li key={chap.id}>
                                                <button
                                                    onClick={() => prepareChapterForAI(book.id, chap.id, `${book.title} - ${chap.title}`)}
                                                    className={`w-full text-left px-3 py-2 rounded text-sm truncate ${activeChapterId === chap.id ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-gray-700 text-gray-300'}`}
                                                >
                                                    {chap.title}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 border-t border-gray-700"><button onClick={() => onSwitchMode('editor')} className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold border border-gray-600">⬅️ Normal Editöre Dön</button></div>
            </div>
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className={`h-16 border-b flex items-center justify-between px-6 shrink-0 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-4"><h2 className="text-lg font-bold truncate max-w-xs">{currentTitle}</h2></div>
                    <div className="flex gap-2 items-center relative">
                        {activeChapterId && (
                            <>
                                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="px-2 py-2 rounded text-xs font-bold border bg-gray-700 text-white cursor-pointer">{AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                                <button onClick={handleProcessAll} disabled={isGlobalProcessing || !API_KEY} className={`px-4 py-2 rounded font-bold shadow transition-all flex items-center gap-2 text-xs ${isGlobalProcessing ? 'bg-gray-600 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>{isGlobalProcessing ? '⏳ İşleniyor...' : `⚡ Çevir (${CONFIG.BATCH_SIZE}'li)`}</button>
                                <button onClick={downloadFile} className="px-4 py-2 rounded font-bold shadow bg-gray-700 text-gray-400 hover:text-white text-xs">📥 İNDİR</button>

                                <div className="w-px h-6 bg-gray-600 mx-2"></div>
                            </>
                        )}

                        {/* ALWAYS VISIBLE BUTTONS */}
                        <button
                            onClick={() => setShowReport(!showReport)}
                            className={`px-4 py-2 rounded font-bold shadow text-xs flex items-center gap-2 ${showReport ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}`}
                        >
                            📋 Çeviri Raporu
                        </button>

                        <button
                            onClick={() => onSwitchMode('admin')}
                            className="px-4 py-2 rounded font-bold shadow bg-red-900/50 hover:bg-red-700 text-red-200 border border-red-800 hover:text-white text-xs transition-colors"
                        >
                            🚪 Çıkış
                        </button>

                        {/* RENDER REPORT MODAL */}
                        {showReport && (
                            <AIReportList
                                library={library}
                                darkMode={darkMode}
                                onClose={() => setShowReport(false)}
                                onLoadChapter={(bid, cid) => {
                                    // Find book title to mimic standard load
                                    const book = library.find(b => b.id === bid);
                                    const chap = book?.chapters.find(c => c.id === cid);
                                    if (book && chap) {
                                        prepareChapterForAI(bid, cid, `${book.title} - ${chap.title}`);
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                    {!activeChapterId ? <div className="h-full flex flex-col items-center justify-center opacity-30"><span className="text-6xl mb-4">👈</span><p>Bölüm seçin.</p></div> : pages.map((page, idx) => {
                        // VALIDATION LOGIC
                        const normOrig = normalizeText(page.originalRaw);
                        const normNew = normalizeText(stripTags(page.newRaw || ""));

                        const originalWords = normOrig ? normOrig.split(" ").filter(w => w.length > 0) : [];
                        const newWords = normNew ? normNew.split(" ").filter(w => w.length > 0) : [];

                        const isExact = normOrig === normNew;
                        const diff = newWords.length - originalWords.length;

                        return (
                            <div key={idx} className={`flex flex-col gap-1 p-3 rounded-xl border ${processingQueue.includes(idx) ? 'border-yellow-500 bg-yellow-900/10' : page.status === 'modified' ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800/50 border-gray-700'}`}>
                                <div className="flex justify-between items-center mb-1 px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold opacity-70">Sayfa {page.id + 1}</span>
                                        {page.status === 'modified' && (
                                            isExact
                                                ? <span className="text-[10px] bg-green-900/50 text-green-300 px-2 py-0.5 rounded border border-green-700">✓ Tam Eşleşme</span>
                                                : <button
                                                    onClick={() => {
                                                        const d = getDiffWords(page.originalRaw, page.newRaw);
                                                        alert(`🔍 FARK DETAYI:\n\n➖ EKSİK KELİMELER (${d.missing.length}):\n${d.missing.join(", ") || "Yok"}\n\n➕ FAZLA/DEĞİŞEN KELİMELER (${d.extra.length}):\n${d.extra.join(", ") || "Yok"}`);
                                                    }}
                                                    className={`cursor-pointer hover:scale-105 transition-transform text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${diff < 0 ? 'bg-red-900/50 text-red-300 border-red-700' : 'bg-orange-900/50 text-orange-300 border-orange-700'}`}>
                                                    {diff < 0 ? '⚠️ Veri Kaybı:' : '⚠️ Fark:'} {Math.abs(diff)} kelime (Detay 🔍)
                                                </button>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        {page.processedBy && <span className="text-[10px] bg-gray-700 text-white px-1 py-0.5 rounded opacity-70 ml-2" title={page.processedBy}>{page.processedBy.split(' on ')[0]}</span>}
                                        {processingQueue.includes(idx) && <span className="text-yellow-500 text-xs animate-pulse ml-2">İşleniyor...</span>}
                                    </div>
                                </div>
                                <div className="flex gap-3 h-44">
                                    <div className="flex-1 relative">
                                        <textarea readOnly className="w-full h-full p-3 rounded text-xs font-mono resize-none border opacity-60 bg-black/30 border-gray-700 text-gray-400" value={page.originalRaw} />
                                        <div className="absolute bottom-2 right-2 flex gap-2">
                                            <button onClick={() => handleManualCopy(idx)} className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-blue-500">📋 Web</button>
                                            <button onClick={() => {
                                                if (selectedModel.includes("web")) {
                                                    alert("⚠️ 'Web' modeli seçili!\nBu modelle otomatik işlem yapılamaz. Lütfen Web butonunu kullanın.");
                                                    return;
                                                }
                                                if (window.confirm("Bu sayfayı 'Tekli' olarak işlemek istiyor musunuz?")) {
                                                    setProcessingQueue([idx]);

                                                    const jsonInput = JSON.stringify([{ id: String(idx), metin: stripTags(pages[idx].originalRaw) }]);
                                                    const fullPrompt = getApiPrompt(jsonInput);

                                                    callGeminiAPI(fullPrompt).then(res => {
                                                        try {
                                                            let parsed;
                                                            // Robust parsing strategy: Direct parse first
                                                            try {
                                                                const jsonStart = res.indexOf('{');
                                                                const arrayStart = res.indexOf('[');
                                                                const startIdx = (jsonStart !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) ? jsonStart : arrayStart;

                                                                // Determine closing char based on start char
                                                                const startChar = res[startIdx];
                                                                const endChar = startChar === '{' ? '}' : ']';
                                                                const endIdx = res.lastIndexOf(endChar);

                                                                const jsonPart = res.substring(startIdx, endIdx + 1);
                                                                parsed = JSON.parse(jsonPart);
                                                            } catch (directErr) {
                                                                console.warn("Direct single parse failed", directErr);
                                                                // Fallback to repair
                                                                const jsonStart = res.indexOf('{');
                                                                const arrayStart = res.indexOf('[');
                                                                const startIdx = (jsonStart !== -1 && (arrayStart === -1 || jsonStart < arrayStart)) ? jsonStart : arrayStart;

                                                                // Determine closing char based on start char
                                                                const startChar = res[startIdx];
                                                                const endChar = startChar === '{' ? '}' : ']';
                                                                const endIdx = res.lastIndexOf(endChar);

                                                                const jsonPart = res.substring(startIdx, endIdx + 1);
                                                                parsed = JSON.parse(repairJsonString(jsonPart));
                                                            }

                                                            const item = Array.isArray(parsed) ? parsed[0] : (parsed.sayfalar ? parsed.sayfalar[0] : parsed);
                                                            if (item && (item.metin || item.text)) {
                                                                updatePageContent(idx, item.metin || item.text, getSelectedModelName());
                                                            } else {
                                                                throw new Error("AI cevabında metin bulunamadı.");
                                                            }
                                                        } catch (e) {
                                                            alert("Hata: " + e.message);
                                                        }
                                                        setProcessingQueue([]);
                                                    }).catch(err => {
                                                        alert("API Hatası: " + err.message);
                                                        setProcessingQueue([]);
                                                    });
                                                }
                                            }} className="bg-purple-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-purple-500">✨ Tek</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative">
                                        <textarea className={`w-full h-full p-3 rounded text-xs font-mono resize-none border ${page.status === 'modified' ? 'border-blue-500 bg-blue-900/10' : 'bg-gray-900 border-gray-600'}`} value={page.newRaw} onChange={(e) => updatePageContent(idx, e.target.value, getSelectedModelName())} placeholder="AI cevabı veya manuel çeviri..." />
                                        <div className="absolute bottom-2 right-2 flex gap-2">
                                            <button onClick={async () => {
                                                try {
                                                    // Document focus check for Electron/Browsers
                                                    if (!document.hasFocus()) window.focus();

                                                    const text = await navigator.clipboard.readText();
                                                    if (text) updatePageContent(idx, text, getSelectedModelName());
                                                } catch (e) { alert("Pano okunamadı."); }
                                            }} className="bg-green-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-green-500 opacity-50 hover:opacity-100 transition-opacity">📋 Yapıştır</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}