import { contextBridge, ipcRenderer, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import fs from 'fs'
import path from 'path'
import md5 from 'js-md5'

// const getApi = (window) => {
//     return new api(window)
// }
const api = {
    getWindowPid(window) {
        const params = new URLSearchParams(window.location.search)
        return params.get('pid')
    },
    closeWindow(pid) {
        ipcRenderer.send('appWindow', { data: 'closeWindow', pid })
    },
    callWindowMethod(pid, method, ...args) {
        return ipcRenderer.sendSync('appWindow', { data: 'callWindowMethod', pid, method, args })
    },
    getWindowProperty(pid, property) {
        return ipcRenderer.sendSync('appWindow', { data: 'getWindowProperty', pid, property })
    },
    getPluginSettings(pid, settingName) {
        return ipcRenderer.sendSync('appWindow', { data: 'getPluginSettings', pid, settingName })
    },
    onWindowEvent(pid, event, callback) {
        ipcRenderer.send('appWindow', { data: 'onWindowEvent', pid, event })
    },
    md5: md5,
    fs: fs,
    shell,

    // // translate
    // async getSelectedText(text){
    //     return await ipcRenderer.invoke('getSelectedText', text);
    // },
    getClipboardText: () => ipcRenderer.invoke(`get-ClipboardText`)

}


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    window.electron = electronAPI
    window.api = api
}
