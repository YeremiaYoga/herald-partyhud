import * as partyhud from "./heraldPartyhud.js";

Hooks.on("ready", () => {
  setTimeout(async () => {
    await partyhud.heraldPartyhud_renderHtml();
  }, 1000);
});

Hooks.once("init", () => {
  game.settings.register("herald-partyhud", "partyhudLocation", {
    name: "Herald Party Hud Location",
    hint: "Herald Party Hud Location",
    scope: "client",
    config: true,
    type: String,
    default: "600px|300px",
  });

    game.settings.register("herald-partyhud", "partyhudSelected", {
    name: "Herald Party Hud Selected",
    hint: "Herald Party Hud Selected",
    scope: "client",
    config: true,
    type: String,
    default: "",
  });
});
