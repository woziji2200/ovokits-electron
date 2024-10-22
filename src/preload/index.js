import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import fs from 'fs'
import path from 'path'


// const getApi = (window) => {
//     return new api(window)
// }
const api = {
    getWindowPid(window){
        const params = new URLSearchParams(window.location.search)
        return params.get('pid')
    },
    closeWindow(pid) {
        ipcRenderer.send('appWindow', { data: 'closeWindow', pid })
    },
    callWindowMethod(pid, method, ...args){
        return ipcRenderer.sendSync('appWindow', { data: 'callWindowMethod', pid, method, args })
    },
    getWindowProperty(pid, property){
        return ipcRenderer.sendSync('appWindow', { data: 'getWindowProperty', pid, property })
    },
    getPluginSettings(pid, settingName){
        return ipcRenderer.sendSync('appWindow', { data: 'getPluginSettings', pid, settingName })
    }
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
