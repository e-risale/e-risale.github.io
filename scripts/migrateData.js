const fs = require('fs');
const path = require('path');

const CHAPTERS_DIR = path.join(__dirname, '../src/data/chapters');
const RISALE_DIR = path.join(__dirname, '../src/data/risale');

function migrate() {
    console.log('Starting migration...');

    // 1. Get all files in chapters
    if (!fs.existsSync(CHAPTERS_DIR)) {
        console.error('Chapters directory not found!');
        return;
    }

    const books = fs.readdirSync(CHAPTERS_DIR);

    books.forEach(bookDir => {
        const chapterPath = path.join(CHAPTERS_DIR, bookDir);
        const risalePath = path.join(RISALE_DIR, bookDir);

        if (!fs.statSync(chapterPath).isDirectory()) return;

        // Ensure target directory exists
        if (!fs.existsSync(risalePath)) {
            console.log(`Creating directory: ${risalePath}`);
            fs.mkdirSync(risalePath, { recursive: true });
        }

        const files = fs.readdirSync(chapterPath);

        files.forEach(file => {
            if (!file.endsWith('.json')) return;

            const sourceFile = path.join(chapterPath, file);
            const targetFile = path.join(risalePath, file);

            console.log(`Processing: ${bookDir}/${file}`);

            // Read Source (Chapters) - Contains CLEAN rawText
            const sourceContent = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

            // Read Target (Risale) - Contains TAGGED rawText (to be renamed to oldText)
            let targetContent = [];
            if (fs.existsSync(targetFile)) {
                targetContent = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
            } else {
                console.log(`Target file not found, creating from source: ${file}`);
                // If target doesn't exist, we construct it from source
                // But wait, if target doesn't exist, we don't have "Tagged" text to preserve.
                // So oldText will be equal to source.newRaw (if exists) or null.
                targetContent = sourceContent.map(p => ({ ...p })); // Clone
            }

            // MERGE LOGIC
            // We want to update targetContent (Risale) array.
            // Map by pageId or Index.
            // Assumption: pageId is reliable.

            const mergedContent = sourceContent.map((sourcePage, idx) => {
                // Find corresponding page in target
                // Try finding by pageId first, then index
                let targetPage = targetContent.find(p => p.pageId === sourcePage.pageId);
                // If not found by ID, try index if structure matches
                if (!targetPage && targetContent[idx]) targetPage = targetContent[idx];

                if (!targetPage) {
                    // New page in source? Use source structure.
                    return {
                        id: sourcePage.id,
                        pageId: sourcePage.pageId,
                        rawText: sourcePage.rawText, // CLEAN
                        oldText: sourcePage.newRaw || "", // Potentially tagged from source if it was there
                        modernText: sourcePage.modernText || "",
                        lastUpdated: sourcePage.lastUpdated,
                        processedBy: sourcePage.processedBy,
                        status: sourcePage.status,
                        isDone: sourcePage.isDone
                    };
                }

                // If target page exists (It has the TAGGED text in 'rawText' currently)
                // We need to:
                // 1. Move targetPage.rawText -> targetPage.oldText
                // 2. Set targetPage.rawText = sourcePage.rawText (Clean)

                // Preservation check: Is existing rawText actually tagged?
                // Does not matter, user wants rename.
                const preservedTaggedText = targetPage.rawText;

                return {
                    ...targetPage,
                    rawText: sourcePage.rawText, // INJECT CLEAN
                    oldText: preservedTaggedText, // PRESERVE TAGGED/WORK
                    // Keep other fields (modernText, etc) from target
                };
            });

            // Write back to RISALE
            fs.writeFileSync(targetFile, JSON.stringify(mergedContent, null, 2), 'utf8');
        });
    });

    console.log('Migration of content complete.');
    console.log('Deleting chapters directory...');
    fs.rmSync(CHAPTERS_DIR, { recursive: true, force: true });
    console.log('Chapters directory deleted.');
    console.log('Migration SUCCESS.');
}

migrate();
