<template>
    <div class="titlebar">
        <div class="left">
            <div>{{ props.title }}</div>
        </div>
        <div class="mid"></div>
        <div class="right">
            <div @click="min">
                <el-icon>
                    <Minus />
                </el-icon>
            </div>
            <div @click="max">
                <svg t="1732004659649" style="width: 14px; height: 14px" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="8054">
                    <path
                        d="M853.504 170.496v682.496H170.496V170.496h683.008m4.096-64h-691.2c-32.768 0-59.392 26.624-59.392 59.392v691.712c0 32.768 26.624 59.392 59.392 59.392h691.712c32.768 0 59.392-26.624 59.392-59.392v-691.2c0-33.28-26.624-59.904-59.904-59.904 0.512 0 0 0 0 0z"
                        p-id="8055"></path>
                </svg>
            </div>
            <div class="close" @click="close">
                <el-icon>
                    <Close />
                </el-icon>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue';
const props = defineProps(['title', 'window']);
const ipcRenderer = window.electron.ipcRenderer;
const min = () => {
    ipcRenderer.send(props.window, {
        data: "ctrlWindow",
        type: "minimize"
    });
}
const max = () => {
    ipcRenderer.send(props.window, {
        data: "ctrlWindow",
        type: "maximize"
    });
}
const close = () => {
    ipcRenderer.send(props.window, {
        data: "ctrlWindow",
        type: "close"
    });
}
</script>

<style scoped>
.titlebar {
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.left {
    display: flex;
}

.left div {
    font-size: 16px;
    color: #666;
    margin-left: 20px;
}

.mid {
    -webkit-app-region: drag;
    flex: 1;
    width: 100%;
    height: 100%;
}

.right {
    display: flex;
    height: 100%;
}

.right div {
    font-size: 16px;
    color: #666;
    /* margin-right: 5px; */
    width: 60px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
}

.right div:hover {
    background-color: #f0f0f0;
}

.close:hover {
    background-color: #ff4141 !important;
    color: #fff;
}
</style>