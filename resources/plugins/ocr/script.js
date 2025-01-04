// Azure OCR API 信息
const AZURE_ENDPOINT = 'https://computervisionplugins.cognitiveservices.azure.com/vision/v3.2/ocr';
const AZURE_OCR_KEY = '2YRepc2iBwULYAmjkxnD9eG3UBsZFQk6iHtTH43QAhxFaFxgxwrNJQQJ99AKACqBBLyXJ3w3AAAFACOG6y83';

window.onload = function () {
    const api = window.api;
    const pid = api.getWindowPid(window);
    var bg = api.getPluginSettings(pid, 'OCR背景');
    let body = document.body;
    
    body.style.backgroundImage = `url('./img/${bg}.png')`;
};

function previewImage() {
    const fileInput = document.getElementById('image-upload');
    const selectedImage = document.getElementById('selected-image');

    // 检查文件是否选择
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            selectedImage.src = e.target.result;
            selectedImage.style.display = 'block';  // 确保显示图片
        };

        reader.onerror = function (error) {
            console.error("图片读取失败：", error);
            alert("无法读取图片，请选择其他图片文件。");
        };

        reader.readAsDataURL(file);
    } else {
        alert("请先选择图片文件。");
    }
}

async function recognizeText() {
    const fileInput = document.getElementById('image-upload');
    const resultText = document.getElementById('result-text');
    const cover = document.getElementById('cover');

    if (fileInput.files.length === 0) {
        alert("请上传图片！");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (event) {
        const imageData = event.target.result;

        try {
            const response = await fetch(AZURE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': AZURE_OCR_KEY,
                    'Content-Type': 'application/octet-stream'
                },
                body: imageData
            });

            if (!response.ok) {
                throw new Error(`API请求失败，状态码：${response.status}`);
            }

            const data = await response.json();
            addOverlayText(data);
            resultText.value = extractTextFromOCRResponse(data);

        } catch (error) {
            resultText.value = `识别失败：${error.message}`;
        }
    };

    reader.readAsArrayBuffer(file);
}

function extractTextFromOCRResponse(data) {
    let text = '';
    if (data && data.regions) {
        data.regions.forEach(region => {
            region.lines.forEach(line => {
                line.words.forEach(word => {
                    text += word.text + ' ';
                });
                text += '\n';
            });
        });
    }
    return text.trim();
}

// document.addEventListener('DOMContentLoaded', function() {
//     const imageUpload = document.getElementById('image-upload');
//     imageUpload.addEventListener('click', handleClick);
// });

function handleClick() {
    const cover = document.getElementById('cover');

    // 清空现有的覆盖文字
    cover.innerHTML = '';
}

function addOverlayText(data) {
    const cover = document.getElementById('cover');
    const selectedImage = document.getElementById('selected-image');

    // 清空现有的覆盖文字
    cover.innerHTML = '';

    // 确保图片加载完成
    selectedImage.onload = function () {
        const imageWidth = selectedImage.naturalWidth;
        const imageHeight = selectedImage.naturalHeight;
        const coverWidth = selectedImage.clientWidth;
        const coverHeight = selectedImage.clientHeight;

        // 获取图片相对于容器的偏移量（考虑图片居中）
        const imageLeft = (selectedImage.parentNode.offsetWidth - coverWidth) / 2;
        const imageTop = (selectedImage.parentNode.offsetHeight - coverHeight) / 2;

        if (data && data.regions) {
            data.regions.forEach(region => {
                region.lines.forEach(line => {
                    line.words.forEach(word => {
                        const { boundingBox, text } = word;

                        const [x, y, width, height] = boundingBox.split(',').map(Number);

                        const span = document.createElement('span');
                        span.textContent = text;
                        span.style.position = 'absolute';
                        // 根据容器位置和图片的缩放比例调整坐标
                        span.style.left = `${(x / imageWidth) * coverWidth + imageLeft}px`;
                        span.style.top = `${(y / imageHeight) * coverHeight + imageTop}px`;
                        span.style.width = `${(width / imageWidth) * coverWidth}px`;
                        span.style.height = `${(height / imageHeight) * coverHeight}px`;
                        span.style.background = 'rgba(255, 255, 0, 0.2)';
                        span.style.color = 'transparent';
                        span.style.border = '1px solid rgba(255, 255, 0, 0.6)';
                        span.style.pointerEvents = 'none';

                        cover.appendChild(span);
                    });
                });
            });
        }
    };

    if (selectedImage.complete) {
        selectedImage.onload();
    }
}
