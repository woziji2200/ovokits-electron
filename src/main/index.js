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
    console.log(err);

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
        { label: "插件设置", click: () => { openSettingsWindow() } },
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
        appListRecent = appListRecent.filter(item => item)
        event.returnValue = appList
    } else if (arg.data == 'openApp') {
        openApp(arg.id)
    } else if (arg.data == 'getAppListRecent') {
        // console.log(appListRecent);

        // console.log(appListRecent.map(item => item.name));
        event.returnValue = appListRecent.toReversed()
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
            if (!fs.existsSync(path.join(__dirname, '../../resources/plugins', plugin, 'config.json'))) {
                continue
            }
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

let pid = 10000;

/**
 * @typedef { Object } WindowList
 * @property { BrowserWindow } window
 * @property { number } pid 插件的pid，运行时id
 * @property { number } id 插件的id
 */

/**
 * @type { WindowList[] }
 */
let windowList = []
/**
 * 启动插件
 * @param {string} id 插件id
 */
function openApp(id) {
    mainWindow.hide()
    const appItem = appList.find(item => item.id == id)
    for (let i = 0; i < appListRecent.length; i++) {
        if (appListRecent[i].id == id) {
            appListRecent.splice(i, 1)
        }
    }
    if (appListRecent.length > 5) {
        appListRecent.shift()
    }
    appListRecent.push(appItem)
    store.set('appListRecent', appListRecent.map(item => item.id))
    if (appItem.startType.toLowerCase() == 'html') {
        let window = new BrowserWindow({
            show: false, webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                sandbox: false,
                webSecurity: false
            }, ...appItem.windowOptions
        })
        window.loadFile(path.join(appItem.path, appItem.entry), {
            query: { pid: pid }
        })
        windowList.push({ window, pid, id: appItem.id })
        window.on('ready-to-show', () => {
            window.show()
        })
        window.on('close', () => {
            windowList = windowList.filter(item => item.pid != pid)
        })

        pid = pid + 1
    }
}
// store.clear('appListRecent')


function openSettingsWindow() {
    let settingsWindow = null
    settingsWindow = new BrowserWindow({
        width: 800,
        height: 500,
        show: false,
        autoHideMenuBar: true,
        // transparent: true,
        // frame: false,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            sandbox: false,
            webSecurity: false
        },
    })
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        settingsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?page=settings')
    } else {
        settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
            query: { page: 'settings' }
        })
    }
    settingsWindow.on('ready-to-show', () => {
        settingsWindow.show()
    })
}

const launcherSettingsPath = path.join(__dirname, '../../resources/settings.json')
function getSettingsList() {
    let settingsList = [{
        name: '启动器设置',
        path: 'launcher',
        settings: JSON.parse(fs.readFileSync(launcherSettingsPath).toString())
    }]

    appList.forEach(item => {
        try {
            if (!fs.existsSync(path.join(item.path, 'settings.json'))) {
                return
            }
            const settings = fs.readFileSync(path.join(item.path, 'settings.json')).toString()
            const settingsJson = JSON.parse(settings)
            settingsList.push({
                name: item.name,
                path: item.path,
                settings: settingsJson
            })
        } catch (error) {
            console.error(error)
        }
    })
    return settingsList
}
ipcMain.on('settingsWindow', (event, arg) => {
    if (arg.data == 'getSettingsList') {
        // console.log(getSettingsList());
        event.returnValue = getSettingsList()
    } else if (arg.data == 'saveSettings') {
        try {
            if (arg.path == 'launcher') {
                fs.writeFileSync(launcherSettingsPath, arg.settings)
            } else {
                fs.writeFileSync(path.join(arg.path, 'settings.json'), arg.settings)
            }
            event.returnValue = 'success'
        } catch (error) {
            event.returnValue = error
            console.log(error);
        }
    }
})

ipcMain.on('appWindow', (event, arg) => {
    if (arg.data == 'closeWindow') {
        const window = windowList.find(item => item.pid == arg.pid)
        if (window) {
            window.window.close()
        }
    } else if(arg.data == 'callWindowMethod'){
        const window = windowList.find(item => item.pid == arg.pid)
        if (window) {
            const res = window.window[arg.method](...arg.args)
            event.returnValue = res
        }
    } else if(arg.data == 'getWindowProperty'){
        const window = windowList.find(item => item.pid == arg.pid)
        if (window) {
            const res = window.window[arg.property]
            event.returnValue = res
        }
    } else if(arg.data == 'getPluginSettings'){
        const window = windowList.find(item => item.pid == arg.pid)
        const appItem = appList.find(item => item.id == window.id)
        const settings = fs.readFileSync(path.join(appItem.path, 'settings.json')).toString()
        const settingsJson = JSON.parse(settings)
        event.returnValue = settingsJson[arg.settingName].value
    }
})