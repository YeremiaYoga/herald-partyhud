import * as partyhud from "./heraldPartyhud.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    await partyhud.heraldPartyhud_renderHtml();
  }, 1000);
});
