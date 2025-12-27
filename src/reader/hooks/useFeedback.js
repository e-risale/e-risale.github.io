import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { library } from '../../data/library';
import { adminEmails } from './useAdmin';
import { CONFIG } from '../../config';

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

    // --- HELPER: CONTENT ANALYSIS ---
    const SUSPICIOUS_PATTERN = /([a-zA-ZğüşıöçĞÜŞİÖÇ])[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]{1,3}([a-zA-ZğüşıöçĞÜŞİÖÇ])/; // Matches letters separated by symbols (e.g. s.a.l.a.k, a*p*t*a*l)

    const analyzeContent = (text) => {
        const lowerText = text.toLowerCase();

        // 1. Check for Hard Block (Profanity)
        if (CONFIG.BAD_WORDS) {
            // Tokenize text into words (handling Turkish chars and punctuation)
            const words = lowerText.split(/[^a-z0-9ğüşıöç]+/);

            for (const badWord of CONFIG.BAD_WORDS) {
                if (words.includes(badWord)) {
                    return { status: 'rejected', reason: 'profanity' };
                }
            }
        }

        // 2. Check for Suspicious Content (Symbol Obfuscation)
        if (SUSPICIOUS_PATTERN.test(text)) {
            return { status: 'pending', reason: 'suspicious' };
        }

        // 3. Clean
        return { status: 'approved', reason: 'clean' };
    };

    // --- FEEDBACK GÖNDERME ---
    const sendFeedback = async (category, text, photoURL, _bookId, _chapterIndex, _selectedText, parentId = null, postAsEditorInput = false) => {
        if (!text || !text.trim()) return;

        setIsSendingFeedback(true);
        try {
            const currentUser = auth.currentUser;
            const isAdmin = currentUser && adminEmails.includes(currentUser.email);

            // --- OTOMATİK İÇERİK KONTROLÜ (Sadece Admin Olmayanlar İçin) ---
            let status = 'approved'; // Default to approved (auto-publish)

            if (!isAdmin) {
                const analysis = analyzeContent(text);

                if (analysis.status === 'rejected') {
                    if (showToast) showToast("Mesajınız uygunsuz ifadeler içeriyor. Lütfen düzeltip tekrar deneyin.", "error");
                    setIsSendingFeedback(false);
                    return; // Stop execution
                } else if (analysis.status === 'pending') {
                    status = 'unread'; // Mark as unread/pending for admin review
                } else {
                    status = 'approved'; // Clean content is auto-approved
                }

                // --- BÖLÜM BAŞINA LİMİT KONTROLÜ ---
                // Kullanıcının bu bölümdeki mevcut yorumlarını sayıyoruz
                if (currentUser) {
                    const userComments = chapterComments.filter(c => c.uids && c.uids.includes(currentUser.uid));
                    const isReply = !!parentId;

                    // Limitleri Config'den Al
                    const limit = isReply ? CONFIG.REPLY_LIMIT_PER_CHAPTER : CONFIG.MESSAGE_LIMIT_PER_CHAPTER;

                    // İlgili türdeki (yanıt veya ana mesaj) sayıyı bul
                    // Not: Basitleştirmek için toplam yorum sayısına bakıyoruz, 
                    // veya isReply'ye göre filtreleyebiliriz. Kullanıcı isteği "yeni mesaj limiti 10, cevap limiti 50".
                    const userCount = userComments.filter(c => isReply ? !!c.parentId : !c.parentId).length;

                    if (userCount >= limit) {
                        if (showToast) showToast(`Bu bölüm için ${isReply ? 'yanıt' : 'mesaj'} limitine (${limit}) ulaştınız.`, "warning");
                        setIsSendingFeedback(false);
                        return;
                    }
                }
            } else {
                // Admin validasyonunu her zaman approved yapar
                status = 'approved';
            }

            // Sayfa Bilgisini Hazırla
            const book = library.find(b => b.id === activeBookId);
            const chapter = book ? book.chapters[activeChapterIndex] : null;
            const pageInfo = chapter ? `${book.title} / ${chapter.title}` : `Kitap: ${activeBookId}, Bölüm: ${activeChapterIndex}`;

            const user = auth.currentUser;

            // Allow overriding name for admins (e.g. "Editör")
            // _postAsEditor is passed as true if admin checkbox is checked
            const postAsEditor = isAdmin && postAsEditorInput === true;

            // Determine Name
            let finalName = user ? user.displayName : 'Anonim Okuyucu';
            if (postAsEditor) {
                finalName = parentId ? 'Editör Yanıtı' : 'Editör Mesajı';
            }

            // Determine Photo
            let finalPhoto = user ? user.photoURL : null;
            if (postAsEditor) {
                finalPhoto = '/said.png'; // Editor profile picture from public folder
            }

            const newFeedback = {
                text: text, // Legacy support
                feedback: text, // Main field
                category,
                parentId: parentId || null, // Thread support
                page: pageInfo,
                bookId: activeBookId,
                chapterIndex: activeChapterIndex,
                date: serverTimestamp(),
                status: status, // Dynamic status based on analysis
                uids: user ? [user.uid] : [],
                email: user ? user.email : 'anonim',
                name: finalName,
                photo: finalPhoto,
                selectedText: selectedText || null, // State'ten veya argümandan
                likes: []
            };

            await addDoc(collection(db, "comments"), newFeedback);

            // Mesaj Türüne Göre Bildirim
            const isReport = ['bug', 'typo'].includes(category);
            let successMsg = "";

            if (status === 'approved') {
                successMsg = isReport ? "Bildiriminiz alındı. Teşekkürler!" : "Yorumunuz yayınlandı!";
            } else {
                successMsg = "Yorumunuz editör onayına gönderildi. Teşekkürler!";
            }

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
