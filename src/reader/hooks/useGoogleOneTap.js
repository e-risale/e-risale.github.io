import { useEffect } from 'react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../firebase';

const useGoogleOneTap = (user) => {
    useEffect(() => {
        // Eğer kullanıcı zaten giriş yapmışsa veya script zaten yüklendiyse dur
        if (user) return;

        const handleCredentialResponse = (response) => {
            const credential = GoogleAuthProvider.credential(response.credential);
            signInWithCredential(auth, credential)
                .then((result) => {
                    // One Tap Login Success
                })
                .catch((error) => {
                    console.error("One Tap Login Error:", error);
                });
        };

        const loadGoogleScript = () => {
            const scriptId = 'google-one-tap-script';
            const existingScript = document.getElementById(scriptId);

            if (existingScript) return;

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.id = scriptId;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google) {
                    window.google.accounts.id.initialize({
                        client_id: "468330555648-6bipjs38pbn12mk8ph0pkqblg46gaqru.apps.googleusercontent.com",
                        callback: handleCredentialResponse,
                        auto_select: true, // Otomatik seçimi dener
                        cancel_on_tap_outside: false // Dışarı tıklayınca kapanmasın
                    });

                    // Sağ üstte değil de, direkt prompt olarak göster
                    window.google.accounts.id.prompt((notification) => {
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                            // Kullanıcı pencereyi kapatmış olabilir veya desteklenmiyor olabilir
                        }
                    });
                }
            };
            document.body.appendChild(script);
        };

        loadGoogleScript();

        return () => {
            // Cleanup gerekirse buraya
        };
    }, [user]);
};

export default useGoogleOneTap;
