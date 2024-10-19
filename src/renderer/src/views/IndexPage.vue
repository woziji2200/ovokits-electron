<template>
    <div @mouseenter="mouseenter()" @mouseleave="mouseleave()" class="search">
        <input class="input" spellcheck="false" ref="searchInput" type="text" placeholder="Send to OvOKits~"
            v-model="appSearch" @keydown="onkeydown">
        <div class="send">
            <svg t="1728460237868" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
                p-id="4233">
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
        <div v-if="isAppRencent" class="res-item-recent" style="text-align: left;">
            最近使用
        </div>
        <div class="search-res">
            <div v-for="i in appShow" :key="i.id" :class="i.id == appSelect ? 'res-item res-item-select' : 'res-item'">
                <img src="./../../resources/app.png" alt="" srcset="">
                <div class="res-item-title">
                    <div class="res-item-title-1" v-html="searchHighlight(i.name, appSearch, i.id, true)"></div>
                    <div class="res-item-title-2" v-html="searchHighlight(i.desc, appSearch, i.id, false)"></div>
                </div>
            </div>

            <div class="res-item-no" v-if="appShow.length == 0 && appSearch">
                搜索结果为空哦
            </div>

            <div class="res-item-no" v-if="appShow.length == 0 && !appSearch">
                最近没有使用过任何插件哦
            </div>
        </div>
    </div>

</template>

<script setup>
import { ref, reactive, watch } from 'vue'
const ipcRenderer = window.electron.ipcRenderer
const searchInput = ref()
ipcRenderer.on('mainWindow', (event, arg) => {
    if (arg.data === 'mainWindowShow') {
        searchInput.value.select()
        searchInput.value.focus()
        appRecent.value = ipcRenderer.sendSync('mainWindow', { data: 'getAppListRecent' })
    }
})


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


const appRecent = ref([])
appRecent.value = ipcRenderer.sendSync('mainWindow', { data: 'getAppListRecent' })


const isAppRencent = ref(true)
const appShow = ref([])
const appSearch = ref("")
const appSelect = ref(0)
watch(appSearch, (newVal, oldVal) => {
    if (newVal === "") {
        appShow.value = appRecent.value
        isAppRencent.value = true
        appSelect.value = appShow.value[0]?.id || '-1'
        console.log(appSelect.value, appShow.value[0]?.id);
        return
    }
    isAppRencent.value = false
    appShow.value = app.value.filter((i) => { return i.name.includes(newVal) || i.desc.includes(newVal) })
    appSelect.value = appShow.value[0]?.id || '-1'
    console.log(appSelect.value, appShow.value[0]?.id);

}, { immediate: true })


const searchHighlight = (value, searchValue, id, isTitle) => {
    const appItem = appShow.value.find(i => i.id == id)
    const highlight = value.replace(new RegExp(searchValue, 'i'), (text) => `<span class="highlight">${text}</span>`)
    if (isTitle) {
        return highlight + '&nbsp;&nbsp;<span style="color: #888">Enter to select</span>'
    } else {
        return highlight + '&nbsp;&nbsp;<span style="color: #888">作者: ' + appItem.author + '</span>'
    }
}

const onkeydown = (event) => {
    if (event.key == 'ArrowUp') {
        appSelect.value = appShow.value[appShow.value.findIndex(i => i.id == appSelect.value) - 1]?.id || appShow.value[appShow.value.length - 1].id
    } else if (event.key == 'ArrowDown') {
        appSelect.value = appShow.value[appShow.value.findIndex(i => i.id == appSelect.value) + 1]?.id || appShow.value[0].id
    } else if (event.key == 'Escape') {
        ipcRenderer.send('mainWindow', {
            data: 'hide',
        })
    } else if (event.key == 'Enter') {
        ipcRenderer.send('mainWindow', {
            data: 'openApp',
            id: appSelect.value
        })
    }

}

</script>

<style>
.highlight {
    color: #98b9ff;
}

.res-item-select {
    background-color: #f1f1f1;
    /* border: solid 1px #0000001e; */
}
</style>

<style scoped>
.search {
    background-color: #fff;
    border-radius: 5px;
    margin: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    /* width: 100%; */
    height: 50px;
    box-shadow: #00000028 0px 0px 10px;
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
    color: #555;
}

.search .input::selection {
    background-color: #98b9ff;
    color: white;
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
    background-color: #f8f8f8;
    border-radius: 5px;
    margin-right: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.search .send:hover {
    background-color: #f1f1f1;
}

.search .send svg {
    width: 20px;
    height: 20px;
}



.res {
    background-color: #fff;
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
    background-color: #f1f1f1;
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
    color: #333;
}

.res-item-title-2 {
    font-size: 14px;
    font-weight: 100;
    color: #555;
}

.res-item-no {
    text-align: center;
    width: 100%;
    color: #555;
    margin-top: 20px;
    margin-bottom: 20px;
}

.res-item-recent {
    color: #555;
    margin-top: 10px;
    margin-left: 10px;
}
</style>