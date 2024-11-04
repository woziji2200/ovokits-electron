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
      <option value="es">西班牙语</option>
      <option value="fr">法语</option>
      <option value="de">德语</option>
      <option value="zh">中文</option>
      <!-- 添加更多语言选项 -->
    </select>

    <!-- 翻译按钮 -->
    <button @click="translateText">翻译</button>

    <!-- 翻译结果 -->
    <div v-if="translateText" class="result">
      <h2>翻译结果</h2>
      <p>{{ translatedText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const text = ref('')
const targetLanguage = ref('en')
const translatedText = ref('')
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