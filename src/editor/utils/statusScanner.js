
export const scanBookStatuses = async (book, library) => {
    // book can be a book object or bookId. If bookId, need library to find it.
    let targetBook = book;
    if (typeof book === 'string' || typeof book === 'number') {
        targetBook = library.find(b => b.id === book);
    }

    if (!targetBook) return {};

    const statuses = {};
    const folder = targetBook.folderName || targetBook.id;

    if (!window.api || !window.api.readRawFile) {
        console.warn("Status scan: API not available");
        return {};
    }

    // Parallel processing could be fast, but let's be safe with file I/O limits if many
    // For 33 chapters, Promise.all is fine.
    await Promise.all(targetBook.chapters.map(async (chapter) => {
        const status = {
            id: chapter.id,
            exists: false,
            pageCount: 0,
            lastUpdated: null,
            model: '-',
            pages: [] // New: Detailed page list
        };

        try {
            // readRawFile is now rooted in 'src/data/risale'.
            const filename = `${folder}/${chapter.id}.json`;
            const result = await window.api.readRawFile({ filename });

            if (result.success) {
                status.exists = true;
                const data = JSON.parse(result.content);
                let pages = [];
                if (Array.isArray(data)) pages = data;
                else if (data.pages) pages = data.pages;

                status.pageCount = pages.length;

                // Extract details for each page
                status.pages = pages.map((p, idx) => {
                    let model = p.aiModel || '-';
                    // Default to lastUpdated, but prefer processedBy date if available
                    let date = p.lastUpdated ? new Date(p.lastUpdated).toLocaleString('tr-TR') : '-';

                    if (p.processedBy) {
                        const parts = p.processedBy.split(' on ');
                        if (parts.length >= 2) {
                            model = parts[0].trim(); // "Gemini 3.0 Pro..."
                            date = parts[1].trim();  // "2025.12.17-16:24"
                        } else {
                            model = p.processedBy;
                        }
                    }

                    // Status check: specifically check modernText empty
                    // Fallback to newRaw or metin for compatibility
                    const content = (p.modernText !== undefined) ? p.modernText : (p.newRaw || p.metin);
                    const hasText = !!(content && content.toString().trim().length > 0);

                    return {
                        id: p.pageId || p.id || idx,
                        aiModel: model,
                        lastUpdated: date, // User wants the format from processedBy
                        hasText: hasText
                    };
                });

                if (pages.length > 0) {
                    // Check lastUpdated
                    const updates = pages.map(p => p.lastUpdated).filter(d => d).sort();
                    if (updates.length > 0) {
                        status.lastUpdated = updates[updates.length - 1];
                    }
                    // Check model (summary)
                    if (pages[0].aiModel) status.model = pages[0].aiModel;
                }
            }
        } catch (e) {
            // Ignore missing files or errors
        }

        statuses[chapter.id] = status;
    }));

    return statuses;
};
