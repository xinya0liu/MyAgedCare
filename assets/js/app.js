// app.js

import "phoenix_html"
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import topbar from "../vendor/topbar"
import MapHook from "./hooks/map_hook"
import NotificationHook from "./hooks/notification_hook"

let Hooks = {
  MapHook: MapHook,
  NotificationHook: NotificationHook
};

// 设置全局 Google Maps 回调
window.initGoogleMaps = function() {
  console.log("Google Maps API loaded successfully");
  window.googleMapsLoaded = true;
  
  // 触发自定义事件，通知 hooks
  window.dispatchEvent(new Event('google-maps-loaded'));
};

// 初始化 LiveSocket
let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
let liveSocket = new LiveSocket("/live", Socket, {
  params: {_csrf_token: csrfToken},
  hooks: Hooks
});

// 显示进度条
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"});
window.addEventListener("phx:page-loading-start", _info => topbar.show(100));
window.addEventListener("phx:page-loading-stop", _info => topbar.hide());

// 连接 LiveSocket
liveSocket.connect();

// 暴露 liveSocket 用于调试
window.liveSocket = liveSocket;
