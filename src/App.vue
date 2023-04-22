<script setup lang="ts">
import { onMounted, ref } from "vue";
import HelloWorld from "./components/HelloWorld.vue";

console.log(
  "[App.vue]",
  `Hello world from Electron ${process.versions.electron}!`
);

import { ipcRenderer } from "electron";

const sendIpcMessage = (message: string) => {
  ipcRenderer.send(message);
};

const handle_reload = () => {
  window.location.reload();
};

const message_container = ref<HTMLElement>();

const get_message = async () => {
  const raw_message = await ipcRenderer.invoke("get-message");
  const message = JSON.parse(raw_message);
  console.log("message", message);

  if (!message_container.value) return;
  message_container.value.innerText = JSON.stringify(message, null, 4);
};

onMounted(async () => {
  await get_message();
});
</script>

<template>
  <header>
    <span class="title">Hello Electron</span>
    <span class="padder"></span>
    <span class="window-toolbar">
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
  width: 400px;
  height: 300px;
}
</style>
