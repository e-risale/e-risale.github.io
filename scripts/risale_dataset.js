const fs = require('fs').promises;
const path = require('path');

// --- AYARLAR ---
// Windows yollarında ters slash (\) kaçış karakteri olduğu için çift (\\) kullanıyoruz
const ORIGINAL_DIR = "C:\\Users\\canbe\\Documents\\risale-proje\\sozler-kitabi\\src\\data\\chapters\\sozler";
const LABELED_DIR = "C:\\Users\\canbe\\Documents\\risale-proje\\sozler-kitabi\\src\\data\\risale\\sozler";
const OUTPUT_FILE = "risale_finetune_dataset.jsonl";

// Modele verilecek sabit emir (Instruction)
const SYSTEM_PROMPT = "Aşağıdaki Risale-i Nur metnini, Osmanlıca kelimeleri [[kelime|kısa_anlam|uzun_anlam]] formatında etiketleyerek işle. Türkçe kelimeleri ve cümle yapısını asla değiştirme.";

// Metni temizleme ve gereksiz boşlukları alma fonksiyonu
function cleanText(text) {
    if (!text) return "";
    return text.trim();
}

// Metni paragraflara bölme ve filtreleme fonksiyonu
function splitIntoParagraphs(text) {
    if (!text) return [];
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10); // 10 karakterden kısa satırları (başlık vs) atla
}

async function createDataset() {
    const dataset = [];
    let totalParagraphs = 0;
    let totalPages = 0;

    console.log("İşlem başlıyor...");

    // sozler_1.json'dan sozler_33.json'a kadar döngü
    for (let i = 1; i <= 33; i++) {
        const filename = `sozler_${i}.json`;
        const orgPath = path.join(ORIGINAL_DIR, filename);
        const lblPath = path.join(LABELED_DIR, filename);

        try {
            // Dosyaların varlığını kontrol et
            await fs.access(orgPath);
            await fs.access(lblPath);
        } catch (error) {
            console.log(`UYARI: ${filename} bulunamadı veya erişilemedi, geçiliyor.`);
            continue;
        }

        console.log(`İşleniyor: ${filename}...`);

        try {
            // Dosyaları oku ve JSON parse et
            const orgContent = await fs.readFile(orgPath, 'utf8');
            const lblContent = await fs.readFile(lblPath, 'utf8');

            const orgData = JSON.parse(orgContent);
            const lblData = JSON.parse(lblContent);

            // Etiketli veriyi pageId'ye göre hızlı erişim için Map'e çevir
            const lblMap = new Map();
            if (Array.isArray(lblData)) {
                lblData.forEach(item => {
                    if (item.pageId) {
                        lblMap.set(item.pageId, item.rawText);
                    }
                });
            } else if (lblData.fullContent && Array.isArray(lblData.fullContent)) {
                // Eğer senin JSON yapın { fullContent: [...] } şeklindeyse burası çalışır
                lblData.fullContent.forEach(item => {
                    if (item.pageId) {
                        lblMap.set(item.pageId, item.rawText);
                    }
                });
            }

            // Orijinal veriyi döngüye al (input kaynağı)
            const sourceData = Array.isArray(orgData) ? orgData : (orgData.fullContent || []);

            for (const orgItem of sourceData) {
                const pId = orgItem.pageId;
                const orgTextRaw = orgItem.rawText || "";

                // Eğer bu sayfa numarası etiketli veride varsa ve metin boş değilse
                if (pId && lblMap.has(pId) && cleanText(orgTextRaw)) {
                    const orgText = cleanText(orgTextRaw);
                    const lblText = cleanText(lblMap.get(pId));

                    // --- STRATEJİ: PARAGRAF BÖLME ---
                    const orgParagraphs = splitIntoParagraphs(orgText);
                    const lblParagraphs = splitIntoParagraphs(lblText);

                    // Eğer paragraf sayıları eşitse ve boş değilse -> Paragraf bazlı ekle
                    if (orgParagraphs.length > 0 && orgParagraphs.length === lblParagraphs.length) {
                        for (let k = 0; k < orgParagraphs.length; k++) {
                            dataset.push({
                                instruction: SYSTEM_PROMPT,
                                input: orgParagraphs[k],
                                output: lblParagraphs[k]
                            });
                            totalParagraphs++;
                        }
                    } else {
                        // Eşit değilse veya yapı bozuksa -> Sayfa bazlı ekle (Fallback)
                        // Çok uzun metinleri kontrol etmek için istersen buraya limit koyabilirsin
                        if (orgText.length > 0) {
                            dataset.push({
                                instruction: SYSTEM_PROMPT,
                                input: orgText,
                                output: lblText
                            });
                            totalPages++;
                        }
                    }
                }
            }

        } catch (err) {
            console.error(`HATA: ${filename} işlenirken bir sorun oluştu:`, err.message);
        }
    }

    // Sonucu JSONL dosyasına yaz
    try {
        // Her objeyi string'e çevirip alt alta ekliyoruz (JSONL formatı)
        const fileContent = dataset.map(entry => JSON.stringify(entry)).join('\n');
        await fs.writeFile(OUTPUT_FILE, fileContent, 'utf8');

        console.log("\n--- İŞLEM TAMAMLANDI ---");
        console.log(`Paragraf bazlı örnek sayısı: ${totalParagraphs}`);
        console.log(`Sayfa bazlı (yedek) örnek sayısı: ${totalPages}`);
        console.log(`Toplam eğitim verisi: ${dataset.length}`);
        console.log(`Dosya kaydedildi: ${path.resolve(OUTPUT_FILE)}`);

    } catch (err) {
        console.error("Dosya yazma hatası:", err);
    }
}

// Scripti çalıştır
createDataset();