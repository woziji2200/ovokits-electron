const appid = '20241106002195901'
const key = 'CGnCZrdxYoOplaNBEK8Q'

const originalText = document.getElementById('originalText');
const targetLanguage = document.getElementById("targetLang");
const targetText = document.getElementById("targetText");
const detectedLanguage = document.getElementById("detectedLang");
// const transButton = document.getElementById("transButton");

let translateTimeout;
let lastInputText = '';
let lastTargetLanguage = targetLanguage.value;

const getSign = (salt) => {
    // console.log("getSign begin");
    const signString = appid + originalText.value + salt + key;
    return window.api.md5(signString);
};

// 检测语言
const detectLanguage = async () => {
    const text = originalText.value.trim();
    if (!text) {
        detectedLanguage.textContent = " ";
        return;
    }

    try {
        const salt = Date.now().toString(); // 使用当前时间戳作为salt
        const response = await fetch('https://fanyi-api.baidu.com/api/trans/vip/language', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                q: text,
                appid: appid,
                salt: salt,
                sign: getSign(salt, text), // 签名
            }),
        });

        const data = await response.json();
        console.log("语言检测结果: ", data);

        if (data.error_code) {
            detectedLanguage.textContent = "好像并不符合某种语言规范呐";
        } else {

            const detectedLangName = getLanguageName(data.data.src);
            if (detectedLangName !== detectedLanguage.textContent) {
                detectedLanguage.textContent = detectedLangName;
            }
        }
    } catch (error) {
        console.error("语言检测失败: ", error);
        detectedLanguage.textContent = "检测中...";
    }
};

// 获取语言名称的辅助函数
const getLanguageName = (langCode) => {
    const languageMap = {
        zh: "汉语",
        en: "英语",
        fra: "法语",
        ja: "日语",
        ko: "韩语",
        es: "西班牙语",
        // 待添加其他支持的语言代码
    };
    return languageMap[langCode] || `未知语言 (${langCode})`;
};


const autoTranslate = async () => {
    const text = originalText.value.trim();
    if (!text) {
        targetText.textContent = "请输入内容进行翻译！";
        return;
    }

    try {
        const salt = Date.now().toString();
        const response = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                appid: appid,
                q: text,
                from: 'auto',
                to: targetLanguage.value,
                salt: salt,
                sign: getSign(salt),
            }),
        });

        const data = await response.json();
        console.log("翻译结果: ", data);

        if (data.trans_result && data.trans_result[0]) {
            // if (data.trans_result[0].dst === originalText.value) {
            //     targetText.textContent = "没找到合适的结果呀";
            // } else {
            targetText.textContent = data.trans_result[0].dst;
            // }
        } else {
            targetText.textContent = "没找到合适的结果呀";
        }
    } catch (error) {
        console.error("翻译失败: ", error);
        targetText.textContent = "翻译失败啦";
    }
};

// 自动翻译
const translateOnTextChange = () => {
    console.log("调用translateOnTextChange啦");
    // const text = originalText.value.trim();
    // if (text) {
    //     autoTranslate();
    // }
    clearTimeout(translateTimeout); // 清除前一次的定时器
    translateTimeout = setTimeout(() => {
        const currentText = originalText.value.trim();
        const currentTarlanguage = targetLanguage.value;
        if (currentText !== lastInputText || currentTarlanguage !== lastTargetLanguage) {
            lastInputText = currentText;
            lastTargetLanguage = currentTarlanguage

            detectLanguage();
            autoTranslate();
        }
    }, 500);
};


originalText.addEventListener('input', translateOnTextChange);
targetLanguage.addEventListener('change', translateOnTextChange);
// 手动翻译按钮（后期删掉）
// transButton.addEventListener('click', autoTranslate);

document.addEventListener('DOMContentLoaded', () => {
    setInterval(async () => {
        try {
            const clipboardText = await window.api.getClipboardText();

            if (clipboardText && clipboardText !== lastInputText) {
                originalText.value = clipboardText;
                translateOnTextChange();
            }
        } catch (error) {
            console.error("获取剪贴板内容失败了555", error);
        }
    }, 1000);
})

// document.addEventListener('mouseup', () =>{
//     const selectedText = window.getSelection().toString().trim();
//     if(selectedText){
//         window.api.getSelectedText(selectedText).then((text) => {
//             originalText.value = text;
//         })
//     }
// })



