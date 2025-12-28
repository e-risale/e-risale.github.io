import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import ReaderComments from './ReaderComments';
import { formatLastUpdated } from '../utils/readerUtils';
import { READER_CONFIG } from '../../config';

// --- TOOLTIP TOKEN COMPONENT ---
// --- TOOLTIP TOKEN COMPONENT ---
const TooltipToken = ({ p1, p2, p3, isModernMode, darkMode, highlightText, activeHighlight, fontSize, fontFamily, scale, setMobileTooltipData, onEditClick, activeTooltipCloseRef, context }) => {

    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef(null);
    const triggerRef = useRef(null);

    const closeTooltip = () => {
        setIsOpen(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (activeTooltipCloseRef.current === closeTooltip) {
            activeTooltipCloseRef.current = null;
        }
    };

    const handleMouseEnter = (e) => {
        if (window.innerWidth < 768) return;
        if (e.nativeEvent && e.nativeEvent.buttons > 0) return;
        if (activeTooltipCloseRef.current && activeTooltipCloseRef.current !== closeTooltip) {
            activeTooltipCloseRef.current();
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
        activeTooltipCloseRef.current = closeTooltip;
    };

    const handleMouseLeave = () => {
        if (window.innerWidth < 768) return;
        timeoutRef.current = setTimeout(() => {
            closeTooltip();
        }, 500);
    };

    const handleTooltipMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        closeTooltip();
        const rect = triggerRef.current.getBoundingClientRect();
        const selectionRect = {
            top: rect.top + window.scrollY - 50,
            left: rect.left + (rect.width / 2) - 80,
            text: `[[${p1}|${p2}${p3 ? '|' + p3 : ''}]]`,
            context: context
        };
        onEditClick(selectionRect);
    };

    const isArabicText = (text) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
    const isWordArabic = isArabicText(p1);

    const wordStyle = {
        fontFamily: isWordArabic ? "'Noto Naskh Arabic', serif" : `'${fontFamily}', serif`,
        fontSize: isWordArabic ? `${fontSize * 1.30 * scale}px` : `${fontSize * scale}px`
    };

    const textColor = isModernMode
        ? (darkMode ? 'text-amber-300' : 'text-amber-700')
        : (darkMode ? 'text-rose-300' : 'text-rose-800');

    const decorationColor = isModernMode
        ? (darkMode ? 'decoration-amber-500/50' : 'decoration-amber-400')
        : (darkMode ? 'decoration-rose-500/50' : 'decoration-rose-300');

    return (
        <span
            ref={triggerRef}
            className="relative group cursor-help text-inherit inline"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth < 768) {
                    setMobileTooltipData({ title: p1, detail: p2 + (p3 ? `\n${p3}` : '') });
                }
            }}
        >
            <span style={wordStyle} className={`font-semibold underline decoration-dotted decoration-2 underline-offset-4 transition-colors decoration-clone box-decoration-clone ${textColor} ${decorationColor}`}>
                {highlightText(p1, activeHighlight, isModernMode)}
            </span>

            {/* Desktop Tooltip */}
            <span
                className={`hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 rounded-xl shadow-2xl transition-all duration-200 z-50 w-max max-w-[280px] origin-bottom select-none ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 translate-y-2 pointer-events-none invisible'} ${darkMode ? 'bg-[#2c2e33] text-gray-100 border border-gray-600' : 'bg-[#fffcf5] text-gray-900 border border-amber-100'}`}
                style={{ fontSize: '0.95rem' }}
                onMouseEnter={handleTooltipMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flex justify-between items-start mb-2 border-b border-gray-500/20 pb-2">
                    <strong className={`font-serif text-lg ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{p2}</strong>
                    <button onClick={handleEditClick} className={`p-1 rounded-full hover:bg-black/10 transition-colors ml-2`} title="Düzeltme Öner">✍️</button>
                </div>
                {p3 && <div className="text-sm opacity-90 leading-snug">{p3}</div>}
                <svg className={`absolute h-3 w-6 left-1/2 -translate-x-1/2 top-full ${darkMode ? 'text-[#2c2e33]' : 'text-[#fffcf5]'}`} viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0" /></svg>
            </span>
        </span>
    );
};

// --- CHUNK ITEM COMPONENT (MEMOIZED) ---
// --- CHUNK ITEM COMPONENT (MEMOIZED) ---
// --- CHUNK ITEM COMPONENT (MEMOIZED) ---
const ChunkItem = React.memo(({ chunk, index, textMode, fontSize, fontFamily, darkMode, activeHighlight, setMobileTooltipData, setSelectionRect, activeTooltipCloseRef, onNavigateFootnote }) => {

    const isModern = textMode === 'modern'; // Helper for style logic

    // Helper Functions inside ChunkItem to avoid prop drilling and facilitate memoization
    const highlightText = (text, query, isModern) => {
        if (!query || !text) return text;
        const highlightClass = isModern ? "bg-amber-200 text-amber-900" : "bg-rose-200 text-rose-900";
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) => part.toLowerCase() === query.toLowerCase() ? <mark key={i} className={`${highlightClass} rounded-sm px-0.5 mx-0.5 shadow-sm font-bold animate-pulse`}>{part}</mark> : part);
    };

    const isArabicText = (text) => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

    const renderContent = (text, scale = 1) => {
        if (!text) return null;
        // Split by tokens, newlines, Arabic text, AND Footnote markers
        const parts = text.split(/(\[\[[\s\S]*?\]\]|\(\([\s\S]*?\)\)|\*\*[\s\S]*?\*\*|___ASTERISM___|\n|\(Hâşiye\[\d+\]\)|\[\d+\] Hâşiye:|[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g);

        const getPlainText = (str) => {
            if (!str) return "";
            return str.replace(/\[\[(.*?)\|.*?\]\]/g, '$1')
                .replace(/\(\((.*?)\)\)/g, '$1')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\(Hâşiye\[\d+\]\)/g, '')
                .replace(/\[\d+\] Hâşiye:/g, '');
        };

        const getContext = (idx) => {
            // 1. BACKWARD (Previous Context)
            let beforeRec = "";
            for (let i = idx - 1; i >= 0; i--) {
                beforeRec = getPlainText(parts[i]) + beforeRec;
                if (beforeRec.length > 200) break; // Limit search
            }
            // Find last sentence boundary in previous text
            const sentences = beforeRec.split(/[\.\!\?](?:\s|$)/);
            // Take last sentence fragment
            let cleanBefore = sentences.length > 0 ? sentences[sentences.length - 1] : beforeRec;

            const beforeWords = cleanBefore.trim().split(/\s+/);
            const finalBefore = beforeWords.length > 7 ? beforeWords.slice(-7).join(" ") : cleanBefore.trim();

            // 2. FORWARD (Next Context)
            let afterRec = "";
            for (let i = idx + 1; i < parts.length; i++) {
                afterRec += getPlainText(parts[i]);
                if (afterRec.length > 200) break;
            }

            // Find first sentence boundary
            const firstPunctuationIndex = afterRec.search(/[\.\!\?]/);
            let cleanAfter = afterRec;
            if (firstPunctuationIndex !== -1) {
                cleanAfter = afterRec.substring(0, firstPunctuationIndex + 1); // Include punctuation
            }

            const afterWords = cleanAfter.trim().split(/\s+/);
            const finalAfter = afterWords.length > 7 ? afterWords.slice(0, 7).join(" ") : cleanAfter.trim();

            return `...${finalBefore} [${getPlainText(parts[idx])}] ${finalAfter}...`;
        };

        return parts.map((part, partIndex) => {
            if (part === '\n') return <br key={partIndex} />;
            if (part === '___ASTERISM___') return <span key={partIndex} className="font-bold mx-2">***</span>;

            // -- FOOTNOTE REFERENCE --
            // Matches: (Hâşiye[1])
            const fnRefMatch = part.match(/^\(Hâşiye\[(\d+)\]\)$/);
            if (fnRefMatch) {
                const fnId = fnRefMatch[1];
                return (
                    <button
                        key={partIndex}
                        id={`footnote-ref-${index}-${fnId}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateFootnote) onNavigateFootnote(fnId, 'goto-def');
                        }}
                        className={`font-bold cursor-pointer hover:underline mx-1 ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}
                        style={{ fontSize: `${fontSize * 0.9}px` }}
                        title="Hâşiyeyi Göster"
                    >
                        {part}
                    </button>
                );
            }

            // -- FOOTNOTE DEFINITION HEADER --
            // Matches: [1] Hâşiye:
            const fnDefMatch = part.match(/^\[(\d+)\] Hâşiye:$/);
            if (fnDefMatch) {
                const fnId = fnDefMatch[1];
                return (
                    <span
                        key={partIndex}
                        id={`footnote-def-${index}-${fnId}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateFootnote) onNavigateFootnote(fnId, 'goto-ref');
                        }}
                        className={`font-bold mr-2 transition-colors duration-500 rounded px-1 cursor-pointer hover:underline ${darkMode ? 'text-amber-400 hover:bg-amber-900/30' : 'text-amber-700 hover:bg-amber-50'}`}
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {part}
                    </span>
                );
            }

            const isArabic = isArabicText(part);
            const activeFontFamily = isArabic ? "'Noto Naskh Arabic', serif" : `'${fontFamily}', serif`;
            const baseStyle = {
                fontFamily: activeFontFamily,
                fontSize: isArabic ? `${fontSize * 1.3 * scale}px` : `${fontSize * scale}px`,
                lineHeight: isArabic ? '1.8' : 'inherit'
            };

            if (part.startsWith('**') && part.endsWith('**')) {
                return <b key={partIndex} className={darkMode ? 'text-gray-100' : 'text-gray-900'} style={baseStyle}>{renderContent(part.slice(2, -2), scale)}</b>;
            }

            if (part.startsWith('[[') && part.endsWith(']]')) {
                // If in 'original' mode, we shouldn't see these theoretically if rawText is clean.
                // But if they appear, treat them.
                const contentRaw = part.slice(2, -2);
                const splitParts = contentRaw.split('|');
                const context = getContext(partIndex);

                return (
                    <TooltipToken
                        key={partIndex}
                        p1={splitParts[0]?.trim()} p2={splitParts[1]?.trim()} p3={splitParts[2]?.trim()}
                        isModernMode={isModern} darkMode={darkMode}
                        highlightText={highlightText} activeHighlight={activeHighlight}
                        fontSize={fontSize} fontFamily={fontFamily} scale={scale}
                        setMobileTooltipData={setMobileTooltipData}
                        onEditClick={(rect) => setSelectionRect(rect)}
                        activeTooltipCloseRef={activeTooltipCloseRef}
                        context={context}
                    />
                );
            }

            if (part.startsWith('((') && part.endsWith('))')) {
                return <span key={partIndex} className={`font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`} style={baseStyle}>{renderContent(part.slice(2, -2), scale)}</span>;
            }

            // 4. CHECK FOR AUTO-BOLD KEYWORDS
            // Dynamic Regex for Bold Keywords
            if (READER_CONFIG.BOLD_KEYWORDS && READER_CONFIG.BOLD_KEYWORDS.length > 0) {
                const boldRegex = new RegExp(`(${READER_CONFIG.BOLD_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

                // If the part contains any bold keyword, we need to split and bold them
                if (boldRegex.test(part)) {
                    const splitParts = part.split(boldRegex);
                    return splitParts.map((subPart, subIndex) => {
                        if (READER_CONFIG.BOLD_KEYWORDS.includes(subPart)) {
                            return <b key={`${partIndex}-${subIndex}`} className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`} style={baseStyle}>{subPart}</b>;
                        }
                        return <span key={`${partIndex}-${subIndex}`} style={baseStyle}>{highlightText(subPart, activeHighlight, isModern)}</span>;
                    });
                }
            }

            return <span key={partIndex} style={baseStyle}>{highlightText(part, activeHighlight, isModern)}</span>;
        });
    };

    const renderFormattedText = (fullText) => {
        if (!fullText) return null;

        // 1. Pre-process collision markers
        const safeText = fullText.replace(/\*\*\*/g, '___ASTERISM___');

        const tokens = [];
        const protectedText = safeText.replace(/(\(\([\s\S]*?\)\)|\[\[[\s\S]*?\]\]|\*\*[\s\S]*?\*\*)/g, (match) => { tokens.push(match); return `___TOKEN_${tokens.length - 1}___`; });
        const lines = protectedText.split('\n');

        return lines.map((line, idx) => {
            if (!line.trim() && line !== '\n') return <br key={idx} className="block content-[''] my-3" />;

            let cleanLine = line;
            let containerClass = `mb-4 text-justify indent-8 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-800'}`;
            let localStyle = { fontFamily: `'${fontFamily}', serif`, fontSize: `${fontSize}px`, lineHeight: '1.8' };
            let lineScale = 1;

            // --- HEADER LOGIC ---
            if (line.trim() === '___ASTERISM___') {
                // Standalone Asterism Line
                return (
                    <div key={idx} className={`text-center my-8 font-bold text-xl tracking-widest select-none opacity-50 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        ***
                    </div>
                );
            }
            else if (line.trim().startsWith('##')) {
                // Subheader (H2)
                cleanLine = line.replace('##', '').trim();
                containerClass = `text-center my-8 font-bold text-lg ${darkMode ? 'text-amber-200/80' : 'text-amber-700/80'}`;
                lineScale = 1.3;
                localStyle = { ...localStyle, fontSize: `${fontSize * lineScale}px`, lineHeight: '1.5' };
            }
            else if (line.trim().startsWith('#')) {
                // Main Header (H1)
                cleanLine = line.replace('#', '').trim();
                const titleColorClass = isModern
                    ? (darkMode ? 'text-amber-400 border-amber-900/40' : 'text-amber-800 border-amber-200')
                    : (darkMode ? 'text-rose-400 border-rose-900/40' : 'text-rose-900 border-rose-100');
                containerClass = `text-center my-12 pb-4 border-b-2 font-bold ${titleColorClass}`;
                lineScale = 2.0;
                localStyle = { ...localStyle, fontSize: `${fontSize * lineScale}px`, lineHeight: '1.4' };
            }
            else if (line.trim().startsWith('::')) {
                // Center Alignment (Poem/Verse/Emphasis)
                cleanLine = line.replace('::', '').trim();
                containerClass = `mb-6 text-center block italic ${darkMode ? 'text-gray-300' : 'text-stone-700'}`;
                lineScale = 1.1;
                localStyle = { ...localStyle, fontSize: `${fontSize * lineScale}px` };
            }
            // Implicit Headers (Auto-detection for ALL MODES - Fallback)
            else if (line.length < 120 && !line.includes('.')) {

                // Prepare Clean Text (Strip tokens to see real content)
                let lineTextForAnalysis = cleanLine.replace(/___TOKEN_(\d+)___/g, (match, index) => {
                    const token = tokens[parseInt(index)];
                    if (!token) return '';
                    if (token.startsWith('[[')) return token.slice(2, -2).split('|')[0];
                    if (token.startsWith('((')) return token.slice(2, -2);
                    if (token.startsWith('**')) return token.slice(2, -2);
                    return '';
                });
                lineTextForAnalysis = lineTextForAnalysis.trim();

                const ordinalRegex = /^(Birinci|İkinci|Üçüncü|Dördüncü|Beşinci|Altıncı|Yedinci|Sekizinci|Dokuzuncu|Onuncu|On\s|Yirmi|Otuz|Kırk|Elli|Altmış|Yetmiş|Seksen|Doksan|Yüz|Bin)/i;
                const isOrdinalStart = ordinalRegex.test(lineTextForAnalysis);

                // Dynamically build regex from config
                const h1SuffixRegex = new RegExp(`(${READER_CONFIG.H1_KEYWORDS.join('|')})$`, 'i');
                const h1ExactRegex = new RegExp(`^(${READER_CONFIG.H1_KEYWORDS.join('|')})$`, 'i');

                const h2SuffixRegex = new RegExp(`(${READER_CONFIG.H2_KEYWORDS.join('|')})$`, 'i');
                const h2ExactRegex = new RegExp(`^(${READER_CONFIG.H2_KEYWORDS.join('|')})$`, 'i');

                // H1 Detection (Major Sections)
                if ((isOrdinalStart && h1SuffixRegex.test(lineTextForAnalysis)) || h1ExactRegex.test(lineTextForAnalysis)) {
                    const titleColorClass = darkMode ? 'text-rose-400 border-rose-900/40' : 'text-rose-900 border-rose-100';
                    containerClass = `text-center my-12 pb-4 border-b-2 font-bold ${titleColorClass}`;
                    lineScale = 2.0;
                    localStyle = { ...localStyle, fontSize: `${fontSize * lineScale}px`, lineHeight: '1.4' };
                }
                // H2 Detection (Sub Sections)
                else if ((isOrdinalStart && h2SuffixRegex.test(lineTextForAnalysis)) || h2ExactRegex.test(lineTextForAnalysis) || lineTextForAnalysis.toLowerCase().includes('makamı')) {
                    containerClass = `text-center my-8 font-bold text-lg ${darkMode ? 'text-amber-200/80' : 'text-amber-700/80'}`;
                    lineScale = 1.3;
                    localStyle = { ...localStyle, fontSize: `${fontSize * lineScale}px`, lineHeight: '1.5' };
                }
            }

            const lineParts = cleanLine.split(/(___TOKEN_\d+___)/g);
            const renderedLineContent = lineParts.map((part, i) => {
                const tokenMatch = part.match(/___TOKEN_(\d+)___/);
                if (tokenMatch) { return <React.Fragment key={i}>{renderContent(tokens[parseInt(tokenMatch[1])], lineScale)}</React.Fragment>; }
                return <React.Fragment key={i}>{renderContent(part, lineScale)}</React.Fragment>;
            });
            return <div key={idx} className={containerClass} style={localStyle}>{renderedLineContent}</div>;
        });
    };

    // SELECT TEXT SOURCE BASED ON MODE
    let text;
    if (textMode === 'modern') text = chunk.modernText;
    else if (textMode === 'original') text = chunk.rawText; // Clean
    else text = chunk.oldText || chunk.rawText; // Tagged (fallback to raw if missing)

    // Centering applied here
    return (
        <div id={`chunk-${index}`} data-chunk-index={index} className="max-w-4xl w-full mx-auto px-4 md:px-8 mb-8">
            {renderFormattedText(text)}
        </div>
    );
});


const ReaderContent = forwardRef(({
    bookData,
    textMode, // Updated prop
    fontSize,
    fontFamily,
    darkMode,
    sidebarOpen,
    activeHighlight,
    onReopenSearch,
    onClearSearch,
    contentRef,
    user,
    onLogin,
    onLogout,
    onNextChapter,
    onFeedbackOpen,
    setSelectionRect,
    selectionRect,
    setMobileTooltipData,
    lastUpdate,
    onSendFeedback,
    feedbackText,
    setFeedbackText,
    feedbackCategory,
    setFeedbackCategory,
    isSendingFeedback,
    chapterComments,
    onLikeComment,
    scrollTarget,
    onDebugUpdate, // New Prop for debugging
    onScrollPos, // New prop for scroll tracking
    isAdmin // Passed from parent
}, ref) => {

    const activeTooltipCloseRef = useRef(null);
    const virtuosoRef = useRef(null);

    // --- IMPERATIVE HANDLE FOR BOOKMARKS ---
    // --- HELPER: FLASH ELEMENT ---
    const flashElement = (element, color, duration = 500, count = 1) => {
        if (!element) return;

        const originalTransition = element.style.transition;
        const originalBg = element.style.backgroundColor;

        element.style.transition = 'background-color 300ms ease';

        let counter = 0;
        const flash = () => {
            element.style.backgroundColor = color;
            setTimeout(() => {
                element.style.backgroundColor = originalBg;
                counter++;
                if (counter < count) {
                    setTimeout(flash, 300);
                } else {
                    setTimeout(() => {
                        element.style.transition = originalTransition;
                    }, 300);
                }
            }, duration);
        };
        flash();
    };

    // --- FOOTNOTE NAVIGATION ---
    const handleNavigateFootnote = (fnId, mode) => {
        // mode: 'goto-def' -> Go to [1] Hâşiye: | 'goto-ref' -> Go to (Hâşiye[1])
        const targetRegex = mode === 'goto-def'
            ? new RegExp(`\\[${fnId}\\] Hâşiye:`)
            : new RegExp(`\\(Hâşiye\\[${fnId}\\]\\)`);

        // Find which chunk contains the target
        let targetIndex = -1;
        for (let i = 0; i < bookData.length; i++) {
            const page = bookData[i];
            const textToCheck = textMode === 'modern' ? page.modernText : (page.oldText || page.rawText);
            if (targetRegex.test(textToCheck)) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex !== -1) {
            if (virtuosoRef.current) {
                virtuosoRef.current.scrollToIndex({
                    index: targetIndex,
                    align: 'center',
                    offset: 0
                });

                setTimeout(() => {
                    const elId = mode === 'goto-def'
                        ? `footnote-def-${targetIndex}-${fnId}`
                        : `footnote-ref-${targetIndex}-${fnId}`;
                    const el = document.getElementById(elId);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const isDark = document.documentElement.classList.contains('dark') || darkMode;
                        const flashColor = isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(251, 191, 36, 0.6)';
                        flashElement(el, flashColor, 500, 2);
                    }
                }, 400);
            }
        } else {
            console.warn("Footnote target not found.");
        }
    };

    // --- IMPERATIVE HANDLE FOR BOOKMARKS ---
    useImperativeHandle(ref, () => ({
        scrollTo: (y) => {
            if (virtuosoRef.current) {
                virtuosoRef.current.scrollTo({ top: y });
            }
        },
        getBookmarkData: () => {
            const data = calculateCurrentLocation();
            if (data) return data;
            return {
                targetId: bookData.length > 0 ? "chunk-0" : "None",
                snippet: "...",
                scrollOffset: 0
            };
        },
        flashCurrentLocation: () => {
            const targetPointY = 150;
            const targetPointX = window.innerWidth / 2;

            const element = document.elementFromPoint(targetPointX, targetPointY);
            if (!element) return;

            const chunk = element.closest('[data-chunk-index]');
            const paragraph = element.closest('.text-justify') || element.closest('div.mb-4') || element.closest('p');

            if (chunk) {
                const isDark = document.documentElement.classList.contains('dark') || darkMode;
                const green = isDark ? 'rgba(6, 95, 70, 0.4)' : 'rgba(167, 243, 208, 0.6)';
                flashElement(chunk, green, 400, 1);

                setTimeout(() => {
                    if (paragraph) {
                        const orange = isDark ? 'rgba(124, 45, 18, 0.4)' : 'rgba(253, 186, 116, 0.6)';
                        flashElement(paragraph, orange, 400, 1);

                        setTimeout(() => {
                            const yellow = isDark ? 'rgba(146, 64, 14, 0.5)' : 'rgba(252, 211, 77, 0.7)';

                            if (element !== paragraph && element !== chunk) {
                                flashElement(element, yellow, 300, 3);
                            } else {
                                flashElement(paragraph, yellow, 300, 3);
                            }
                        }, 600);
                    }
                }, 600);
            }
        }
    }));

    // --- SCROLL TO TARGET EFFECT ---
    // --- ROBUST SCROLL TO TARGET EFFECT ---
    useEffect(() => {
        if (scrollTarget && virtuosoRef.current && bookData.length > 0) {

            // Step 1: Scroll to the generic chunk first
            const targetIndex = scrollTarget.index !== undefined ? scrollTarget.index : 0;

            virtuosoRef.current.scrollToIndex({
                index: targetIndex,
                align: 'start',
                offset: -80
            });

            // Step 2: Fine tune if we have anchorText
            if (scrollTarget.anchorText) {
                setTimeout(() => {
                    const chunkEl = document.getElementById(`chunk-${targetIndex}`);
                    if (chunkEl) {

                        // Recursive Search Helper
                        const findTextNode = (element, text) => {
                            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
                            let node;
                            const targetClean = text.replace(/\s+/g, ' ').trim().toLowerCase();

                            while (node = walker.nextNode()) {
                                if (node.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes(targetClean)) {
                                    return node.parentElement;
                                }
                            }
                            return null;
                        };

                        const targetNode = findTextNode(chunkEl, scrollTarget.anchorText);

                        if (targetNode) {

                            // Use scrollIntoView which automatically finds the scroll container
                            // 'center' puts it in the middle of the viewport
                            targetNode.scrollIntoView({ block: 'center', behavior: 'smooth' });

                            // TRIGGER 3-STAGE FLASH
                            setTimeout(() => {
                                const isDark = document.documentElement.classList.contains('dark') || darkMode;
                                const green = isDark ? 'rgba(6, 95, 70, 0.4)' : 'rgba(167, 243, 208, 0.6)';
                                const orange = isDark ? 'rgba(124, 45, 18, 0.4)' : 'rgba(253, 186, 116, 0.6)';
                                const yellow = isDark ? 'rgba(146, 64, 14, 0.5)' : 'rgba(252, 211, 77, 0.7)';

                                // 1. Flash Chunk
                                flashElement(chunkEl, green, 400, 1);

                                setTimeout(() => {
                                    // 2. Flash Paragraph
                                    const paragraph = targetNode.closest('.text-justify') || targetNode.closest('div.mb-4') || chunkEl;
                                    flashElement(paragraph, orange, 400, 1);

                                    setTimeout(() => {
                                        // 3. Flash Sentence/Line
                                        flashElement(targetNode, yellow, 300, 3);
                                    }, 600);
                                }, 600);
                            }, 600); // Wait for smooth scroll to finish mostly
                        } else {
                            const green = document.documentElement.classList.contains('dark') ? 'rgba(6, 95, 70, 0.4)' : 'rgba(167, 243, 208, 0.6)';
                            flashElement(chunkEl, green, 400, 1);
                        }
                    }
                }, 500); // Increased delay to ensure rendering
            }
        }
    }, [scrollTarget, bookData]);

    // --- BOOKMARK CALCULATION LOGIC (REUSABLE) ---
    const calculateCurrentLocation = () => {
        // Debug vars
        let hitTag = "N/A";
        let hitId = "N/A";

        // Helper for Cleaning Text
        const cleanText = (text) => {
            if (!text) return "";
            let cleaned = text;
            // Remove token markers
            cleaned = cleaned.replace(/___TOKEN_\d+___/g, ' ');
            // Remove tooltip internal format - logic updated for 3 modes
            const isModern = textMode === 'modern'; // Scope variable
            cleaned = cleaned.replace(/\[\[(.*?)\]\]/g, (m, c) => (isModern && c.split('|')[1]) ? c.split('|')[1] : c.split('|')[0]);
            cleaned = cleaned.replace(/\(\((.*?)\)\)/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1');
            // Remove common icons/emojis used in tooltips
            cleaned = cleaned.replace(/✍️|🛡️|⚠️|💬|📷|⋮/g, '');
            // Normalize whitespace
            return cleaned.replace(/\s+/g, ' ').trim();
        };

        try {
            // 1. Selection (Priority)
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 5 && selection.anchorNode && selection.focusNode) {
                // Verify selection is within our content
                if (contentRef.current && contentRef.current.contains(selection.anchorNode)) {
                    return { snippet: cleanText(selection.toString()), targetId: null, type: 'selection' };
                }
            }

            // 2. Eye Level Center Detection (More Precise)
            const targetPointY = 150;
            const targetPointX = window.innerWidth / 2;

            let chunkElement = null;
            let anchorText = "";
            let chunkIndex = 0;
            let targetId = "";

            // Method A: caretRangeFromPoint (Most Precise)
            // This gives us the exact text node and offset
            if (document.caretRangeFromPoint) {
                const range = document.caretRangeFromPoint(targetPointX, targetPointY);
                if (range && range.startContainer) {
                    let node = range.startContainer;
                    // If node is text, great. If element, finding closest text
                    if (node.nodeType === Node.TEXT_NODE) {
                        anchorText = node.textContent;
                        chunkElement = node.parentElement.closest('[id^="chunk-"]');
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // Hit an element (e.g. padding of div)
                        chunkElement = node.closest('[id^="chunk-"]');
                    }
                }
            }

            // Method B: elementFromPoint (Fallback)
            if (!chunkElement) {
                const elementAtPoint = document.elementFromPoint(targetPointX, targetPointY);
                if (elementAtPoint) {
                    chunkElement = elementAtPoint.closest('[id^="chunk-"]');
                    // If we hit a specific span/text wrapper, use it
                    if (elementAtPoint.childNodes.length === 1 && elementAtPoint.firstChild.nodeType === Node.TEXT_NODE) {
                        anchorText = elementAtPoint.textContent;
                    }
                }
            }

            if (chunkElement) {
                targetId = chunkElement.id;
                chunkIndex = parseInt(targetId.replace('chunk-', ''), 10);
                const rect = chunkElement.getBoundingClientRect();

                // If we haven't found a specific text node yet (e.g. hit empty space in chunk), 
                // search for the text node closest to the 150px mark
                if (!anchorText || anchorText.length < 5) {
                    const walker = document.createTreeWalker(chunkElement, NodeFilter.SHOW_TEXT, null, false);
                    let closestNode = null;
                    let minDistance = Infinity;

                    let node;
                    while ((node = walker.nextNode())) {
                        // Skip empty or purely whitespace nodes
                        if (node.textContent.trim().length < 3) continue;

                        // Skip tooltip content if possible (check parent class)
                        // TooltipToken uses 'absolute' positioning, so usually safe, 
                        // but let's check if parent is the tooltip container
                        if (node.parentElement.closest('.absolute')) continue;

                        const range = document.createRange();
                        range.selectNode(node);
                        const nodeRect = range.getBoundingClientRect();

                        // Distance to target center line
                        const dist = Math.abs((nodeRect.top + nodeRect.height / 2) - targetPointY);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestNode = node;
                        }
                    }
                    if (closestNode) {
                        anchorText = closestNode.textContent;
                    }
                }

                // If still empty, fallback to chunk start
                if (!anchorText) {
                    anchorText = chunkElement.textContent.substring(0, 100);
                }

                // Clean final text
                anchorText = cleanText(anchorText);

                // Limit length
                if (anchorText.length > 80) anchorText = anchorText.substring(0, 80);

                const relativeTop = 80 - rect.top;
                const ratio = Math.max(0, Math.min(1, relativeTop / rect.height));

                const snippet = anchorText.length > 3 ? anchorText + "..." : "Ayraç";

                return {
                    targetId: targetId,
                    chunkIndex: chunkIndex,
                    anchorText: anchorText,
                    relativeRatio: ratio,
                    snippet: snippet,
                    scrollOffset: Math.round(rect.top - 70)
                };
            }
        } catch (e) {
            console.error("Bookmark Error", e);
        }
        return null; // Return null if nothing found
    };

    // Handle Scroll for Debugging (Throttled)
    const lastUpdateRef = useRef(0);
    const handleScroll = () => {
        if (!onDebugUpdate) return;

        const now = Date.now();
        if (now - lastUpdateRef.current > 200) { // Update every 200ms
            lastUpdateRef.current = now;
            // Use requestAnimationFrame to avoid interrupting main thread
            requestAnimationFrame(() => {
                const info = calculateCurrentLocation();
                if (info) onDebugUpdate(info);
            });
        }
    };

    // --- FOOTER COMPONENT for Virtuoso ---
    // Defined once with stable identity. Context is passed by Virtuoso.
    const virtuosoComponents = useMemo(() => ({
        Header: () => <div className="h-12 w-full"></div>,
        Footer: ({ context }) => <ReaderComments {...context} isAdmin={isAdmin} />
    }), []);



    // --- SELECTION HANDLING ---
    // Handle Selection Logic (Enhanced for Mobile)
    const handleSelectionChange = useRef((e) => {
        // Debounce selection updates
        if (window.selectionTimeout) clearTimeout(window.selectionTimeout);

        window.selectionTimeout = setTimeout(() => {
            const selection = window.getSelection();

            // Basic valid selection check
            if (!selection || selection.toString().trim().length < 2) {
                // Only clear if we really have no selection (sometimes on mobile it flickers)
                // But we act conversatively to not close accidental popup
                // Actually, if selection is cleared, we should clear rect.
                if (!selection || selection.isCollapsed) {
                    setSelectionRect(null);
                }
                return;
            }

            const text = selection.toString().trim();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Check if selection is inside our content
            if (contentRef.current && !contentRef.current.contains(selection.anchorNode)) return;

            // Check if selection is inside comments section (exclude)
            if (selection.anchorNode.parentElement && selection.anchorNode.parentElement.closest('.reader-comments-section')) return;

            setSelectionRect({
                top: rect.top + window.scrollY - 50,
                left: rect.left + (rect.width / 2) - 80,
                text: text
            });
        }, 300); // 300ms delay to wait for mobile selection handle to settle
    });

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange.current);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange.current);
            if (window.selectionTimeout) clearTimeout(window.selectionTimeout);
        };
    }, []);

    const handleMouseUp = () => {
        // Fallback for desktop immediate response
        if (window.innerWidth >= 768) {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            if (text.length > 2) {
                if (selection.anchorNode && selection.anchorNode.parentElement && selection.anchorNode.parentElement.closest('.reader-comments-section')) return;
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setSelectionRect({
                    top: rect.top + window.scrollY - 50,
                    left: rect.left + (rect.width / 2) - 80,
                    text: text
                });
            }
        }
    };

    const virtuosoContext = {
        lastUpdate, chapterComments, darkMode, user, onLogin, onSendFeedback,
        feedbackText, setFeedbackText, feedbackCategory, setFeedbackCategory,
        isSendingFeedback, onLikeComment, onNextChapter
    };

    return (
        <div
            className={`flex-1 h-full w-full transition-all duration-300 ${sidebarOpen ? 'md:pl-72' : 'pl-0'}`}
            ref={contentRef}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
        >
            {bookData.length > 0 ? (
                <Virtuoso
                    ref={virtuosoRef}
                    style={{ height: '100%', width: '100%', overscrollBehavior: 'none' }}
                    data={bookData}
                    onScroll={(e) => {
                        handleScroll();
                        if (onScrollPos) onScrollPos(e.target.scrollTop);
                    }}
                    context={virtuosoContext}
                    components={virtuosoComponents}
                    itemContent={(index, chunk) => (
                        <ChunkItem
                            chunk={chunk}
                            index={index}
                            textMode={textMode}
                            fontSize={fontSize}
                            fontFamily={fontFamily}
                            darkMode={darkMode}
                            activeHighlight={activeHighlight}
                            setMobileTooltipData={setMobileTooltipData}
                            setSelectionRect={setSelectionRect}
                            activeTooltipCloseRef={activeTooltipCloseRef}
                            onNavigateFootnote={handleNavigateFootnote}
                        />
                    )}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <p className="text-xl font-serif italic">Bölüm yükleniyor...</p>
                </div>
            )}

            {/* Search Popup Highlight (Existing) */}
            {activeHighlight && (
                <div className={`fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl animate-bounce-in border backdrop-blur-md transition-all ${darkMode ? 'bg-[#2c2e33]/90 text-amber-100 border-gray-600' : 'bg-white/90 text-amber-900 border-amber-200'}`}>
                    <button onClick={onReopenSearch} className="flex items-center gap-2 text-sm font-bold hover:underline">
                        <span>🔍</span><span className="max-w-[100px] truncate">"{activeHighlight}"</span>
                    </button>
                    <div className={`w-px h-4 mx-1 ${darkMode ? 'bg-gray-600' : 'bg-amber-200'}`}></div>
                    <button onClick={onClearSearch} className="text-xs font-bold hover:text-red-500 px-1" title="Aramayı Temizle">✕</button>
                </div>
            )}
        </div>
    );
});

export default ReaderContent;
