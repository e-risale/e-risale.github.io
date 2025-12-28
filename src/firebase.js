import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: "risale-feedback.firebaseapp.com",
    projectId: "risale-feedback",
    storageBucket: "risale-feedback.firebasestorage.app",
    messagingSenderId: "468330555648",
    appId: "1:468330555648:web:671448985c86d31c25abe5",
    measurementId: "G-HB9CYTZE9S"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Giriş Hatası:", error);
    }
};

export const logout = () => signOut(auth);

// Mesaj Gönderme
export const sendFeedback = async (user, text, pageInfo, category) => {
    return await addDoc(collection(db, "feedbacks"), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        feedback: text,
        page: pageInfo,
        category: category || "general",
        status: 'new',
        date: serverTimestamp()
    });
};

// Spam Kontrolü (Kota)
export const checkUserFeedbackLimit = async (uid, pageInfo) => {
    try {
        const q = query(
            collection(db, "feedbacks"),
            where("uid", "==", uid),
            where("page", "==", pageInfo)
        );
        const snapshot = await getDocs(q);
        return snapshot.size < 3;
    } catch (error) {
        console.error("Limit kontrol hatası:", error);
        return true;
    }
};

// Tüm mesajları çek
export const getAllFeedbacks = async () => {
    try {
        const q = query(collection(db, "feedbacks"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Veri çekme hatası:", error);
        return [];
    }
};

// Mesaj sil
export const deleteFeedback = async (id) => {
    try {
        await deleteDoc(doc(db, "feedbacks", id));
    } catch (error) {
        console.error("Silme hatası:", error);
    }
};

// Tümünü Sil (Batch)
export const deleteAllFeedbacks = async () => {
    try {
        const q = query(collection(db, "feedbacks"));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        return true;
    } catch (error) {
        console.error("Toplu silme hatası:", error);
        return false;
    }
};

// Durum güncelle
export const updateFeedbackStatus = async (id, newStatus) => {
    try {
        await updateDoc(doc(db, "feedbacks", id), {
            status: newStatus
        });
    } catch (error) {
        console.error("Güncelleme hatası:", error);
    }
};

// --- YAYIN YÖNETİMİ (PUBLICATION MANAGEMENT) ---

// Yayın durumunu getir
export const getPublicationStatus = async () => {
    try {
        const docRef = doc(db, "config", "publication");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().published || {};
        }
        return {};
    } catch (error) {
        console.error("Yayın durumu çekilemedi:", error);
        return {};
    }
};

// Yayın durumunu kaydet
export const savePublicationStatus = async (statusMap) => {
    try {
        await setDoc(doc(db, "config", "publication"), {
            published: statusMap,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Yayın durumu kaydedilemedi:", error);
        return false;
    }
};