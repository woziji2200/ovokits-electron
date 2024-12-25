const express = require('express');
const { exec } = require('child_process');
const cors = require('../../../node_modules/cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const app = express();
const axios = require('axios');
const userAgentList = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/89.0',
    // 添加更多的 User-Agent
];
const randomUserAgent = userAgentList[Math.floor(Math.random() * userAgentList.length)];
axios.get('https://example.com', {
    headers: { 'User-Agent': randomUserAgent }
});


/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
//app.use(cors());  // 启用跨域
app.use(cors({
    origin: 'http://127.0.0.1:5000', // 修改为你的前端地址
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());  // 解析 JSON 请求体
app.use((req, res, next) => {
    res.setTimeout(300000, () => {  // 设置超时时间为 5 分钟（300000ms）
        console.log('请求超时');
        res.status(408).send('请求超时');
    });
    next();
});


// 设置下载文件存储路径
const DOWNLOAD_FOLDER = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    fs.mkdirSync(DOWNLOAD_FOLDER);  // 如果目录不存在则创建
}

// 设置 ffmpeg 路径（可以替换为你自己的路径）
const ffmpegPath = path.join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe');

// 生成唯一的视频文件名
const generateFileName = () => `${uuidv4()}.mp4`;

// 下载视频的函数
const downloadVideo = async (videoUrl) => {
    const videoFileName = generateFileName();
    const outputFilePath = path.join(DOWNLOAD_FOLDER, videoFileName);

    // yt-dlp 命令，设置 ffmpeg 和输出文件
    const ytdlCommand = `"${path.join(__dirname, 'yt-dlp', 'yt-dlp.exe')}" -f bestvideo+bestaudio/best -o "${outputFilePath}" --merge-output-format mp4 --ffmpeg-location "${ffmpegPath}" ${videoUrl}`;
    
    // 使用 exec 执行 yt-dlp 下载视频
    const execPromise = promisify(exec);
    try {
        await execPromise(ytdlCommand);
        return outputFilePath;
    } catch (error) {
        throw new Error('下载视频失败: ' + error.message);
    }
};

// 视频提取和下载接口
app.post('/extract', async (req, res) => {
    const { url: videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ success: false, message: 'URL 未提供' });
    }

    try {
        // 下载视频并获取下载文件路径
        const videoFile = await downloadVideo(videoUrl);

        // 发送文件给客户端
        res.download(videoFile, (err) => {
            if (err) {
                console.error('下载文件失败:', err);
                //res.status(500).json({ success: false, message: '下载文件失败' });
            } else {
                // 下载完成后删除文件
                fs.unlink(videoFile, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('删除临时文件失败:', unlinkErr);
                    }
                });
            }
        });

    } catch (error) {
        console.error('下载或合并失败:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 启动服务器
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
