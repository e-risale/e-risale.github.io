import React, { useEffect, useCallback } from 'react';
import { isArabicText } from '../../utils/editorHelpers';

export const EditorContent = ({
    activeBookId,
    mode,
    rawText,
    modernText,
    pages,
    pageIndex,
    saveStatus,
    darkMode,
    editorFontSize,
    textAreaRef,
    // Actions
    onRawTextChange,
    onMouseUp,
    onWordClick,
    highlightTerm // Added prop
}) => {

    // --- HELPER: DATE FORMATTER ---
    const formatLastUpdated = (isoDateString) => {
        if (!isoDateString) return "Henüz güncellenmedi";
        const d = new Date(isoDateString);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hour = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `Son güncelleme: ${day}.${month}.${year} - ${hour}:${min} `;
    };

    // --- TEXTAREA RESIZE ---
    const adjustHeight = useCallback(() => {
        if (!textAreaRef) return;
        const ta = textAreaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = ta.scrollHeight + 'px';
        }
    }, [textAreaRef]);

    useEffect(() => {
        adjustHeight();
    }, [rawText, mode, editorFontSize, adjustHeight]);

    // Auto-Scroll to Highlight
    useEffect(() => {
        if (highlightTerm) {
            // Need a slight delay for React to render the new class
            const timer = setTimeout(() => {
                const el = document.querySelector('.animate-flash-update');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [highlightTerm, pageIndex]);

    // --- RECURSIVE RENDER LOGIC ---
    const renderRecursive = (text) => {
        if (!text) return null;
        return text.split(/(\[\[[\s\S]*?\]\]|\(\([\s\S]*?\)\)|\*\*[\s\S]*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <b key={i}>{renderRecursive(part.slice(2, -2))}</b>;
            }
            if (part.startsWith('((') && part.endsWith('))')) {
                const inner = part.slice(2, -2);
                const isAr = isArabicText(inner);
                return <span key={i} style={{ fontFamily: isAr ? "'Noto Naskh Arabic', serif" : 'inherit', fontSize: isAr ? '1.2em' : 'inherit' }} className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-600'} `}>{renderRecursive(inner)}</span>;
            }
            if (part.startsWith('[[') && part.endsWith(']]')) {
                const raw = part.slice(2, -2).split('|');
                const orig = raw[0];
                const short = raw[1];
                const long = raw[2] || "";
                const isAuto = raw[3] && raw[3].trim() === '*';

                const disp = mode === 'check' ? short : orig;
                const isAr = mode === 'tag' && isArabicText(disp);

                const color = isAuto
                    ? (darkMode ? 'border-yellow-600 text-yellow-300 hover:bg-yellow-900' : 'border-yellow-500 text-yellow-700 hover:bg-yellow-50')
                    : (mode === 'check' ? (darkMode ? 'border-blue-700 text-blue-300 hover:bg-blue-900' : 'border-blue-500 text-blue-800 hover:bg-blue-50') : (darkMode ? 'border-green-700 text-green-300 hover:bg-green-900' : 'border-green-500 text-green-800 hover:bg-green-50'));

                // Highlight Logic
                const isHighlighted = highlightTerm && (
                    orig.toLowerCase().trim() === highlightTerm.toLowerCase().trim() ||
                    (short && short.toLowerCase().trim() === highlightTerm.toLowerCase().trim())
                );
                const highlightClass = isHighlighted ? 'animate-flash-update ring-4 ring-orange-500 rounded z-10' : '';

                return (
                    <span key={i} className={`relative group inline-block mx-0.5 align-baseline ${highlightClass}`}>
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                const r = e.target.getBoundingClientRect();
                                onWordClick(r, orig, short, long);
                            }}
                            style={{ fontSize: isAr ? '1.25em' : 'inherit', fontFamily: isAr ? "'Noto Naskh Arabic', serif" : 'inherit' }}
                            className={`cursor-pointer border-b-2 border-dotted px-0.5 font-normal transition-colors ${color} `}
                        >
                            {disp}
                        </span>
                        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 w-max max-w-[250px] ${darkMode ? 'bg-gray-800 text-gray-100 border-gray-600' : 'bg-white text-gray-800 border-gray-200'} `} style={{ fontSize: '0.9rem' }}>
                            <div className="flex flex-col text-left">
                                <div className="font-bold text-sm border-b pb-1 mb-1">{mode === 'check' ? orig : short}</div>
                                {long && <div className="text-xs opacity-90">{long}</div>}
                            </div>
                            <svg className={`absolute h-2 w-full left-0 top-full ${darkMode ? 'text-gray-800' : 'text-white'} `} x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
                        </span>
                    </span>
                );
            }
            // Plain text handling for highlight
            if (highlightTerm) {
                const regex = new RegExp(`(${highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                if (regex.test(part)) {
                    return <span key={i}>{
                        part.split(regex).map((chunk, ci) => {
                            if (chunk.toLowerCase() === highlightTerm.toLowerCase()) {
                                return <span key={ci} className="animate-flash-update bg-yellow-400 text-black rounded px-1">{chunk}</span>
                            }
                            return chunk;
                        })
                    }</span>;
                }
            }
            return <span key={i}>{part}</span>;
        });
    };

    const renderInteractivePreview = () => {
        if (typeof rawText !== 'string') return null;
        return rawText.split('\n').map((line, idx) => {
            if (!line.trim()) return <br key={idx} />;
            let cl = line;
            let sc = `mb-2 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-800'} `;
            if (line.startsWith('#')) {
                cl = line.replace('#', '').trim();
                sc = `text-3xl my-4 font-serif ${darkMode ? 'text-red-400' : 'text-gray-900'} `;
            } else if (line.startsWith('::')) {
                cl = line.replace('::', '').trim();
                sc = `mb-2 text-center block ${darkMode ? 'text-gray-300' : 'text-gray-800'} `;
            }
            return <div key={idx} className={sc} style={{ fontSize: `${editorFontSize}px` }}>{renderRecursive(cl)}</div>;
        });
    };

    return (
        <div className={`flex-1 overflow-y-auto custom-scrollbar p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} `}>
            <div className="mb-4 flex items-center justify-between h-6">
                <div className="flex-1 flex justify-start">{pages[pageIndex]?.processedBy && (<span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border opacity-70 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-200 border-gray-300 text-gray-600'} `}>🛠️ {pages[pageIndex].processedBy.split(' on ')[0]}</span>)}</div>
                <div className="flex-1 flex justify-center">{saveStatus && <span className="text-xl font-bold text-green-500 animate-pulse tracking-wide">{saveStatus}</span>}</div>
                <div className="flex-1 flex justify-end">
                    <span className={`text-[10px] font-mono font-bold opacity-50 ${darkMode ? 'text-gray-400' : 'text-gray-500'} `}>
                        {formatLastUpdated(pages[pageIndex]?.lastUpdated)}
                    </span>
                </div>
            </div>

            {activeBookId ? (
                <>
                    {mode === 'write' && (
                        <div className="relative w-full min-h-[600px]">
                            {/* Backdrop for Highlights */}
                            <div
                                className={`absolute inset-0 p-6 font-mono leading-relaxed whitespace-pre-wrap -z-0 pointer-events-none break-words ${darkMode ? 'text-transparent' : 'text-transparent'}`}
                                style={{ fontSize: `${editorFontSize}px`, fontFamily: 'monospace' }}
                                aria-hidden="true"
                            >
                                {rawText.split(new RegExp(`(${highlightTerm ? highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '_____NONE_____'})`, 'gi')).map((part, i) => {
                                    if (highlightTerm && part.toLowerCase() === highlightTerm.toLowerCase()) {
                                        return <span key={i} className="bg-yellow-400/50 rounded">{part}</span>;
                                    }
                                    return <span key={i}>{part}</span>;
                                })}
                            </div>

                            <textarea
                                ref={textAreaRef}
                                className={`w-full h-full p-6 border rounded shadow-sm outline-none font-mono leading-relaxed overflow-hidden resize-none bg-transparent ${darkMode ? 'text-gray-200 border-gray-700' : 'text-black border-gray-300'} z-10 relative`}
                                style={{
                                    minHeight: '600px',
                                    fontSize: `${editorFontSize}px`,
                                    height: 'auto',
                                    fontFamily: 'monospace',
                                    backgroundColor: 'transparent', // FORCE TRANSPARENT
                                    background: 'transparent'
                                }}
                                value={rawText}
                                onChange={(e) => onRawTextChange(e.target.value)}
                                placeholder="Metin girin..."
                                spellCheck={false}
                            />
                        </div>
                    )}
                    {(mode === 'tag' || mode === 'check') && (
                        <div
                            className={`w-full p-6 border rounded shadow-sm leading-relaxed select-text ${darkMode ? 'bg-gray-800 border-green-900 text-gray-200' : 'bg-white border-green-200'} `}
                            style={{ minHeight: '600px', fontSize: `${editorFontSize}px` }}
                            onMouseUp={onMouseUp}
                        >
                            {renderInteractivePreview()}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] opacity-50">
                    <span className="text-6xl mb-4">👈</span>
                    <p className="text-xl">Lütfen soldaki menüden düzenlemek istediğiniz bölümü seçin.</p>
                </div>
            )}

            {activeBookId && (
                <div className={`mt-8 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'} `}>
                    <h3 className="font-bold opacity-80 mb-2">Canlı Çeviri (Modern)</h3>
                    <textarea
                        className={`w-full h-40 p-3 border rounded outline-none resize-y opacity-80 cursor-not-allowed ${darkMode ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600'} `}
                        value={modernText}
                        readOnly
                    />
                </div>
            )}
        </div>
    );
};
