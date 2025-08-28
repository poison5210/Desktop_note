const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const { createStorage } = require('./storage');

let mainWindow = null;
let tray = null;

const storage = createStorage(app);

function resolveAssetPath(filename) {
  // 开发环境：项目根目录
  const devPath = path.join(__dirname, '..', filename);
  if (require('fs').existsSync(devPath)) return devPath;
  // 生产环境：resources 根目录
  const prodPath = path.join(process.resourcesPath || '', filename);
  if (require('fs').existsSync(prodPath)) return prodPath;
  return devPath; // 回退
}

function resolveAppIconPath() {
  // 优先使用 .ico（Windows 托盘/任务栏抗锯齿且带透明通道更好）
  const ico = resolveAssetPath('icon.ico');
  if (require('fs').existsSync(ico)) return ico;
  return resolveAssetPath('icon.png');
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 360,
    minWidth: 200,
    minHeight: 100,
    frame: false,
    resizable: true,
    transparent: true,
    show: false,
    skipTaskbar: false,
    icon: resolveAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'sticky_note_prototype_updated.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = resolveAppIconPath();
  const image = nativeImage.createFromPath(iconPath);
  const trayImage = image.isEmpty() ? nativeImage.createFromBuffer(Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAe1BMVEUAAAD///////////////////////////////////////////////////////////////////////////////////////////////////////////////9x8m0cAAAAKHRSTlMAAQIEBwgJDA8WFx8kLS4xO1FdZGdyfIWQq7C3v8bL0Nvj6fL4+v/hp3t1AAAAQElEQVQY02NgQARiYmBgYGBg4GZgYGDgA2YGBgYmJgYJGBhY2JgYGBgYGB4gDEwMDAwMDAyEgoCBAwQxIBQwVQAAZkAFm0AFlQAE0QABdQAAGe9A4zQ8r1kAAAAASUVORK5CYII=', 'base64')) : image;
  tray = new Tray(trayImage);
  tray.setToolTip('桌面便签');
  try {
    tray.setTitle('桌面便签');
  } catch {}
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (!mainWindow) return;
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  tray.on('double-click', () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
  });
}

function registerIpc() {
  ipcMain.handle('notes:read', async () => {
    return storage.readNotes();
  });
  ipcMain.handle('notes:update', async (_e, notes) => {
    await storage.writeNotes(notes);
    return { ok: true };
  });

  ipcMain.handle('settings:read', async () => {
    return storage.readSettings();
  });
  ipcMain.handle('settings:update', async (_e, settings) => {
    await storage.writeSettings(settings);
    if (mainWindow && typeof settings.isPinned === 'boolean') {
      mainWindow.setAlwaysOnTop(!!settings.isPinned, 'screen-saver');
    }
    if (mainWindow && typeof settings.opacity === 'number') {
      // 仅用于整体窗口透明背景，内容透明由渲染层控制
      // 这里不直接修改窗口不透明度，保持由 CSS 控制
    }
    return { ok: true };
  });

  ipcMain.handle('window:pin', async (_e, isPinned) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(!!isPinned, 'screen-saver');
    }
    const settings = storage.readSettings();
    settings.isPinned = !!isPinned;
    await storage.writeSettings(settings);
    return { ok: true };
  });

  ipcMain.handle('window:minimize', async () => {
    if (mainWindow && mainWindow.minimize) {
      mainWindow.minimize();
    }
    return { ok: true };
  });

  ipcMain.handle('dialog:chooseDir', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择默认数据目录',
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || !result.filePaths || !result.filePaths[0]) {
      return { canceled: true };
    }
    const dir = result.filePaths[0];
    const settings = storage.readSettings();
    settings.dataDir = dir;
    await storage.writeSettings(settings);
    return { canceled: false, dir };
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();
    registerIpc();
    createTray();
    if (tray && tray.displayBalloon) {
      try {
        tray.displayBalloon({ title: '桌面便签', content: '应用已在托盘中运行' });
      } catch {}
    }

    // 应用启动时根据已保存设置恢复置顶
    const settings = storage.readSettings();
    if (mainWindow && typeof settings.isPinned === 'boolean') {
      mainWindow.setAlwaysOnTop(!!settings.isPinned, 'screen-saver');
    }
    // 每次启动都显示窗口
    if (mainWindow) {
      mainWindow.setSkipTaskbar(false);
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    // macOS 常驻，这里为 Windows，直接退出
    app.quit();
  });
}


