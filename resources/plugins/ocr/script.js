// Azure OCR API 信息
const AZURE_ENDPOINT = 'https://computervisionplugins.cognitiveservices.azure.com/vision/v3.2/ocr';
const AZURE_OCR_KEY = '2YRepc2iBwULYAmjkxnD9eG3UBsZFQk6iHtTH43QAhxFaFxgxwrNJQQJ99AKACqBBLyXJ3w3AAAFACOG6y83';

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

    if (fileInput.files.length === 0) {
        alert("请上传图片！");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

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
            const text = extractTextFromOCRResponse(data);
            resultText.value = text;

        } catch (error) {
            resultText.value = `识别失败：${error.message}`;
        }
    };
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
    return text;
}
