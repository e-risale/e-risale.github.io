const fs = require('fs');
const path = require('path');

// AYARLAR
const MAX_CHUNK_SIZE = 3800; // Parça boyutu limiti (Karakter)
const INPUT_DIR = './raw_texts'; // Kaynak klasör kökü
const OUTPUT_DIR = './src/data/chapters'; // Çıktı klasörü kökü

// Gerekli klasörleri kontrol et ve oluştur
if (!fs.existsSync(INPUT_DIR)) {
    console.log(`❌ '${INPUT_DIR}' klasörü bulunamadı!`);
    process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Türkçe karakter dönüşüm haritası
const trMap = {
    'ğ': 'g', 'Ğ': 'g',
    'ü': 'u', 'Ü': 'u',
    'ş': 's', 'Ş': 's',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ç': 'c', 'Ç': 'c',
    'â': 'a', 'Â': 'a',
    'î': 'i', 'Î': 'i',
    'û': 'u', 'Û': 'u'
};

function cleanString(str) {
    return str
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .replace(/[^a-zA-Z0-9]/g, '_') // Sadece harf ve rakam, gerisi alt çizgi
        .replace(/_+/g, '_')           // Tekrarlayan alt çizgileri temizle
        .toLowerCase();
}

// Dosya isimlendirme mantığı
function generateSafeFileName(originalName) {
    // Örnek Format: "Mektubat-01-Birinci Mektup" -> ["Mektubat", "01", "Birinci Mektup"]
    const parts = originalName.split('-');

    // Eğer format "Kitap-No-Konu" şeklindeyse (en az 2 tire varsa ve 2. parça sayıysa)
    if (parts.length >= 2) {
        // Genelde ortadaki parça numara olur mu? "Mektubat-01-..."
        // Bazen "Sözler-01" gibi olabilir.
        // Basitçe: İlk parçayı (Kitap) ve İkinci parçayı (No) alalım.

        let bookName = cleanString(parts[0]);
        let number = cleanString(parts[1]);

        // Eğer 2. kısım sayı değilse (örn: "Küçük-Kitaplar") o zaman standart temizleme yap
        // Ama user "Mektubat-01-Birinci Mektup" örneğini verdi.
        // Hatta bazen "Lemalar-01-..." olabilir.
        // Biz yine de kontrol edelim, eğer parts[1] sayı gibi duruyorsa formatı uygula.
        if (/^\d+$/.test(parts[1]) || /^\d+$/.test(number.replace(/_/g, ''))) {
            return `${bookName}_${number}`;
        }
    }

    // Format uymuyorsa veya numara yoksa (örn: "14_kucuk_kitaplar" içindekiler)
    // Direkt temizle
    return cleanString(originalName);
}

// Metni parçalara ayıran fonksiyon
function splitTextIntoChunks(text, limit) {
    const chunks = [];
    let currentChunk = "";

    // Windows/Unix satır sonlarını standartlaştır
    const normalizedText = text.replace(/\r\n/g, '\n');
    const paragraphs = normalizedText.split(/\n+/);

    for (let paragraph of paragraphs) {
        paragraph = paragraph.trim();
        if (!paragraph) continue;

        if ((currentChunk.length + paragraph.length) < limit) {
            currentChunk += paragraph + "\n\n";
        } else {
            if (currentChunk) chunks.push(currentChunk.trim());

            if (paragraph.length > limit) {
                let temp = paragraph;
                while (temp.length > 0) {
                    chunks.push(temp.substring(0, limit));
                    temp = temp.substring(limit);
                }
                currentChunk = "";
            } else {
                currentChunk = paragraph + "\n\n";
            }
        }
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
    return chunks;
}

const getCurrentTimestamp = () => new Date().toISOString();

// Recursive klasör tarama fonksiyonu
function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

function processChapters() {
    console.log(`🚀 İşlem başlıyor... Kaynak: ${INPUT_DIR}\n`);

    let fileCount = 0;

    walkDir(INPUT_DIR, (filePath) => {
        if (!filePath.endsWith('.txt')) return;

        // Dosyanın bulunduğu klasörün ismi (örn: raw_texts/02_mektubat/...)
        const parentDir = path.dirname(filePath);
        // raw_texts içindeki göreceli yol (örn: 02_mektubat)
        const relativeDir = path.relative(INPUT_DIR, parentDir);

        // Hedef klasörü oluştur (src/data/chapters/02_mektubat)
        const targetDir = path.join(OUTPUT_DIR, relativeDir);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const fileName = path.basename(filePath, '.txt');
        const safeName = generateSafeFileName(fileName);

        console.log(`Processing: ${relativeDir}/${fileName} -> ${safeName}.json`);

        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const chunks = splitTextIntoChunks(rawContent, MAX_CHUNK_SIZE);

        const editorCompatibleData = chunks.map((chunk, index) => ({
            id: index,
            pageId: index + 1,
            originalIndex: index,
            rawText: chunk,
            oldText: chunk,
            modernText: "",
            lastUpdated: getCurrentTimestamp(),
            processedBy: "Sistem (Import)"
        }));

        const outputPath = path.join(targetDir, `${safeName}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(editorCompatibleData, null, 2), 'utf-8');
        fileCount++;
    });

    console.log(`\n✅ Toplam ${fileCount} dosya başarıyla işlendi ve dönüştürüldü!`);
}

processChapters();