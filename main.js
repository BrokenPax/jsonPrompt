const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const PROFILE_DIR = path.join(__dirname, 'profiles');

const CHECKBOX_PATH = path.join(DATA_DIR, 'checkboxCategories.json');
const DROPDOWN_PATH = path.join(DATA_DIR, 'dropdownOptions.json');
const DROPDOWN_ORDER_PATH = path.join(DATA_DIR, 'dropdownOrder.json');

// Ensure required directories exist
[DATA_DIR, PROFILE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// ---- Profile Logic (already working) ----
ipcMain.handle('get-profile-list', async () => {
  const files = await fs.promises.readdir(PROFILE_DIR);
  return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
});

ipcMain.handle('load-profile', async (event, profileName) => {
  const profilePath = path.join(PROFILE_DIR, ...profileName.split('/')) + '.json';
  const data = await fs.promises.readFile(profilePath, 'utf-8');
  return JSON.parse(data);
});

ipcMain.handle('save-profile', async (event, name, data) => {
  const filePath = path.join(PROFILE_DIR, `${name}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
});

ipcMain.handle('delete-profile', async (event, profilePath) => {
  const fullPath = path.join(PROFILE_DIR, ...profilePath.split('/')) + '.json';
  try {
    await fs.promises.unlink(fullPath);
    console.log(`🗑️ Deleted profile: ${fullPath}`);
  } catch (err) {
    console.error('❌ Failed to delete profile:', err);
  }
});

ipcMain.handle('rename-profile', async (event, folder, oldName, newName) => {
  const folderPath = folder === '(Root Profiles)' ? '' : folder;
  const oldFullPath = path.join(PROFILE_DIR, folderPath, `${oldName}.json`);
  const newFullPath = path.join(PROFILE_DIR, folderPath, `${newName}.json`);

  try {
    await fs.promises.rename(oldFullPath, newFullPath);
    console.log(`✏️ Renamed profile: ${oldFullPath} → ${newFullPath}`);
  } catch (err) {
    console.error('❌ Failed to rename profile:', err);
  }
});

// ---- NEW: Read/Save Dropdowns ----
ipcMain.handle('read-dropdowns', async () => {
  console.log('📥 Reading dropdownOptions from:', DROPDOWN_PATH);
  try {
    const data = await fs.promises.readFile(DROPDOWN_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('❌ Failed to read or parse dropdownOptions:', err);
    throw err;
  }
});

ipcMain.handle('save-dropdowns', async (event, data) => {
  await fs.promises.writeFile(DROPDOWN_PATH, JSON.stringify(data, null, 2));
});

// ---- NEW: Read/Save Checkboxes ----
ipcMain.handle('read-checkboxes', async () => {
  console.log('📥 Reading checkboxCategories from:', CHECKBOX_PATH);
  try {
    const data = await fs.promises.readFile(CHECKBOX_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('❌ Failed to read or parse checkboxCategories:', err);
    throw err;
  }
});


ipcMain.handle('save-checkboxes', async (event, data) => {
  await fs.promises.writeFile(CHECKBOX_PATH, JSON.stringify(data, null, 2));
});

ipcMain.handle('getProfileStructure', async () => {
  const folders = await fs.promises.readdir(PROFILE_DIR, { withFileTypes: true });

  const result = {};

  for (const dirent of folders) {
    if (dirent.isDirectory()) {
      const folderName = dirent.name;
      const folderPath = path.join(PROFILE_DIR, folderName);
      const files = await fs.promises.readdir(folderPath);
      const jsonFiles = files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
      result[folderName] = jsonFiles;
    }
  }

  // Include root profiles
  const rootFiles = folders
    .filter(f => f.isFile() && f.name.endsWith('.json'))
    .map(f => f.name.replace('.json', ''));
  result['(Root Profiles)'] = rootFiles;

  return result;
});

ipcMain.handle('save-dropdown-order', async (event, order) => {
  await fs.promises.writeFile(DROPDOWN_ORDER_PATH, JSON.stringify(order, null, 2));
});

ipcMain.handle('read-dropdown-order', async () => {
  try {
    const data = await fs.promises.readFile(DROPDOWN_ORDER_PATH);
    return JSON.parse(data);
  } catch {
    return []; // fallback
  }
});

ipcMain.handle('write-dropdown-order', async (event, data) => {
  await fs.promises.writeFile(DROPDOWN_ORDER_PATH, JSON.stringify(data, null, 2));
});
      

// ---- App Bootstrap ----
function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 1080,
    minWidth: 1200,
    minHeight: 850,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
