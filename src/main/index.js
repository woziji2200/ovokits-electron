import { app, shell, BrowserWindow, ipcMain, Menu, Tray, screen, dialog } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { globalShortcut } from 'electron/main'
import fs from 'fs'
import md5 from 'js-md5'
import Store from 'electron-store';
import * as ws from '../../resources/windows-shortcut/windows-shortcuts'

async function main() {
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
                webSecurity: false,
                experimentalFeatures: true
            },
            alwaysOnTop: true,
        })
        const tray = new Tray(icon)
        tray.setToolTip('OvO Kits')
        tray.setContextMenu(Menu.buildFromTemplate([
            { label: "显示", click: () => { mainWindow.show() } },
            { label: "插件设置", click: () => { openSettingsWindow() } },
            { label: "插件市场", click: () => { openManagementWindow() } },
            { label: "重启OvO Kits", click: () => { app.relaunch() } },
            { label: "退出OvO Kits", click: () => { app.exit() } },
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
            const settings = JSON.parse(fs.readFileSync(launcherSettingsPath).toString())
            if (settings['搜索结果中包含最近文件'].value) {
                appList = appList.concat(recentFile)
            }
            appListRecent = store.get('appListRecent', []).map(id => appList.find(item => item.id == id))
            appListRecent = appListRecent.filter(item => item)
            event.returnValue = appList
        } else if (arg.data == 'openApp') {
            openApp(arg.id, arg.param)
        } else if (arg.data == 'getAppListRecent') {
            // console.log(appListRecent);

            // console.log(appListRecent.map(item => item.name));
            event.returnValue = appListRecent.toReversed()
        }
    })

    function wsQuery(lnkPath) {
        return new Promise((resolve, reject) => {
            ws.query(lnkPath, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    async function getRecentFile() {
        return new Promise((resolve, reject) => {
            const recentFileDir = app.getPath('recent')
            let recentFile = fs.readdirSync(recentFileDir)
                .filter(i => !i.startsWith('ms-'))
                .filter(i => !i.startsWith('http-'))
                .filter(i => !i.startsWith('https-'))
                .map(i => i.split('.').slice(0, -1).join('.'))
                .filter(i => i.includes('.'))
            let recentFileList = []
            // let recentFileList = []
            Promise.allSettled(recentFile.map(i => wsQuery(path.join(recentFileDir, i + '.lnk')))).then(res => {
                res.forEach((item, index) => {
                    if (item.status == 'fulfilled') {
                        // const lnkPathBuffer = new TextEncoder('gbk').encode(item.value.target)
                        const lnkPath = item.value.target
                        recentFileList.push({
                            id: md5(recentFile[index]),
                            name: recentFile[index],
                            path: lnkPath,
                            startType: 'file',
                            desc: lnkPath,
                        })
                    }
                })
                resolve(recentFileList)
            })
        })
    }


    let recentFile = await getRecentFile()
    // console.log(recentFile.filter(i => i.name.includes('pptx')));

    // console.log(recentFile);


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
                // console.log(path.join(__dirname, '../../resources/plugins', plugin));
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
    function openApp(id, param) {
        mainWindow.hide()
        const appItem = appList.find(item => item.id == id)
        if (appItem.singleton) {
            for (let i = 0; i < windowList.length; i++) {
                if (windowList[i].id == id) {
                    windowList[i].window.show()
                    return
                }
            }
        }

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
            function a() {
                return function () {
                    const currentPid = pid
                    let window = new BrowserWindow({
                        icon: appItem.logo ? path.join(appItem.path, appItem.logo) : icon,
                        show: false, webPreferences: {
                            preload: path.join(__dirname, '../preload/index.js'),
                            sandbox: false,
                            webSecurity: false
                        }, ...appItem.windowOptions
                    })
                    window.loadFile(path.join(appItem.path, appItem.entry), {
                        query: { pid: pid, param: param }
                    })
                    windowList.push({ window, pid, id: appItem.id })
                    window.on('ready-to-show', () => {
                        window.show()
                    })
                    window.on('close', () => {
                        windowList = windowList.filter(item => item.pid != currentPid)
                    })
                }
            }
            a()()
            pid = pid + 1
        } else if(appItem.startType.toLowerCase() == 'file') {
            console.log(appItem.path);
            
            shell.openPath(appItem.path)
        }
    }
    // store.clear('appListRecent')
    /**
     * @type { BrowserWindow }
     */
    let settingsWindow = null
    function openSettingsWindow(pluginId) {
        if (settingsWindow) {
            settingsWindow.show()
            return
        }
        settingsWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            minWidth: 600,
            minHeight: 400,
            show: false,
            autoHideMenuBar: true,
            // transparent: true,
            frame: false,
            ...(process.platform === 'linux' ? { icon } : {}),
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                sandbox: false,
                webSecurity: false
            },
        })
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            settingsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + `?page=settings&pluginId=${pluginId}`)
        } else {
            settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
                query: { page: 'settings', pluginId: pluginId }
            })
        }
        settingsWindow.on('ready-to-show', () => {
            settingsWindow.show()
        })
        settingsWindow.on('close', () => {
            settingsWindow = null
        })
    }
    /**
     * @type { BrowserWindow }
     */
    let managementWindow = null
    function openManagementWindow() {
        if (managementWindow) {
            managementWindow.show()
            return
        }
        managementWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            minHeight: 400,
            minWidth: 600,
            show: false,
            autoHideMenuBar: true,
            // transparent: true,
            frame: false,
            ...(process.platform === 'linux' ? { icon } : {}),
            webPreferences: {
                preload: path.join(__dirname, '../preload/index.js'),
                sandbox: false,
                webSecurity: false
            },
        })
        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
            managementWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '?page=management')
        }
        else {
            managementWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
                query: { page: 'management' }
            })
        }
        managementWindow.on('ready-to-show', () => {
            managementWindow.show()
        })
        managementWindow.on('close', () => {
            managementWindow = null
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
                if (item.startType == 'file') return
                if (!fs.existsSync(path.join(item.path, 'settings.json'))) {
                    return
                }
                const settings = fs.readFileSync(path.join(item.path, 'settings.json')).toString()
                const settingsJson = JSON.parse(settings)
                settingsList.push({
                    id: item.id,
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
        } else if (arg.data == 'reloadSettings') {
            const settings = JSON.parse(fs.readFileSync(launcherSettingsPath).toString())
            if (settings['开机自启动'].value) {
                app.setLoginItemSettings({
                    openAtLogin: true,
                    openAsHidden: true
                })
            } else {
                app.setLoginItemSettings({
                    openAtLogin: false,
                    openAsHidden: false
                })
            }
        } else if (arg.data == 'ctrlWindow') {
            if (arg.type == 'close') settingsWindow.close()
            else if (arg.type == 'minimize') settingsWindow.minimize()
            else if (arg.type == 'maximize' && settingsWindow.isMaximized()) settingsWindow.unmaximize()
            else if (arg.type == 'maximize' && !settingsWindow.isMaximized()) settingsWindow.maximize()
        }
    })

    ipcMain.on('appWindow', (event, arg) => {
        if (arg.data == 'closeWindow') {
            const window = windowList.find(item => item.pid == arg.pid)
            if (window) {
                window.window.close()
            }
        } else if (arg.data == 'callWindowMethod') {
            const window = windowList.find(item => item.pid == arg.pid)
            if (window) {
                const res = window.window[arg.method](...arg.args)
                event.returnValue = res
            }
        } else if (arg.data == 'getWindowProperty') {
            const window = windowList.find(item => item.pid == arg.pid)
            if (window) {
                const res = window.window[arg.property]
                event.returnValue = res
            }
        } else if (arg.data == 'getPluginSettings') {
            if (arg.pid == 'launcher') {
                const settings = fs.readFileSync(launcherSettingsPath).toString()
                const settingsJson = JSON.parse(settings)
                event.returnValue = settingsJson[arg.settingName].value
                return
            }
            const window = windowList.find(item => item.pid == arg.pid)
            const appItem = appList.find(item => item.id == window.id)
            const settings = fs.readFileSync(path.join(appItem.path, 'settings.json')).toString()
            const settingsJson = JSON.parse(settings)
            event.returnValue = settingsJson[arg.settingName].value
        } else if (arg.data == 'onWindowEvent') {
            const window = windowList.find(item => item.pid == arg.pid).window
            if (window) {
                window.on(arg.event, arg.callback)
            }
        }
    })

    ipcMain.on('managementWindow', (event, arg) => {
        if (arg.data == 'getPluginList') {
            event.returnValue = getAppList()
        } else if (arg.data == 'openSettingsWindow') {
            openSettingsWindow(arg.id)
        } else if (arg.data == 'ctrlWindow') {
            if (arg.type == 'close') managementWindow.close()
            else if (arg.type == 'minimize') managementWindow.minimize()
            else if (arg.type == 'maximize' && managementWindow.isMaximized()) managementWindow.unmaximize()
            else if (arg.type == 'maximize' && !managementWindow.isMaximized()) managementWindow.maximize()
        }
    })

}

main()