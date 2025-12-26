import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { library } from '../../data/library';
import { adminEmails } from './useAdmin';

export const useFeedback = (activeBookId, activeChapterIndex, showToast) => {
    // --- GÖNDERME STATE ---
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [feedbackCategory, setFeedbackCategory] = useState("general");
    const [selectedText, setSelectedText] = useState("");
    const [isSendingFeedback, setIsSendingFeedback] = useState(false);

    // --- YORUMLARI GÖRÜNTÜLEME STATE ---
    const [chapterComments, setChapterComments] = useState([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    // --- YORUMLARI ÇEKME VE DİNLEME ---
    useEffect(() => {
        if (!activeBookId) return;

        setIsLoadingComments(true);
        // Sadece bu bölümün ve ONAYLANMIŞ yorumlarını getir
        const q = query(
            collection(db, "comments"),
            where("bookId", "==", activeBookId),
            where("chapterIndex", "==", activeChapterIndex),
            where("status", "==", "approved")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side Sort (Yeniden Eskiye)
            comments.sort((a, b) => {
                const dateA = a.date?.toMillis ? a.date.toMillis() : 0;
                const dateB = b.date?.toMillis ? b.date.toMillis() : 0;
                return dateB - dateA;
            });

            setChapterComments(comments);
            setIsLoadingComments(false);
        });

        return () => unsubscribe();
    }, [activeBookId, activeChapterIndex]);

    // --- FEEDBACK GÖNDERME ---
    const sendFeedback = async (category, text, photoURL, _bookId, _chapterIndex, _selectedText, parentId = null) => {
        if (!text || !text.trim()) return;

        setIsSendingFeedback(true);
        try {
            const currentUser = auth.currentUser;
            const isAdmin = currentUser && adminEmails.includes(currentUser.email);

            // Günlük Limit Kontrolü (LocalStorage - Basit Koruma)
            // Adminler bu limitten muaftır
            if (!isAdmin) {
                const today = new Date().toDateString();
                const storageKey = `daily_limit_${today} `;
                const currentCount = parseInt(localStorage.getItem(storageKey) || '0');

                if (currentCount >= 5) {
                    if (showToast) showToast("Günlük mesaj limitine ulaştınız (5). Yarın tekrar bekleriz!", "warning");
                    setIsSendingFeedback(false);
                    return;
                }

                // Limit Artır (Sadece admin değilse)
                localStorage.setItem(storageKey, (currentCount + 1).toString());
            }

            // Sayfa Bilgisini Hazırla
            const book = library.find(b => b.id === activeBookId);
            const chapter = book ? book.chapters[activeChapterIndex] : null;
            const pageInfo = chapter ? `${book.title} / ${chapter.title}` : `Kitap: ${activeBookId}, Bölüm: ${activeChapterIndex}`;

            const user = auth.currentUser;
            const newFeedback = {
                text: text, // Legacy support
                feedback: text, // Main field
                category,
                parentId: parentId || null, // Thread support
                page: pageInfo,
                bookId: activeBookId,
                chapterIndex: activeChapterIndex,
                date: serverTimestamp(),
                status: 'unread',
                uids: user ? [user.uid] : [],
                email: user ? user.email : 'anonim',
                name: user ? user.displayName : 'Anonim Okuyucu',
                photo: user ? user.photoURL : null,
                selectedText: selectedText || null, // State'ten veya argümandan
                likes: []
            };

            await addDoc(collection(db, "comments"), newFeedback);

            // Limit artırma işlemi yukarı taşındı (conditional olduğu için)

            // Mesaj Türüne Göre Bildirim
            const isReport = ['bug', 'typo'].includes(category);
            const successMsg = isReport
                ? "Bildiriminiz teknik ekibe iletildi. Katkınız için teşekkürler!"
                : "Yorumunuz editör onayına gönderildi. Teşekkürler!";

            if (showToast) showToast(successMsg, "success");

            setIsFeedbackModalOpen(false);
            setFeedbackText(""); // Reset
            setSelectedText(""); // Reset
        } catch (error) {
            console.error("Hata:", error);
            if (showToast) showToast("Bir hata oluştu, lütfen tekrar deneyin.", "error");
        } finally {
            setIsSendingFeedback(false);
        }
    };

    // --- BEĞENME (LIKE) ---
    const handleLikeComment = async (commentId, currentLikes) => {
        const user = auth.currentUser;
        if (!user) {
            if (showToast) showToast("Beğenmek için giriş yapmalısınız.", "warning");
            return;
        }

        const isLiked = currentLikes && currentLikes.includes(user.uid);
        const commentRef = doc(db, "comments", commentId);

        // Optimistic UI Update
        setChapterComments(prev => prev.map(c => {
            if (c.id === commentId) {
                const newLikes = isLiked
                    ? c.likes.filter(uid => uid !== user.uid)
                    : [...(c.likes || []), user.uid];
                return { ...c, likes: newLikes };
            }
            return c;
        }));

        try {
            if (isLiked) {
                await updateDoc(commentRef, { likes: arrayRemove(user.uid) });
            } else {
                await updateDoc(commentRef, { likes: arrayUnion(user.uid) });
            }
        } catch (error) {
            console.error("Like hatası:", error);
            if (showToast) showToast("İşlem başarısız oldu.", "error");
            // Revert changes could be done here but simple optimistic approach usually fine
        }
    };

    return {
        // Modal State
        isFeedbackModalOpen, setIsFeedbackModalOpen,
        feedbackText, setFeedbackText,
        feedbackCategory, setFeedbackCategory,
        selectedText, setSelectedText,

        // Actions
        sendFeedback, // sendFeedback olarak export ediyoruz
        isSendingFeedback,

        // Data
        chapterComments,
        handleLikeComment
    };
};
