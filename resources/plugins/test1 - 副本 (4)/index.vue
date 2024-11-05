<template>
    <div>
        1111
    </div>
    <button @click="api.closeWindow(pid)">asa</button>
    <b1></b1>
</template>

<script setup>
import { ref } from 'vue'
// import b1 from './button.vue'
const api = window.api
const pid = api.getWindowPid(window)
console.log(api.getPluginSettings(pid,'启动器设置2'));

</script>