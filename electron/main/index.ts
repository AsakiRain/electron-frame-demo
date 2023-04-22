import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import fs from "node:fs";
import path from "node:path";

process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    // titleBarStyle: 'hidden',
    // titleBarOverlay: {
    //   color: '#2f3241',
    //   symbolColor: '#74b1be',
    //   height: 32
    // },
    width: 1280,
    height: 800,
    frame: false,
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

//////////////////////////////////
//    ipcMain自定义事件监听      //
//////////////////////////////////

// 打开调试工具
ipcMain.on("open-devtool", () => {
  win?.webContents.openDevTools();
});

// 切换始终保持最前
ipcMain.on("toggle-pin", () => {
  if (win?.isAlwaysOnTop()) {
    win?.setAlwaysOnTop(false);
  } else {
    win?.setAlwaysOnTop(true);
  }
});

// 最小化窗口
ipcMain.on("minimize", () => {
  win?.minimize();
});

// 最大化窗口
ipcMain.on("maximize", () => {
  if (win?.isMaximized()) {
    win?.restore();
  } else {
    win?.maximize();
  }
});

// 关闭窗口
ipcMain.on("close", () => {
  win?.close();
});

// 获取本地文件，对应ipcRenderer.invoke("get-message")
ipcMain.handle("get-message", () => {
  // https://www.electronjs.org/zh/docs/latest/api/app#appgetpathname
  // 使用app.getPath可以获取到electron内置的几个运行相关路径
  const file_path = path.join(app.getPath("userData"), "message.json");
  // 复制默认文件，通常用于创建默认配置的情景
  if (!fs.existsSync(file_path)) {
    const default_message = {
      "hello": "world",
      "number": 300,
      "boolean": true
    }
    // 写入带有4格空格缩进的json字符串，增强调试的可读性
    fs.writeFileSync(file_path, JSON.stringify(default_message, null, 4));
  }
  // 读出的文件是字符串，不用做额外的处理就可以返回。这里并没有做读取失败处理，并不可靠
  return fs.readFileSync(file_path, "utf-8");
});
