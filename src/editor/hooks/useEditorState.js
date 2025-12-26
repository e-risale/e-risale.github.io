import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../../reader/context/ToastContext';
import { generateTranslatedText } from '../../utils/editorHelpers';

// Helper for timestamp
const getCurrentTimestamp = () => {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export function useEditorState(initialLibrary) {
    // --- CONTENT STATE ---
    const [globalLibrary, setGlobalLibrary] = useState(initialLibrary);
    const [activeBookId, setActiveBookId] = useState(null);
    const [activeChapterId, setActiveChapterId] = useState(null);
    const [pages, setPages] = useState([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [rawText, setRawText] = useState("");
    const [modernText, setModernText] = useState("");
    const [currentFileName, setCurrentFileName] = useState("Bölüm Seçilmedi");
    const [modifiedChapters, setModifiedChapters] = useState(() => {
        const saved = localStorage.getItem('risaleModifiedChapters');
        return saved ? JSON.parse(saved) : [];
    });
    const [saveStatus, setSaveStatus] = useState(""); // UI Feedback

    // --- MODE STATE ---
    const [mode, setMode] = useState("tag"); // 'tag', 'check', 'write'

    // --- UTILS ---
    const { showToast } = useToast();

    // --- ACTIONS ---
    const markAsModified = useCallback((chapterId) => {
        if (!chapterId) return;
        setModifiedChapters(prev => {
            if (prev.includes(chapterId)) return prev;
            const newList = [...prev, chapterId];
            localStorage.setItem('risaleModifiedChapters', JSON.stringify(newList));
            return newList;
        });
    }, []);

    const unmarkModified = useCallback((chapterId) => {
        setModifiedChapters(prev => {
            const newList = prev.filter(id => id !== chapterId);
            localStorage.setItem('risaleModifiedChapters', JSON.stringify(newList));
            return newList;
        });
    }, []);

    // Text değişince çeviri üret (Effect)
    useEffect(() => {
        const translated = generateTranslatedText(rawText);
        setModernText(translated);
    }, [rawText]);

    const loadPageToEditor = useCallback((page) => {
        // Load oldText (Tagged) if available, otherwise empty.
        // rawText (State) represents the Editing Area, which now uses oldText (Data).
        setRawText(page?.oldText || "");
        setModernText(generateTranslatedText(page?.oldText || ""));
    }, []);

    const loadChapter = useCallback(async (bookId, chapterId) => {
        const book = globalLibrary.find(b => b.id === bookId);
        const chapter = book?.chapters.find(c => c.id === chapterId);
        if (!chapter) return;

        let content = chapter.data;

        // Dynamic Load
        if (!content && chapter.loader) {
            try {
                if (showToast) showToast("Bölüm yükleniyor...", "info");
                const module = await chapter.loader();
                content = module.default || [];

                // Update Cache
                setGlobalLibrary(prev => prev.map(b =>
                    b.id === bookId ? {
                        ...b,
                        chapters: b.chapters.map(c => c.id === chapterId ? { ...c, data: content } : c)
                    } : b
                ));
            } catch (error) {
                console.error("Yükleme hatası:", error);
                if (showToast) showToast("Bölüm yüklenemedi", "error");
                return;
            }
        }

        content = Array.isArray(content) ? content : [];

        setActiveBookId(bookId);
        setActiveChapterId(chapterId);
        setCurrentFileName(`${book.title} - ${chapter.title}`);
        setPages(content);

        if (content.length > 0) {
            setPageIndex(0);
            loadPageToEditor(content[0]);
        } else {
            setRawText("");
            setModernText("");
            setPageIndex(0);
        }
    }, [globalLibrary, showToast, loadPageToEditor]);

    const saveCurrentWorkToMemory = useCallback((showNotification = true) => {
        if (!activeBookId || !activeChapterId) return;

        setPages(currentPages => {
            // Optimization: If text hasn't changed (compare with oldText), don't create new array reference
            const currentPage = currentPages[pageIndex];
            if (currentPage && currentPage.oldText === rawText) {
                return currentPages;
            }

            const updatedPages = [...currentPages];
            // Safety check
            if (pageIndex < 0 || pageIndex >= updatedPages.length) return currentPages;

            updatedPages[pageIndex] = {
                ...updatedPages[pageIndex],
                pageId: pageIndex + 1,
                // rawText: PRESERVED from spread (Clean Original)
                oldText: rawText, // SAVED Tagged Text from Editor State
                modernText: generateTranslatedText(rawText),
                lastUpdated: getCurrentTimestamp()
            };

            // Sync with global library for persistence across navigation
            setGlobalLibrary(prevLib => prevLib.map(book =>
                book.id === activeBookId
                    ? {
                        ...book,
                        chapters: book.chapters.map(chap =>
                            chap.id === activeChapterId
                                ? { ...chap, data: updatedPages }
                                : chap
                        )
                    }
                    : book
            ));

            markAsModified(activeChapterId);
            return updatedPages;
        });

        if (showNotification) {
            setSaveStatus("KAYDEDİLDİ ✅");
            setTimeout(() => setSaveStatus(""), 2000);
        }
    }, [activeBookId, activeChapterId, pageIndex, rawText, markAsModified, setSaveStatus]);

    const handlePageChange = useCallback((newIndex) => {
        saveCurrentWorkToMemory(false); // Önce mevcut sayfayı kaydet
        // Note: activePages state update is async, inside saveCurrentWorkToMemory we use functional update.
        // But here we need to switch page. 
        // We should wait? No, standard pattern is optimizing.
        // Actually, since save uses `setPages`, and `handlePageChange` needs to read from `pages`,
        // there is a potential conflict if we switch before save commits.
        // But `pages` ref in render is used.
        // We can pass `pages` as dependency? 
        // Cleaner: `saveCurrentWorkToMemory` updates state. 
        // We can just rely on `setPageIndex` updating.
        setPages(prevPages => {
            // We need to verify index is valid for CURRENT pages
            if (newIndex < 0 || newIndex >= prevPages.length) return prevPages;
            // We should also load the new page to text fields, but we can't do side effect in reducer.
            // So we do it outside.
            return prevPages;
        });

        // This relies on `pages` being fresh or using Ref.
        // Let's stick to the original Editor.js logic which was synchronous-like because it blocked.
        // In the hook, let's trust that we can simply set index.

        setPageIndex(prev => {
            // We need to access the pages to load data. 
            // We'll use a `useEffect` to sync `rawText` when `pageIndex` changes?
            // Original `Editor.js` did `loadPageToEditor(pages[newIndex])`.
            // Let's modify `handlePageChange` to take `pages` as arg or use state.
            return newIndex;
        });

    }, [saveCurrentWorkToMemory]);

    // Better Handle Page Change that does logic:
    const changePage = (newIndex) => {
        if (newIndex < 0 || newIndex >= pages.length) return;
        saveCurrentWorkToMemory(false);
        setPageIndex(newIndex);
        loadPageToEditor(pages[newIndex]);
    };

    return {
        globalLibrary, setGlobalLibrary,
        activeBookId, setActiveBookId,
        activeChapterId, setActiveChapterId,
        pages, setPages,
        pageIndex, setPageIndex,
        rawText, setRawText,
        modernText, setModernText,
        currentFileName, setCurrentFileName,
        modifiedChapters, setModifiedChapters,
        saveStatus, // Exported
        mode, setMode,
        loadChapter,
        loadPageToEditor,
        changePage,
        saveCurrentWorkToMemory,
        markAsModified, unmarkModified
    };
}
