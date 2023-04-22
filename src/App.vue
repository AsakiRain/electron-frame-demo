<script setup lang="ts">
import { onMounted, ref } from "vue";
import HelloWorld from "./components/HelloWorld.vue";

console.log(
  "[App.vue]",
  `Hello world from Electron ${process.versions.electron}!`
);

import { ipcRenderer } from "electron";         // 导入renderer进程的ipc通信模块

const sendIpcMessage = (message: string) => {   // 封装发送ipc消息的方法，这个做法并不安全，攻击者可以借此向后端发送任何指令
  ipcRenderer.send(message);                    // send方法的第一个参数是消息通道，可以理解为事件名，后续参数会被收集到args中
};                                              // 后端的ipcMain可以监听到这个消息通道，具体实现在/electron/main/index.ts

const handle_reload = () => {                   // 刷新窗口是浏览器环境就可以完成的，不用传递给后端
  window.location.reload();
};

const message_container = ref<HTMLElement>();   // ref获取dom元素，这里是textarea

const get_message = async () => {               // 通过注册invoke事件监听器，获取后端传递的消息
  const raw_message = await ipcRenderer.invoke("get-message");
  const message = JSON.parse(raw_message);      // ipc只能传递基本数据对象，所以后端传递了一个字符串，需要解析成对象
  console.log("message", message);

  if (!message_container.value) return;
  message_container.value.innerHTML = JSON.stringify(message, null, 4); // 这里用innerHTML可以保留换行格式，但是不安全
};

onMounted(async () => {
  await get_message();                          // 挂载组件后立即尝试获取信息
});
</script>

<template>
  <header>
    <!-- 整个header都是drag区域，但是单独排除了按钮部分用于响应点击 -->
    <span class="title">Hello Electron</span>
    <!-- 偷懒给padder设置flex-grow，撑开标题和按钮区域 -->
    <span class="padder"></span>
    <span class="window-toolbar">
      <!-- 项目安装了 unocss 的 presetIcons 预设，并且安装了 @iconify-json/mdi，所以可以直接给 div 应用图标的 class 来快速引用图标 -->
      <!-- 实际实现方法是将 div 的背景设置为指定颜色，把图标的 svg 轮廓作为裁剪路径，把图形切出来 -->
      <!-- 但是这样导致我不能直接给图标设置 :hover 的 background-color ，因此我被迫在外面套了一层 span -->
      <!-- mdi是一套material design的图标，可以在 https://pictogrammers.com/library/mdi/ 查看更多图标-->
      <span @click="handle_reload">
        <div class="i-mdi-refresh"></div>
      </span>
      <span @click="sendIpcMessage('open-devtool')">
        <div class="i-mdi-tools"></div>
      </span>
      <span @click="sendIpcMessage('toggle-pin')">
        <div class="i-mdi-pin"></div>
      </span>
      <span @click="sendIpcMessage('minimize')">
        <div class="i-mdi-window-minimize"></div>
      </span>
      <span @click="sendIpcMessage('maximize')">
        <div class="i-mdi-window-maximize"></div>
      </span>
      <span @click="sendIpcMessage('close')">
        <div class="i-mdi-window-close"></div>
      </span>
    </span>
  </header>
  <div>
    <!-- 这里有个注意点，如果不设置target=_blank，网址会在我们自己的程序里打开 -->
    <!-- 这样就搞砸了，不容易返回，而且如果这个网站里有恶意代码，就可能通过后端破坏我们的电脑 -->
    <a href="https://www.electronjs.org/" target="_blank">
      <img
        src="./assets/electron.svg"
        class="logo electron"
        alt="Electron logo"
      />
    </a>
    <a href="https://vitejs.dev/" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Electron + Vite + Vue" />
  <textarea ref="message_container"></textarea>
  <div class="flex-center">
    Place static files into the <code>/public</code> folder
    <img style="width: 5em" src="/node.svg" alt="Node logo" />
  </div>
</template>

<style>
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo.electron:hover {
  filter: drop-shadow(0 0 2em #9feaf9);
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}

header {
  -webkit-app-region: drag;
  height: 64px;
  background-color: #2f3241;
  color: #fff;
  display: flex;
  justify-items: center;
  align-items: center;
  padding: 0 16px;
}

header .title {
  font-size: 24px;
  font-weight: bold;
}

header .window-toolbar {
  -webkit-app-region: no-drag;
  display: flex;
  font-size: 18px;
  justify-content: flex-end;
}

header .padder {
  flex-grow: 1;
}

header .window-toolbar span {
  cursor: pointer;
  padding: 6px;
  border-radius: 100%;
  transition: 0.1s ease-out background-color;
}

header .window-toolbar span:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

textarea{
  width: 200px;
  height: 100px;
}
</style>
