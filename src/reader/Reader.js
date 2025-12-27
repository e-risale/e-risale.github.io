import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, logout } from '../firebase';
import { formatLastUpdated } from './utils/readerUtils';

// Hooks
import { useReader } from './hooks/useReader';
import { useBookmarks } from './hooks/useBookmarks';
// import { useAdmin } from './hooks/useAdmin'; // App.js'e taşındı
import { useFeedback } from './hooks/useFeedback';

// Components
import ReaderHeader from './components/ReaderHeader';
import ReaderSidebar from './components/ReaderSidebar';
import ReaderContent from './components/ReaderContent';
// import ToolsMenu from './components/ToolsMenu'; // REMOVED

// Modals
import SearchModal from './components/modals/SearchModal';
// import BookmarkModal from './components/modals/BookmarkModal'; // App.js'e taşındı
// import SettingsModal from './components/modals/SettingsModal'; // REMOVED
// import AdminPanel from './components/modals/AdminPanel'; // App.js'e taşındı (AdminPage)
import FeedbackModal from './components/modals/FeedbackModal';
import MobileTooltip from './components/modals/MobileTooltip';
import QuoteCardModal from './components/modals/QuoteCardModal';

const Reader = React.forwardRef(({
    onSwitchMode,
    onBookChange,
    activeBookId: propActiveBookId, // Rename to avoid shadowing
    activeChapterIndex: propActiveChapterIndex, // Rename to avoid shadowing
    onChapterChange,
    isAdmin,
    unreadCount,
    showToast,
    // Global Theme Props
    darkMode,
    toggleDarkMode,
    publishedChapters, // NEW
    // Bookmark Props
    bookmarks,
    isBookmarkModalOpen,

    setIsBookmarkModalOpen,
    onSaveBookmark,
    onDeleteBookmark,
    onBack // NEW
}, ref) => {
    // --- HOOKS ---
    const {
        activeBookId, setActiveBookId,
        activeChapterIndex, setActiveChapterIndex,
        bookData,
        activeHighlight,
        // darkMode handled via props
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
        handleChapterChange,
        handleNextChapter,
        navigateToLocation,
        clearSearch,
        reopenSearchModal,
        scrollTarget,
        setScrollTarget,
        setScrollY,
        restoredScrollY
    } = useReader(showToast, propActiveBookId, propActiveChapterIndex);

    const virtualReaderRef = React.useRef(null);

    // --- EFFECT: Handle Scroll Restoration ---
    useEffect(() => {
        if (restoredScrollY !== null && virtualReaderRef.current) {
            // Give a slight delay for Virtuoso to potentially calculate layout or just ensuring call stack is clear
            setTimeout(() => {
                virtualReaderRef.current.scrollTo(restoredScrollY);
            }, 100);
        }
    }, [restoredScrollY]);

    // useBookmarks App.js'e taşındı

    // useAdmin App.js'e taşındı, props olarak geliyor

    // showToast App'ten geliyor
    const {
        isFeedbackModalOpen, setIsFeedbackModalOpen,
        feedbackText, setFeedbackText,
        feedbackCategory, setFeedbackCategory,
        selectedText, setSelectedText,
        sendFeedback,
        isSendingFeedback,
        chapterComments, // YENİ
        handleLikeComment // YENİ
    } = useFeedback(activeBookId, activeChapterIndex, showToast);

    // --- USER STATE (Local to this component as it deals with user auth UI flow) ---
    const [user, setUser] = useState(null);
    const [selectionRect, setSelectionRect] = useState(null);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // --- SYNC STATE WITH PARENT ---
    // Listen to internal changes and notify parent (App.js) so it stays in sync
    // This fixes the bug where App.js thinks we are at Chapter 0 but Reader is at Chapter 10
    useEffect(() => {
        if (onBookChange && activeBookId) {
            onBookChange(activeBookId);
        }
    }, [activeBookId]);

    useEffect(() => {
        if (onChapterChange && activeChapterIndex !== undefined) {
            onChapterChange(activeChapterIndex);
        }
    }, [activeChapterIndex]);

    // --- IMPERATIVE HANDLE (For Bookmarking from App.js) ---
    React.useImperativeHandle(ref, () => ({
        getCurrentLocationBookmarkData: () => {
            if (virtualReaderRef.current && virtualReaderRef.current.getBookmarkData) {
                return virtualReaderRef.current.getBookmarkData();
            }
            // Fallback if ref is not ready
            return {
                bookTitle: activeBook ? activeBook.title : "Risale-i Nur",
                chapterTitle: activeChapter ? activeChapter.title : `Bölüm ${activeChapterIndex + 1}`,
                targetId: "chunk-0",
                snippet: "...",
                scrollOffset: 0
            };
        },
        flashCurrentLocation: () => {
            if (virtualReaderRef.current && virtualReaderRef.current.flashCurrentLocation) {
                virtualReaderRef.current.flashCurrentLocation();
            }
        },
        navigateToLocation: (location) => {
            // location: { bookId, chapterIndex, chunkIndex, scrollOffset, anchorText, relativeRatio }

            // 1. Switch Book/Chapter if needed
            if (location.bookId && location.bookId !== activeBookId) {
                setActiveBookId(location.bookId);
            }
            if (location.chapterIndex !== undefined && location.chapterIndex !== activeChapterIndex) {
                setActiveChapterIndex(location.chapterIndex);
            }

            // 2. Set Scroll Target (Logic inside ReaderContent effect will handle the rest)
            // We pass all robust data
            if (setScrollTarget) {
                setScrollTarget({
                    index: location.chunkIndex !== undefined ? location.chunkIndex : (location.targetId ? parseInt(location.targetId.replace('chunk-', '')) : 0),
                    offset: location.scrollOffset,
                    anchorText: location.anchorText,
                    relativeRatio: location.relativeRatio,
                    align: 'start'
                });
            }
        },
        goToLocation: (location) => {
            // Legacy wrapper for backward compatibility if needed, or just alias
            // But we will use navigateToLocation in App.js
            if (setScrollTarget) {
                setScrollTarget({
                    index: location.chunkIndex,
                    offset: location.scrollOffset,
                    anchorText: location.anchorText, // Pass these too just in case
                    relativeRatio: location.relativeRatio,
                    align: 'start'
                });
            }
        }
    }));


    // --- HANDLERS ---
    const handleQuickBookmark = async () => {
        // 1. Get Data from Content (via ref)
        let data = {};
        if (virtualReaderRef.current && virtualReaderRef.current.getBookmarkData) {
            data = virtualReaderRef.current.getBookmarkData();
        }

        // 2. Add extra metadata
        const bookmarkData = {
            ...data,
            bookTitle: activeBook ? activeBook.title : "Risale-i Nur",
            chapterTitle: activeChapter ? activeChapter.title : `Bölüm ${activeChapterIndex + 1}`,
        };

        // 3. Save (no modal, direct call)
        // onSaveBookmark is passed from App.js -> useBookmarks hook
        // We need to make sure onSaveBookmark supports taking data directly without opening modal?
        // Actually, onSaveBookmark in App.js might toggle the modal.
        // Let's check Reader props. onSaveBookmark comes from App.js. 
        // We might need to call the hook directly OR App.js wrapper needs to support 'silent' save.
        // But wait, the prop `onSaveBookmark` usually opens the modal or executes save?
        // Looking at App.js signatures (implied):
        // It likely calls the hook's handleSaveBookmark.

        // If we want "Quick Save", we should probably just call the save function directly if we had access to the hook here.
        // But `useBookmarks` is in App.js now? No.
        // Line 7: import { useBookmarks } from './hooks/useBookmarks';
        // Line 70: // useBookmarks App.js'e taşındı
        // So Reader receives `onSaveBookmark` as a prop.

        // Let's assume onSaveBookmark(data) works.
        await onSaveBookmark(bookmarkData);

        // 4. Flash & Feedback
        if (virtualReaderRef.current && virtualReaderRef.current.flashCurrentLocation) {
            virtualReaderRef.current.flashCurrentLocation();
        }
    };

    const handleSecretAdminClick = () => {
        // Basit gizli admin girişi (Geliştirme için)
        // setIsAdmin(!isAdmin); // App.js yönetiyor
    };

    // Calculate Last Update
    const lastUpdate = activeChapter ? activeChapter.lastUpdated : null;

    // Calculate safe area for mobile scroll issues?
    // Actually just preventing overscroll on body-like element

    return (
        <div className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 font-sans ${darkMode ? 'bg-[#1a1b1e] text-gray-100' : 'bg-[#fdfbf7] text-gray-800'}`}
            style={{ overscrollBehavior: 'none', touchAction: 'pan-y' }}
            onClick={() => {
                setMobileTooltipData(null);
                setIsToolsMenuOpen(false);

                // Eğer metin seçimi varsa (veya yeni yapıldıysa) butonu hemen kapatma
                const selection = window.getSelection();
                if (!selection || selection.toString().length === 0) {
                    setSelectionRect(null);
                }
            }}>

            {/* DEBUG BAR - REMOVED */}


            {/* CIMBIZ BUTONU (Selection Tooltip) */}
            {selectionRect && (
                <div
                    className={`z-[100] flex gap-3 animate-in zoom-in duration-200 
                        ${window.innerWidth < 768
                            ? "fixed bottom-28 left-4 right-4 justify-center bg-[#1a1b1e]/95 p-3 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                            : "absolute"
                        }`}
                    style={window.innerWidth < 768 ? {} : { top: selectionRect.top, left: selectionRect.left }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => { setIsFeedbackModalOpen(true); setFeedbackCategory("suggestion"); setSelectedText(selectionRect.text); setSelectionRect(null); }}
                        className={`bg-blue-600 text-white rounded-full shadow-lg font-bold hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2 border border-white/20 ${window.innerWidth < 768 ? "flex-1 justify-center py-3 text-xs px-2" : "px-5 py-2.5 text-sm"}`}
                    >
                        <span className="text-lg">💬</span> <span>Çeviri Öner</span>
                    </button>
                    <button
                        onClick={() => { setIsFeedbackModalOpen(true); setFeedbackCategory("typo"); setSelectedText(selectionRect.text); setSelectionRect(null); }}
                        className={`bg-red-500 text-white rounded-full shadow-lg font-bold hover:bg-red-600 hover:scale-105 transition-all flex items-center gap-2 border border-white/20 ${window.innerWidth < 768 ? "flex-1 justify-center py-3 text-xs px-2" : "px-5 py-2.5 text-sm"}`}
                    >
                        <span className="text-lg">⚠️</span> <span>Hata Bildir</span>
                    </button>
                    <button
                        onClick={() => { setIsQuoteModalOpen(true); setSelectedText(selectionRect.text); setSelectionRect(null); }}
                        className={`bg-amber-600 text-white rounded-full shadow-lg font-bold hover:bg-amber-700 hover:scale-105 transition-all flex items-center gap-2 border border-white/20 ${window.innerWidth < 768 ? "flex-1 justify-center py-3 text-xs px-2" : "px-5 py-2.5 text-sm"}`}
                    >
                        <span className="text-lg">📷</span> <span>Söz Paylaş</span>
                    </button>
                </div>
            )}

            {/* HEADER - Artık Flex akışında en üstte */}
            <div className="flex-none z-50">
                <ReaderHeader
                    showControls={showControls}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeBookTitle={activeBook?.title}
                    activeChapterTitle={activeChapter?.title}
                    textMode={textMode}
                    setTextMode={setTextMode}
                    isAdmin={isAdmin}
                    unreadCount={unreadCount}
                    isToolsMenuOpen={isToolsMenuOpen}
                    setIsToolsMenuOpen={setIsToolsMenuOpen}
                    onSwitchMode={onSwitchMode}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    user={user}
                    onQuickBookmark={handleQuickBookmark}
                    onBack={onBack}
                    // Font Props Passed to Header now
                    fontSize={fontSize}
                    changeFontSize={changeFontSize}
                    fontFamily={fontFamily}
                    setFontFamily={setFontFamily}
                    // Menu Action Callbacks
                    onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
                    onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                    onLogout={logout}
                    onGoToAdmin={() => onSwitchMode('admin')}
                    onOpenSearch={() => setIsSearchModalOpen(true)}
                    onOpenBookmarks={() => setIsBookmarkModalOpen(true)}
                />
            </div>

            {/* MAIN CONTENT AREA - Flex-row to hold Sidebar + Content */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* SIDEBAR */}
                <ReaderSidebar
                    isOpen={sidebarOpen}
                    activeBookId={activeBookId}
                    activeChapterIndex={activeChapterIndex}
                    onSwitchMode={onSwitchMode}
                    onSecretAdminClick={handleSecretAdminClick}
                    onNavigate={navigateToLocation}
                    onChapterChange={handleChapterChange}
                    darkMode={darkMode}
                    publishedChapters={publishedChapters}
                />

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-hidden relative w-full h-full" id="reader-scroll-container">
                    <ReaderContent
                        ref={virtualReaderRef}
                        scrollTarget={scrollTarget}
                        bookData={bookData}
                        textMode={textMode}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        darkMode={darkMode}
                        sidebarOpen={sidebarOpen}
                        activeHighlight={activeHighlight}
                        onReopenSearch={reopenSearchModal}
                        onClearSearch={clearSearch}
                        contentRef={contentTopRef}
                        user={user}
                        onLogin={loginWithGoogle}
                        onLogout={logout}
                        onNextChapter={handleNextChapter}
                        onFeedbackOpen={() => { setIsFeedbackModalOpen(true); setSelectedText(""); }}
                        setSelectionRect={setSelectionRect}
                        selectionRect={selectionRect}
                        setMobileTooltipData={setMobileTooltipData}
                        lastUpdate={lastUpdate}
                        // Feedback Props for Inline Form
                        onSendFeedback={sendFeedback}
                        feedbackText={feedbackText}
                        setFeedbackText={setFeedbackText}
                        feedbackCategory={feedbackCategory}
                        setFeedbackCategory={setFeedbackCategory}
                        isSendingFeedback={isSendingFeedback}
                        // Comments Props
                        chapterComments={chapterComments}
                        onLikeComment={handleLikeComment}
                        onDebugUpdate={(info) => { /* console.log(info) */ }}
                        onScrollPos={setScrollY}
                        isAdmin={isAdmin} // Pass admin status down
                    />
                </div>
            </div>

            {/* TOOLS MENU REMOVED - Integrated into Header */}

            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                query={globalSearchQuery}
                onQueryChange={setGlobalSearchQuery}
                results={globalSearchResults}
                onNavigate={navigateToLocation}
                darkMode={darkMode}
            />

            {/* SettingsModal Removed */}

            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                selectedText={selectedText}
                category={feedbackCategory}
                onCategoryChange={setFeedbackCategory}
                text={feedbackText}
                onTextChange={setFeedbackText}
                onSend={sendFeedback}
                isSending={isSendingFeedback}
                darkMode={darkMode}
                user={user}
                onLogin={loginWithGoogle}
            />

            <QuoteCardModal
                isOpen={isQuoteModalOpen}
                onClose={() => setIsQuoteModalOpen(false)}
                text={selectedText}
                source={activeBook && activeChapter ? `${activeBook.title} / ${activeChapter.title}` : "Risale-i Nur Külliyatı"}
            />

            <MobileTooltip
                data={mobileTooltipData}
                onClose={() => setMobileTooltipData(null)}
                darkMode={darkMode}
            />
        </div>
    );


}); // END forwardRef

export default Reader;
