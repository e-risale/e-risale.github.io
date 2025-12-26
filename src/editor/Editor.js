import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EditorToolbar } from './components/EditorToolbar';
import { EditorContent } from './components/EditorContent';
import { UnifiedSidebar } from './components/EditorSidebars'; // Updated import
import { useToast } from '../reader/context/ToastContext';
import { library } from '../data/library';
import { generateTranslatedText } from '../utils/editorHelpers';
import { getDictionary, saveDictionary, saveChapter } from '../services/DataService'; // defaultDictionary removed
import { sortDictionaryByKey } from '../utils/editorHelpers';
import { GlobalSearchModal, WordPopup } from './components/EditorModals';
// import { TranslationStatusModal } from './components/TranslationStatusModal'; // REMOVED
import { useEditorState } from './hooks/useEditorState';
// import { scanBookStatuses } from './utils/statusScanner'; // REMOVED

const Editor = ({ onSwitchMode, user }) => {
    // --- STATE & LOGIC (HOOK) ---
    const {
        globalLibrary, setGlobalLibrary,
        activeBookId, // setActiveBookId,
        activeChapterId, // setActiveChapterId,
        pages, setPages,
        pageIndex, // setPageIndex,
        rawText, setRawText, // We need setRawText for updates
        modernText, setModernText,
        currentFileName, // setCurrentFileName,
        modifiedChapters, setModifiedChapters, // Restored
        saveStatus,
        mode, setMode,
        loadChapter,
        loadPageToEditor,
        changePage: handlePageChange, // Restored Alias
        saveCurrentWorkToMemory,
        markAsModified,
        unmarkModified // Restored
    } = useEditorState(library);

    // --- LOCAL UI STATE ---
    const [darkMode, setDarkMode] = useState(true);
    const [fontSize, setFontSize] = useState(18);
    const [isFormatMode, setIsFormatMode] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    // const [showStatusModal, setShowStatusModal] = useState(false); // REMOVED
    const [selectedWord, setSelectedWord] = useState(null); // For popup

    // Sidebar State
    const [activeTab, setActiveTab] = useState('files');
    const [dictSearchTerm, setDictSearchTerm] = useState("");
    const [filterLen, setFilterLen] = useState("all");

    // Refs
    const textAreaRef = useRef(null);

    // --- UI & DICTIONARY STATE ---
    const [dictionary, setDictionary] = useState({});

    const [popupData, setPopupData] = useState({ show: false, word: "", originalWord: "", short: "", long: "", source: "", x: 0, y: 0, placement: "bottom", isEdit: false });

    // SIDEBAR STATE
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(25);
    const [resizingPanel, setResizingPanel] = useState(null);
    const [sidebarTab, setSidebarTab] = useState('files');

    // Modallar State
    const [globalQuery, setGlobalQuery] = useState("");
    const [globalResults, setGlobalResults] = useState([]);

    // Highlight State for Navigation
    const [highlightTerm, setHighlightTerm] = useState(null);

    const { showToast } = useToast();

    // Refs (textAreaRef declared above)
    const dragRef = useRef(null);

    // --- HELPER METODLAR ---
    // --- NAVIGATION EFFECT ---
    useEffect(() => {
        if (highlightTerm && textAreaRef.current) {
            const ta = textAreaRef.current;
            const word = highlightTerm;

            // Wait slightly for render? Usually useEffect is post-render.
            // But we need to make sure rawText in DOM matches.
            if (ta.value.includes(word)) {
                const text = ta.value;
                const idx = text.indexOf(word);
                if (idx !== -1) {
                    ta.focus();
                    ta.setSelectionRange(idx, idx + word.length);
                    const lineHeight = 24;
                    const linesBefore = text.substring(0, idx).split('\n').length;
                    const scrollY = linesBefore * lineHeight - (ta.clientHeight / 2);
                    ta.scrollTop = Math.max(0, scrollY);
                }
            }
        }
    }, [highlightTerm, rawText]); // Trigger when term or text changes

    const handleNavigate = (pageIdx, word) => {
        handlePageChange(pageIdx);
        if (mode === 'write') setMode('tag');
        // Enable Backdrop Highlight & Trigger Scroll Effect
        setHighlightTerm(word);
    };

    const handleManualPageChange = (idx) => {
        setHighlightTerm(null);
        handlePageChange(idx);
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const toggleEditLock = () => {
        if (mode === 'write') setMode('tag');
        else setMode('write');
    };

    const toggleViewMode = () => {
        if (mode === 'tag') setMode('check');
        else if (mode === 'check') setMode('tag');
    };

    // --- İLK YÜKLEMELER ---
    useEffect(() => {
        if (localStorage.getItem('risaleTheme') === 'dark') setDarkMode(true);
        loadDictionaryData();
    }, []);

    const loadDictionaryData = async () => {
        const loaded = await getDictionary();
        let finalDict = loaded || {};
        const savedDict = localStorage.getItem('risaleDictionary');
        if (savedDict) {
            try {
                // Merge local storage if exists (for web, or if user had old unsaved changes)
                finalDict = { ...finalDict, ...JSON.parse(savedDict) };
            } catch (e) { console.error(e); }
        }
        setDictionary(sortDictionaryByKey(finalDict));
    };

    const saveDictionaryToStorage = async (updatedDict) => {
        const sorted = sortDictionaryByKey(updatedDict);
        setDictionary(sorted);

        // Save using Service (handles Electron IPC or Web DL)
        const success = await saveDictionary(sorted);
        if (success && window.api?.isElectron) {
            showToast('Sözlük dosyaya kaydedildi.', 'success');
        }
        // Cache in localStorage too
        localStorage.setItem('risaleDictionary', JSON.stringify(sorted));
    };

    const toggleDarkMode = () => { const newMode = !darkMode; setDarkMode(newMode); localStorage.setItem('risaleTheme', newMode ? 'dark' : 'light'); };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeBookId && rawText) saveCurrentWorkToMemory(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, [rawText, activeBookId, saveCurrentWorkToMemory]);

    // --- DOSYA İNDİRME / KAYDETME ---
    const downloadCurrentChapter = async () => {
        if (!activeBookId) return showToast("Bölüm seçilmedi", "error");
        saveCurrentWorkToMemory();
        const chapter = globalLibrary.find(b => b.id === activeBookId).chapters.find(c => c.id === activeChapterId);

        const success = await saveChapter(`${activeChapterId}.json`, chapter.data);
        if (success) {
            if (window.api?.isElectron) showToast(`${activeChapterId}.json kaydedildi.`, "success");
            unmarkModified(activeChapterId);
        }
    };

    const downloadAllModified = async () => {
        if (modifiedChapters.length === 0) return;
        if (!window.confirm(`${modifiedChapters.length} dosya kaydedilsin mi?`)) return;

        let successCount = 0;
        for (const chapId of modifiedChapters) {
            let foundData = null;
            globalLibrary.forEach(b => {
                const c = b.chapters.find(ch => ch.id === chapId);
                if (c) foundData = c.data;
            });

            if (foundData) {
                const result = await saveChapter(`${chapId}.json`, foundData);
                if (result) successCount++;
            }
        }

        if (successCount > 0) {
            if (window.api?.isElectron) showToast(`${successCount} dosya kaydedildi.`, "success");
            setModifiedChapters([]);
            localStorage.setItem('risaleModifiedChapters', JSON.stringify([]));
        }
    };

    const downloadDictionary = async () => {
        await saveDictionary(dictionary); // DataService handles download/save
        if (window.api?.isElectron) showToast('Sözlük dosyaya kaydedildi.', 'success');
    };

    // --- GLOBAL ARAMA ---
    const handleGlobalSearch = () => {
        if (!globalQuery || globalQuery.length < 2) { setGlobalResults([]); return; }
        const results = []; const term = globalQuery.toLowerCase('tr');
        globalLibrary.forEach(book => book.chapters.forEach(chapter => (Array.isArray(chapter.data) ? chapter.data : []).forEach((chunk, idx) => {
            const regex = /\[\[(.*?)\|.*?\]\]/g; let match;
            // Use oldText (Tagged) for search
            const textToSearch = chunk.oldText || "";
            while ((match = regex.exec(textToSearch)) !== null) {
                if (match[1].toLowerCase('tr').includes(term)) {
                    const parts = match[0].slice(2, -2).split('|').map(s => s.trim());
                    const start = Math.max(0, match.index - 35); const end = Math.min(textToSearch.length, match.index + match[0].length + 35);
                    results.push({ bookId: book.id, bookTitle: book.title, chapterId: chapter.id, chapterTitle: chapter.title, chunkIdx: idx, fullTag: match[0], original: parts[0], short: parts[1] || "", long: parts[2] || "", snippetRaw: textToSearch.substring(start, end), isUpdated: false });
                }
            }
        })));
        setGlobalResults(results);
    };

    const updateGlobalTag = (idx, field, value) => {
        if (field === 'save') {
            const res = globalResults[idx];
            // Conditional formatting for global update as well
            const newTag = res.long
                ? `[[${res.original}|${res.short}|${res.long}]]`
                : `[[${res.original}|${res.short}]]`;
            // Update oldText (Tagged)
            const newLib = globalLibrary.map(b => b.id === res.bookId ? { ...b, chapters: b.chapters.map(c => c.id === res.chapterId ? { ...c, data: c.data.map((d, i) => i === res.chunkIdx ? { ...d, oldText: (d.oldText || "").replaceAll(res.fullTag, newTag), modernText: generateTranslatedText((d.oldText || "").replaceAll(res.fullTag, newTag)) } : d) } : c) } : b);
            setGlobalLibrary(newLib); markAsModified(res.chapterId);
            if (activeBookId === res.bookId && activeChapterId === res.chapterId) {
                if (pageIndex === res.chunkIdx) setRawText(prev => prev.replaceAll(res.fullTag, newTag));
                else { const up = [...pages]; up[res.chunkIdx].oldText = (up[res.chunkIdx].oldText || "").replaceAll(res.fullTag, newTag); setPages(up); }
            }
            const newRes = [...globalResults]; newRes[idx] = { ...res, fullTag: newTag, isUpdated: true }; setGlobalResults(newRes);
        } else {
            const newRes = [...globalResults]; newRes[idx][field] = value; setGlobalResults(newRes);
        }
    };

    // --- BATCH CONSISTENCY FIX ---
    // --- BATCH CONSISTENCY FIX ---
    const matchCase = (orig, rep) => {
        if (!orig || !rep) return rep;
        const sOrig = String(orig);
        const first = sOrig.charAt(0);
        // More robust check for uppercase first letter
        const isUpper = /^[A-ZÇĞİÖŞÜÂÎÛ]/.test(first);
        if (isUpper) {
            return rep.charAt(0).toLocaleUpperCase('tr-TR') + rep.slice(1);
        }
        return rep;
    };

    const handleFixConsistency = (targetWord, targetVariant, arg3, arg4, arg5, arg6) => {
        const isRemove = targetVariant === '__REMOVE__';
        const isMerge = targetVariant === '__MERGE__';
        const isAutoTag = targetVariant === '__AUTO_TAG__';
        const isReplacePage = targetVariant === '__REPLACE_PAGE__';
        const isSmartFix = targetVariant === '__SMART_FIX__';
        const isTestInsert = targetVariant === '__TEST_INSERT__';
        const isTestCursor = targetVariant === '__TEST_CURSOR__';

        const targetShort = (isMerge || isAutoTag) ? arg3 : targetVariant;
        const targetLong = (isMerge || isAutoTag) ? arg4 : (arg3 || "");

        const newPages = pages.map((page, pIdx) => {
            // TEST CURSOR LOGIC (Selection Based)
            if (isTestCursor) {
                const selection = window.getSelection();
                const text = selection.toString().trim(); // Trim visual selection

                if (text && (page.oldText || "") && pIdx === pageIndex) {
                    let newText = page.oldText || "";
                    let replaced = false;

                    // 1. Try Direct Replacement (for untagged text)
                    if (newText.includes(text)) {
                        newText = newText.replace(text, "TEST");
                        replaced = true;
                    }
                    // 2. Try Tag Replacement (Visual text is inside [[...]])
                    else {
                        const esc = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        // Look for tag start: [[text| or [[ text |
                        const tagRegex = new RegExp(`\\[\\[\\s*${esc}\\s*[\\|\\]]`, 'i');

                        if (tagRegex.test(newText)) {
                            // Replace "[[text" with "[[TEST"
                            // Be careful to match the prefix exactly
                            // Find the actual string match for the prefix
                            const match = newText.match(new RegExp(`\\[\\[\\s*${esc}`, 'i'));
                            if (match) {
                                newText = newText.replace(match[0], `[[TEST`);
                                replaced = true;
                            }
                        }
                    }

                    if (replaced && newText !== page.oldText) {
                        return { ...page, oldText: newText, modernText: generateTranslatedText(newText) };
                    }
                }
                if (pIdx === pageIndex) {
                    showToast(`⚠️ Yazılamadı: "${text}" ham metinde bulunamadı.`, "warning");
                }
                return page;
            }

            // Logic for Smart Fix (Single Correction)
            if (isSmartFix) {
                // arg3=Original (Correct), arg4=Current (Wrong), arg5=pageIdx
                if (typeof arg5 === 'number' && pIdx !== arg5) return page; { // Block start for scoping
                    let original = arg3;
                    let replacement = arg4; // Variable name reused but logic was arg3=Replacement
                    // Actually, let's look at the previous fix. 
                    // Previous fix was: let original = arg4; let replacement = arg3;
                    // I should keep that correct logic!

                    // Re-declaring to be safe and clean based on my previous successful edit
                    // The user said "mahlukatı" (Wrong/arg4) was looked for.
                    // So original=arg4 (Search), replacement=arg3 (Replace)
                    original = arg4;
                    replacement = arg3;

                    // arg5 can be occurrenceIndex
                    const occurrenceIndex = typeof arg6 === 'number' ? arg6 : -1;

                    if (isSmartFix) {
                        if (!page.oldText) return page;

                        if (!original) return page;

                        original = original.trim();
                        replacement = replacement ? replacement.trim() : "";

                        // TAG PRESERVATION: If we are replacing a token starting with [[ with a simple word,
                        // we must preserve the tag structure (pipes, descriptions).
                        if (original.startsWith('[[') && !replacement.startsWith('[[')) {
                            const match = original.match(/^\[\[([^|\]]+)/);
                            if (match) {
                                const oldShort = match[1];
                                // Replace ONLY the word part in the token
                                // Use functional replace to avoid regex special char issues in oldShort
                                replacement = original.replace(`[[${oldShort}`, `[[${replacement}`);
                            }
                        }

                        // 2. Escape Regex
                        const esc = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                        // 3. Regex with Boundaries (Unicode aware)
                        // Matches word if surrounded by non-letters or string start/end
                        const startsWithLetter = /^[\p{L}]/u.test(original);
                        const endsWithLetter = /[\p{L}]$/u.test(original);

                        let pattern = esc;
                        if (startsWithLetter) pattern = `(?<!\\p{L})${pattern}`;
                        if (endsWithLetter) pattern = `${pattern}(?!\\p{L})`;

                        const searchRegexStrict = new RegExp(pattern, 'gui');
                        const searchRegexLoose = new RegExp(esc, 'gui');

                        let count = 0;
                        // Try strict first
                        let fixedText = page.oldText.replace(searchRegexStrict, (match) => {
                            const currentIdx = count++;
                            if (occurrenceIndex !== -1 && currentIdx !== occurrenceIndex) return match;
                            if (occurrenceIndex === -1 && currentIdx !== 0) return match;
                            return replacement;
                        });

                        // If strict failed to change anything, try loose (only if word length > 3 to avoid noise, or if user explicitly requested)
                        if (fixedText === page.oldText && original.length > 2) {
                            count = 0; // Reset count
                            fixedText = page.oldText.replace(searchRegexLoose, (match) => {
                                const currentIdx = count++;
                                if (occurrenceIndex !== -1 && currentIdx !== occurrenceIndex) return match;
                                if (occurrenceIndex === -1 && currentIdx !== 0) return match;
                                return replacement;
                            });
                        }

                        // If still no change...
                        if (fixedText === page.oldText) {
                            showToast(`⚠️ Değişiklik yapılamadı: "${original}" bulunamadı.`, 'warning');
                            return page;
                        }

                        return {
                            ...page,
                            oldText: fixedText,
                            text: undefined,
                            metin: undefined,
                            content: undefined,
                            modernText: generateTranslatedText(fixedText)
                        };
                    }
                }
                return page;
            }

            // Logic for Page Replacement
            if (isReplacePage) {
                // ... (No change)
                if (pIdx === arg3) return { ...page, oldText: arg4 };
                return page;
            }

            // Logic for Single Tag Fix
            if (targetVariant === '__FIX_ONE_TAG__') {
                if (pIdx !== Number(arg4)) return page;

                let replaced = page.oldText || "";
                const startIndex = Number(arg5);

                // Precise replacement if index matches
                if (!isNaN(startIndex) && startIndex >= 0 && replaced.substring(startIndex, startIndex + targetWord.length) === targetWord) {
                    replaced = replaced.substring(0, startIndex) + arg3 + replaced.substring(startIndex + targetWord.length);
                } else {
                    // Fallback to simple replace (first occurrence)
                    replaced = replaced.replace(targetWord, arg3);
                }

                return {
                    ...page,
                    oldText: replaced,
                    modernText: generateTranslatedText(replaced)
                };
            }

            // Logic for Insert After (Missing Text)
            if (targetVariant === '__INSERT_AFTER__') {
                if (typeof arg5 === 'number' && pIdx !== arg5) return page;

                // arg3: Text to Insert (Missing Content)
                // arg4: Anchor Text (Preceding partial word)
                const textToInsert = arg3;
                const anchorText = arg4;

                if (!page.oldText) return page;

                let newText = page.oldText;
                let insertIndex = 0;

                if (anchorText) {
                    // Find Anchor
                    const esc = anchorText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    // We search for the anchor word
                    const regex = new RegExp(esc, 'g');

                    // arg6 passed as occurrenceIndex from AnalysisPanel (if available)
                    const anchorOccIdx = typeof arg6 === 'number' ? arg6 : -1;

                    let match;
                    let foundMatch = null;

                    if (anchorOccIdx !== -1) {
                        // Find the Nth occurrence
                        let count = 0;
                        while ((match = regex.exec(newText)) !== null) {
                            if (count === anchorOccIdx) {
                                foundMatch = match;
                                break;
                            }
                            count++;
                        }
                    } else {
                        // Fallback: Find first
                        foundMatch = regex.exec(newText);
                    }

                    if (foundMatch) {
                        match = foundMatch;
                        let matchEnd = match.index + match[0].length;

                        // INTELLIGENT ANCHOR CHECK:
                        // If the matched anchor is inside a tag like [[anchor|...]], we must insert AFTER the tag.
                        // Check if the character immediately following the match is a pipe '|' or text followed by pipe
                        // Or if we are inside a [[...]] block.

                        // Let's check the context around the match.
                        // We look ahead from matchEnd. matching [[anchor ... ]]
                        const textAfter = newText.substring(matchEnd);

                        // Check if we are inside a tag marker. 
                        // Simple check: does it look like start of a tag definition "[[anchor|" ? 
                        // Or is the anchor actually the *full* token content?

                        // Case A: Anchor is "Fâni". Text is "[[Fâni|geçici]]".
                        // Match find "Fâni". Next char is '|'. 
                        // We should skip until ']]'.
                        if (textAfter.startsWith('|') || (textAfter.startsWith(' ') && textAfter.includes('|'))) {
                            const closeBracketIdx = textAfter.indexOf(']]');
                            if (closeBracketIdx !== -1) {
                                // Verify that we are indeed in a tag structure (search for opening [[ backwards)
                                const textBefore = newText.substring(0, match.index);
                                const lastOpen = textBefore.lastIndexOf('[[');
                                const lastClose = textBefore.lastIndexOf(']]');

                                if (lastOpen > lastClose) {
                                    // Yes, we are inside [[ ....
                                    // So move insertIndex to after ']]'
                                    matchEnd += closeBracketIdx + 2;
                                }
                            }
                        }

                        insertIndex = matchEnd;

                    } else {
                        // Fallback: If strict anchor not found, try loose?
                        // Or just warn and insert at 0?
                        showToast(`⚠️ Referans kelime "${anchorText}" tam bulunamadı (${anchorOccIdx > -1 ? anchorOccIdx + 1 : '1'}. sıra). Başa ekleniyor.`, 'warning');
                        insertIndex = 0;
                    }
                } else {
                    // No anchor -> Insert at start
                    insertIndex = 0;
                }

                // Insert
                const prefix = newText.substring(0, insertIndex);
                const suffix = newText.substring(insertIndex);

                // Add space if needed
                const needsSpaceBefore = insertIndex > 0 && !prefix.endsWith(' ') && !textToInsert.startsWith(' ');
                const needsSpaceAfter = !suffix.startsWith(' ') && !textToInsert.endsWith(' ');

                const finalInsert = (needsSpaceBefore ? ' ' : '') + textToInsert + (needsSpaceAfter ? ' ' : '');

                const updatedText = prefix + finalInsert + suffix;

                // --- FLASH HIGHLIGHT (Selection) ---
                if (pIdx === pageIndex && textAreaRef.current) {
                    setTimeout(() => {
                        const ta = textAreaRef.current;
                        if (ta) {
                            ta.focus();
                            const start = prefix.length + (needsSpaceBefore ? 1 : 0);
                            const end = start + textToInsert.length;
                            ta.setSelectionRange(start, end);

                            // Scroll to it
                            const linesBefore = updatedText.substring(0, start).split('\n').length;
                            const lineHeight = 24;
                            const scrollY = linesBefore * lineHeight - (ta.clientHeight / 2);
                            ta.scrollTop = Math.max(0, scrollY);
                        }
                    }, 100);
                }

                return {
                    ...page,
                    oldText: updatedText,
                    text: undefined,
                    metin: undefined,
                    content: undefined,
                    modernText: generateTranslatedText(updatedText)
                };
            }

            if (!page.oldText) return page;
            let newText = page.oldText;

            if (isMerge) {
                const words = targetWord.words;
                if (!words || words.length === 0) return page;
                const pattern = words.map(w => {
                    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    return `\\[\\[\\s*${esc}\\s*\\|.*?\\]\\]`;
                }).join('[\\s\\t\\.,;\\-]*');
                const regex = new RegExp(pattern, 'gi');
                newText = newText.replace(regex, () => {
                    // Remove spaces around pipes
                    return `[[${targetWord.phrase}|${targetShort}|${targetLong}]]`;
                });
            } else if (isAutoTag) {
                const parts = newText.split(/(\[\[[\s\S]*?\]\])/g);
                const esc = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(?<=^|[^\\p{L}])(${esc})(?=$|[^\\p{L}])`, 'gu');

                const processed = parts.map(part => {
                    if (part.startsWith('[[') && part.endsWith(']]')) return part;
                    return part.replace(regex, (m, p1) => {
                        // Remove spaces around pipes
                        return `[[${p1}|${targetShort}|${targetLong}]]`;
                    });
                });
                newText = processed.join('');
            } else {
                if (typeof targetWord !== 'string') return page;
                const esc = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Updated Regex to be robust for spaces (using [\s\S]*? for content after pipe)
                // Added capturing group (${esc}) to ensure p1 is the matched word string, not the offset number
                const regex = new RegExp(`\\[\\[\\s*(${esc})\\s*\\|[\\s\\S]*?\\]\\]`, 'gi');
                newText = newText.replace(regex, (match, p1) => {
                    if (isRemove) return p1;
                    // Apply matchCase logic here to respect the original capitalization found in text
                    const finalShort = matchCase(String(p1 || ""), targetShort ? targetShort.trim() : "");
                    const finalLong = targetLong ? targetLong.trim() : "";

                    // Remove spaces around pipes. Also handle empty long desc if needed?
                    // Currently user logic is consistent: [[word|short|long]]
                    // If finalLong is empty, we arguably should output [[word|short]] but current logic outputs [[word|short|]] if empty string passed.
                    // The user specifically asked for omission of pipe if empty in handleSaveWord.
                    // Let's mirror that logic here if possible, but handleFixConsistency receives specific args.
                    // If targetLong is undefined, it becomes empty string.

                    if (!finalLong) {
                        return `[[${p1}|${finalShort}]]`;
                    }
                    return `[[${p1}|${finalShort}|${finalLong}]]`;
                });
            }
            return { ...page, oldText: newText };
        });

        setPages(newPages);
        // Force update editor text if we are on the active page
        if (newPages[pageIndex].oldText !== pages[pageIndex].oldText) {
            setRawText(newPages[pageIndex].oldText);
        }
        markAsModified(activeChapterId);

        let msg = `✅ "${targetWord}" güncellendi.`;
        if (isRemove) msg = `🗑️ "${targetWord}" etiketleri silindi.`;
        if (isMerge) msg = `🔗 "${targetWord.phrase}" öbeği birleştirildi.`;
        if (isAutoTag) msg = `🏷️ "${targetWord}" otomatik etiketlendi.`;
        if (isReplacePage) msg = `✅ Sayfa ${arg3 + 1} orijinal haline döndürüldü.`;
        if (isSmartFix) msg = `✅ Düzeltme uygulandı: "${(arg4 || "").trim()}" -> "${(arg3 || "").trim()}"`;
        if (isTestInsert) msg = `✅ TEST uygulandı: "${(arg4 || "").trim()}" -> "${(arg3 || "").trim()}"`;

        showToast(msg, "success");
    };



    // --- POPUP VE DRAG ---
    const startDrag = (e) => { dragRef.current = { startX: e.clientX, startY: e.clientY, initialX: popupData.x, initialY: popupData.y, placement: popupData.placement }; document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', stopDrag); };
    const onDrag = (e) => { if (!dragRef.current) return; const newX = dragRef.current.initialX + (e.clientX - dragRef.current.startX); const newY = (dragRef.current.placement === 'top') ? dragRef.current.initialY - (e.clientY - dragRef.current.startY) : dragRef.current.initialY + (e.clientY - dragRef.current.startY); setPopupData(prev => ({ ...prev, x: newX, y: newY })); };
    const stopDrag = () => { dragRef.current = null; document.removeEventListener('mousemove', onDrag); document.removeEventListener('mouseup', stopDrag); };

    const handleMouseUp = () => {
        if (mode === 'write' || isFormatMode) return;
        const sel = window.getSelection(); const txt = sel.toString().trim();
        if (txt.length > 0 && !txt.includes('[')) {
            const rect = sel.getRangeAt(0).getBoundingClientRect();
            const entry = dictionary[txt];
            setDictSearchTerm(txt);
            const s = entry ? (entry.short || entry) : "";
            const l = entry ? (entry.long || "") : "";
            const src = entry ? (entry.source || "AI") : "";
            openPopup(rect, txt, s, l, false, src);
        }
    };

    const openPopup = (rect, word, short, long, isEdit, source = "") => {
        // If not provided (e.g. from context menu), try to look up
        if (!source && dictionary[word]) source = dictionary[word].source || "AI";

        const viewH = window.innerHeight; const spaceBelow = viewH - rect.bottom; const place = spaceBelow < 320 ? 'top' : 'bottom'; const y = place === 'top' ? viewH - rect.top + 5 : rect.bottom + 5; let x = rect.left; if (x + 320 > window.innerWidth) x = window.innerWidth - 340;
        setPopupData({ show: true, word, originalWord: word, short, long, source, x, y, placement: place, isEdit });
    };

    const handleSaveWord = () => {
        const { word, originalWord, short, long } = popupData;

        // Trim inputs to avoid extra spaces
        const cleanWord = word ? word.trim() : "";
        const cleanShort = short ? short.trim() : "";
        const cleanLong = long ? long.trim() : "";
        const cleanOriginal = originalWord ? originalWord.trim() : "";

        if (!cleanWord || !cleanShort) return;

        // Author Logic
        let newSource = "AI";
        if (user) {
            if (user.displayName) {
                newSource = user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
            } else if (user.email) {
                newSource = user.email.substring(0, 2).toUpperCase();
            }
        }

        // Remove lowercase variant if we are saving uppercase to prevent duplicates in dictionary
        const newDict = { ...dictionary };
        if (cleanWord && /^[A-ZÇĞİÖŞÜÂÎÛ]/.test(cleanWord.charAt(0))) {
            const lower = cleanWord.toLocaleLowerCase('tr-TR');
            if (newDict[lower]) delete newDict[lower];
        }
        newDict[cleanWord] = { short: cleanShort, long: cleanLong, source: newSource };

        let txt = rawText;

        // Conditional formatting: Omit second pipe if long description is empty
        // Conditional formatting: Omit second pipe if long description is empty
        const rep = cleanLong
            ? `[[${cleanWord}|${cleanShort}|${cleanLong}]]`
            : `[[${cleanWord}|${cleanShort}]]`;

        if (popupData.isEdit) {
            // Trim originalWord to ensure regex matches the token regardless of surrounding spaces
            const esc = cleanOriginal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Flexible regex: matches [[ spaced_word | ... ]] or [[word|...]]
            const regex = new RegExp(`\\[\\[\\s*${esc}\\s*\\|[\\s\\S]*?\\]\\]`, 'g');
            txt = txt.replace(regex, rep);
        } else {
            // If we have originalWord, prefer replacing that specific phrase to preserve context/integrity
            const targetRepl = cleanOriginal || cleanWord;
            txt = txt.replaceAll(targetRepl, rep);
        }
        setRawText(txt);
        saveDictionary(newDict);
        setPopupData({ ...popupData, show: false });
        window.getSelection().removeAllRanges();
    };
    const handleRemoveTag = () => {
        const { originalWord } = popupData;
        const esc = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Flexible match for [[ word | ... ]] with optional spaces
        const regex = new RegExp(`\\[\\[\\s*${esc}\\s*\\|[\\s\\S]*?\\]\\]`, 'g');
        setRawText(rawText.replace(regex, originalWord));
        setPopupData({ ...popupData, show: false });
    };
    const handleDeleteDict = () => {
        const { word } = popupData;
        const newDict = { ...dictionary };
        delete newDict[word];
        saveDictionary(newDict);
        setPopupData({ ...popupData, show: false });
    };

    // --- EVRENSEL FORMATLAMA ---
    const applyFormat = (type) => {
        if (mode === 'write') {
            const ta = textAreaRef.current; if (!ta) return;
            const start = ta.selectionStart; const end = ta.selectionEnd;
            const sel = rawText.substring(start, end);
            if (type === 'bold') setRawText(prev => prev.substring(0, start) + `** ${sel}** ` + prev.substring(end));
            else if (type === 'red') setRawText(prev => prev.substring(0, start) + `((${sel}))` + prev.substring(end));
            else if (type === 'center' || type === 'header') {
                const ls = rawText.lastIndexOf('\n', start - 1) + 1; const le = rawText.indexOf('\n', start); const e = le === -1 ? rawText.length : le;
                const l = rawText.substring(ls, e); const p = type === 'center' ? ':: ' : '# ';
                const nl = l.startsWith(p) ? l.replace(p, '') : p + l.replace(/^[#:]+\s?/, '');
                setRawText(prev => prev.substring(0, ls) + nl + prev.substring(e));
            }
        }
        else if (isFormatMode) {
            const selection = window.getSelection();
            const text = selection.toString();
            if (type === 'bold' && text) { setRawText(prev => prev.replace(text, `** ${text}** `)); selection.removeAllRanges(); }
            else if (type === 'red' && text) { setRawText(prev => prev.replace(text, `((${text}))`)); selection.removeAllRanges(); }
            else if ((type === 'center' || type === 'header') && text) {
                const lines = rawText.split('\n');
                const newLines = lines.map(line => {
                    if (line.includes(text)) {
                        const p = type === 'center' ? ':: ' : '# ';
                        return line.startsWith(p) ? line.replace(p, '') : p + line.replace(/^[#:]+\s?/, '');
                    }
                    return line;
                });
                setRawText(newLines.join('\n')); selection.removeAllRanges();
            }
        }
    };

    const autoTagFromDictionary = () => {
        if (!rawText.trim()) return;
        let tc = 0;
        const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
        const parts = rawText.split(/(\[\[[\s\S]*?\]\])/g);
        const proc = parts.map(part => {
            if (part.startsWith('[[') && part.endsWith(']]')) return part;
            let tp = part;
            keys.forEach(w => {
                const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const reg = new RegExp(`(?< !\\[\\[)${esc} (? !\\|)`, 'g');
                if (tp.match(reg)) {
                    tc += tp.match(reg).length;
                    const d = dictionary[w];
                    const s = d.short || d;
                    const l = d.long || "";
                    const rep = l ? `[[${w}|${s}|${l}]]` : `[[${w}|${s}]]`;
                    tp = tp.replace(reg, rep);
                }
            });
            return tp;
        });
        if (tc > 0) { setRawText(proc.join('')); setMode('tag'); showToast(`✅ ${tc} etiketlendi.`, "success"); }
        else showToast("⚠️ Eşleşme yok.", "warning");
    };

    // --- PANEL RESIZE ---
    const startResize = useCallback(() => setResizingPanel(true), []);
    const stopResize = useCallback(() => setResizingPanel(false), []);
    const doResize = useCallback((e) => {
        if (!resizingPanel) return;
        const w = document.body.clientWidth;
        setSidebarWidth((e.clientX / w) * 100);
    }, [resizingPanel]);

    useEffect(() => { window.addEventListener('mousemove', doResize); window.addEventListener('mouseup', stopResize); return () => { window.removeEventListener('mousemove', doResize); window.removeEventListener('mouseup', stopResize); }; }, [doResize, stopResize]);

    if (!globalLibrary) return <div className="p-10 text-red-500">Kütüphane yüklenemedi (Library is null)</div>;

    return (
        <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'} `}>
            <UnifiedSidebar
                isOpen={isSidebarOpen}
                width={sidebarWidth}
                library={globalLibrary}
                activeChapterId={activeChapterId}
                modifiedChapters={modifiedChapters}
                // Status props moved to internal Sidebar state
                onLoadChapter={(bookId, chapId) => {
                    loadChapter(bookId, chapId);
                    setSidebarTab('dictionary');
                }}
                onDownloadAll={downloadAllModified}
                darkMode={darkMode}
                dictionary={dictionary}
                onDownloadDictionary={downloadDictionary}
                onDownloadChapter={downloadCurrentChapter}
                searchTerm={dictSearchTerm}
                setSearchTerm={setDictSearchTerm}
                filterLen={filterLen} // Fixed: was dictFilterLength
                setFilterLen={setFilterLen} // Fixed: was setDictFilterLength
                onSelectWord={(s, l) => popupData.show && setPopupData(p => ({ ...p, short: s, long: l }))}
                pages={pages}
                activeBookId={activeBookId}
                onFixAll={handleFixConsistency}
                onNavigate={handleNavigate}
                activeTab={sidebarTab}
                setActiveTab={setSidebarTab}
            />

            {isSidebarOpen && <div className="w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 z-20 h-full shrink-0" onMouseDown={startResize}></div>}

            <div className="flex-1 h-full flex flex-col min-w-0 relative">
                <EditorToolbar
                    activeBookId={activeBookId}
                    currentFileName={currentFileName}
                    pageIndex={pageIndex}
                    pages={pages}
                    darkMode={darkMode}
                    mode={mode}
                    isFormatMode={isFormatMode}
                    onCyclePanels={toggleSidebar}
                    onPageChange={handleManualPageChange}
                    onToggleDarkMode={toggleDarkMode}
                    onToggleEditLock={toggleEditLock}
                    onToggleViewMode={toggleViewMode}
                    onApplyFormat={applyFormat}
                    onToggleFormatMode={() => setIsFormatMode(!isFormatMode)}
                    onOpenGlobalSearch={() => setShowGlobalSearch(true)}
                    onSwitchMode={onSwitchMode}
                    onAutoTag={autoTagFromDictionary} // Fixed: use undefined
                />

                <EditorContent
                    activeBookId={activeBookId}
                    mode={mode}
                    rawText={rawText}
                    modernText={modernText}
                    pages={pages}
                    pageIndex={pageIndex}
                    saveStatus={saveStatus}
                    darkMode={darkMode}
                    editorFontSize={fontSize} // Fixed: was editorFontSize
                    textAreaRef={textAreaRef}
                    onMouseUp={handleMouseUp}
                    onRawTextChange={setRawText}
                    highlightTerm={highlightTerm}
                    onWordClick={(rect, orig, short, long) => {
                        const cleanOrig = orig.trim();
                        setDictSearchTerm(cleanOrig);
                        const entry = dictionary[cleanOrig];
                        const src = entry ? (entry.source || "AI") : "";
                        openPopup(rect, cleanOrig, short, long, true, src);
                    }}
                />
            </div>

            <GlobalSearchModal isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} query={globalQuery} setQuery={setGlobalQuery} onSearch={handleGlobalSearch} results={globalResults} onUpdate={updateGlobalTag} darkMode={darkMode} />
            <WordPopup data={popupData} setData={setPopupData} dictionary={dictionary} darkMode={darkMode} onSave={handleSaveWord} onRemoveTag={handleRemoveTag} onDeleteDict={handleDeleteDict} startDrag={startDrag} />
        </div>
    );
};

export default Editor;