<template>
    <canvas id="canvas"></canvas>
    <div @mouseenter="mouseenter()" @mouseleave="mouseleave()" class="tool">
        <button @click="modelMove()">移动</button>
    </div>
</template>

<script setup>
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import { nextTick } from 'vue';
window.PIXI = PIXI;
const ipcRenderer = window.electron.ipcRenderer
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
function modelMove() {
    ipcRenderer.send('mainWindow', {
        data: 'modelMove'
    })
}

/**
 * 
 * @param {PIXI.Application} app
 * @param {Live2DModel} sprite 
 */
function resizeModel(app, sprite) {
    sprite.anchor.set(0.5, 0.5);
    sprite.x = app.screen.width / 2;
    sprite.y = app.screen.height / 2;
    const screenRatio = app.screen.width / app.screen.height;
    // 获取精灵的宽高比
    const spriteRatio = sprite.width / sprite.height;
    // 根据画布的宽高比和元素的宽高比来调整大小
    if (screenRatio > spriteRatio) {
        // 如果画布比精灵宽，那么设置宽度占满，按比例调整高度
        sprite.width = app.screen.width;
        sprite.height = app.screen.width / spriteRatio;
    } else {
        // 如果画布比精灵高，那么设置高度占满，按比例调整宽度
        sprite.height = app.screen.height;
        sprite.width = app.screen.height * spriteRatio;
    }
    // 确保精灵始终在画布中心
    sprite.x = app.screen.width / 2;
    sprite.y = app.screen.height / 2;

}

nextTick(async () => {
    const app = new PIXI.Application({
        view: document.getElementById('canvas'),
        backgroundAlpha: 0,
        autoStart: true,
        width: window.innerWidth - 40,
        height: window.innerHeight - 30,
    });


    const model = await Live2DModel.from('E:\\Code_project\\Electron\\一些模型model\\runtime\\mao_pro.model3.json');
    resizeModel(app, model)
    model.interactive = true
    // 交互
    model.on('hit', (hitAreas) => {
        if (hitAreas.includes('body')) {
            model.motion('tap_body');
        } else if (hitAreas.includes("head")) {
            model.motion('tap_head')
        }
    });
    model.on('pointerdown', (event) => {
        // e.stopPropagation()
        const sprite = model
        const globalPos = event.data.global;

        // // 将全局坐标转换为相对于精灵的局部坐标
        const localPos = sprite.toLocal(globalPos);
        console.log(globalPos, localPos, app.renderer.width);

        // // 获取精灵的宽高
        // const { width, height } = sprite;

        // // 确保点击的位置在精灵范围内
        // const x = Math.floor(globalPos.x);
        // const y = Math.floor(globalPos.y);
        // app.render()
        // const pixels = app.renderer.plugins.extract.pixels(sprite);
        // console.log(pixels);

        var extract = app.renderer.plugins.extract;
        var canvas = extract.canvas();
        const context = canvas.getContext("2d");
        var rgba = context.getImageData(app.renderer.width - 100 - 1, app.renderer.height - 100 - 1, 1, 1).data;
        console.log(rgba);
        
        

    })
    model.on('pointerover', () => {
        mouseenter()
    })
    model.on('pointerout', () => {
        mouseleave()
    })

    app.stage.addChild(model);
    app.stage.interactive = true
    app.stage.hitArea = new PIXI.Rectangle(0, 0, 1000, 1000)
    console.log(model);
    

})

</script>

<style scoped>
.tool {
    position: absolute;
    right: 0;
    top: 0;
}
</style>