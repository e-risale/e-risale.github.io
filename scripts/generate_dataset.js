const fs = require('fs');
const path = require('path');

// --- AYARLAR ---
// Dosya yolları
const ORIGINAL_DIR = path.join(__dirname, '..', 'src', 'data', 'chapters', 'sozler');
const LABELED_DIR = path.join(__dirname, '..', 'src', 'data', 'risale', 'sozler');
const OUTPUT_FILE = path.join(__dirname, 'risale_finetune_dataset.jsonl');

const SYSTEM_PROMPT = "Aşağıdaki Risale-i Nur metnini, Osmanlıca kelimeleri [[kelime|kısa_anlam|uzun_anlam]] formatında etiketleyerek işle. Türkçe kelimeleri ve cümle yapısını asla değiştirme.";

function loadJson(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error(`Hata oluştu - Dosya okunamadı: ${filePath} \n${e.message}`);
        return null;
    }
}

function cleanText(text) {
    if (!text) return "";
    return text.trim();
}

function createDataset() {
    let dataset = [];
    let totalParagraphs = 0;
    let totalPages = 0;

    // sozler_1.json'dan sozler_33.json'a kadar döngü
    for (let i = 1; i <= 33; i++) {
        const filename = `sozler_${i}.json`;
        const orgPath = path.join(ORIGINAL_DIR, filename);
        const lblPath = path.join(LABELED_DIR, filename);

        if (!fs.existsSync(orgPath) || !fs.existsSync(lblPath)) {
            console.log(`UYARI: ${filename} her iki klasörde de bulunamadı, geçiliyor.`);
            continue;
        }

        console.log(`İşleniyor: ${filename}...`);

        const orgData = loadJson(orgPath);
        const lblData = loadJson(lblPath);

        if (!orgData || !lblData) continue;

        // Labeled veriyi pageId'ye göre hızlı erişim için haritala
        const lblMap = {};
        lblData.forEach(item => {
            if (item.pageId) lblMap[item.pageId] = item.rawText;
        });

        // Orginal veriyi işle
        orgData.forEach(orgItem => {
            const pId = orgItem.pageId;
            const orgText = cleanText(orgItem.rawText || "");

            if (pId && lblMap[pId] && orgText) {
                const lblText = cleanText(lblMap[pId]);

                // --- STRATEJİ: PARAGRAF BÖLME ---
                const orgParagraphs = orgText.split('\n').filter(p => p.trim().length > 10);
                const lblParagraphs = lblText.split('\n').filter(p => p.trim().length > 10);

                // Eğer paragraf sayıları eşitse, PARAGRAF eşleşmesi yap
                if (orgParagraphs.length === lblParagraphs.length && orgParagraphs.length > 0) {
                    for (let k = 0; k < orgParagraphs.length; k++) {
                        const entry = {
                            "instruction": SYSTEM_PROMPT,
                            "input": orgParagraphs[k].trim(),
                            "output": lblParagraphs[k].trim()
                        };
                        dataset.push(entry);
                        totalParagraphs++;
                    }
                } else {
                    // Paragraf sayıları tutmuyorsa SAYFA bazlı al
                    const entry = {
                        "instruction": SYSTEM_PROMPT,
                        "input": orgText,
                        "output": lblText
                    };
                    dataset.push(entry);
                    totalPages++;
                }
            }
        });
    }

    // JSONL olarak kaydet
    const stream = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf-8' });
    dataset.forEach(entry => {
        stream.write(JSON.stringify(entry) + '\n');
    });
    stream.end();

    console.log(`\n--- İŞLEM TAMAMLANDI ---`);
    console.log(`Paragraf bazlı örnek sayısı: ${totalParagraphs}`);
    console.log(`Sayfa bazlı (fallback) örnek sayısı: ${totalPages}`);
    console.log(`Toplam eğitim verisi: ${dataset.length}`);
    console.log(`Dosya kaydedildi: ${OUTPUT_FILE}`);
}

createDataset();
