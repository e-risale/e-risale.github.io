const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const sozlukPath = path.join(projectRoot, 'src', 'sozluk.json');
const sozlukBackupPath = path.join(projectRoot, 'src', 'sozluk.json.bak');
const dataDir = path.join(projectRoot, 'src', 'data', 'sozler');

// 1. Backup existing dictionary
if (fs.existsSync(sozlukPath)) {
    console.log(`Backing up ${sozlukPath} to ${sozlukBackupPath}...`);
    fs.copyFileSync(sozlukPath, sozlukBackupPath);
} else {
    console.log('No existing dictionary found to backup.');
}

// 2. Scan for JSON files
function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else {
            if (file.endsWith('.json')) {
                results.push(file);
            }
        }
    });
    return results;
}

if (!fs.existsSync(dataDir)) {
    console.error(`Directory not found: ${dataDir}`);
    process.exit(1);
}

const files = getFiles(dataDir);
console.log(`Found ${files.length} data files.`);

const newDictionary = {};

// 3. Process each file
files.forEach(filePath => {
    console.log(`Processing ${path.basename(filePath)}...`);
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;
    try {
        data = JSON.parse(content);
    } catch (e) {
        console.error(`Error parsing JSON in ${filePath}:`, e);
        return;
    }

    // Assuming structure is array of page objects with 'rawText'
    if (Array.isArray(data)) {
        data.forEach(page => {
            if (page.rawText) {
                extractWords(page.rawText);
            }
        });
    } else if (data.rawText) {
         extractWords(data.rawText);
    }
});

function extractWords(text) {
    // Regex to match [[...]]
    const regex = /\[\[(.*?)\]\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const content = match[1];
        const parts = content.split('|');

        if (parts.length >= 2) {
            const original = parts[0].trim();
            const short = parts[1].trim();
            let long = "";
            
            if (parts.length >= 3) {
                long = parts[2].trim();
            }

            // Add to dictionary. 
            // Javascript object keys are case-sensitive. 
            // If key exists, it will be overwritten (as requested to prevent duplicates but keep latest/update)
            // User asked to *prevent* duplicates if 3 values are same. 
            // If they differ, we overwrite. Essentially, the last one wins.
            
            newDictionary[original] = {
                short: short,
                long: long,
                source: "AI"
            };
        }
    }
}

// 4. Sort and Write dictionary
const sortedKeys = Object.keys(newDictionary).sort((a, b) => a.localeCompare(b, 'tr'));
const sortedDictionary = {};
sortedKeys.forEach(key => {
    sortedDictionary[key] = newDictionary[key];
});

fs.writeFileSync(sozlukPath, JSON.stringify(sortedDictionary, null, 2), 'utf-8');
console.log(`Dictionary rebuild complete. Saved to ${sozlukPath}`);
console.log(`Total entries: ${sortedKeys.length}`);
