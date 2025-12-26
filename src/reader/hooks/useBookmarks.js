import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, doc } from 'firebase/firestore';
import { generateSnippet, formatLastUpdated, formatDateWithTime } from '../utils/readerUtils';

export const useBookmarks = (activeBookId, activeChapterIndex, bookData, showToast) => {
    const [bookmarks, setBookmarks] = useState([]);
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

    // Ayraçları Dinle - Auth State Değişikliğine Göre
    useEffect(() => {
        let unsubscribeBookmarks = null;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                // Kullanıcı giriş yaptı, bookmarkları dinle
                const q = query(collection(db, "bookmarks"), where("uid", "==", user.uid));
                unsubscribeBookmarks = onSnapshot(q, (snapshot) => {
                    const bms = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: formatDateWithTime(doc.data().createdAt?.toDate())
                    }));
                    // Tarihe göre sırala (yeni en üstte)
                    bms.sort((a, b) => b.createdAt - a.createdAt);
                    setBookmarks(bms);
                });
            } else {
                // Kullanıcı yok, bookmarkları temizle ve dinlemeyi durdur
                setBookmarks([]);
                if (unsubscribeBookmarks) {
                    unsubscribeBookmarks();
                    unsubscribeBookmarks = null;
                }
            }
        });

        // Cleanup function
        return () => {
            unsubscribeAuth();
            if (unsubscribeBookmarks) unsubscribeBookmarks();
        };
    }, []);

    // Ayraç Ekle
    const handleSaveBookmark = async (customData = {}) => {
        const user = auth.currentUser;
        if (!user) {
            if (showToast) showToast("Ayraç eklemek için giriş yapmalısınız.", "error");
            return;
        }

        // Eğer custom snippet yoksa ve bookData da yoksa hata ver
        // AMA: Custom data varsa bookData'ya gerek yok.
        // Eğer custom snippet yoksa ve bookData da yoksa hata ver
        // AMA: Custom data varsa bookData'ya gerek yok.
        const hasCustomData = customData.snippet && customData.snippet.length > 0;
        if (!hasCustomData && (!bookData || bookData.length === 0)) {
            if (showToast) showToast("Sayfa verisi alınamadı. Lütfen sayfayı yenileyip tekrar deneyin.", "error");
            return;
        }

        // Custom data'dan al veya varsayılan snippet oluştur
        const snippetText = customData.snippet || bookData[0]?.rawText || "";
        const cleanSnippet = customData.snippet ? snippetText : generateSnippet(snippetText);

        // Custom targetId yoksa en başa (0)
        const targetId = customData.targetId || "chunk-0";

        // Başlıklar: customData'dan geliyorsa onları kullan, yoksa ve bookData yoksa default, varsa hesapla
        // Reader.js'den gelen customData artık başlıkları da içeriyor.
        const bookTitle = customData.bookTitle || "Risale-i Nur";
        const chapterTitle = customData.chapterTitle || `Bölüm ${activeChapterIndex + 1}`;

        try {
            await addDoc(collection(db, "bookmarks"), {
                uid: user.uid,
                bookId: activeBookId,
                chapterIndex: activeChapterIndex,
                targetId: targetId, // SCROLL İÇİN ÖNEMLİ
                // New precise location data:
                chunkIndex: customData.chunkIndex !== undefined ? customData.chunkIndex : -1,
                scrollOffset: customData.scrollOffset !== undefined ? customData.scrollOffset : 0,
                // Text-Based Anchoring (Robust)
                anchorText: customData.anchorText || null,
                relativeRatio: customData.relativeRatio !== undefined ? customData.relativeRatio : null,

                bookTitle: bookTitle,
                chapterTitle: chapterTitle,
                snippet: cleanSnippet,
                createdAt: serverTimestamp()
            });
            if (showToast) showToast("Ayraç eklendi!", "success");
        } catch (error) {
            console.error("Ayraç hatası:", error);
            if (showToast) showToast("Ayraç eklenirken hata oluştu.", "error");
        }
    };

    const handleDeleteBookmark = async (id) => {
        // if (!window.confirm("Bu ayracı silmek istediğinize emin misiniz?")) return; // Artık sormadan silsin mi? 
        // Kullanıcı "iptal edelim" dedi tarayıcı mesajını. 
        // Toast ile "Silindi" desek yeterli mi? Genelde silme işlemi kritikse sorulur. 
        // Kullanıcı "tarayıcı mesajını iptal edelim" dedi, belki "Custom Modal sorusu" kastediyor ama 
        // "ayraç eklendi gibi ... bildirim olsa yeter" dediği için silme için de silent olsun istiyor olabilir.
        // Ama yanlışlıkla silmeyi önlemek için, Toast içinde "Geri Al" butonu yoksa sormak iyidir.
        // Şimdilik direkt siliyorum istendiği gibi.

        try {
            await deleteDoc(doc(db, "bookmarks", id));
            if (showToast) showToast("Ayraç silindi.", "success");
        } catch (error) {
            console.error("Silme hatası:", error);
            if (showToast) showToast("Silinirken hata oluştu.", "error");
        }
    };

    return {
        bookmarks,
        isBookmarkModalOpen,
        setIsBookmarkModalOpen,
        handleSaveBookmark,
        handleDeleteBookmark
    };
};
