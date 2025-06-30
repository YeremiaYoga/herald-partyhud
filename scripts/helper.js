function heraldPartyhud_dragPosition(el) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // Handler disimpan supaya bisa dilepas
  function onMouseDown(e) {
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    document.body.style.userSelect = "none";
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    el.style.left = `${e.clientX - offsetX}px`;
    el.style.top = `${e.clientY - offsetY}px`;
  }

  async function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = "auto";

    const top = el.style.top;
    const left = el.style.left;
    const positionValue = `${top}|${left}`;
    await game.settings.set("herald-partyhud", "partyhudLocation", positionValue);
  }

  // Pasang event listener
  el.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  // Simpan fungsi untuk membersihkan event listener
  el._dragCleanup = () => {
    el.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
}


function heraldPartyhud_getNpcActorsInSceneOwnedByUser(user) {
  const tokens = canvas.tokens.placeables;
  const npcTokens = tokens.filter((token) => {
    const actor = token.actor;
    if (!actor) return false;

    const isNpc = actor.type === "npc";
    const isOwned =
      actor.ownership?.[user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    return isNpc && isOwned;
  });

  return npcTokens.map((token) => token.actor);
}

export {
  heraldPartyhud_dragPosition,
  heraldPartyhud_getNpcActorsInSceneOwnedByUser,
};
