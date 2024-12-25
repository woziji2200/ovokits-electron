const canvas = document.getElementById('screenshot');
const ctx = canvas.getContext('2d');
const controls = document.getElementById('controls');

let scale = 1;

document.getElementById('zoom-in').addEventListener('click', () => {
    scale += 0.1;
    drawImage();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    scale -= 0.1;
    drawImage();
});

document.getElementById('save').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'screenshot.png';
    link.href = canvas.toDataURL();
    link.click();
});

document.getElementById('close').addEventListener('click', () => {
    window.api.closeWindow();
});

async function drawImage() {
    const sources = await window.api.captureScreen();
    const screenSource = sources[0]; // 默认选择第一个屏幕

    const img = new Image();
    img.src = screenSource.thumbnail.toDataURL();
    img.onload = () => {
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
}

drawImage();
