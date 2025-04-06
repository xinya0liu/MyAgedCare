// app.js

import "phoenix_html"
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"
import topbar from "../vendor/topbar"
import MapHook from "./hooks/map_hook"
import NotificationHook from "./hooks/notification_hook"
import LocationSearchHook from "./hooks/location_search_hook"

let Hooks = {
  MapHook: MapHook,
  NotificationHook: NotificationHook,
  LocationSearch: LocationSearchHook
};

// Set global Google Maps callback
window.initGoogleMaps = function () {
  console.log("Google Maps API loaded successfully");
  window.googleMapsLoaded = true;

  // Trigger custom event to notify hooks
  window.dispatchEvent(new Event('google-maps-loaded'));
};

// Initialize LiveSocket
let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
let liveSocket = new LiveSocket("/live", Socket, {
  params: { _csrf_token: csrfToken },
  hooks: Hooks
});

// Show progress bar
topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" });
window.addEventListener("phx:page-loading-start", _info => topbar.show(100));
window.addEventListener("phx:page-loading-stop", _info => topbar.hide());

// Connect LiveSocket
liveSocket.connect();

// Expose liveSocket for debugging
window.liveSocket = liveSocket;
