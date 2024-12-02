const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const path = require('path');

let mainWindow;

// 启动后端服务
function startBackend() {
    const backend = exec('node app.js', { cwd: path.join(__dirname) });

    backend.stdout.on('data', (data) => {
        console.log('[Backend]', data);
    });

    backend.stderr.on('data', (data) => {
        console.error('[Backend Error]', data);
    });

    backend.on('close', (code) => {
        console.log(`Backend exited with code ${code}`);
    });
}
startBackend();

// 创建 Electron 窗口
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    // 加载前端页面
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

// Electron 启动流程
app.whenReady().then(() => {
    startBackend();  // 启动 Node.js 后端
    createWindow();   // 启动浏览器窗口

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 退出时清理资源
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
