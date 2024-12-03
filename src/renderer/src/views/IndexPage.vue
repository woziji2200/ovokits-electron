<template>
    <div :class="className">
        <div @mouseenter="mouseenter()" @mouseleave="mouseleave()" class="search">
            <div class="input-div">
                <div class="input-tag" v-if="tagPluginChoose?.name">{{ tagPluginChoose?.name }}</div>
                <input class="input" spellcheck="false" ref="searchInput" type="text" placeholder="Send to OvOKits~"
                    v-model="appSearch" @keydown="onkeydown">
            </div>

            <div class="send">
                <svg t="1728460237868" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="4233">
                    <path
                        d="M946.773333 93.198222c-24.832-32.398222-70.087111-43.932444-120.917333-30.336L147.100444 244.295111c-46.449778 12.458667-77.297778 38.940444-86.840888 74.581333-9.628444 35.939556 4.053333 74.709333 38.528 109.169778l253.411555 253.411556 243.882667 243.868444c27.079111 27.107556 57.045333 41.415111 86.613333 41.415111 45.866667 0 82.218667-33.607111 97.336889-89.912889l180.920889-678.229333c11.136-41.543111 6.115556-78.976-14.179556-105.400889z m-40.775111 90.695111L725.048889 862.136889c-3.854222 14.321778-15.687111 47.715556-42.368 47.715555-13.966222 0-30.449778-8.775111-46.392889-24.746666L412.529778 661.347556l170.965333-170.979556a28.444444 28.444444 0 1 0-40.220444-40.220444L372.309333 621.127111 139.008 387.84c-19.214222-19.214222-27.889778-38.983111-23.808-54.229333 4.010667-14.961778 21.006222-27.491556 46.620444-34.346667L840.590222 117.831111a103.992889 103.992889 0 0 1 26.581334-3.84c10.894222 0 25.699556 2.389333 34.474666 13.838222 9.272889 12.074667 10.808889 31.971556 4.352 56.064z"
                        fill="#515151" p-id="4234"></path>
                    <path
                        d="M742.855111 621.084444a14.307556 14.307556 0 0 0-17.365333 10.197334l-1.464889 5.589333a14.250667 14.250667 0 0 0 27.548444 7.182222l1.464889-5.603555a14.250667 14.250667 0 0 0-10.183111-17.365334zM732.145778 662.357333a14.222222 14.222222 0 0 0-17.351111 10.197334l-30.321778 116.750222a14.222222 14.222222 0 1 0 27.534222 7.139555l30.336-116.750222a14.236444 14.236444 0 0 0-10.197333-17.336889z"
                        fill="#515151" p-id="4235"></path>
                </svg>
            </div>
        </div>

        <div @mouseenter="mouseenter" @mouseleave="mouseleave" class="res">
            <div v-if="isAppRencent && !tagPluginChoose" class="res-item-recent" style="text-align: left;">
                最近使用
            </div>
            <div class="search-res" ref="searchRes">
                <div v-for="i in appShow" :id="i.id"
                    :class="i.id == appSelect ? 'res-item res-item-select' : 'res-item'" @click="openPlugin(i.id)"
                    v-if="!(tagPluginChoose && tagPluginChoose?.render)">
                    <img v-if="i.startType != 'file'"
                        :src="i.logo ? i.path + '/' + i.logo : './../../resources/app.png'" alt="" srcset="">
                    <i class="file-icon" v-if="i.startType == 'file'" :class="getClassWithColor(i.name)"></i>
                    <div class="res-item-title">
                        <div class="res-item-title-1" v-html="searchHighlight(i.name, appSearch, i.id, true)"></div>
                        <div class="res-item-title-2" v-html="searchHighlight(i.desc, appSearch, i.id, false)">
                        </div>
                    </div>
                </div>

                <div v-if="tagPluginChoose && tagPluginChoose?.render" class="iframe-box">
                    <iframe ref="renderIframe" class="iframe"
                        :src="tagPluginChoose.path + '/' + tagPluginChoose.render + `?className=${className}`"
                        frameborder="0"></iframe>
                </div>

                <div class="res-item-no" v-if="appShow.length == 0 && appSearch">
                    搜索结果为空哦
                </div>

                <div class="res-item-no" v-if="appShow.length == 0 && !appSearch">
                    最近没有使用过任何插件哦
                </div>
            </div>
        </div>


    </div>
</template>
<style>
@import url('../../../../node_modules/file-icons-js/css/style.css');
</style>

<script setup>
import { ref, reactive, watch, getCurrentInstance } from 'vue'
import Fuse from 'fuse.js'
import { getClass, getClassWithColor } from 'file-icons-js'

const api = window.api
const pid = 'launcher'
const windowStyle = api.getPluginSettings(pid, '启动器风格')
const className = ref()
className.value = {
    "极简白色": "style-white",
    "极简黑色": "style-black",
    "透明黑色": "style-blur",
}[windowStyle]
console.log(className.value);



const ipcRenderer = window.electron.ipcRenderer
const searchInput = ref()
const searchRes = ref()
ipcRenderer.on('mainWindow', (event, arg) => {
    if (arg.data === 'mainWindowShow') {
        appRecent.value = ipcRenderer.sendSync('mainWindow', { data: 'getAppListRecent' })
        if (appSearch.value === "") {
            appShow.value = appRecent.value
            isAppRencent.value = true
            appSelect.value = appShow.value[0]?.id || '-1'
        }
        searchInput.value.select()
        searchInput.value.focus()
    }
})

// console.log(getClass('index.jsx'));



function mouseenter() {
    ipcRenderer.send('mainWindow', {
        data: 'pointerover',
    })
}
function mouseleave() {
    ipcRenderer.send('mainWindow', {
        data: 'pointerout',
    })
}

const app = ref([])
app.value = ipcRenderer.sendSync('mainWindow', { data: 'getAppList' })
console.log(app);


const appRecent = ref([])
appRecent.value = ipcRenderer.sendSync('mainWindow', { data: 'getAppListRecent' })


const isAppRencent = ref(true)
const appShow = ref([])
const appSearch = ref("")
const appSelect = ref(0)
const tagPluginChoose = ref(null)

const watchSearch = (newVal, oldVal) => {
    if (tagPluginChoose.value && tagPluginChoose.value.render) {
        if(renderIframe.value?.contentWindow){
            renderIframe.value.contentWindow?.postMessage({
                type: 'search',
                search: newVal
            }, '*');
        }
    }


    if (tagPluginChoose.value) {
        appShow.value = [tagPluginChoose.value]
        appSelect.value = tagPluginChoose.value.id
        return
    }
    if (newVal === "") {
        appShow.value = appRecent.value
        isAppRencent.value = true
        appSelect.value = appShow.value[0]?.id || '-1'
        // console.log(appSelect.value, appShow.value[0]?.id);
        return
    }
    isAppRencent.value = false
    // appShow.value = app.value.filter((i) => { return i.name.includes(newVal) || i.desc.includes(newVal) })
    const fuse = new Fuse(app.value, {
        keys: ['name', 'desc'],
    })
    appShow.value = fuse.search(newVal, { limit: 10 }).map(i => i.item)
    // console.log(appShow.value);
    appSelect.value = appShow.value[0]?.id || '-1'
    // console.log(appSelect.value, appShow.value[0]?.id);

}
watch(appSearch, watchSearch, { immediate: true })


const searchHighlight = (value = '', searchValue, id, isTitle) => {

    const appItem = appShow.value.find(i => i.id == id)
    const highlight = value.replace(new RegExp(searchValue, 'i'), (text) => `<span class="highlight">${text}</span>`)

    if (appItem.startType == 'file' && isTitle) {
        return '<span>文件：</span>' + highlight + (appSelect.value == id ? '&nbsp;&nbsp;<span style="color: var(--title-2)">Enter to select</span>' : '')
    } else if (appItem.startType == 'file' && !isTitle) {
        return appItem.path
    }
    if (isTitle) {
        return highlight + (appSelect.value == id ? '&nbsp;&nbsp;<span style="color: var(--title-2)">Enter to select</span>' : '')
    } else {
        return highlight + '&nbsp;&nbsp;<span style="color: var(--title-2)">作者: ' + appItem.author + '</span>'
    }
}

const renderIframe = ref()
const onkeydown = (event) => {
    if (tagPluginChoose.value && tagPluginChoose.value.render) {
        if(renderIframe.value?.contentWindow){
            renderIframe.value.contentWindow?.postMessage({
                type: 'keydown',
                key: event.key
            }, '*');
        }

        if (tagPluginChoose.value.canHandlerKeydown && event.key !== 'Escape' && event.key !== 'Backspace') {
            return
        }
    }

    if (event.key == 'ArrowUp' && !tagPluginChoose.value) {
        event.preventDefault()
        appSelect.value = appShow.value[appShow.value.findIndex(i => i.id == appSelect.value) - 1]?.id || appShow.value[appShow.value.length - 1].id
        document.getElementById(appSelect.value).scrollIntoView({ block: 'center', behavior: 'smooth' })

    } else if (event.key == 'ArrowDown' && !tagPluginChoose.value) {
        event.preventDefault()
        appSelect.value = appShow.value[appShow.value.findIndex(i => i.id == appSelect.value) + 1]?.id || appShow.value[0].id
        document.getElementById(appSelect.value).scrollIntoView({ block: 'center', behavior: 'smooth' })

    } else if (event.key == 'Escape') {
        ipcRenderer.send('mainWindow', {
            data: 'hide',
        })
    } else if (event.key == 'Enter') {
        openPlugin(appSelect.value)
    } else if (event.key == 'ArrowRight') {
        if (!tagPluginChoose.value) {
            const appNow = appShow.value.find(i => i.id == appSelect.value)
            console.log(appNow);

            if (appNow.startType !== 'file' && appNow.hasParam) {
                tagPluginChoose.value = appNow
                appSearch.value = ''
                watchSearch(appSearch.value, appSearch.value)
            }
        }
    } else if (event.key == 'Backspace') {
        if (tagPluginChoose.value && searchInput.value.selectionStart == 0 && searchInput.value.selectionEnd == 0) {
            tagPluginChoose.value = null
            // 触发watch
            watchSearch(appSearch.value, appSearch.value)
        }
    } else {
        searchRes.value.scrollTop = 0
    }
}

const openPlugin = (id) => {
    ipcRenderer.send('mainWindow', {
        data: 'openApp',
        id: id,
        param: tagPluginChoose.value ? appSearch.value : null
    })
}


</script>

<style>
.style-white {
    --hight-color: #98b9ff;
    --select-bg: #f1f1f1;
    --search-input-bg: #fff;
    --search-input-color: #555;
    --search-send-bg: #f8f8f8;
    --search-send-bg-hover: #f1f1f1;
    --select-bg-hover: #f1f1f1;
    --title-1: #333;
    --title-2: #555;
    --search-send-color: #555;
}

.style-black {
    --hight-color: #6578a0;
    --select-bg: #4b4b4b;
    --search-input-bg: #333;
    --search-input-color: #fff;
    --search-send-bg: #444;
    --search-send-bg-hover: #555;
    --select-bg-hover: #4b4b4b;
    --title-1: #fff;
    --title-2: #ccc;
    --search-send-color: #fff;
}

.style-blur {
    --hight-color: #5ec1ff;
    --select-bg: #00000074;
    --search-input-bg: #00000074;
    --search-input-color: #fff;
    --search-send-bg: #00000074;
    --search-send-bg-hover: #000000;
    --select-bg-hover: #00000074;
    --title-1: #fff;
    --title-2: #ffffffa9;
    --search-send-color: #fff;
}

.style-blur .input::placeholder {
    /* placeholder color */
    color: #fff;
}

.style-blur * {
    text-shadow: 0 0 10px #000;
}




.highlight {
    color: var(--hight-color)
}

.res-item-select {
    background-color: var(--select-bg);
    position: relative;
    /* border: solid 1px #0000001e; */
}

.res-item-select::before {
    content: '';
    position: absolute;
    width: 2px;
    height: 100%;
    background-color: var(--hight-color);
    left: 0;
    top: 0;
}
</style>

<style scoped>
.file-icon {
    width: 40px;
    height: 40px;
    margin: 10px;
    margin-right: 10px;
    font-weight: bolder;
    display: flex;
    justify-content: center;
    align-items: center;
    font-style: normal;
}

.file-icon::before {
    font-size: 26px;
}

.search {
    background-color: var(--search-input-bg);
    border-radius: 5px;
    margin: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    /* width: 100%; */
    height: 50px;
    box-shadow: #00000028 0px 0px 10px;
}

.search .input-div {
    flex: 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.search .input-tag {
    font-size: 20px;
    height: 30px;
    line-height: 30px;
    font-weight: 100;
    color: var(--search-input-color);
    background-color: var(--search-send-bg);
    border-radius: 5px;
    padding: 0 10px;
    margin-left: 10px;
}

.search .input {
    flex: 1;
    margin-left: 10px;
    margin-right: 10px;
    height: 40px;
    background-color: transparent;
    /* background-color: aqua; */
    border: none;
    font-size: 22px;
    font-weight: 100;
    color: var(--search-input-color)
}

.search .input::selection {
    background-color: var(--hight-color);
    color: var(--search-input-bg)
}

.search .input:focus {
    outline: none;
}

.search .send {
    width: 60px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--search-send-bg);
    border-radius: 5px;
    margin-right: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.search .send:hover {
    background-color: var(--search-send-bg-hover);
}

.search .send svg {
    width: 20px;
    height: 20px;
}

.search .send svg path {
    fill: var(--search-send-color);
}



.res {
    background-color: var(--search-input-bg);
    border-radius: 5px;
    margin: 10px 20px;
    /* overflow: scroll; */
    overflow-y: auto;
    overflow-x: hidden;
    /* width: 100%; */
    /* height: 1000px; */
    max-height: calc(100vh - 100px);
    box-shadow: #00000028 0px 0px 10px;
    user-select: none;
}

.res::-webkit-scrollbar {
    width: 3px;
    /* height: 10px; */
}

.res::-webkit-scrollbar-thumb {
    background-color: #00000073;
    border-radius: 10px;
}

.res::-webkit-scrollbar-track {
    background-color: #00000027;
}

.search-res {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    margin: 10px;
}

.res-item {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    cursor: pointer;
    width: 100%;
    border-radius: 5px;
    /* transition: all 0.15s; */
    margin-bottom: 5px;
}

.res-item:last-child {
    margin-bottom: 0;
}



.res-item:hover {
    background-color: var(--select-bg-hover);
}

.res-item img {
    width: 40px;
    height: 40px;
    border-radius: 5px;
    margin-right: 10px;
    margin: 10px;
}

.res-item-title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    margin: 10px;
}

.res-item-title-1 {
    font-size: 18px;
    font-weight: 500;
    color: var(--title-1);
    /* 不允许换行 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

}

.res-item-title-2 {
    font-size: 14px;
    font-weight: 100;
    color: var(--title-2);
    /* 不允许换行 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.res-item-no {
    text-align: center;
    width: 100%;
    color: var(--title-2);
    margin-top: 20px;
    margin-bottom: 20px;
}

.res-item-recent {
    color: var(--title-2);
    margin-top: 10px;
    margin-left: 10px;
}

.iframe {
    width: 100%;
    height: 270px;
    border: none;
}

.iframe-box {
    width: 100%;
    height: 100%;
    border: none;
}
</style>