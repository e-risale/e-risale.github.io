import { db } from '../firebase';
import { doc, setDoc, increment, serverTimestamp, collection, query, orderBy, limit, getDocs, addDoc } from "firebase/firestore";

const COLLECTION_NAME = "analytics_daily";

const getTodayDocId = () => {
    const now = new Date();
    // Use local YYYY-MM-DD
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const logVisit = async (user = null) => {
    try {
        const today = getTodayDocId();
        const sessionStorageKey = `risale_visit_${today}`;

        // DEV: Localhost or No Session
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

        // We log if it's a new session OR if we haven't logged a user-specific visit yet (optional refinement)
        // For now, stick to 1 visit per session logic, but capture user info if available.
        if (isLocal || !sessionStorage.getItem(sessionStorageKey)) {
            sessionStorage.setItem(sessionStorageKey, 'true');

            // 1. Fetch IP & Location
            let visitorData = { ip: 'Gizli', location: { city: 'Bilinmiyor', country: 'Bilinmiyor', region: '' } };

            try {
                const res = await fetch('https://ipapi.co/json/');
                if (res.ok) {
                    const json = await res.json();
                    visitorData = {
                        ip: json.ip,
                        location: {
                            city: json.city || 'Bilinmiyor',
                            country: json.country_name || 'Bilinmiyor',
                            region: json.region || ''
                        }
                    };
                } else {
                    // Fallback to just IP
                    const res2 = await fetch('https://api.ipify.org?format=json');
                    if (res2.ok) {
                        const json2 = await res2.json();
                        visitorData.ip = json2.ip;
                    }
                }
            } catch (err) {
                console.warn("Location fetch failed", err);
            }

            console.log("📊 Analytics: Ziyaretçi kaydediliyor...", visitorData.ip);

            // 2. Update Aggregates
            const dailyRef = doc(db, COLLECTION_NAME, today);
            await setDoc(dailyRef, {
                date: today,
                visitors: increment(1),
                last_updated: serverTimestamp()
            }, { merge: true });

            // 3. Add Detail Record with Location
            const visitsRef = collection(db, COLLECTION_NAME, today, "visits");
            await addDoc(visitsRef, {
                timestamp: serverTimestamp(),
                ip: visitorData.ip,
                location: visitorData.location,
                userAgent: navigator.userAgent,
                user: user ? {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName,
                    photo: user.photoURL
                } : null,
                platform: navigator.platform
            });

            console.log("✅ Analytics: Ziyaret detayları kaydedildi.");
        } else {
            console.log("ℹ️ Analytics: Oturum zaten aktif.");
        }
    } catch (e) {
        console.error("❌ Analytics Ziyaret Hatası:", e);
    }
};

export const logPageView = async (bookId, chapterIndex) => {
    if (!bookId) return;
    try {
        const today = getTodayDocId();
        const docRef = doc(db, COLLECTION_NAME, today);
        const pageKey = `${bookId}_${chapterIndex}`;

        await setDoc(docRef, {
            date: today,
            total_views: increment(1),
            page_stats: {
                [pageKey]: increment(1)
            },
            last_updated: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.error("❌ Analytics Sayfa Hatası:", e);
    }
};

export const getStats = async (days = 30) => {
    try {
        const ref = collection(db, COLLECTION_NAME);
        const q = query(ref, orderBy("date", "desc"), limit(days));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    } catch (e) {
        console.error("❌ Stats Fetch Error:", e);
        return [];
    }
};

// New: Fetch detailed visits for a specific date
export const getDailyVisits = async (dateId) => {
    try {
        const ref = collection(db, COLLECTION_NAME, dateId, "visits");
        const q = query(ref, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("❌ Daily Visits Fetch Error:", e);
        return [];
    }
};
