import { useState, useEffect, useRef } from 'react';
import { library } from '../../data/library';

export const useReader = (showToast, initialBookId, initialChapterIndex) => {
    // --- DURUM DEĞİŞKENLERİ (STATE) ---
    // Kitap & İçerik
    // Başlangıç değerlerini: Props'tan -> LocalStorage'dan -> Varsayılan'dan al
    const savedProgress = JSON.parse(localStorage.getItem('reading_progress') || '{}');

    // Determine initial values
    const startingBookId = initialBookId || savedProgress.bookId || library[0].id;
    const startingChapterIndex = (initialChapterIndex !== undefined && initialChapterIndex !== null)
        ? initialChapterIndex
        : (savedProgress.chapterIndex || 0);

    const [activeBookId, setActiveBookId] = useState(startingBookId);
    const [activeChapterIndex, setActiveChapterIndex] = useState(startingChapterIndex);
    const [bookData, setBookData] = useState([]);
    const [activeHighlight, setActiveHighlight] = useState(null);

    // Görünüm Ayarları
    // darkMode, setDarkMode Removed - Managed by App.js
    const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('fontSize')) || 18);
    const [fontFamily, setFontFamily] = useState(localStorage.getItem('fontFamily') || 'Merriweather');
    // textMode: 'original' (Clean), 'tagged' (Interactive), 'modern' (Translated)
    const [textMode, setTextMode] = useState(localStorage.getItem('textMode') || 'tagged');

    // Arayüz Durumu
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

    // Modallar
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [mobileTooltipData, setMobileTooltipData] = useState(null);

    // Arama
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const currentScrollY = useRef(0); // Track virtual scroll position
    const [restoredScrollY, setRestoredScrollY] = useState(null); // Signal to restore scroll

    // Refs
    const contentTopRef = useRef(null);
    const lastScrollY = useRef(0);
    const saveTimeoutRef = useRef(null);
    const stateRef = useRef({ bookId: activeBookId, chapterIndex: activeChapterIndex });
    const canSaveRef = useRef(false); // Helper to prevent initial overwrite
    const hasRestoredRef = useRef(false); // Helper to prevent double toast

    // Update state ref whenever active book/chapter changes
    useEffect(() => {
        stateRef.current = { bookId: activeBookId, chapterIndex: activeChapterIndex };
        canSaveRef.current = false; // Disable saving when book/chapter changes until loaded
        hasRestoredRef.current = false; // Reset restoration flag
    }, [activeBookId, activeChapterIndex]);

    // --- EFFECT: Ayarları Kaydet ---
    // Dark mode saved by App.js
    useEffect(() => { localStorage.setItem('fontSize', fontSize); }, [fontSize]);
    useEffect(() => { localStorage.setItem('fontFamily', fontFamily); }, [fontFamily]);
    useEffect(() => { localStorage.setItem('textMode', textMode); }, [textMode]);

    // Save Helper
    const saveProgressNow = (scrollY) => {
        if (!canSaveRef.current) {
            console.log("Skipping save - not ready yet", { scrollY });
            return;
        }
        const { bookId, chapterIndex } = stateRef.current;
        localStorage.setItem('reading_progress', JSON.stringify({
            bookId,
            chapterIndex,
            scrollY
        }));
        console.log("Saved progress to storage:", { bookId, chapterIndex, scrollY });
    };

    // --- EFFECT: İlerleme Kaydı (Unmount/Change) ---
    useEffect(() => {
        // Unmount veya chapter değişimi öncesi kaydet
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            // Force save on unmount only if we were allowed to save (meaning likely valid session)
            // But if user quickly opens and closes, we might not want to clobber?
            // If canSave is false, it means we haven't even finished loading. Don't overwrite.
            if (canSaveRef.current) {
                saveProgressNow(currentScrollY.current);
            }
        };
    }, []); // Empty dependency? Or [activeBookId]? 
    // Actually, we want this to run when the component unmounts mostly.
    // If activeBookId changes, the cleanup of the *previous* effect run would handle it if we had dependencies.
    // But since we use a ref for state, we can just have one unmount effect?
    // No, if book changes, we want to save the *previous* book's progress.
    // So let's keep it dependent on book/chapter so it runs cleanup (save) when they change.

    useEffect(() => {
        return () => {
            // Cleanup for exact book/chapter change
            if (canSaveRef.current) {
                saveProgressNow(currentScrollY.current);
            }
        };
    }, [activeBookId, activeChapterIndex]);

    // Better scroll saver (using Ref from ReaderContent):
    const setScrollY = (y) => {
        currentScrollY.current = y;
        // console.log("Scroll update received:", y); // Uncomment to see high-frequency logs

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            saveProgressNow(y);
        }, 1000);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            // Periodically save if changed?
            // Or rely on the fact that useEffect cleanup saves it.
            // Let's keep it simple: Save on unmount is robust for "Back button".
            // For crash proof, maybe save every 5 seconds?
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Explicit debounced save triggered by scroll updates (if we were to pass it to useEffect)
    // But `setScrollY` is called frequently.
    // Let's add a `useEffect` that tracks `currentScrollY.current` changes? No, ref changes don't trigger effect.
    // We will assume "Save on Unmount" matches user "Back button" flow.
    // AND "Save on Chapter Change" (handled by useEffect cleanup).

    // --- EFFECT: Kitap Verisini Yükle ---
    useEffect(() => {
        const loadChapter = async () => {
            canSaveRef.current = false; // Already set in dependency effect, but safe to reiterate

            const book = library.find(b => b.id === activeBookId);
            if (!book) return;
            const chapter = book.chapters[activeChapterIndex];
            if (!chapter) return;

            setBookData([]); // Yüklenirken temizle
            setRestoredScrollY(null); // Reset restore signal

            try {
                // Dynamic import ile veriyi çek
                const module = await chapter.loader();
                setBookData(module.default || []);

                // Restore Scroll Logic
                const saved = JSON.parse(localStorage.getItem('reading_progress') || '{}');
                // Check if we are reloading the exact same chapter/book we saved
                const shouldRestore = saved.bookId === activeBookId && saved.chapterIndex === activeChapterIndex && saved.scrollY > 0;

                if (shouldRestore) {
                    setRestoredScrollY(saved.scrollY);
                    // Allow saving only after enough time for restoration scroll to happen
                    setTimeout(() => {
                        canSaveRef.current = true;
                        if (showToast && !hasRestoredRef.current) {
                            showToast('Kaldığınız yerden devam ediliyor...', 'restore');
                            hasRestoredRef.current = true;
                        }
                    }, 1500);
                } else {
                    setRestoredScrollY(0); // Signal top
                    // If no restore needed, we can save immediately (once user scrolls)
                    canSaveRef.current = true;
                }

            } catch (error) {
                console.error("Bölüm yüklenemedi:", error);
                if (showToast) showToast("Bölüm yüklenirken hata oluştu.", "error");
            }
        };

        loadChapter();
    }, [activeBookId, activeChapterIndex, showToast]);

    // Removed the window.scrollTo useEffects created previously.

    // --- EFFECT: Scroll Davranışı (Header Gizleme) ---
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setShowControls(false); // Aşağı kaydırınca gizle
            } else {
                setShowControls(true); // Yukarı kaydırınca göster
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- İŞLEVLER ---

    const handleChapterChange = (bookIdOrIndex, index) => {
        if (typeof bookIdOrIndex === 'string') {
            // Called as (bookId, index)
            setActiveBookId(bookIdOrIndex);
            setActiveChapterIndex(index);
        } else {
            // Called as (index) - assume current book
            setActiveChapterIndex(bookIdOrIndex);
        }
        setSidebarOpen(false); // Mobilde menüyü kapat
    };

    const handleNextChapter = () => {
        const book = library.find(b => b.id === activeBookId);
        if (activeChapterIndex < book.chapters.length - 1) {
            handleChapterChange(activeBookId, activeChapterIndex + 1);
            window.scrollTo(0, 0);
        } else {
            if (showToast) showToast("Bu kitabın sonuna geldiniz.", "info");
        }
    };

    const changeFontSize = (delta) => {
        setFontSize(prev => Math.min(Math.max(prev + delta, 12), 32));
    };

    // toggleDarkMode Moved to App.js

    // Scroll Hedefi (Virtualization için)
    const [scrollTarget, setScrollTarget] = useState(null);

    const navigateToLocation = (bookId, chapIdx, chunkIdx, highlight = "", anchorText = "") => {
        if (activeBookId !== bookId || activeChapterIndex !== chapIdx) {
            setActiveBookId(bookId);
            setActiveChapterIndex(chapIdx);
        }

        // Virtualization için hedefi belirle
        // chunkIdx null ise (bölüm başı), 0. indexe git
        if (chunkIdx !== null && chunkIdx !== undefined) {
            setScrollTarget({
                index: chunkIdx,
                align: 'center',
                highlight,
                anchorText: anchorText || (highlight ? highlight : null) // Use specific anchorText or fallback to highlight
            });
        } else {
            setScrollTarget(null);
        }

        setGlobalSearchQuery("");
        setGlobalSearchResults([]);
        setIsSearchModalOpen(false);
        setActiveHighlight(highlight);
        setSidebarOpen(false);
    };

    // Arama İşlemleri
    useEffect(() => {
        if (globalSearchQuery.length < 2) {
            setGlobalSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            // NOTE: Global arama Lazy Loading nedeniyle geçici olarak devre dışı.
            // İleride sunucu tabanlı veya indeksli arama eklenecek.
            setGlobalSearchResults([]);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [globalSearchQuery]);

    const clearSearch = () => {
        setActiveHighlight(null);
        setGlobalSearchQuery("");
    };

    const reopenSearchModal = () => {
        setIsSearchModalOpen(true);
    };

    const activeBook = library.find(b => b.id === activeBookId);
    const activeChapter = activeBook?.chapters[activeChapterIndex];

    return {
        // State
        activeBookId, setActiveBookId,
        activeChapterIndex, setActiveChapterIndex,
        bookData,
        activeHighlight,
        // darkMode removed (managed by App.js)
        fontSize, setFontSize, changeFontSize,
        fontFamily, setFontFamily,
        textMode, setTextMode,
        sidebarOpen, setSidebarOpen,
        showControls,
        isToolsMenuOpen, setIsToolsMenuOpen,
        isSearchModalOpen, setIsSearchModalOpen,
        isSettingsModalOpen, setIsSettingsModalOpen,
        mobileTooltipData, setMobileTooltipData,
        globalSearchQuery, setGlobalSearchQuery,
        globalSearchResults,
        contentTopRef,
        activeBook,
        activeChapter,

        // Actions
        handleChapterChange,
        handleNextChapter,
        navigateToLocation,
        clearSearch,
        reopenSearchModal,
        scrollTarget, // Exposed for ReaderContent
        setScrollTarget,
        setScrollY, // NEW
        restoredScrollY // NEW
    };
};
