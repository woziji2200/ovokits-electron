<template>
    <el-tabs v-model="activeTab" class="tabs" type="border-card">
        <el-tab-pane label="已安装的插件" name="first">
            <el-input v-model="localPluginSearch" placeholder="搜索"></el-input>

            <div v-for="i in localPluginListAll">
                {{ i }}
            </div>
        </el-tab-pane>
        <el-tab-pane label="插件市场" name="second"></el-tab-pane>
    </el-tabs>
</template>

<script setup>
import { ref, watch } from 'vue'

const activeTab = ref('first')
const localPluginSearch = ref('')
const ipcRenderer = window.electron.ipcRenderer
const localPluginListAll = ref([])
localPluginListAll.value = ipcRenderer.sendSync('managementWindow', { data: 'getPluginList' })
const localPluginListShow = ref([])
const localPluginListPage = ref(1)

watch(localPluginSearch, (val) => {
    localPluginListPage.value = 1
    
})
</script>

<style>
.tabs .el-tabs__content{
    overflow: auto;
}
</style>
<style scoped>
.tabs {
    /* margin: 20px; */
    /* margin-top: 10px; */
    height: calc(100vh - 2px);
    overflow: auto;
}

</style>