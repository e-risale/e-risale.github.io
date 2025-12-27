import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, deleteDoc, doc, updateDoc, query, orderBy, onSnapshot, getDocs, writeBatch, where, serverTimestamp } from 'firebase/firestore';

export const adminEmails = ["kolay.risale@gmail.com", "turan1971@gmail.com"]; // Admin email listesi - Shared constant

export const useAdmin = (showToast) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminFeedbacks, setAdminFeedbacks] = useState([]);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Admin durumunu dinle (Basit bir kontrol, gerçek projede Auth claim veya DB kullanılmalı)
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setIsAdmin(adminEmails.includes(user.email));
            } else {
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Yorumları ve Bildirimleri Dinle (Sadece adminsel)
    useEffect(() => {
        if (!isAdmin) return;

        setIsAdminLoading(true);
        // Tüm yorumları tarih sırasına göre çek
        // Not: Gerçek zamanlı dinleme (onSnapshot) kullanıyoruz
        const q = query(collection(db, "comments"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fbList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sorting to avoid index issues
            fbList.sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(0);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(0);
                return dateB - dateA;
            });

            setAdminFeedbacks(fbList);
            // new veya unread olanları say
            const unread = fbList.filter(f => f.status === 'unread' || f.status === 'new').length;
            setUnreadCount(unread);
            setIsAdminLoading(false);
        }, (error) => {
            console.error("Veri çekme hatası:", error);
            if (showToast) showToast("Veri çekilemedi: " + error.message, "error");
            setIsAdminLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin, showToast]);

    const handleAdminDeleteFeedback = async (id) => {
        if (!window.confirm("Bu mesajı kalıcı olarak silmek istediğinizden emin misiniz?")) return;
        try {
            await deleteDoc(doc(db, "comments", id));
            if (showToast) showToast("Mesaj silindi.", "success");
        } catch (error) {
            console.error("Silme hatası:", error);
            if (showToast) showToast("Silinirken hata oluştu.", "error");
        }
    };

    const handleAdminMarkRead = async (id) => {
        try {
            await updateDoc(doc(db, "comments", id), { status: 'read' });
            // Toast'a gerek yok, arayüzde anlık değişiyor
        } catch (error) {
            console.error("İşaretleme hatası:", error);
        }
    };

    const handleApprove = async (id) => {
        try {
            await updateDoc(doc(db, "comments", id), { status: 'approved' });
            if (showToast) showToast("Yorum onaylandı ve yayınlandı.", "success");
        } catch (error) {
            console.error("Onay hatası:", error);
            if (showToast) showToast("Onay işleminde hata.", "error");
        }
    };

    const handleArchive = async (id) => {
        try {
            await updateDoc(doc(db, "comments", id), { status: 'archived' });
            if (showToast) showToast("Mesaj arşive gönderildi.", "info");
        } catch (error) {
            console.error("Arşivleme hatası:", error);
        }
    };

    // "Tüm Arşivlenenleri (Çöp Kutusu) Sil" Fonksiyonu
    const handleDeleteArchived = async () => {
        if (!window.confirm("DİKKAT! 'Arşiv' sekmesindeki (Onaylanmayacak) tüm mesajlar kalıcı olarak silinecek. Emin misiniz?")) return;

        try {
            setIsAdminLoading(true);
            const q = query(collection(db, "comments"), where("status", "==", "archived"));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                if (showToast) showToast("Silinecek 'arşivlenmiş' mesaj bulunamadı.", "info");
                return;
            }

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            if (showToast) showToast(`${snapshot.size} adet arşivlenmiş mesaj temizlendi.`, "success");
        } catch (error) {
            console.error("Toplu silme hatası:", error);
            if (showToast) showToast("Bir hata oluştu.", "error");
        } finally {
            setIsAdminLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (adminFeedbacks.length === 0) {
            if (showToast) showToast("İndirilecek veri yok.", "warning");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "ID,Tarih,Kategori,Klasor,Durum,Kullanici,Email,Sayfa,Secilen_Metin,Mesaj,Begeniler\n";

        adminFeedbacks.forEach(fb => {
            const dateStr = fb.date?.toDate ? fb.date.toDate().toLocaleDateString('tr-TR') : "";
            const row = [
                fb.id,
                dateStr,
                fb.category,
                fb.status === 'approved' ? 'Yayında' : fb.status === 'archived' ? 'Arşiv' : fb.status === 'read' ? 'İncelendi' : 'Yeni',
                fb.status,
                `"${fb.name || ''}"`,
                fb.email,
                `"${fb.page || ''}"`,
                `"${(fb.selectedText || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                `"${(fb.feedback || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                fb.likes ? fb.likes.length : 0
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "yorumlar_yedek.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReply = async (id, replyText) => {
        try {
            await updateDoc(doc(db, "comments", id), {
                reply: replyText,
                replyDate: serverTimestamp()
            });
            if (showToast) showToast("Yanıtınız kaydedildi.", "success");
        } catch (error) {
            console.error("Yanıt hatası:", error);
            if (showToast) showToast("Yanıt gönderilemedi.", "error");
        }
    };

    const updateCategory = async (id, newCategory) => {
        try {
            const feedbackRef = doc(db, 'comments', id); // Use 'comments' collection
            await updateDoc(feedbackRef, {
                category: newCategory
            });

            // Optimistically update the local state
            setAdminFeedbacks(prev => prev.map(fb =>
                fb.id === id ? { ...fb, category: newCategory } : fb
            ));

            if (showToast) showToast('Kategori güncellendi.', 'success'); // Use showToast
        } catch (error) {
            console.error('Error updating category:', error);
            if (showToast) showToast('Kategori güncellenemedi.', 'error'); // Use showToast
        }
    };

    return {
        isAdmin,
        adminFeedbacks,
        isAdminPanelOpen,
        setIsAdminPanelOpen,
        isAdminLoading,
        unreadCount,
        handleAdminDeleteFeedback,
        handleAdminMarkRead,
        handleApprove,
        handleArchive,
        handleDeleteArchived,
        handleReply,
        handleExportExcel,
        updateCategory
    };
};

