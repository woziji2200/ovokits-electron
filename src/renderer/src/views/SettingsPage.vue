<template>
    <Titlebar title="插件设置" window="settingsWindow"></Titlebar>
    <div class="main">
        <el-container >
            <el-aside width="200px">
                <el-menu active-text-color="#0073ff" active-background-color="#0010ff" background-color="#fff" class="el-menu-vertical-demo"
                    :default-active="defaultActive" text-color="#666" style="height: 100%;padding-top: 10px;">
                    <el-menu-item class="el-menu-item" v-for="(i, index) in plugins" :index="index"
                        @click="currentPluginSettings = i">
                        <div style="text-align: center;">{{ i.name }}</div>
                    </el-menu-item>
                </el-menu>
            </el-aside>
            <el-container style="height: calc(100vh - 41px);">
                <el-header>
                    <div class="search">
                        <span>搜索设置项：</span>
                        <el-input v-model="search" placeholder="请输入搜索内容"></el-input>
                    </div>
                </el-header>
                <el-main>
                    <div>
                        <div v-for="(settingValue, settingKey) in searchSetting(currentPluginSettings.settings)" class="setting-card">
                            <div v-if="settingValue.type == 'divider'" class="setting-divider">{{ settingKey }}</div>
                            <el-card shadow="hover" v-if="settingValue.type != 'divider'">
                                <template #header><span class="setting-title">{{ settingKey }}</span></template>
                                <template v-if="settingValue.desc" #footer><span class="setting-desc">{{
                                    settingValue.desc }}</span></template>
                                <div v-if="settingValue.type == 'input'">
                                    <el-input v-model="settingValue.value"
                                        :placeholder="settingValue.placeholder || ''"></el-input>
                                </div>
                                <div v-if="settingValue.type == 'select'">
                                    <el-select v-model="settingValue.value" placeholder="请选择">
                                        <el-option v-for="item in settingValue.options" :key="item" :label="item"
                                            :value="item">
                                        </el-option>
                                    </el-select>
                                </div>
                                <div v-if="settingValue.type == 'checkbox'">
                                    <el-checkbox v-model="settingValue.value" :label="settingValue.label" border />
                                </div>


                            </el-card>
                        </div>

                    </div>
                </el-main>
                <el-footer>
                    <div class="save">
                        <el-button type="primary" @click="save">保存</el-button>
                    </div>
                </el-footer>
            </el-container>
        </el-container>
    </div>
</template>


<script setup>
import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import Titlebar from '../components/Titlebar.vue';
const ipcRenderer = window.electron.ipcRenderer
document.title = '插件设置'
const search = ref('')
const plugins = ref([])
plugins.value=plugins.value.concat(ipcRenderer.sendSync('settingsWindow', { data: 'getSettingsList' }))
console.log(plugins.value);
const params = new URLSearchParams(window.location.search);
const pluginId = params.get('pluginId');
const currentPluginSettings = ref(plugins.value[0])
const defaultActive = ref(0)
if (pluginId) {
    const plugin = plugins.value.find(i => i.id == pluginId)
    console.log(plugins.value);   
    if (plugin) {
        currentPluginSettings.value = plugin
        defaultActive.value = plugins.value.indexOf(plugin)
    }
}
function searchSetting(settings) {
    if(search.value == '') {
        return settings
    }
    const result = {}
    for (const key in settings) {
        if (Object.hasOwnProperty.call(settings, key)) {
            const element = settings[key];
            if (element.type == 'divider') {
                continue
            } else {
                if (key.includes(search.value)) {
                    result[key] = element
                }
            }
        }
    }
    return result
}

function save() {
    let res = ipcRenderer.sendSync('settingsWindow', {
        data: 'saveSettings',
        path: currentPluginSettings.value.path,
        settings: JSON.stringify(currentPluginSettings.value.settings,null, 4)
    })
    if(currentPluginSettings.value.path == 'launcher'){
        ipcRenderer.send('settingsWindow', {
            data: 'reloadSettings'
        })
    }
    if(res == 'success') {
        ElNotification({
            title: '保存成功',
            type: 'success'
        })
    } else {
        ElNotification({
            title: '保存失败',
            type: 'error',
            message: res.message
        })
    }
}
</script>

<style scoped>
.main {
    /* height: calc(100vh - 42px); */
    /* width: 100vw; */
    border-top: solid 1px #ddd;
    position: relative;
}

.setting-card {
    margin-bottom: 20px;
}

.setting-card * {
    padding: 5px;
    /* color: #0073ff; */
}

.setting-title {
    font-size: 14px;
}

.setting-desc {
    font-size: 12px;
    color: #666;
}

.setting-divider {
    font-size: 18px;
    margin-top: 8px;
    margin-bottom: 8px;
    padding: 0;
    font-weight: bold;
}

.el-menu-item {
    display: flex;
    justify-content: center;
    align-items: center;
}

.search {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
}

.search span {
    width: 100px;
    font-size: 14px;
    color: #666;
}

.save {
    display: flex;
    justify-content: right;
    align-items: center;
    height: 100%;
}
</style>
