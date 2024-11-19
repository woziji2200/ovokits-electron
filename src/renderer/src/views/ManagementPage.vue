<template>
    <Titlebar title="插件市场" window="managementWindow"></Titlebar>
    <el-tabs v-model="activeTab" class="tabs" type="border-card">
        <el-tab-pane label="已安装的插件" name="first">
            <el-input v-model="localPluginSearch" placeholder="搜索"></el-input>

            <div class="plugins">
                <div class="plugin" v-for="i in localPluginListShow" @click="openPlugin(i.id)">
                    <div class="plugin-left">
                        <img class="plugin-left-img"
                            :src="i.logo ? i.path + '\\' + i.logo : './../../resources/app.png'" alt=""
                            style="width: 100%; height: 100%;">
                    </div>
                    <div class="plugin-right">
                        <div class="plugin-title">{{ i.name }}</div>
                        <div class="plugin-author">作者：{{ i.author }}</div>
                        <div class="plugin-description">简介：{{ i.desc }}</div>
                        <div class="plugin-version">版本：{{ i.version }}</div>
                    </div>

                    <div class="plugin-ghost" @click.stop>
                        <div class="plugin-ghost-tools">
                            <el-tooltip content="插件设置" placement="right-start">
                                <div class="plugin-ghost-tool" @click="openPluginSetting(i.id)" v-if="hasSetting(i.id)">
                                    <el-icon color="#27acff">
                                        <Setting />
                                    </el-icon>
                                </div>
                            </el-tooltip>

                            <el-tooltip content="打开插件文件夹" placement="right-start">
                                <div class="plugin-ghost-tool" @click="openPluginDir(i.id)">
                                    <el-icon color="#27acff">
                                        <Folder />
                                    </el-icon>
                                </div>
                            </el-tooltip>


                            <el-popconfirm title="确认删除此插件吗" @confirm="deletePlugin(i.id)">
                                <template #reference>
                                    <div class="plugin-ghost-tool">
                                        <el-tooltip content="删除插件" placement="right-start">
                                            <el-icon color="#ff2b27">
                                                <Delete />
                                            </el-icon>
                                        </el-tooltip>
                                    </div>
                                </template>
                            </el-popconfirm>

                        </div>
                    </div>
                </div>
            </div>
        </el-tab-pane>
        <el-tab-pane label="插件市场" name="second"></el-tab-pane>
    </el-tabs>
</template>

<script setup>
import { ElMessage } from 'element-plus';
import { ref, watch } from 'vue'
import Titlebar from '../components/Titlebar.vue';
document.title = '插件市场'
const activeTab = ref('first')
const localPluginSearch = ref('')
const ipcRenderer = window.electron.ipcRenderer
const localPluginListAll = ref([])
localPluginListAll.value = ipcRenderer.sendSync('managementWindow', { data: 'getPluginList' })
const localPluginListShow = ref([])
localPluginListShow.value = localPluginListAll.value
const localPluginListPage = ref(1)
console.log(localPluginListAll.value)
const fs = window.api.fs


watch(localPluginSearch, (val) => {
    localPluginListShow.value = localPluginListAll.value.filter(i => i.name.includes(val))
})
function deletePlugin(id) {
    const plugin = localPluginListAll.value.find(i => i.id === id)
    try {
        fs.rmSync(plugin.path, { recursive: true })
        localPluginListAll.value = ipcRenderer.sendSync('managementWindow', { data: 'getPluginList' })
        localPluginListShow.value = localPluginListAll.value.filter(i => i.name.includes(localPluginSearch.value))
        ElMessage.success('删除成功')
    } catch (error) {
        console.log(error)
        ElMessage.error('删除失败：' + error)
    }
}
function openPluginDir(id) {
    const plugin = localPluginListAll.value.find(i => i.id === id)
    window.api.shell.openPath(plugin.path)
}

function openPlugin(id) {
    ipcRenderer.send('mainWindow', {
        data: 'openApp',
        id: id
    })
}

function hasSetting(id) {
    const plugin = localPluginListAll.value.find(i => i.id === id)
    return fs.existsSync(plugin.path + '/settings.json')
}

function openPluginSetting(id) {
    const plugin = localPluginListAll.value.find(i => i.id === id)
    ipcRenderer.send('managementWindow', {
        data: 'openSettingsWindow',
        id: id,
    })
}
</script>

<style>
.tabs .el-tabs__content {
    overflow: auto;
}

.el-tabs__content {
    background-color: #f0f2f5;
}

body {
    user-select: none;
}
</style>
<style scoped>
.tabs {
    /* margin: 20px; */
    /* margin-top: 10px; */
    height: calc(100vh - 42px);
    overflow: auto;
}

.plugins {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.plugin {
    height: 140px;
    margin: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-shadow: 0 0 5px #ccc;
    display: flex;
    background-color: #fff;
    position: relative;
    overflow: hidden;
    transition: all 0.2s;
}

.plugin:hover .plugin-ghost {
    right: 0;
}

.plugin:hover {
    box-shadow: 0 0 10px #ccc;
    transform: scale(1.02);
}

.plugin-left {
    margin-left: 20px;
    width: 100px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.plugin-left-img {
    width: 100%;
    height: auto !important;
    /* height: 100%; */
}

.plugin-right {
    flex: 1;
    padding: 20px;
}

.plugin-title {
    font-size: 20px;
    font-weight: bold;
}

.plugin-description {
    font-size: 14px;
    color: #666;
}

.plugin-version {
    font-size: 12px;
    color: #999;
}

.plugin-author {
    font-size: 14px;
    color: #666;
}

.plugin-ghost {
    transition: all 0.2s;
    position: absolute;
    top: 0;
    right: -100px;
    bottom: 0;
    width: 60px;
    font-size: 20px;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgb(244, 244, 244));
}

.plugin-ghost-tools {
    position: absolute;
    top: 15px;
    right: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.plugin-ghost-tool {
    cursor: pointer;
}
</style>