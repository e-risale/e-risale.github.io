const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000'
            : `file://${path.join(__dirname, '../build/index.html')}`
    );

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Handle new window requests (e.g., Google Auth popups or external links)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // If it's a Google Auth URL, allow it to open in a popup window
        if (url.startsWith('https://accounts.google.com') || url.includes('firebaseapp.com')) {
            return { action: 'allow' };
        }
        // For other external links, open in default browser
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// IPC Handlers for Local File System
const DOCUMENTS_PATH = app.getPath('documents');
const BASE_DIR = path.join(DOCUMENTS_PATH, 'RisaleTranslations');

// Ensure directory exists
if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
}

ipcMain.handle('save-file', async (event, { filename, content }) => {
    try {
        const filePath = path.join(BASE_DIR, filename);
        await fs.promises.writeFile(filePath, content, 'utf8');
        return { success: true, path: filePath };
    } catch (error) {
        console.error('Save File Error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('read-file', async (event, { filename }) => {
    try {
        const filePath = path.join(BASE_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }
        const content = await fs.promises.readFile(filePath, 'utf8');
        return { success: true, content };
    } catch (error) {
        console.error('Read File Error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('check-file-exists', async (event, { filename }) => {
    const filePath = path.join(BASE_DIR, filename);
    return fs.existsSync(filePath);
});

// NEW: Read raw files from src/data/chapters (for comparision/dev tools)
ipcMain.handle('read-raw-file', async (event, { filename }) => {
    try {
        // In dev: public/electron.js -> ../src/data/risale
        const RAW_DIR = path.join(__dirname, '../src/data/risale');
        const filePath = path.join(RAW_DIR, filename);

        if (!fs.existsSync(filePath)) {
            console.error('Raw file not found:', filePath);
            return { success: false, error: 'File not found', filePath };
        }
        const content = await fs.promises.readFile(filePath, 'utf8');
        return { success: true, content, filePath };
    } catch (error) {
        console.error('Read Raw File Error:', error);
        return { success: false, error: error.message };
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
