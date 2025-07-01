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

  game.settings.register("herald-partyhud", "collapseParty", {
    name: "Herald Party Hud Collapse Party",
    hint: "Herald Party Hud Collapse Party",
    scope: "client",
    config: true,
    type: Number,
    default: 1,
  });
  game.settings.register("herald-partyhud", "collapseNpc", {
    name: "Herald Party Hud Collapse Npc",
    hint: "Herald Party Hud Collapse Npc",
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
  });
  game.settings.register("herald-partyhud", "lockPosition", {
    name: "Herald Party Hud Lock Position",
    hint: "Herald Party Hud Lock Position",
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
  });
});
