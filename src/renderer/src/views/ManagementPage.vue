<template>
    <Titlebar title="插件市场" window="managementWindow"></Titlebar>
    <el-tabs v-model="activeTab" class="tabs" type="border-card">
        <el-tab-pane label="已安装的插件" name="first">
            <el-input v-model="localPluginSearch" placeholder="搜索"></el-input>

            <div class="plugins">
                <div class="plugin" v-for="i in localPluginListShow" @click="openPlugin(i.id)">
                    <div class="plugin-left">
                        <img class="plugin-left-img"
                            :src="i.logo ? i.path + '\\' + i.logo : defaultLogo" alt=""
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
        <el-tab-pane label="插件市场" name="second" style="position: relative;">
            <div class="market-loading" v-loading="false"> </div>
            <div class="market-title">
                全部插件
            </div>
            <div class="market-p">
                <div class="market-plugin" v-for="i in 10" v-loading="false">
                    <div class="market-plugin-left">
                        <div class="market-plugin-left-title">插件名</div>
                        <div class="market-plugin-left-author">
                            <span>作者：{{ "123" }}</span>
                            <span>版本：{{ "111" }}</span>
                        </div>
                        <div class="market-plugin-left-desc">{{ "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111" }}</div>
                    </div>
                    <div class="market-plugin-right" v-if="Math.random() > 0.5">
                        下载
                    </div>
                    <div class="market-plugin-right market-plugin-right-install" v-else>
                        已安装
                    </div>
                </div>

            </div>

        </el-tab-pane>
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
const defaultLogo = `data:image/svg+xml;charset=utf-8;base64,PHN2ZyB0PSIxNzM1OTY2MDI4NTUzIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjUyNTMiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cGF0aCBkPSJNNDY4LjY5MzMzMyAxNi43MjUzMzNhODUuMzMzMzMzIDg1LjMzMzMzMyAwIDAgMSA4Mi41NiAwbDM4MS45NTIgMjExLjA3MmE4NS4zMzMzMzMgODUuMzMzMzMzIDAgMCAxIDQ0LjA3NDY2NyA3NC42NjY2Njd2NDE5LjAyOTMzM2E4NS4zMzMzMzMgODUuMzMzMzMzIDAgMCAxLTQ0LjA3NDY2NyA3NC42NjY2NjdsLTM4MS45NTIgMjExLjExNDY2N2E4NS4zMzMzMzMgODUuMzMzMzMzIDAgMCAxLTgyLjU2IDBsLTM4MS45NTItMjExLjA3MkE4NS4zMzMzMzMgODUuMzMzMzMzIDAgMCAxIDQyLjY2NjY2NyA3MjEuNDkzMzMzVjMwMi41MDY2NjdhODUuMzMzMzMzIDg1LjMzMzMzMyAwIDAgMSA0NC4wNzQ2NjYtNzQuNjY2NjY3TDQ2OC42OTMzMzMgMTYuNjgyNjY3eiBtNDIzLjI1MzMzNCAyODUuNzgxMzM0bC0zODEuOTk0NjY3LTIxMS4wNzJMMTI4IDMwMi41MDY2Njd2NDE4Ljk4NjY2NmwzODEuOTUyIDIxMS4wNzIgMzgxLjk5NDY2Ny0yMTEuMDcyVjMwMi41MDY2Njd6IG0tNjg0LjcxNDY2NyA0Mi4xOTczMzNhNDIuNjY2NjY3IDQyLjY2NjY2NyAwIDAgMSA1Ny45ODQtMTYuNzI1MzMzbDI0NC43MzYgMTM1LjI1MzMzMyAyNDQuNzc4NjY3LTEzNS4yNTMzMzNhNDIuNjY2NjY3IDQyLjY2NjY2NyAwIDAgMSA0MS4yNTg2NjYgNzQuNjY2NjY2bC0yNDMuMzcwNjY2IDEzNC41Mjh2MjY4LjE2YTQyLjY2NjY2NyA0Mi42NjY2NjcgMCAwIDEtODUuMzMzMzM0IDBWNTM3LjE3MzMzM0wyMjMuOTE0NjY3IDQwMi42ODhhNDIuNjY2NjY3IDQyLjY2NjY2NyAwIDAgMS0xNi42ODI2NjctNTguMDI2NjY3eiIgZmlsbD0iIzc1QzgyQiIgcC1pZD0iNTI1NCI+PC9wYXRoPjwvc3ZnPg==`

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
    /* background-color: #f0f2f5; */
}

.el-tabs {
    background-image: linear-gradient(to right, #f7faff, #fff) !important;
}

.el-tabs__header {
    background-color: transparent !important;
}

.el-tabs__item.is-active {
    background-color: #ffffff90 !important;
}

.el-input__wrapper {
    background-color: #ffffff90 !important;

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
    border: 1px solid #ccccccb2;
    border-radius: 5px;
    box-shadow: 0 0 5px #cdcdcd78;
    display: flex;
    background-color: #ffffff8d;
    position: relative;
    overflow: hidden;
    transition: all 0.2s;
    backdrop-filter: blur(10px);
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

.market-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100vh - 120px);
    /* background-color: aqua; */
}

.market-title {
    font-size: 36px;
    font-weight: bold;
    padding-left: 20px;
    margin-top: 10px;
}

.market-plugin {
    display: flex;
    align-items: center;
    margin: 10px;
    border: 1px solid #ccccccb2;
    border-radius: 5px;
    box-shadow: 0 0 5px #cdcdcd78;
    background-color: #ffffff8d;
    position: relative;
    overflow: hidden;
    transition: all 0.2s;
    backdrop-filter: blur(10px);
    justify-content: space-between;
    padding: 10px;
    position: relative;
}

.market-plugin-left {
    margin-left: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    width: calc(100% - 200px);
    padding-right: 50px;
}

.market-plugin-left-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
    margin-top: 4px;
}

.market-plugin-left-author {
    font-size: 14px;
    color: #666;
    margin-bottom: 6px;
}
.market-plugin-left-author span {
    margin-right: 10px;
}

.market-plugin-left-desc {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.market-plugin-right {
    padding: 10px 20px;
    background-color: #27acff;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    border-radius: 999px;
    margin-right: 10px;
    width: 60px;
    text-align: center;
}
.market-plugin-right-install{
    background-color: white;
    border: solid 2px #1cbb0d;
    color: #1cbb0d;
}
.market-plugin-right:hover {
    background-color: #27acffcc;
}
.market-plugin-right-install:hover {
    background-color: #f9fff8;
}
.market-p {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}
</style>