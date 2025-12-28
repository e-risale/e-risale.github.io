import * as firebaseService from '../firebase';
import defaultDictionary from '../sozluk.json';

const isElectron = window.api && window.api.isElectron;

// --- PUBLICATION STATUS ---
export const getPublicationStatus = async () => {
    if (isElectron) {
        try {
            const result = await window.api.readFile({ filename: 'publication_status.json' });
            if (result.success) {
                return JSON.parse(result.content);
            } else {
                return {};
            }
        } catch (error) {
            console.error("Local load error:", error);
            return {};
        }
    } else {
        return firebaseService.getPublicationStatus();
    }
};

export const savePublicationStatus = async (statusMap) => {
    if (isElectron) {
        try {
            const result = await window.api.saveFile({
                filename: 'publication_status.json',
                content: JSON.stringify(statusMap, null, 2)
            });
            return result.success;
        } catch (error) {
            console.error("Local save error:", error);
            return false;
        }
    } else {
        return firebaseService.savePublicationStatus(statusMap);
    }
};

// --- DICTIONARY ---
// --- CHAPTERS ---
export const saveChapter = async (filename, data) => {
    if (isElectron) {
        try {
            // We save to a 'chapters' subdirectory or just flat, depending on preference.
            // Let's keep it simple: just the filename provided (which usually includes ID)
            const result = await window.api.saveFile({
                filename: filename,
                content: JSON.stringify(data, null, 2)
            });
            return result.success;
        } catch (error) {
            console.error("Local save error:", error);
            return false;
        }
    } else {
        // Web: Trigger download
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", filename);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        return true;
    }
};

export const getDictionary = async () => {
    if (isElectron) {
        // In Electron, we check for a local override file first
        try {
            const result = await window.api.readFile({ filename: 'sozluk.json' });
            if (result.success) {
                return JSON.parse(result.content);
            }
        } catch (e) {
            console.log("No local dictionary found, using default.");
        }
        // Fallback to built-in dictionary if no local file exists
        return defaultDictionary;
    } else {
        // Web behavior: load from localStorage as per original logic, or just return default
        // The original component Logic handled localStorage merging. 
        // We can replicate that here or let the component do it.
        // For consistency, let's return defaultDictionary and let component handle overrides if web
        // BUT, ideally we move logic here. For now, to minimize refactor risk:
        return null; // Null signals "use standard web logic" to the component
    }
};

export const saveDictionary = async (dictionaryData, forceDownload = false) => {
    if (isElectron) {
        try {
            const result = await window.api.saveFile({
                filename: 'sozluk.json',
                content: JSON.stringify(dictionaryData, null, 2)
            });
            return result.success;
        } catch (error) {
            console.error("Local save error:", error);
            return false;
        }
    } else {
        if (forceDownload) {
            // Web: Trigger download
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dictionaryData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "sozluk.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            return true;
        }
        // If not forcing download, we do nothing here (caller handles localStorage)
        return true;
    }
};
