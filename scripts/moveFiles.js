const fs = require('fs');
const path = require('path');
const os = require('os');

// --- AYARLAR ---
// Windows İndirilenler Klasörünü Bul
const downloadsDir = path.join(os.homedir(), 'Downloads');

// Hedef Klasör (Projenin içindeki src/data/sozler)
// __dirname scripts klasörüdür, iki kere yukarı çıkıp src/data/sozler'e gidiyoruz.
const targetDir = path.join(__dirname, '..', 'src', 'data', 'sozler');

// Taşınacak Dosya Deseni (Sadece bu isimle başlayanları alır)
const filePattern = /^sozler_\d+\.json$/; // Örn: sozler_1.json, sozler_33.json

// --- İŞLEM ---
console.log(`📂 Kaynak: ${downloadsDir}`);
console.log(`📂 Hedef:  ${targetDir}`);
console.log('--------------------------------------------------');

// Klasörleri kontrol et
if (!fs.existsSync(targetDir)) {
    console.error(`❌ Hata: Hedef klasör bulunamadı: ${targetDir}`);
    process.exit(1);
}

// İndirilenler klasörünü oku
fs.readdir(downloadsDir, (err, files) => {
    if (err) {
        console.error("❌ İndirilenler klasörü okunamadı:", err);
        return;
    }

    let movedCount = 0;

    files.forEach(file => {
        // Eğer dosya ismi bizim formatımıza uyuyorsa (sozler_1.json gibi)
        if (filePattern.test(file)) {
            const sourcePath = path.join(downloadsDir, file);
            const destPath = path.join(targetDir, file);

            try {
                // Dosyayı taşı (Eğer varsa üzerine yazar)
                // Not: Windows'ta rename, farklı diskler arası çalışmayabilir, copy+unlink daha güvenlidir ama genelde çalışır.
                fs.copyFileSync(sourcePath, destPath); // Kopyala
                fs.unlinkSync(sourcePath); // Eskisini sil (İndirilenleri temizle)

                console.log(`✅ Taşındı: ${file}`);
                movedCount++;
            } catch (moveErr) {
                console.error(`❌ Hata (${file}):`, moveErr.message);
            }
        }
    });

    console.log('--------------------------------------------------');
    if (movedCount === 0) {
        console.log("⚠️  İndirilenler klasöründe taşınacak 'sozler_X.json' dosyası bulunamadı.");
    } else {
        console.log(`🎉 Toplam ${movedCount} dosya başarıyla güncellendi!`);
        console.log("👉 Değişiklikleri görmek için sayfayı yenilemeyi unutma.");
    }
});