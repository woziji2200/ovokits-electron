<template>
    <div>
        1111
    </div>
    <button @click="api.closeWindow(pid)">asa</button>
    <b1></b1>
</template>

<script setup>
import { ref } from 'vue'
// import md5 from '../_libs/md5/md5.min.js'
// import axios from '../_libs/axios/'
const axios = require('../_libs/axios.js')
// const md5 = new MD5()
console.log(window.api.md5('123456'));

// import b1 from './button.vue'
const api = window.api
const pid = api.getWindowPid(window)
console.log(api.getPluginSettings(pid,'启动器设置2')); 
api.on(pid, 'move', () => {
    console.log('窗口移动位置');
})


</script>