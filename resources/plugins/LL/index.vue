<template>
  <div class="translator">
    <h1>翻译器</h1>
    <!-- 查询输入框 -->
    <input v-model="text" placeholder="请输入要翻译的内容" />
    <!-- 选择目标语言 -->
    <select v-model="targetLanguage">
      <option value="en">英语</option>
      <option value="zh">汉语</option>
      <!-- <option value="ko">朝鲜语</option> -->
      <option value="spa">西班牙语</option>
      <option value="fra">法语</option>
      <option value="de">德语</option>
      <!-- 待添加更多语言选项 -->
    </select>

    <!-- 翻译按钮 -->
    <button @click="translateText">Deepl翻译</button>
    <button @click="transText">百度翻译</button>


    <!-- 翻译结果 -->
    <div v-if="translatedText || translatedText_1" class="result">
      <h2>DeepL翻译结果</h2>
      <p>{{ translatedText }}</p>

      <h2>百度翻译结果</h2>
      <p>{{ translatedText_1 }}</p>
    </div>
  </div>
</template>

<script setup>
// import { app } from 'electron';


const { ref } = require('vue');
const axios = require('../_libs/axios.js');
// const md5 = require('../_libs/md5.js')
// const md5 = require('../_libs/md5.min.js')
// import { md5 } from './md5.js';
// import axios from '../_libs/axios/axios'
// import "../_libs/axios/dist/axios"


const text = ref('')
const targetLanguage = ref('zh')
const translatedText = ref('')
const translatedText_1 = ref('')
const sourceLanguage = ref('')  //识别输入内容的语言

const appid = '20241106002195901'
const key = 'CGnCZrdxYoOplaNBEK8Q'

const Deepl_AuthKey = '995e054d-bb05-4d08-a2d2-439c47880c0d:dp'

// 翻译文本
const translateText = async () => {
    // console.log("translateText开始");
    // console.log("targetLanguage：", targetLanguage.value);
    // console.log("text：", text.value);

    if(!text.value){
        translatedText.value = "请输入内容进行翻译！";
        return;
    }

    try{
        const response = await axios.post(
            'https://api.deepl-pro.com/v2/translate',
            new URLSearchParams({
                text: text.value,
                target_lang: targetLanguage.value
            }),
            
            {
                headers:{
                    'Authorization': `DeepL-Auth-Key ${Deepl_AuthKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        translatedText.value = response.data.translations[0].text;
        sourceLanguage.value = response.data.translations[0].detected_source_language;
      

    }catch (error) {
    console.error("翻译失败:", error.message);
    translatedText.value = "翻译失败，请重试。";
    sourceLanguage.value = '';
    }
}


const getSign = (salt) => {
    const signString = appid + text.value + salt + key;
    const resSign = window.api.md5(signString);
    return resSign;
};


const transText = async () =>{
    if(!text.value){
        translatedText_1.value = "请输入内容进行翻译！";
        return;
    }

    try{
        const salt = Date.now().toString();
        
        const response = await axios.post(
            'https://fanyi-api.baidu.com/api/trans/vip/translate',
            {
              appid: appid,
              q: encodeURIComponent(text.value),
              from: 'auto',
              to: targetLanguage.value,
              salt: salt,
              sign: getSign(salt),
            },
            {
                headers:{
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        console.log("翻译结果: ", response.data);
        translatedText_1.value = response.data.trans_result[0].dst;
    }catch (error) {
    console.error("翻译失败:", error.message);
    translatedText_1.value = "翻译失败，请重试。";
    sourceLanguage.value = '';
    }
}



</script>

<style scoped>
.translator {
  display: flex;
  flex-direction: column;
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
}
input, select, button {
  margin: 10px 0;
  padding: 8px;
  font-size: 1rem;
}

.result {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}
</style>