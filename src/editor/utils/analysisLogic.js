
/**
 * Analyzes all pages (chunks) to find consistency issues.
 * @param {Array} pages - Array of chunk objects { rawText: "..." }
 * @param {Object} dictionary - Optional dictionary object for missing word detection
 * @returns {Object} Analysis report { consistency: [], stats: {} }
 */
export const analyzeConsistency = (pages, dictionary) => {
    if (!pages || !Array.isArray(pages)) return { consistency: [], stats: {} };

    const wordUsage = {};
    const detectedPhrases = [];

    // Missing Word Setup
    const missingUsage = {};
    const dictLookup = {};
    if (dictionary) {
        Object.keys(dictionary).forEach(k => {
            dictLookup[k.toLocaleLowerCase('tr')] = k;
        });
    }

    const scanForMissing = (text, pIdx) => {
        if (!dictionary || !text) return;
        const tokens = text.match(/[\p{L}]+/gu);
        if (!tokens) return;

        tokens.forEach(token => {
            const lower = token.toLocaleLowerCase('tr');
            if (dictLookup[lower]) {
                const dictKey = dictLookup[lower];
                if (!missingUsage[dictKey]) missingUsage[dictKey] = { count: 0, pages: new Set() };
                missingUsage[dictKey].count++;
                missingUsage[dictKey].pages.add(pIdx);
            }
        });
    };

    // Casing Check
    const casingIssues = [];

    pages.forEach((page, pageIndex) => {
        const textToAnalyze = page.oldText || "";
        if (!textToAnalyze) return;

        let lastMatchEnd = 0;
        let currentSequence = [];

        // Extract all tags: [[original | short | long]]
        const regex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = regex.exec(textToAnalyze)) !== null) {
            const content = match[1];
            const parts = content.split('|');
            const original = parts[0].trim();
            const short = parts[1] ? parts[1].trim() : "";
            const long = parts[2] ? parts[2].trim() : "";
            const fullTag = match[0];
            const start = match.index;

            // --- CONSISTENCY LOGIC ---
            const key = original.toLowerCase();
            if (!wordUsage[key]) wordUsage[key] = { variants: {}, total: 0, pages: new Set() };
            if (!wordUsage[key].variants[short]) wordUsage[key].variants[short] = { count: 0, longs: new Set() };
            wordUsage[key].variants[short].count++;
            if (long) wordUsage[key].variants[short].longs.add(long);
            wordUsage[key].total++;
            wordUsage[key].pages.add(pageIndex);

            // --- CASING LOGIC ---
            // If Original starts with Upper, Translation MUST start with Upper
            if (original && short) {
                const firstOrig = original.charAt(0);
                const firstShort = short.charAt(0);
                // Check if Original is Uppercase (Turkish support)
                if (/[A-ZÇĞİÖŞÜÂÎÛ]/.test(firstOrig)) {
                    // Check if Translation is Lowercase (Turkish support)
                    if (/[a-zçğıöşüâîû]/.test(firstShort)) {
                        const prevText = textToAnalyze.substring(0, start).trimEnd();
                        const isSentenceStart = prevText.length === 0 || /[\.!\?\n]$/.test(prevText);

                        casingIssues.push({
                            word: original,
                            translation: short,
                            long: long,
                            fullTag: fullTag,
                            pageIndex: pageIndex,
                            isSentenceStart, // Add flag
                            startIndex: start // For precise replacement
                        });
                    }
                }
            }

            // --- PHRASE & MISSING DETECTION LOGIC ---
            const gap = textToAnalyze.substring(lastMatchEnd, start);

            // Check Missing Words in gap
            scanForMissing(gap, pageIndex);

            // Allow space, comma, dot, dash, semicolon
            if (currentSequence.length > 0 && /^[ \t\.,;\-]*$/.test(gap)) {
                currentSequence.push({ word: original, short, long, fullTag });
            } else {
                // If previous sequence had more than 1 item, save it
                if (currentSequence.length > 1) {
                    detectedPhrases.push({ sequence: currentSequence, pageIndex });
                }
                // Start new sequence
                currentSequence = [{ word: original, short, long, fullTag }];
            }
            lastMatchEnd = regex.lastIndex;
        }

        // Process remaining text for missing words
        const remaining = textToAnalyze.substring(lastMatchEnd);
        scanForMissing(remaining, pageIndex);

        // End of loop: check if trailing sequence exists
        if (currentSequence.length > 1) {
            detectedPhrases.push({ sequence: currentSequence, pageIndex });
        }
    });

    // Consolidate Phrases
    const uniquePhrases = {};
    detectedPhrases.forEach(p => {
        const key = p.sequence.map(i => i.word).join(' '); // "Rabbi Rahim"
        if (!uniquePhrases[key]) {
            uniquePhrases[key] = {
                words: p.sequence.map(i => i.word),
                count: 0,
                // We keep one example sequence to use for proposed merged values
                exampleSequence: p.sequence,
                pages: new Set()
            };
        }
        uniquePhrases[key].count++;
        uniquePhrases[key].pages.add(p.pageIndex);
    });

    const sortedPhrases = Object.entries(uniquePhrases)
        .map(([key, data]) => ({
            phrase: key,
            count: data.count,
            words: data.words,
            exampleSequence: data.exampleSequence,
            pages: Array.from(data.pages).sort((a, b) => a - b)
        }))
        .sort((a, b) => b.count - a.count);

    // Filter for Inconsistency: Words with > 1 distinct variant (ignoring case)
    const inconsistentWords = Object.entries(wordUsage)
        .filter(([key, data]) => {
            const variantKeys = Object.keys(data.variants);
            if (variantKeys.length <= 1) return false;
            // Case-insensitive check to distinguish "Yerküre" from "yerküre" (ignored) vs "Yerküre" from "Dünya" (flagged)
            const distinct = new Set(variantKeys.map(v => v.toLocaleLowerCase('tr')));
            return distinct.size > 1;
        })
        .map(([key, data]) => ({
            word: key,
            // Convert variants object to array for easier rendering
            variants: Object.entries(data.variants).map(([vKey, vVal]) => ({
                short: vKey,
                count: vVal.count,
                longs: Array.from(vVal.longs) // Convert Set to Array
            })),
            total: data.total,
            pages: Array.from(data.pages).sort((a, b) => a - b)
        }))
        .sort((a, b) => b.total - a.total); // Sort by most frequent

    // Consolidate Missing
    const missingWords = Object.entries(missingUsage)
        .map(([word, data]) => ({ word, count: data.count, pages: Array.from(data.pages).sort((a, b) => a - b) }))
        .sort((a, b) => b.count - a.count);

    return {
        consistency: inconsistentWords,
        phrases: sortedPhrases,
        missing: missingWords,
        casing: casingIssues,
        stats: {
            uniqueWords: Object.keys(wordUsage).length,
            inconsistentCount: inconsistentWords.length,
            phraseCount: sortedPhrases.length,
            missingCount: missingWords.length,
            casingCount: casingIssues.length
        }
    };
};
