import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../reader/context/ToastContext';
import emailjs from '@emailjs/browser';
import { CONFIG } from '../config';

export default function UpdatesManager({ onBack, darkMode }) {
    const { showToast } = useToast();
    const [view, setView] = useState('updates'); // 'updates' or 'subscribers'

    // Updates State
    const [updates, setUpdates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Subscribers State
    const [subscribers, setSubscribers] = useState([]);
    const [isLoadingSubs, setIsLoadingSubs] = useState(false);

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        desc: '',
        type: 'feature',
        date: new Date().toISOString().split('T')[0],
        link: '',
        actionText: 'Görüntüle'
    });

    const [sendEmail, setSendEmail] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (view === 'updates') {
            fetchUpdates();
        } else {
            fetchSubscribers();
        }
    }, [view]);

    // --- FETCH FUNCTIONS ---
    const fetchUpdates = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "updates"), orderBy("date", "desc"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUpdates(data);
        } catch (error) {
            console.error("Error fetching updates:", error);
            showToast("Duyurular çekilemedi.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubscribers = async () => {
        setIsLoadingSubs(true);
        try {
            // orderBy tarih varsa kullanılır, yoksa default gelir.
            // Abonelerde 'date' alanı güvenilir olmayabilir (serverTimestamp), try-catch ile koruyalım
            let q = collection(db, "subscribers");
            // const q = query(collection(db, "subscribers"), orderBy("date", "desc")); 

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    email: d.email,
                    date: d.date?.toDate ? d.date.toDate().toLocaleDateString('tr-TR') : 'Tarih Yok'
                };
            });
            setSubscribers(data);
        } catch (error) {
            console.error("Error fetching subscribers:", error);
            if (error.code === 'permission-denied') {
                showToast("Yetki hatası! Firestore Rules kontrol edilmeli.", "error");
            } else {
                showToast("Aboneler çekilemedi.", "error");
            }
        } finally {
            setIsLoadingSubs(false);
        }
    };

    // --- ACTIONS ---
    const handleDeleteSubscriber = async (id, email) => {
        if (!window.confirm(`${email} abonesini silmek istiyor musunuz?`)) return;
        try {
            await deleteDoc(doc(db, "subscribers", id));
            setSubscribers(prev => prev.filter(s => s.id !== id));
            showToast("Abone silindi.", "success");
        } catch (error) {
            console.error(error);
            showToast("Silinemedi.", "error");
        }
    };

    const handleSendNewsletter = async (subject, message) => {
        setIsSending(true);
        try {
            // 1. Aboneleri taze çek
            const snapshot = await getDocs(collection(db, "subscribers"));
            if (snapshot.empty) {
                showToast("Hiç abone bulunamadı.", "warning");
                setIsSending(false);
                return;
            }

            const emails = snapshot.docs.map(doc => doc.data().email);
            // Unique emails (Mükerrer varsa temizle)
            const uniqueEmails = [...new Set(emails)]; // Javascript SET ile duplicate önle

            console.log("Sending to:", uniqueEmails.length, "recipients");

            // 2. EmailJS - TEK TEK GÖNDERİM
            // Toplu gönderim yerine loop kullanıyoruz çünkü ücretsiz plan veya basit config
            // virgülle ayrılmış listeyi desteklemeyebiliyor.
            // Promise.all ile paralel atıyoruz.
            const sendPromises = uniqueEmails.map(email => {
                const templateParams = {
                    to_email: email,
                    subject: subject,
                    message: message
                };

                return emailjs.send(
                    CONFIG.EMAILJS_CONFIG.SERVICE_ID,
                    CONFIG.EMAILJS_CONFIG.TEMPLATE_ID,
                    templateParams,
                    CONFIG.EMAILJS_CONFIG.PUBLIC_KEY
                ).catch(err => {
                    console.error(`Failed to send to ${email}`, err);
                    return null; // Bir hata tüm süreci bozmasın
                });
            });

            await Promise.all(sendPromises);

            showToast(`${uniqueEmails.length} aboneye bildirim iletildi.`, "success");

        } catch (error) {
            console.error("Mail gönderme hatası:", error);
            showToast("Mail gönderme süreci başarısız oldu: " + error.text, "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUpdate) {
                const docRef = doc(db, "updates", editingUpdate.id);
                await updateDoc(docRef, { ...formData });
                showToast("Duyuru güncellendi!", "success");
            } else {
                await addDoc(collection(db, "updates"), {
                    ...formData,
                    createdAt: serverTimestamp()
                });
                showToast("Yeni duyuru eklendi!", "success");

                if (sendEmail) {
                    await handleSendNewsletter(
                        `Yeni Güncelleme: ${formData.title}`,
                        `${formData.desc}\n\nDetaylar için: https://e-risale.github.io/\n\n---\nBu mesajı bülten üyemiz olduğunuz için aldınız. Ayrılmak için siteye giriş yapıp bülten alanından üyeliğinizi sonlandırabilirsiniz.`
                    );
                }
            }
            setIsModalOpen(false);
            setEditingUpdate(null);
            resetForm();
            fetchUpdates();
        } catch (error) {
            console.error("Error saving update:", error);
            showToast("Kaydedilemedi: " + error.message, "error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) return;
        try {
            await deleteDoc(doc(db, "updates", id));
            setUpdates(prev => prev.filter(u => u.id !== id));
            showToast("Duyuru silindi.", "info");
        } catch (error) {
            console.error("Error deleting update:", error);
            showToast("Silinemedi!", "error");
        }
    };

    const handleEdit = (update) => {
        setEditingUpdate(update);
        setFormData({
            title: update.title,
            desc: update.desc,
            type: update.type,
            date: update.date,
            link: update.link || '',
            actionText: update.actionText || 'Görüntüle'
        });
        setSendEmail(false);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingUpdate(null);
        resetForm();
        setSendEmail(true);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            desc: '',
            type: 'feature',
            date: new Date().toISOString().split('T')[0],
            link: '',
            actionText: 'Görüntüle'
        });
        setSendEmail(false);
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-[#1a1b1e] text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
            {/* Header */}
            <header className={`sticky top-0 z-30 border-b transition-colors duration-300 ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className={`p-2 -ml-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">İçerik Yönetimi</h1>
                            <div className="flex gap-4 mt-1">
                                <button
                                    onClick={() => setView('updates')}
                                    className={`text-sm font-medium border-b-2 transition-colors ${view === 'updates' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-500'}`}
                                >
                                    Duyurular
                                </button>
                                <button
                                    onClick={() => setView('subscribers')}
                                    className={`text-sm font-medium border-b-2 transition-colors ${view === 'subscribers' ? 'border-amber-500 text-amber-500' : 'border-transparent text-gray-500'}`}
                                >
                                    Aboneler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">

                {/* --- UPDATES VIEW --- */}
                {view === 'updates' && (
                    <>
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={handleAddNew}
                                className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-sm transition-colors"
                            >
                                + Yeni Duyuru Ekle
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-12">Yükleniyor...</div>
                        ) : updates.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">Henüz duyuru eklenmemiş.</div>
                        ) : (
                            <div className="space-y-4">
                                {updates.map(update => (
                                    <div key={update.id} className={`p-4 rounded-xl border flex justify-between items-start group ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${update.type === 'book' ? 'bg-blue-900/30 text-blue-300 border-blue-800' :
                                                    update.type === 'feature' ? 'bg-purple-900/30 text-purple-300 border-purple-800' :
                                                        'bg-green-900/30 text-green-300 border-green-800'
                                                    }`}>
                                                    {update.type === 'book' ? 'KİTAP' : update.type === 'feature' ? 'ÖZELLİK' : 'DUYURU'}
                                                </span>
                                                <span className="text-xs text-gray-500">{update.date}</span>
                                            </div>
                                            <h3 className="font-bold text-lg mb-1">{update.title}</h3>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{update.desc}</p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(update)} className="p-2 hover:bg-blue-100 text-blue-600 rounded">✎</button>
                                            <button onClick={() => handleDelete(update.id)} className="p-2 hover:bg-red-100 text-red-600 rounded">🗑</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* --- SUBSCRIBERS VIEW --- */}
                {view === 'subscribers' && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Bülten Aboneleri ({subscribers.length})</h2>
                            <button
                                onClick={() => navigator.clipboard.writeText(subscribers.map(s => s.email).join(', ')).then(() => showToast("Liste kopyalandı", "success"))}
                                className={`px-3 py-1.5 text-sm rounded border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-100'}`}
                            >
                                Listeyi Kopyala
                            </button>
                        </div>

                        {isLoadingSubs ? (
                            <div className="text-center py-12">Yükleniyor...</div>
                        ) : subscribers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-gray-50/5 rounded-xl border border-dashed border-gray-500/20">
                                <p>Henüz abone yok.</p>
                                <p className="text-xs mt-2 opacity-60">Not: Eğer deneme yaptıysanız ve burası boşsa, Firebase Rules ayarlarını kontrol edin.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {subscribers.map((sub) => (
                                    <div key={sub.id} className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs">
                                                {sub.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{sub.email}</p>
                                                <p className="text-xs opacity-50">{sub.date}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                                            className="text-red-500 hover:bg-red-500/10 p-2 rounded text-xs"
                                        >
                                            Sil
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* MODAL (Only used for Updates) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
                    <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl ${darkMode ? 'bg-[#1a1b1e]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">{editingUpdate ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Ekle'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 opacity-70">Başlık</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 opacity-70">Açıklama</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.desc}
                                    onChange={e => setFormData({ ...formData, desc: e.target.value })}
                                    className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-70">Tür</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        <option value="feature">Özellik</option>
                                        <option value="book">Kitap</option>
                                        <option value="announcement">Duyuru</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-70">Tarih</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none ${darkMode ? 'bg-[#25262b] border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                    />
                                </div>
                            </div>

                            {/* SEND EMAIL CHECKBOX */}
                            {!editingUpdate && (
                                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                                    <input
                                        type="checkbox"
                                        id="sendEmail"
                                        checked={sendEmail}
                                        onChange={e => setSendEmail(e.target.checked)}
                                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                                    />
                                    <label htmlFor="sendEmail" className="text-sm font-medium cursor-pointer select-none">
                                        Bülten Abonelerine Bildirim Gönder ({isSending ? 'Gönderiliyor...' : 'E-posta'})
                                    </label>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">İptal</button>
                                <button type="submit" disabled={isSending} className="px-6 py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors flex items-center gap-2">
                                    {isSending && <span className="animate-spin text-white">⌛</span>}
                                    {isSending ? 'Gönderiliyor' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
