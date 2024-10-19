import { app, shell, BrowserWindow, ipcMain, Menu, Tray, screen, dialog } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { globalShortcut } from 'electron/main'
import fs from 'fs'
import md5 from 'js-md5'
import Store from 'electron-store';

const store = new Store();
process.on('uncaughtException', function (err) {
    dialog.showErrorBox('Error', err.message)
})
app.commandLine.appendSwitch('wm-window-animations-disabled');
/**
 * @type { BrowserWindow }
 */
let mainWindow = null
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: screen.width * 0.7,
        height: 400,
        show: true,
        autoHideMenuBar: true,
        transparent: true,
        frame: false,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            sandbox: false,
            webSecurity: false
        },
        alwaysOnTop: true,
    })
    const tray = new Tray(icon)
    tray.setToolTip('OvO Kits')
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: "显示", click: () => { mainWindow.show() } },
        { label: "退出", click: () => { app.exit() } }
    ]))
    mainWindow.setSkipTaskbar(true)
    globalShortcut.register('Alt+Space', () => {
        mainWindow.show()
        mainWindow.webContents.send('mainWindow', {
            data: 'mainWindowShow'
        })
    })
    mainWindow.setIgnoreMouseEvents(true, { forward: true })
    mainWindow.on('blur', () => {
        mainWindow.hide()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        // mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/settings?page=1111')
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        // dialog.showMessageBox({
        //     message: __dirname + " " + join(__dirname, '../renderer/index.html'),
        //     title: 'Hello, World!',
        //     type: 'info',
        //     buttons: ['OK']
        // })
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
            // query: { page: 'settings' }
        })
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.ovokits')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC test

    createMainWindow()

    // app.on('activate', function () {
    //     // On macOS it's common to re-create a window in the app when the
    //     // dock icon is clicked and there are no other windows open.
    //     if (BrowserWindow.getAllWindows().length === 0) createWindow()
    // })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
let appList = [];
let appListRecent = []
ipcMain.on('mainWindow', (event, arg) => {
    // console.log('mainWindow', arg);
    if (arg.data == 'pointerover') {
        mainWindow.setIgnoreMouseEvents(false)
    } else if (arg.data == 'pointerout') {
        mainWindow.setIgnoreMouseEvents(true, { forward: true })
    } else if (arg.data == 'modelMove') {
        mainWindow.resizable = true
    } else if (arg.data == 'hide') {
        mainWindow.hide()
    } else if (arg.data == 'show') {
        mainWindow.show()
    } else if (arg.data == 'getAppList') {
        appList = getAppList()
        appListRecent = store.get('appListRecent', []).map(id => appList.find(item => item.id == id))
        // console.log(appListRecent, appList);
        event.returnValue = appList
    } else if (arg.data == 'openApp') {
        openApp(arg.id)
    } else if (arg.data == 'getAppListRecent') {
        // console.log(appListRecent.reverse());
        console.log(appListRecent.map(item => item.name));
        event.returnValue = appListRecent.reverse()
    }
})


/**
 * 从插件目录加载插件
 * @returns { Array }
 */
function getAppList() {
    let pluginsList = []
    const plugins = fs.readdirSync(path.join(__dirname, '../../resources/plugins'))    
    for (const plugin of plugins) {
        try {
            const config = fs.readFileSync(path.join(__dirname, '../../resources/plugins', plugin, 'config.json')).toString()
            const configJson = JSON.parse(config)
            pluginsList.push({
                id: md5(configJson.name + configJson.desc + configJson.entry),
                path: path.join(__dirname, '../../resources/plugins', plugin),
                ...configJson
            })
        } catch (error) {
            console.error(error)
        }
    }
    return pluginsList
}


/**
 * @typedef { Object } WindowList
 * @property { BrowserWindow } window
 * @property { number } pid
 */

let pid = 0;

/**
 * @type { WindowList[] }
 */
let windowList = []
/**
 * 加载插件
 * @param {Electron.BrowserViewConstructorOptions} options 
 * @param {string} url 
 */
function openApp(id) {
    const appItem = appList.find(item => item.id == id)
    for(let i =0; i < appListRecent.length; i++) {
        if (appListRecent[i].id == id) {
            appListRecent.splice(i, 1)
        }
    }
    if (appListRecent.length > 5) {
        appListRecent.shift()
    }
    appListRecent.push(appItem)


    
    store.set('appListRecent', appListRecent.map(item => item.id))
    const window = new BrowserWindow(appItem.windowOptions)
    window.loadURL(path.join(appItem.path, appItem.entry))
    windowList.push({ window, pid })
    pid = pid + 1
}
// store.clear('appListRecent')