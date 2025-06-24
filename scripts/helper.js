function heraldPartyhud_dragPosition(el) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  el.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    el.style.left = `${e.clientX - offsetX}px`;
    el.style.top = `${e.clientY - offsetY}px`;
  });

  document.addEventListener("mouseup", async () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.userSelect = "auto";

    const top = el.style.top;
    const left = el.style.left;
    const positionValue = `${top}|${left}`;
    await game.settings.set(
      "herald-partyhud",
      "partyhudLocation",
      positionValue
    );
  });
}

export { heraldPartyhud_dragPosition };
