import React, { useState, useEffect, useMemo, useRef } from 'react';
import { analyzeConsistency } from '../utils/analysisLogic';
import { library } from '../../data/library';

const PageLinks = ({ pages, onNavigate, targetWord }) => {
    if (!pages || pages.length === 0) return null;
    return (
        <div className="mt-2 border-t pt-1 border-gray-100 dark:border-gray-700 opacity-90">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                <span className="text-[9px] opacity-50 mr-1 shrink-0 sticky left-0">Konumlar:</span>
                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onNavigate && onNavigate(p, targetWord)}
                        className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-600 hover:text-white transition-colors border border-gray-300 dark:border-gray-600 font-mono"
                        title={`${p + 1}. Sayfaya Git`}
                    >
                        S.{p + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, color, icon, subtext, darkMode }) => (
    <div className={`p-3 rounded-lg border shadow-sm flex flex-col items-center justify-center text-center transition-all hover:scale-105 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`text-2xl mb-1 ${color}`}>{icon}</div>
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="text-xs opacity-70 font-semibold uppercase tracking-wider">{title}</div>
        {subtext && <div className="text-[10px] opacity-50 mt-1">{subtext}</div>}
    </div>
);

const SimpleBarChart = ({ data, darkMode }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className={`p-4 rounded-lg border shadow-sm mt-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h4 className="text-xs font-bold opacity-70 mb-4 uppercase tracking-wider text-center">Dağılım Analizi</h4>
            <div className="flex items-end justify-center gap-4 h-32">
                {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center group w-14">
                        <div className="relative w-full flex justify-center">
                            <div
                                style={{ height: `${(d.value / max) * 100}px` }}
                                className={`w-8 rounded-t transition-all duration-500 ${d.colorClass} opacity-80 group-hover:opacity-100`}
                            ></div>
                            <span className="absolute -top-5 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{d.value}</span>
                        </div>
                        <span className="text-[10px] mt-2 font-semibold opacity-70 text-center leading-tight">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AnalysisPanel = ({ pages, activeBookId, activeChapterId, darkMode, onFixAll, dictionary, onNavigate }) => {

    // --- STATE ---
    const [viewMode, setViewMode] = useState('summary'); // 'summary', 'consistency', 'phrases', 'missing'
    const [editState, setEditState] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [ignoredWords, setIgnoredWords] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('risaleIgnoredWords') || '[]');
        } catch (e) { return []; }
    });

    const [activeCasingIndex, setActiveCasingIndex] = useState(0);

    // Reset Casing Index on View Change
    useEffect(() => { if (viewMode === 'casing') setActiveCasingIndex(0); }, [viewMode]);

    // Auto-Scroll and Navigate when Active Index Changes (Casing Mode)
    useEffect(() => {
        if (viewMode === 'casing' && analysis?.casing?.length > 0) {
            // Ensure index is valid
            const safeIndex = Math.min(activeCasingIndex, analysis.casing.length - 1);
            if (safeIndex < 0) return;
            if (safeIndex !== activeCasingIndex) { setActiveCasingIndex(safeIndex); return; }

            const item = analysis.casing[safeIndex];
            if (item && onNavigate) {
                onNavigate(item.pageIndex, item.word);
            }
            // Scroll to item
            setTimeout(() => {
                const el = document.getElementById(`casing-item-${safeIndex}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [activeCasingIndex, viewMode, analysis]);

    // --- ASYNC ANALYSIS ---
    useEffect(() => {
        setIsAnalyzing(true);
        // Use timeout to unblock the main thread (render) before heavy calculation
        const timer = setTimeout(() => {
            const result = analyzeConsistency(pages, dictionary);
            setAnalysis(result);
            setIsAnalyzing(false);
        }, 100);
        return () => clearTimeout(timer);
    }, [pages, dictionary]);

    // Clear edit state if view changes
    useEffect(() => { setEditState(null); }, [viewMode]);

    if (!pages || pages.length === 0) return <div className="p-10 text-center opacity-50">Analiz için bir bölüm seçin</div>;

    // Strict check: If no analysis data exists (Initial or Error), show loading.
    // This handles both "isAnalyzing=true" (initial load) and "isAnalyzing=false" (before effect runs or failed).
    if (!analysis) return (
        <div className="flex flex-col items-center justify-center h-full opacity-60">
            <div className="animate-spin text-3xl mb-2">⚙️</div>
            <div>Analiz ediliyor...</div>
        </div>
    );

    const handleIgnore = (word) => {
        const newIgnored = [...ignoredWords, word];
        setIgnoredWords(newIgnored);
        localStorage.setItem('risaleIgnoredWords', JSON.stringify(newIgnored));
    };

    // Determine loading state for overlay
    const isLoadingOverlay = isAnalyzing && analysis;

    const handleSelectForEdit = (word, variantData) => {
        setEditState({
            word: word,
            short: variantData.short,
            long: variantData.longs[0] || "",
            isMerge: false
        });
    };

    const handleSelectForMerge = (phraseItem) => {
        const proposal = getMergedProposal(phraseItem);
        setEditState({
            word: phraseItem.phrase,
            originalObj: phraseItem,
            short: proposal.short,
            long: proposal.long,
            isMerge: true
        });
    };

    const handleSave = () => {
        if (onFixAll && editState) {
            if (editState.isMerge) {
                onFixAll(editState.originalObj, '__MERGE__', editState.short, editState.long);
            } else {
                onFixAll(editState.word, editState.short, editState.long);
            }
            setEditState(null);
        }
    };

    const getMergedProposal = (phrase) => {
        const mergedShort = phrase.exampleSequence.map(p => p.short).filter(s => s).join(' ');
        const mergedLong = phrase.exampleSequence.map(p => p.long).filter(l => l).join(', ');
        return { short: mergedShort, long: mergedLong };
    };

    // Filter Missing words
    const missingWords = analysis.missing.filter(m => !ignoredWords.includes(m.word));

    // Chart Data
    const chartData = [
        { label: 'Öbek', value: analysis.stats.phraseCount, colorClass: 'bg-purple-500' },
        { label: 'Eksik', value: missingWords.length, colorClass: 'bg-yellow-500' },
        { label: 'B.Harf', value: analysis.stats.casingCount, colorClass: 'bg-orange-500' },
        { label: 'Tutarsız', value: analysis.stats.inconsistentCount, colorClass: 'bg-red-500' },
        { label: 'Tutarlı', value: analysis.stats.uniqueWords - analysis.stats.inconsistentCount, colorClass: 'bg-green-500' },
    ];

    const handleCasingPrev = () => setActiveCasingIndex(p => Math.max(0, p - 1));

    const handleCasingNext = () => setActiveCasingIndex(p => Math.min((analysis?.casing?.length || 1) - 1, p + 1));

    const handleCasingFix = () => {
        if (!analysis?.casing || analysis.casing.length === 0) return;
        const item = analysis.casing[activeCasingIndex];
        if (!item) return;

        const correctTrans = item.translation.charAt(0).toLocaleUpperCase('tr') + item.translation.slice(1);
        const newTag = item.long
            ? `[[${item.word}|${correctTrans}|${item.long}]]`
            : `[[${item.word}|${correctTrans}]]`;

        if (onFixAll) {
            onFixAll(item.fullTag, '__FIX_ONE_TAG__', newTag, Number(item.pageIndex), item.startIndex);
        }
    };

    return (
        <div className={`flex flex-col h-full relative ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {/* TABS HEADER */}
            <div className={`p-2 border-b shrink-0 flex gap-2 overflow-x-auto custom-scrollbar ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                {[
                    { id: 'summary', label: '📊 Özet', count: 0 },
                    { id: 'diff', label: 'Çeviri Düzelt', count: 0, color: 'bg-blue-600' },
                    { id: 'missing', label: 'Eksik', count: missingWords.length, color: 'bg-yellow-500' },
                    { id: 'casing', label: 'Büyük Harf', count: analysis.stats.casingCount, color: 'bg-orange-500' },
                    { id: 'consistency', label: 'Tutarlılık', count: analysis.stats.inconsistentCount, color: 'bg-red-500' },
                    { id: 'phrases', label: 'Öbekler', count: analysis.stats.phraseCount, color: 'bg-purple-500' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-2 whitespace-nowrap 
                            ${viewMode === tab.id
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : `hover:bg-gray-200 dark:hover:bg-gray-700 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-800 border-gray-300'}`
                            }`}
                    >
                        {tab.label}
                        {tab.count > 0 && <span className={`px-1.5 py-0.5 ${tab.color} text-white rounded-full text-[9px]`}>{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${editState ? 'pb-60' : 'pb-20'}`}>

                {/* SUMMARY VIEW */}
                {viewMode === 'summary' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <SummaryCard title="Benzersiz Kelime" value={analysis.stats.uniqueWords} icon="📝" color="text-blue-500" darkMode={darkMode} />
                            <SummaryCard title="Eksik Etiket" value={missingWords.length} icon="🔍" color="text-yellow-500" darkMode={darkMode} />
                            <SummaryCard title="Büyük Harf" value={analysis.stats.casingCount} icon="Aa" color="text-orange-500" darkMode={darkMode} />
                            <SummaryCard title="Tutarsızlık" value={analysis.stats.inconsistentCount} icon="⚠️" color="text-red-500" darkMode={darkMode} />
                            <SummaryCard title="Öbek Önerisi" value={analysis.stats.phraseCount} icon="🔗" color="text-purple-500" darkMode={darkMode} />
                        </div>
                        <SimpleBarChart data={chartData} darkMode={darkMode} />
                    </div>
                )}

                {/* CONSISTENCY VIEW */}
                {viewMode === 'consistency' && (
                    <div className="space-y-4">
                        {analysis.consistency.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 opacity-60">
                                <span className="text-4xl mb-2">✅</span>
                                <div>Tutarlılık sorunu bulunamadı.</div>
                            </div>
                        ) : (
                            analysis.consistency.map(item => (
                                <div key={item.word} className={`p-4 rounded-xl border shadow-sm text-sm transition-all hover:shadow-md ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${editState?.word === item.word ? 'ring-2 ring-blue-500' : ''}`}>
                                    <div className="font-bold text-lg text-blue-500 mb-2 flex justify-between items-center border-b pb-2 border-gray-100 dark:border-gray-700">
                                        <span>{item.word}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-700 font-bold'}`}>Toplam: {item.total}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {item.variants.map((v) => (
                                            <div key={v.short} className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                                                <div className="flex-1">
                                                    <div className="font-bold text-green-600">{v.short || ' (Boş)'}</div>
                                                    {v.longs.length > 0 && <div className="text-[10px] opacity-60 italic">{v.longs[0]}</div>}
                                                </div>
                                                <div className="font-mono font-bold opacity-50 text-sm px-2">{v.count}</div>
                                                <button
                                                    onClick={() => handleSelectForEdit(item.word, v)}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] uppercase font-bold rounded-md shadow-sm transition-transform active:scale-95"
                                                >
                                                    Seç
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <PageLinks pages={item.pages} onNavigate={onNavigate} targetWord={item.word} />
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* PHRASES VIEW */}
                {viewMode === 'phrases' && (
                    <div className="space-y-4">
                        {analysis.phrases.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 opacity-60">
                                <span className="text-4xl mb-2">🤷‍♂️</span>
                                <div>Öbek önerisi bulunamadı.</div>
                            </div>
                        ) : (
                            analysis.phrases.map(item => (
                                <div key={item.phrase} className={`p-4 rounded-xl border shadow-sm text-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-bold text-purple-500 text-lg">{item.phrase}</div>
                                        <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full font-bold">{item.count}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {item.exampleSequence.map((part, idx) => (
                                            <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-mono border ${darkMode ? 'bg-gray-900 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                                                {part.word}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handleSelectForMerge(item)}
                                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                                    >
                                        🔗 Birleştir ve Düzenle
                                    </button>
                                    <PageLinks pages={item.pages} onNavigate={onNavigate} targetWord={item.phrase} />
                                </div>
                            ))
                        )}
                        <div className="text-[10px] opacity-40 p-4 text-center italic">
                            Ayrı etiketlenmiş kelime gruplarını (örn: "Rabbi" + "Rahim") tespit eder.
                        </div>
                    </div>
                )}

                {/* MISSING VIEW */}
                {viewMode === 'missing' && (
                    <div className="space-y-4">
                        <div className="text-xs bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700 mb-4 flex gap-2 items-center">
                            <span>🔍</span>
                            Aşağıdaki kelimeler sözlükte bulundu fakat metinde etiketlenmemiş.
                        </div>
                        {missingWords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 opacity-60">
                                <span className="text-4xl mb-2">🎉</span>
                                <div>Eksik etiket bulunamadı.</div>
                            </div>
                        ) : (
                            missingWords.map(item => {
                                const dictEntry = dictionary[item.word];
                                const short = dictEntry ? (dictEntry.short || dictEntry) : "?";
                                const long = dictEntry ? (dictEntry.long || "") : "";

                                return (
                                    <div key={item.word} className={`p-3 rounded-xl border shadow-sm text-sm flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex-1">
                                                <div className="font-bold text-lg text-yellow-600">{item.word}</div>
                                                <div className="text-xs opacity-70 italic">{short}</div>
                                            </div>
                                            <div className="font-mono text-xs opacity-50 mr-4">{item.count} kez</div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onNavigate && onNavigate(item.pages[0], item.word)}
                                                    className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded shadow-sm"
                                                    title="Metinde Bul"
                                                >
                                                    🎯 Seç
                                                </button>
                                                <button
                                                    onClick={() => onFixAll && onFixAll(item.word, '__AUTO_TAG__', short, long)}
                                                    className="px-2 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-[10px] font-bold rounded shadow-sm"
                                                    title="Otomatik Etiketle"
                                                >
                                                    🏷️ Etiketle
                                                </button>
                                                <button
                                                    onClick={() => handleIgnore(item.word)}
                                                    className="px-2 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-[10px] font-bold rounded shadow-sm"
                                                    title="Bu kelimeyi bir daha gösterme"
                                                >
                                                    🚫 Yoksay
                                                </button>
                                            </div>
                                        </div>
                                        <PageLinks pages={item.pages} onNavigate={onNavigate} targetWord={item.word} />
                                    </div>
                                );
                            }))}
                    </div>
                )}

                {/* CASING VIEW */}
                {/* CASING VIEW */}
                {viewMode === 'casing' && (
                    <div className="flex flex-col min-h-full">
                        {/* HEADER - STICKY */}
                        <div className={`sticky top-0 z-20 -mt-4 -mx-4 px-4 py-3 border-b shadow-md flex items-center justify-between shrink-0 mb-2 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                            <button onClick={handleCasingPrev} className="px-3 py-1.5 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-xs transition-colors">
                                ⬅️ Önceki
                            </button>

                            <div className="flex flex-col items-center">
                                <button onClick={handleCasingFix} className="px-6 py-1.5 bg-orange-600 text-white rounded font-bold text-sm shadow hover:bg-orange-500 active:scale-95 transition-transform flex gap-2 items-center">
                                    <span>✨ Düzelt</span>
                                </button>
                                <span className={`text-[10px] opacity-70 font-mono mt-1 font-bold ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                    {analysis.casing.length > 0 ? (activeCasingIndex + 1) : 0} / {analysis.casing.length}
                                </span>
                            </div>

                            <button onClick={handleCasingNext} className="px-3 py-1.5 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 font-bold text-xs transition-colors">
                                Sonraki ➡️
                            </button>
                        </div>

                        {/* LIST */}
                        <div className="space-y-3 pb-4">
                            {analysis.casing.length === 0 ? (
                                <div className="text-center p-10 opacity-50 flex flex-col items-center">
                                    <span className="text-4xl mb-2">✅</span>
                                    <span>Harika! Sorun bulunamadı.</span>
                                </div>
                            ) : (
                                analysis.casing.map((item, index) => {
                                    const isActive = index === activeCasingIndex;
                                    const totalForWord = analysis.casing.filter(c => c.word === item.word).length;
                                    const correctTrans = item.translation.charAt(0).toLocaleUpperCase('tr') + item.translation.slice(1);
                                    const correctTag = item.long
                                        ? `[[${item.word}|${correctTrans}|${item.long}]]`
                                        : `[[${item.word}|${correctTrans}]]`;

                                    if (!isActive) {
                                        return (
                                            <div
                                                key={`${item.word}-${index}`}
                                                id={`casing-item-${index}`}
                                                onClick={() => setActiveCasingIndex(index)}
                                                className={`px-4 py-2 rounded-lg border text-xs flex justify-between items-center cursor-pointer transition-colors
                                                    ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-white'}
                                                `}
                                            >
                                                <div className="font-mono truncate flex-1 opacity-80">{item.word}</div>
                                                <div className="opacity-50 ml-2 whitespace-nowrap">S. {item.pageIndex + 1}</div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={`${item.word}-${index}`}
                                            id={`casing-item-${index}`}
                                            onClick={() => setActiveCasingIndex(index)}
                                            className={`p-4 rounded-xl border text-sm relative transition-all cursor-pointer shadow-md my-2
                                                ${darkMode ? 'bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/30' : 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'}
                                                `}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${item.isSentenceStart
                                                    ? (darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800')
                                                    : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600 border border-gray-200 shadow-sm')
                                                    }`}>
                                                    {item.isSentenceStart ? '⚡ Cümle başı' : 'Cümle içi'}
                                                </div>
                                                <div className="text-[10px] font-mono opacity-50">
                                                    Sayfa {item.pageIndex + 1}
                                                </div>
                                            </div>

                                            <div className="mt-2 font-mono text-[13px] break-all leading-relaxed space-y-2">
                                                <div className={`${darkMode ? 'text-red-400 opacity-90' : 'text-red-600'}`}>
                                                    {item.fullTag}
                                                </div>
                                                <div className={`${darkMode ? 'text-green-400' : 'text-green-700'} font-bold`}>
                                                    {correctTag}
                                                </div>
                                            </div>

                                            {totalForWord > 1 && (
                                                <div className="mt-3 pt-2 border-t border-dashed border-blue-200 dark:border-blue-800 text-[10px] opacity-60 text-center">
                                                    Bu kelime ({item.word}) için toplam <b>{totalForWord}</b> sorun var.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}


                {/* DIFF (TRANSLATION CORRECTION) VIEW */}
                {viewMode === 'diff' && (
                    <TranslationCorrectionView
                        pages={pages}
                        activeBookId={activeBookId}
                        activeChapterId={activeChapterId}
                        onFixAll={onFixAll}
                        darkMode={darkMode}
                        onNavigate={onNavigate}
                    />
                )}

            </div>

            {/* EDIT PANEL (Sticky Bottom) */}
            {editState && (
                <div className={`absolute bottom-0 left-0 right-0 p-4 pb-8 border-t-2 shadow-[0_-5px_20px_rgba(0,0,0,0.2)] z-30 animation-slide-up ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-blue-500 text-gray-800'}`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-blue-500 flex items-center gap-2">
                            ✏️ Düzenle: <span className="text-white bg-blue-500 px-2 py-0.5 rounded text-xs">{editState.word}</span>
                        </span>
                        <button onClick={() => setEditState(null)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">✕</button>
                    </div>
                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="text-[10px] font-bold opacity-60 uppercase mb-1 block">Kısa Anlam (Görünecek)</label>
                            <input
                                className={`w-full p-2.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                value={editState.short}
                                onChange={(e) => setEditState({ ...editState, short: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold opacity-60 uppercase mb-1 block">Uzun Anlam (Tooltip)</label>
                            <textarea
                                className={`w-full p-2.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}
                                value={editState.long}
                                onChange={(e) => setEditState({ ...editState, long: e.target.value })}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2"
                    >
                        <span>✓</span> Tümünü Değiştir
                    </button>
                </div>
            )}
        </div>
    );
};

// --- SUB-COMPONENT: TRANSLATION CORRECTION ---

const stripTags = (text) => {
    if (!text) return "";
    let clean = text.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");

    // Format [[Original|Translation]] as "Original"
    clean = clean.replace(/\[\[([^|]+)\|.*?\]\]/g, '$1');

    // Remove custom markers like # and ::
    clean = clean.replace(/[#:]+/g, '');

    // Remove bold markers (**) but protect section breaks (***)
    clean = clean.replace(/\*\*\*/g, '___TRIPLE_STAR___');
    clean = clean.replace(/\*\*/g, '');
    clean = clean.replace(/___TRIPLE_STAR___/g, '***');

    return clean;
};

const computeDiff = (oldText, newText) => {
    if (!oldText && !newText) return [];

    // Normalize newlines and split by whitespace
    const oldWords = (oldText || "").replace(/\r\n/g, "\n").split(/\s+/);
    const newWords = (newText || "").replace(/\r\n/g, "\n").split(/\s+/);

    // Helper to ignore punctuation for comparison
    const clean = (text) => text.replace(/[.,;:"'?!(){}[\]]/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "").toLocaleLowerCase('tr');

    const diff = [];
    let i = 0;
    let j = 0;

    // Very simple diffing: match words until mismatch, then look ahead
    while (i < oldWords.length || j < newWords.length) {
        if (i < oldWords.length && j < newWords.length && clean(oldWords[i]) === clean(newWords[j])) {
            diff.push({
                type: 'equal',
                oldValue: oldWords[i] + " ",
                newValue: newWords[j] + " "
            });
            i++;
            j++;
        } else {
            // Mismatch found. 
            // Is it an addition? (Next word in NEW matches current in OLD)
            // Is it a deletion? (Next word in OLD matches current in NEW)
            // Or a modification?

            let deletion = null;
            let insertion = null;

            // Look ahead to minimize noise
            // Try to find current OLD word in upcoming NEW words (Insertion check)
            let foundInNew = false;

            // Only convert oldWords[i] if i is within bounds
            if (i < oldWords.length) {
                for (let k = 1; k < 20; k++) { // Look ahead 20 words
                    if (j + k < newWords.length && clean(oldWords[i]) === clean(newWords[j + k])) {
                        // It was an insertion of k words
                        insertion = newWords.slice(j, j + k);
                        j += k;
                        foundInNew = true;
                        break;
                    }
                }
            }

            if (foundInNew) {
                const insertedText = insertion.join(" ");
                // Check if it is a parenthetical note (e.g. "(yaklaşık ...)")
                if (insertedText.startsWith('(') && insertedText.endsWith(')')) {
                    diff.push({ type: 'note', value: insertedText + " " });
                } else {
                    diff.push({ type: 'add', value: insertedText + " " });
                }
                continue;
            }

            // Try to find current NEW word in upcoming OLD words (Deletion check)
            let foundInOld = false;

            // Only convert newWords[j] if j is within bounds
            if (j < newWords.length) {
                for (let k = 1; k < 20; k++) {
                    if (i + k < oldWords.length && clean(newWords[j]) === clean(oldWords[i + k])) {
                        // It was a deletion of k words
                        deletion = oldWords.slice(i, i + k);
                        i += k;
                        foundInOld = true;
                        break;
                    }
                }
            }

            if (foundInOld) {
                diff.push({ type: 'remove', value: deletion.join(" ") + " " });
                continue;
            }

            // If neither, treat as localized replacement (one word mismatch)
            if (i < oldWords.length) {
                diff.push({ type: 'remove', value: oldWords[i] + " " });
                i++;
            }
            if (j < newWords.length) {
                diff.push({ type: 'add', value: newWords[j] + " " });
                j++;
            }
        }
    }
    return diff;
};

const CorrectionPageCard = ({ page, rawPage, idx, darkMode, onNavigate, onFixAll }) => {
    const [diffIndex, setDiffIndex] = useState(0);

    // Refs for auto-scrolling
    const rawContainerRef = useRef(null);
    const currentContainerRef = useRef(null);

    const rawContent = rawPage.rawText || rawPage.newRaw || rawPage.text || rawPage.metin || "";
    const diffRaw = stripTags(rawContent);
    const diffCurrent = stripTags(page.oldText || page.text || page.rawText || page.content || "");
    const diffs = computeDiff(diffRaw, diffCurrent);

    // Group diffs for smarter navigation
    const navigationItems = useMemo(() => {
        const items = [];
        let lastEqual = null; // Track the last matching word to use as anchor
        // Track occurrences for ALL words to find correct anchor position
        const wordCounts = {};

        for (let i = 0; i < diffs.length; i++) {
            const current = diffs[i];
            const next = diffs[i + 1];

            if (current.type === 'equal') {
                const w = current.value;
                wordCounts[w] = (wordCounts[w] || 0) + 1;
                // Store BOTH value and its occurrence index (0-based)
                lastEqual = { value: w, occurrence: wordCounts[w] - 1 };
            }

            if (current.type === 'remove' && next && next.type === 'add') {
                // Mismatch (Typo or Change)
                // For mismatch, we also need to know occurrence of the "original" to find it? 
                // Currently mismatch logic relies on "current" (wrong) word which is usually unique enough or handled by smart fix logic
                const w = current.value;
                // We should count removals too if we want perfect tracking? 
                // Actually smart fix uses the "Wrong" word to search. 
                // Let's keep mismatch logic as is for now.
                items.push({ type: 'mismatch', original: current.value, current: next.value, index: i, addIndex: i + 1 });
                i++; // Skip next
            } else if (current.type === 'remove') {
                // MISSING with Anchor Logic
                items.push({
                    type: 'missing',
                    original: current.value,
                    current: null,
                    index: i,
                    anchor: lastEqual ? lastEqual.value : null,
                    anchorOccurrence: lastEqual ? lastEqual.occurrence : -1
                });
            } else if (current.type === 'add') {
                items.push({ type: 'extra', original: null, current: current.value, index: i, addIndex: i });
            }
        }
        return items;
    }, [diffs]);

    const isDifferent = navigationItems.length > 0;

    // Collapse if matching (isDifferent false) by default
    const [isOpen, setIsOpen] = useState(isDifferent);

    // If suddenly becomes different (e.g. reload), maybe open? But user preference overrides.
    // Let's just trust initial state for now. Only open if became different?
    useEffect(() => {
        if (isDifferent) setIsOpen(true);
    }, [isDifferent]);

    const currentItem = navigationItems[diffIndex];

    const activeAddIndex = currentItem ? (currentItem.addIndex !== undefined ? currentItem.addIndex : -1) : -1;
    // For raw/original, usually we map to the 'remove' index
    const activeRemoveIndex = currentItem ? currentItem.index : -1;

    // SCROLL EFFECT
    useEffect(() => {
        if (!isDifferent || !isOpen) return;

        const scrollToElement = (container, index) => {
            if (!container) return;
            const el = container.querySelector(`[data-diff-idx="${index}"]`);
            if (el) {
                // Use scrollTop instead of scrollIntoView to prevent parent scrolling
                const containerRect = container.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const offset = el.offsetTop - container.offsetTop;
                // Center the element
                container.scrollTop = offset - (container.clientHeight / 2) + (el.clientHeight / 2);
            }
        };

        // Scroll Current (Right Panel)
        if (activeAddIndex !== -1) {
            scrollToElement(currentContainerRef.current, activeAddIndex);
        }

        // Scroll Raw (Left Panel)
        if (activeRemoveIndex !== -1) {
            scrollToElement(rawContainerRef.current, activeRemoveIndex);
        }

    }, [diffIndex, activeAddIndex, activeRemoveIndex, isDifferent, isOpen]);


    const handleSkip = (e) => {
        e.stopPropagation();
        if (!isDifferent) return;
        setDiffIndex((prev) => (prev + 1) % navigationItems.length);
    };

    const handleGo = (e) => {
        e.stopPropagation();
        if (!currentItem || !onNavigate) return;
        const target = currentItem.current || currentItem.original;

        // Fix: Strip punctuation for cleaner search in editor
        if (target) {
            const cleanTarget = target.replace(/[.,;:"?!()[\]]/g, "").trim();
            if (cleanTarget) {
                onNavigate(idx, cleanTarget);
            }
        }
    };

    const handleFix = (e) => {
        e.stopPropagation();
        if (!currentItem || !onFixAll) return;

        let original = "";
        let current = "";
        // Default to first occurrence if not specified
        let occIdx = -1;
        let variant = '__SMART_FIX__';
        let anchor = null;

        if (currentItem.type === 'mismatch') {
            original = currentItem.original;
            current = currentItem.current;
            occIdx = currentItem.occurrenceIndex || -1;
        } else if (currentItem.type === 'extra') {
            original = "";
            current = currentItem.current;
        } else if (currentItem.type === 'missing') {
            // MISSING: Use Anchor to insert AFTER
            variant = '__INSERT_AFTER__';
            original = currentItem.original; // What to insert
            anchor = currentItem.anchor; // Where to insert after
            // Use Anchor's occurrence index
            occIdx = currentItem.anchorOccurrence !== undefined ? currentItem.anchorOccurrence : -1;
        }

        if (variant === '__INSERT_AFTER__') {
            // Pass Anchor Occurrence as arg6 (reusing occIdx param)
            onFixAll(null, variant, original, anchor, idx, occIdx);
        } else {
            onFixAll(null, variant, original, current, idx, occIdx);
        }
    };

    return (
        <div className={`rounded-xl border shadow-sm overflow-hidden mb-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div
                className={`flex justify-between items-center text-xs px-4 py-3 cursor-pointer select-none transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} border-b border-transparent ${isOpen ? (darkMode ? 'border-gray-700' : 'border-gray-200') : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <span className={`transform transition-transform duration-200 text-[10px] opacity-60 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>▶</span>
                    <span className="font-bold opacity-60">Sayfa {idx + 1}</span>
                    {isDifferent ? (
                        <span className="text-red-500 font-bold flex items-center gap-1 text-[10px]">
                            ⚠️ Fark Var ({navigationItems.length})
                        </span>
                    ) : (
                        <span className="text-green-500 font-bold flex items-center gap-1 text-[10px]">✓ Eşleşiyor</span>
                    )}
                </div>

                {isDifferent && isOpen && (
                    <div className="flex gap-1 h-6 items-center">
                        <span className="mr-2 text-[10px] opacity-50 font-mono">{diffIndex + 1}/{navigationItems.length}</span>
                        <button
                            onClick={handleGo}
                            className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 px-2 h-full rounded-l hover:bg-blue-200 text-[10px] font-bold border-r border-blue-200 dark:border-blue-800"
                            title="Farka Git"
                        >
                            Git
                        </button>
                        <button
                            onClick={handleSkip}
                            className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 h-full hover:bg-gray-300 dark:hover:bg-gray-600 text-[10px] font-bold border-r border-gray-300 dark:border-gray-600"
                            title="Sonraki"
                        >
                            Geç
                        </button>
                        <button
                            onClick={handleFix}
                            className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200 px-2 h-full rounded-r hover:bg-red-200 text-[10px] font-bold"
                            title="Bu farkı düzelt"
                        >
                            Düzelt
                        </button>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="grid grid-cols-2 text-xs font-mono h-[400px] overflow-y-auto custom-scrollbar group relative leading-relaxed animation-expand">
                    {/* RAW (LEFT) */}
                    <div ref={rawContainerRef} className="p-4 border-r border-gray-100 dark:border-gray-700 overflow-y-auto whitespace-pre-wrap">
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-1 rounded mb-2 inline-block text-[10px] font-bold uppercase sticky top-0 z-10">Orijinal (Raw)</div>
                        <div className="text-gray-600 dark:text-gray-400">
                            {diffs.map((part, i) => {
                                const isActive = i === activeRemoveIndex;
                                let className = "";
                                if (part.type === 'remove') {
                                    className = isActive
                                        ? "bg-green-500 text-white font-bold px-1 rounded shadow-sm ring-2 ring-green-300" // Active -> Green High Visibility
                                        : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 font-bold border-b-2 border-green-400";
                                }

                                return (
                                    <span key={i} data-diff-idx={i} className={className}>
                                        {part.type === 'remove' ? part.value : (part.type === 'equal' ? part.oldValue : "")}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* CURRENT (RIGHT) - Yellow for Errors, Red for Active */}
                    <div ref={currentContainerRef} className="p-4 overflow-y-auto whitespace-pre-wrap">
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-1 rounded mb-2 inline-block text-[10px] font-bold uppercase sticky top-0 z-10">Mevcut (Hatalı)</div>
                        <div className="text-gray-600 dark:text-gray-400">
                            {diffs.map((part, i) => {
                                const isActive = i === activeAddIndex;
                                let className = "";
                                if (part.type === 'add') {
                                    className = isActive
                                        ? "bg-red-500 text-white font-bold px-1 rounded shadow-sm ring-2 ring-red-300"
                                        : "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 font-bold border-b-2 border-yellow-400";
                                } else if (part.type === 'note') {
                                    className = "text-gray-500 dark:text-gray-500 italic opacity-75"; // Neutral style
                                }

                                return (
                                    <span key={i} data-diff-idx={i} className={className}>
                                        {part.type === 'add' || part.type === 'note' ? part.value : (part.type === 'equal' ? part.newValue : "")}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};






const TranslationCorrectionView = ({ pages, activeBookId, activeChapterId, onFixAll, darkMode, onNavigate }) => {
    const [rawPages, setRawPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRawData();
    }, [activeBookId, activeChapterId]);

    const loadRawData = async () => {
        const book = library.find(b => b.id === activeBookId);
        if (!book) {
            setError(`Kitap bulunamadı: ${activeBookId}`);
            return;
        }

        // Web Fallback: Use the loader from library.js
        if (!window.api || !window.api.readRawFile) {
            setLoading(true);
            setError(null);
            try {
                // Try to find chapter by ID
                let targetChapter = book.chapters.find(c => c.id === activeChapterId);

                // Fallback: If activeChapterId is numeric string or number, try index
                if (!targetChapter && !isNaN(activeChapterId)) {
                    const idx = Number(activeChapterId);
                    if (idx >= 0 && idx < book.chapters.length) {
                        targetChapter = book.chapters[idx];
                    }
                }

                // Fallback 2: Try standard ID format (bookId_index+1) simply as last resort?
                // Usually activeChapterId is accurate.

                if (!targetChapter) {
                    setError(`Bölüm bulunamadı (ID: ${activeChapterId})`);
                    setLoading(false);
                    return;
                }

                console.log("Loading raw data via web loader:", targetChapter.id);
                const module = await targetChapter.loader();
                const data = module.default || module;

                let loadedPages = [];
                if (data.pages && Array.isArray(data.pages)) loadedPages = data.pages;
                else if (Array.isArray(data)) loadedPages = data;

                // Tag for debug
                loadedPages._debugPath = "Web Loader (" + targetChapter.title + ")";
                setRawPages(loadedPages);

            } catch (err) {
                setError("Web yükleme hatası: " + err.message);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Desktop / Electron Logic
        if (!book.folderName) {
            setError(`Kitap klasör bilgisi bulunamadı. (ID: ${activeBookId})`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const filename = `${book.folderName}/${activeChapterId}.json`;
            const result = await window.api.readRawFile({ filename });

            if (result.success) {
                const data = JSON.parse(result.content);
                let loadedPages = [];
                if (data.pages && Array.isArray(data.pages)) loadedPages = data.pages;
                else if (Array.isArray(data)) loadedPages = data;

                loadedPages._debugPath = result.filePath;

                setRawPages(loadedPages);
            } else {
                setError(`Dosya bulunamadı: ${filename}`);
            }
        } catch (err) {
            setError("Yükleme hatası: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center opacity-50">📂 Orijinal dosya yükleniyor...</div>;
    if (error) return <div className="p-10 text-center text-red-500">❌ {error}</div>;

    // DEBUG: Show loaded path
    const debugPath = rawPages._debugPath || "Bilinmiyor";

    return (
        <div className="space-y-8">
            <div className="text-[10px] text-gray-400 font-mono text-center">
                Kaynak: {debugPath}
            </div>
            {pages.map((page, idx) => (
                <CorrectionPageCard
                    key={idx}
                    page={page}
                    rawPage={rawPages[idx] || { text: "Bulunamadı" }}
                    idx={idx}
                    darkMode={darkMode}
                    onNavigate={onNavigate}
                    onFixAll={onFixAll}
                />
            ))}
        </div>
    );
};

