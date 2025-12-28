// src/config.js

// --- MESAJ AYARLARI---
export const CONFIG = {
  BATCH_SIZE: 5, // Vagon Sayısı (Buradan değiştirebilirsiniz)
  MESSAGE_LIMIT_PER_CHAPTER: 10,
  REPLY_LIMIT_PER_CHAPTER: 50,
  BAD_WORDS: ["amına", "mamına", "korum", "koduğumun", "kodumun", "aptal", "salak", "gerizekalı", "mal", "dangalak", "ahmak", "kafasız", "öküz", "yavşak", "piç", "göt", "amk", "aq", "sik", "siktir", "sikerim", "yarrak", "yarrağım", "oç", "kahpe", "fahişe"], // Genişletilebilir liste

  // --- ADMIN EMAIL CONFIG ---
  ADMIN_EMAIL_CONFIG: {
    recipients: ["kolay.risale@gmail.com"], // Mail gönderilecek adminler
    dailyLimit: 5, // Günde en fazla kaç mail gönderilecek
    minIntervalHours: 2 // İki mail arası en az kaç saat olmalı (Opsiyonel kontrol)
  }
};

// --- READER CONFIG ---
// Bu kelimeler RawText (Orijinal) modunda otomatik başlık algılama için kullanılır.
// Mantık:
// 1. Satır bir Sıra Sayısı (Birinci, İkinci...) ile başlayıp bu kelimelerden biriyle BİTİYORSA (Örn: "Birinci Söz")
// 2. VEYA Satır SADECE bu kelimeden oluşuyorsa (Örn: "KONFERANS", "MUKADDİME")
// Başlık olarak formatlanır.
export const READER_CONFIG = {
  H1_KEYWORDS: [
    // Major Sections (Büyük Başlıklar - H1)
    "Söz", "Mektup", "Lem'a", "Lemaat", "Şua", "Mesnevî", "İşarat", "Lahika", "Müdafaa", "KONFERANS"
  ],
  H2_KEYWORDS: [
    // Sub Sections (Alt Başlıklar - H2)
    "Sır", "Nükte", "İşaret", "Mesele", "Makam", "Maksat", "Misal", "İhtar", "Zeyl", "Hatime", "Mukaddime", "Sual", "Elcevap", "Bölüm"
  ],
  BOLD_KEYWORDS: [
    // Otomatik Kalın Yapılacak Kelimeler (Exact Match)
    "Sual:", "Elcevap:", "Diyorsun ki:", "Eğer desen:", "Dedi:", "Netice:", "Hülâsa:"
  ]
};

// --- MODELLER ---
export const AVAILABLE_MODELS = [
  { id: "gemini-3-pro-preview", name: "🧠 Gemini 3 Pro (Preview)" },
  { id: "gemini-3-flash-preview", name: "⚡ Gemini 3 Flash (Preview)" },
  { id: "gemini-2.5-pro", name: "🚀 Gemini 2.5 Pro (API)" },
  { id: "gemini-2.5-flash", name: "⚡ Gemini 2.5 Flash (API)" },
  { id: "gemini-2.5-flash-lite", name: "🪶 Gemini 2.5 Lite (API)" },
  { id: "gemini-2.0-flash-exp", name: "🧪 Gemini 2.0 Flash (Exp)" },
  { id: "gemini-2.0-pro-exp", name: "🧪 Gemini 2.0 Pro (Exp)" },
  { id: "gemini-3-pro-web", name: "🧠 Gemini 3 Pro (Web - Manuel)" },
  { id: "gemini-2.5-flash-web", name: "🌐 Gemini 2.5 Flash (Web - Manuel)" }
];

// --- ORTAK KURALLAR (ANAYASA) ---
// Burayı değiştirdiğinizde hem Web hem API promptu değişir.
const COMMON_RULES = `
- Sen, Risale-i Nur Külliyatı'na ve Osmanlı Türkçesi lügatına tam hakimiyeti olan, kelimelerin hem etimolojik kökenlerini hem de ıstılahi (terimsel) derinliklerini bilen uzman bir editör ve filologsun.
1.EN ÜST VE DEĞİŞMEZ KURAL (KRİTİK):
-Orijinal metin KESİNLİKLE DEĞİŞTİRİLMEYECEK.
-Cümle yapısı, kelime sırası, paragraf düzeni, satır başları, büyük/küçük harfler, noktalama işaretleri ve imla birebir korunacak.
-Metne hiçbir yorum, özet, açıklama veya dış bilgi eklenmeyecek.
-Sadece belirlenen kelimeler, belirlenen formatla yerinde ETİKETLENECEK.

2.TEMEL AMAÇ:
-Metnin içindeki Osmanlıca, Arapça ve Farsça kelime veya tamlamaları tespit et.
-Bu kelimeleri metnin akışını bozmadan, sadece yerlerine aşağıdaki formatı koyarak etiketle.

3.ZORUNLU ETİKETLEME FORMATI:
-HEDEF FORMAT: [[orjinal_kelime|kısa_bağlam_anlamı|uzun_detaylı_anlam]]
-Eğer uzun açıklamaya gerek yoksa: [[orjinal_kelime|kısa_anlam]]
-Açıklamalar:
--orjinal_kelime: Metinde geçtiği şekliyle, harfi harfine.
--kısa_bağlam_anlamı: Kelimenin o cümledeki anlamı.
--uzun_detaylı_anlam: Gerekliyse eş anlamlar, kavramsal çerçeve, kısa izah.

4.METİN BÜTÜNLÜĞÜ VE YAPI KURALLARI:
-Cümleleri ve paragrafları ASLA birleştirme veya bölme.
-Satır başlarını, boşlukları ve paragraf yapısını aynen koru.
-Cümle başındaki BÜYÜK HARFLER orijinalde nasılsa öyle kalacak.
-Nokta, virgül, üç nokta, yıldız, dipnot işareti vb. asla silinmeyecek.

5.BAĞLAM VE ANLAM KURALI (ÇOK ÖNEMLİ):
-Kelimelerin sözlük anlamını değil, sadece o cümledeki bağlama uygun anlamını yaz.
-Gerekirse uzun anlam kısmında eş anlamlıları ve açıklamaları belirt.

6.BİRLEŞİK FİİLLER (KRİTİK DİLBİLGİSİ KURALI):
-“etmek, eylemek, olmak, kılmak” gibi yardımcı fiillerle kurulan yapıları ASLA AYIRMA.
-Bu yapıları tek bir fiil grubu olarak etiketle ve günümüz Türkçesindeki fiil karşılığını yaz.
-“Muvâzene etmek”, “nazar eylemek” gibi birleşik fiiller tek grup olacak, parçalanmayacak.

7.ARAPÇA METİNLER (AYET – HADİS – DUA):
-Arap harfleriyle yazılmış ayet, hadis veya duaları ATLAMA.
-Türkçe mealini ekleyerek aynı etiket formatıyla ver.
-Uzun Arapça metinleri tek blok yapma. Her cümleyi ayrı ayrı etiketle. 
-Her kelimeyi veya kelime grubunu ayrı etiketleme. Cümle sonlarından, duraklardan veya virgüllerden böl. 
-Noktalama işaretlerini ve durakları ASLA SİLME.

8.YASAKLI / ETİKETLENMEYECEK KELİMELER:
-Günümüz Türkçesinde çok yaygın ve basit olan kelimeleri ETİKETLEME.
-Örnek: ağaç, yıldız, dünya, güneş, kitap, kalem, gece, kış, soğuk, su, toprak vb.

9.EKLER, İMLA VE BÜYÜK/KÜÇÜK HARF UYUMU (KIRMIZI ÇİZGİ):
-Kelimenin çekim veya yapım eklerine ASLA dokunma.
-Orijinal kelime hangi ekle geldiyse aynen korunacak.
-Harf ekleme, silme veya düzeltme KESİNLİKLE YAPMA.
- Orijinal kelime BÜYÜK HARFLE başlıyorsa, yazdığın anlamın da ilk harfini mutlaka BÜYÜK yap. (Örnek: "Huruf" ise karşılığı "Harfler" olmalı; "harfler" değil.)

10.PARANTEZLER VE NOTLAR:
-Parantez içleri, hâşiyeler ve köşeli parantezler ASLA silinmeyecek.
-(Hâşiye[1]) gibi ifadeler aynen korunacak.

11.ÖLÇÜ BİRİMLERİ:
-Eski ölçü birimleri varsa, kelimeyi etiketlemeden modern karşılığını parantez içinde belirt. Örnek: okkalık (1 okka = 1,28 kg)

12.BAĞLAÇLAR VE GRAMER:
-“ile”, “ve”, “ki” gibi bağlaçları ASLA çıkarma veya değiştirme.

13.GENEL YASAKLAR:
-Metni özetleme.
-Yorum katma.
-Anlam genişletme.
-Cümle sadeleştirme.
-Modern Türkçeyle yeniden yazma.
-Sadece ETİKETLE.
`;

// --- WEB (MANUEL) PROMPT ŞABLONU ---
export const getWebPrompt = (text, pageIndex) => `
Aşağıda verilen Risale-i Nur metninin TAMAMINI, hiçbir eksiltme yapmadan al ve aşağıdaki kurallara HARFİYEN uyarak geri ver.

KURALLAR (LÜTFEN HARFİYEN UY):
${COMMON_RULES}
14.ÇIKTI FORMATI:
-Çıktıyı tek parça halinde ve kolay kopyalanacak Kod Penceresi içinde ver.
-Ek açıklama yazma.
-Sadece işlenmiş metni döndür.

İşlenecek Metin (Sayfa ${pageIndex + 1}):
${text}
`;

// --- API (OTOMATİK) PROMPT ŞABLONU ---
export const getApiPrompt = (jsonInput) => `
Sen uzman bir Osmanlıca editörüsün. Sana JSON formatında bir sayfa listesi veriyorum.
GÖREV: Her bir sayfanın "metin" alanını al, aşağıdaki kurallara göre işle ve yine JSON olarak döndür.

KURALLAR (LÜTFEN HARFİYEN UY):
${COMMON_RULES}
(JSON KURALI) SADECE ve SADECE SAF, GEÇERLİ JSON formatı döndür.
    - Kesinlikle yorum satırı ekleme (// veya /* ... */ yasak).
    - Anahtarları (keys) mutlaka çift tırnak içine al ("key": ...).
    - Son elemandan sonra virgül koyma (Trailing comma yasak).
    - Markdown (\`\`\`json) kullanabilirsin ama içindeki veri saf JSON olmalı.

GİRDİ (JSON):
${jsonInput}

İSTENEN ÇIKTI FORMATI (JSON):
{
  "sayfalar": [
    {
      "id": "0",
      "metin": "İşlenmiş metin..."
    }
  ]
}
`;