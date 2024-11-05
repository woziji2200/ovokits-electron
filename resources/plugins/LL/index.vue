<!-- <template>
    <div class="translator">
        
    </div>
</template> -->

<!-- <script setup>
import { ref } from 'vue'
const count = ref(0)
</script> -->
<template>
  <div class="translator">
    <h1>翻译器</h1>
    <!-- 查询输入框 -->
    <input v-model="text" placeholder="请输入要翻译的内容" />
    <!-- 选择目标语言 -->
    <select v-model="targetLanguage">
      <option value="en">英语</option>
      <option value="zh">汉语</option>
      <option value="ko">朝鲜语</option>
      <option value="es">西班牙语</option>
      <option value="fr">法语</option>
      <option value="de">德语</option>
      <!-- 待添加更多语言选项 -->
    </select>

    <!-- 翻译按钮 -->
    <button @click="translateText">翻译</button>
    <!-- <button @click="testAwait">测试</button> -->

    <!-- 翻译结果 -->
    <div v-if="translatedText || testContent" class="result">
      <h2>翻译结果</h2>
      <p>{{ translatedText }}</p>
    </div>
  </div>
</template>

<script setup>

const { ref } = require('vue');
const axios = require('../_libs/axios.js');
// import axios from '../_libs/axios/axios'
// import "../_libs/axios/dist/axios"


const text = ref('')
const targetLanguage = ref('zh')
const translatedText = ref('')
const sourceLanguage = ref('')  //识别输入内容的语言
// const testContent = ref('')


const Deepl_AuthKey = '995e054d-bb05-4d08-a2d2-439c47880c0d:dp'

// 测试请求
const testAwait = async () => {
  try{
    const response = await axios.post(
      'https://jsonplaceholder.typicode.com/posts',
      {
        title: 'test',
        body: 'test内容',
        userId: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("请求成功，返回数据:", response.data);
    testContent.value = JSON.stringify(response.data, null, 2);
  } catch(error){
    console.error("请求失败:", error.message);
    testContent.value = "请求失败请检查控制台";
  }
}

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
        // console.log("得到: ", response.data.translations);
        // console.log("得到: ", response.data.translations[0].text);
        translatedText.value = response.data.translations[0].text;
        sourceLanguage.value = response.data.translations[0].detected_source_language;
      

    }catch (error) {
    console.error("翻译失败:", error.message);
    translatedText.value = "翻译失败，请重试。";
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