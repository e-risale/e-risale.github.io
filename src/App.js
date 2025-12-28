import React, { useState, useEffect } from 'react';
import Editor from './editor/Editor';
import AIEditor from './editor/AIEditor';
import Reader from './reader/Reader';
import Home from './Home';
import Library from './Library';
import BookIntro from './BookIntro';
import AdminDashboard from './admin/AdminDashboard';
import MessageManager from './admin/MessageManager';
import DictionaryManager from './admin/DictionaryManager';
import PublicationManager from './admin/PublicationManager';
import AdminStats from './admin/AdminStats';
import UpdatesManager from './admin/UpdatesManager'; // YENİ
import { useAdmin } from './reader/hooks/useAdmin';
import { useBookmarks } from './reader/hooks/useBookmarks';
import { ToastProvider, useToast } from './reader/context/ToastContext';
import BookmarkModal from './reader/components/modals/BookmarkModal';
import SearchModal from './reader/components/modals/SearchModal';
import { library } from './data/library';
import { auth, loginWithGoogle, logout, getPublicationStatus } from './firebase';
import { logVisit } from './services/AnalyticsService';

function AppContent() {
  // --- UI Routing State ---
  const [view, setView] = useState('home'); // home, library, intro, read, editor, admin
  const readerRef = React.useRef(null);

  // --- Global App State ---
  const [activeBookId, setActiveBookId] = useState('sozler');
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [user, setUser] = useState(null); // Global User State

  // --- Global Modals ---
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);

  // --- Global Publication State ---
  const [publishedChapters, setPublishedChapters] = useState({});

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await getPublicationStatus();
      setPublishedChapters(status);
    };
    fetchStatus();
  }, []);

  const { showToast } = useToast();

  // --- Auth Listener & Analytics ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      logVisit(currentUser); // Track Visit with User Info
    });
    return () => unsubscribe();
  }, []);

  // --- Admin Hook ---
  const adminState = useAdmin(showToast);

  // --- Bookmarks Hook ---
  const bookmarkState = useBookmarks(activeBookId, activeChapterIndex, null, showToast);

  // --- Theme Effect ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // --- Global Search Logic (Titles Only) ---
  useEffect(() => {
    if (!globalSearchQuery || globalSearchQuery.length < 2) {
      setGlobalSearchResults([]);
      return;
    }

    const query = globalSearchQuery.toLocaleLowerCase('tr');
    const results = [];

    library.forEach(book => {
      const bookTitle = book.title.toLocaleLowerCase('tr');
      const bookTitleMatch = bookTitle.includes(query);
      const matchedChapters = [];

      book.chapters.forEach((chapter, index) => {
        const chapterTitle = chapter.title.toLocaleLowerCase('tr');
        if (bookTitleMatch || chapterTitle.includes(query)) {
          // Title match is a "match"
          matchedChapters.push({
            index: index,
            title: chapter.title,
            matches: [{
              chunkIndex: 0, // Go to beginning
              preview: `... ${chapter.title} ...` // Simple preview
            }]
          });
        }
      });

      if (matchedChapters.length > 0) {
        results.push({
          id: book.id,
          title: book.title,
          total: matchedChapters.length,
          chapters: matchedChapters
        });
      }
    });

    setGlobalSearchResults(results);
  }, [globalSearchQuery]);


  // --- Navigation & Actions ---
  const handleBookSelect = (bookId) => {
    setActiveBookId(bookId);
    setActiveChapterIndex(0);
    setView('intro');
  };

  const handleStartReading = (chapterIndex) => {
    if (typeof chapterIndex === 'number') {
      setActiveChapterIndex(chapterIndex);
    }
    setView('read');
  };

  const handleBookChange = (bookId) => {
    setActiveBookId(bookId);
    setActiveChapterIndex(0);
    setIsSidebarOpen(false);
  };

  const handleSwitchMode = (mode) => {
    setView(mode);
  };

  const handleNavigateFromSearch = (bookId, chapIdx, chunkIdx) => {
    setActiveBookId(bookId);
    setActiveChapterIndex(chapIdx);
    setIsSearchModalOpen(false);
    setView('read');

    setTimeout(() => {
      if (readerRef.current && readerRef.current.navigateToLocation) {
        readerRef.current.navigateToLocation({
          bookId,
          chapterIndex: chapIdx,
          chunkIndex: chunkIdx
        });
      }
    }, 100);
  };

  const commonUserMenuProps = {
    darkMode,
    toggleDarkMode,
    onOpenBookmarks: () => bookmarkState.setIsBookmarkModalOpen(true),
    onOpenSearch: () => setIsSearchModalOpen(true),
    onLogout: logout,
    onLogin: loginWithGoogle,
    user,
    isAdmin: adminState.isAdmin, // Pass admin status
    onOpenAdmin: () => setView('admin')
  };


  // --- RENDER ---
  if (view === 'admin') {
    return (
      <AdminDashboard
        onNavigate={(target) => setView(target)}
        onBack={() => setView('home')}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  if (view === 'admin_messages') {
    return (
      <MessageManager
        onBack={() => setView('admin')}
        feedbacks={adminState.adminFeedbacks}
        isLoading={adminState.isAdminLoading}
        onDelete={adminState.handleAdminDeleteFeedback}
        onMarkRead={adminState.handleAdminMarkRead}
        onApprove={adminState.handleApprove}
        onArchive={adminState.handleArchive}
        onDeleteAll={adminState.handleDeleteArchived}
        onExport={adminState.handleExportExcel}
        onReply={adminState.handleReply}
        updateCategory={adminState.updateCategory}
        onUpdateContent={adminState.handleUpdateFeedbackContent}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  if (view === 'admin_dictionary') {
    return (
      <DictionaryManager
        onBack={() => setView('admin')}
        user={user}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  if (view === 'admin_publication') {
    return (
      <PublicationManager
        onBack={() => {
          setView('admin');
          // Refresh status when returning from manager
          getPublicationStatus().then(setPublishedChapters);
        }}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  if (view === 'admin_stats') {
    return (
      <AdminStats
        onBack={() => setView('admin')}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
    );
  }

  if (view === 'admin_updates') {
    return (
      <UpdatesManager
        onBack={() => setView('admin')}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''} h-screen flex flex-col overflow-hidden`}>
      {view === 'home' && (
        <Home
          onNavigate={(target) => setView(target)}
          isAdmin={adminState.isAdmin}
          publishedChapters={publishedChapters}
          {...commonUserMenuProps}
        />
      )}

      {view === 'library' && (
        <Library
          onBookSelect={handleBookSelect}
          onBack={() => setView('home')}
          publishedChapters={publishedChapters}
          {...commonUserMenuProps}
        />
      )}

      {view === 'intro' && (
        <BookIntro
          bookId={activeBookId}
          onStartReading={handleStartReading}
          onBack={() => setView('library')}
          publishedChapters={publishedChapters}
          {...commonUserMenuProps}
        />
      )}

      {view === 'read' && (
        <Reader
          ref={readerRef}
          activeBookId={activeBookId}
          activeChapterIndex={activeChapterIndex}
          onChapterChange={(idx) => setActiveChapterIndex(idx)}
          onBack={() => setView('intro')}
          onBookChange={handleBookChange}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onOpenAdmin={() => setView('admin')}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          showToast={showToast}
          onSwitchMode={handleSwitchMode}
          isAdmin={adminState.isAdmin}
          unreadCount={adminState.unreadCount}
          // Bookmark Props
          bookmarks={bookmarkState.bookmarks}
          isBookmarkModalOpen={bookmarkState.isBookmarkModalOpen}
          setIsBookmarkModalOpen={bookmarkState.setIsBookmarkModalOpen}
          onSaveBookmark={bookmarkState.handleSaveBookmark}
          onDeleteBookmark={bookmarkState.handleDeleteBookmark}
          publishedChapters={publishedChapters}
        />
      )}

      {view === 'editor' && <Editor onSwitchMode={handleSwitchMode} user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      {view === 'ai_editor' && <AIEditor onSwitchMode={handleSwitchMode} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}

      {/* GLOBAL MODALS */}
      <BookmarkModal
        isOpen={bookmarkState.isBookmarkModalOpen}
        onClose={() => bookmarkState.setIsBookmarkModalOpen(false)}
        bookmarks={bookmarkState.bookmarks}
        onNavigate={(location) => {
          if (view !== 'read') setView('read');
          bookmarkState.setIsBookmarkModalOpen(false);
          setTimeout(() => {
            if (readerRef.current && readerRef.current.navigateToLocation) {
              readerRef.current.navigateToLocation(location);
              if (location.bookId) setActiveBookId(location.bookId);
              if (location.chapterIndex !== undefined) setActiveChapterIndex(location.chapterIndex);
            } else {
              // Fallback basic nav
              setActiveBookId(location.bookId);
              setActiveChapterIndex(location.chapterIndex);
            }
          }, 200);
        }}
        onDelete={bookmarkState.handleDeleteBookmark}
        onAdd={() => {
          if (view !== 'read') {
            showToast('Ayraç eklemek için bir kitap okumalısınız.', 'warning');
            return;
          }
          bookmarkState.setIsBookmarkModalOpen(false);
          setTimeout(() => {
            if (readerRef.current) {
              const data = readerRef.current.getCurrentLocationBookmarkData();
              if (readerRef.current.flashCurrentLocation) readerRef.current.flashCurrentLocation();

              if (data && data.chunkIndex !== -1 && data.targetId !== "None") {
                bookmarkState.handleSaveBookmark(data);
              } else {
                bookmarkState.handleSaveBookmark();
              }
            }
          }, 350);
        }}
        darkMode={darkMode}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        query={globalSearchQuery}
        onQueryChange={setGlobalSearchQuery}
        results={globalSearchResults}
        onNavigate={handleNavigateFromSearch}
        darkMode={darkMode}
      />

    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}