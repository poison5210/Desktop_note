const fs = require('fs');
const path = require('path');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function debounce(fn, wait) {
  let timer = null;
  let lastArgs = null;
  return (...args) => {
    lastArgs = args;
    clearTimeout(timer);
    timer = setTimeout(() => fn(...lastArgs), wait);
  };
}

function createStorage(app) {
  const userData = app.getPath('userData');
  ensureDirSync(userData);

  let notesPath = path.join(userData, 'notes.json');
  const settingsPath = path.join(userData, 'settings.json');
  const backupNotesPath = path.join(userData, 'notes.bak.json');

  const defaultNotes = [
    { id: '1', text: '买牛奶', completed: false, createdAt: Date.now(), updatedAt: Date.now() },
    { id: '2', text: '完成文档', completed: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: '3', text: '约会提醒', completed: false, createdAt: Date.now(), updatedAt: Date.now() }
  ];
  const defaultSettings = {
    opacity: 0.9,
    bgColor: '#fffac8',
    textColor: '#333333',
    isPinned: false,
    dataDir: '',
    hasRunOnce: false
  };

  function safeRead(file, fallback) {
    try {
      if (!fs.existsSync(file)) return fallback;
      const raw = fs.readFileSync(file, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function safeWrite(file, data) {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      try {
        fs.writeFileSync(file + '.tmp', JSON.stringify(data, null, 2), 'utf-8');
      } catch {}
      return false;
    }
  }

  const writeNotesDebounced = debounce((notes) => {
    const ok = safeWrite(notesPath, notes);
    if (!ok) {
      safeWrite(backupNotesPath, notes);
    }
  }, 300);

  return {
    readNotes() {
      return safeRead(notesPath, defaultNotes);
    },
    async writeNotes(notes) {
      writeNotesDebounced(notes);
    },
    readSettings() {
      const s = safeRead(settingsPath, defaultSettings);
      // 动态更新 notesPath：若设置了 dataDir 则写入该目录
      if (s && typeof s.dataDir === 'string' && s.dataDir.trim()) {
        try {
          ensureDirSync(s.dataDir);
          notesPath = path.join(s.dataDir, 'notes.json');
        } catch {}
      } else {
        notesPath = path.join(userData, 'notes.json');
      }
      return s;
    },
    async writeSettings(settings) {
      // 直接写，设置不频繁
      safeWrite(settingsPath, settings);
      // 应用新目录
      if (settings && typeof settings.dataDir === 'string' && settings.dataDir.trim()) {
        try {
          ensureDirSync(settings.dataDir);
          notesPath = path.join(settings.dataDir, 'notes.json');
        } catch {}
      } else {
        notesPath = path.join(userData, 'notes.json');
      }
    }
  };
}

module.exports = { createStorage };


