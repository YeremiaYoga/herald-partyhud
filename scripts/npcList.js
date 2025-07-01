import * as helper from "./helper.js";

async function heraldPartyhud_renderNpcSingleActor(data) {
  let npcCollapse = await game.settings.get("herald-partyhud", "collapseNpc");

  if (!npcCollapse) {
    return;
  }
  const rawUserId = data.userUuid.replace("User.", "");
  const user = game.users.get(rawUserId);
  const userColor = user.color;
  const actor = await fromUuid(data.actorUuid);
  const npcActor = document.querySelector(
    `.heraldPartyhud-npcList[data-actor-id="${actor.uuid}"]`
  );

  let npcListView = ``;
  let arrNpc = helper.heraldPartyhud_getNpcActorsInSceneOwnedByUser(user);

  for (let npc of arrNpc) {
    npcListView += `
    <div class="heraldPartyhud-npcItem">
        <div id="heraldPartyhud-npcItemTop" class="heraldPartyhud-npcItemTop">
          
        </div>
        <div id="heraldPartyhud-npcItemMiddle" class="heraldPartyhud-npcItemMiddle">
            <div id="heraldPartyhud-npcBarContainer" class="heraldPartyhud-npcBarContainer">
                <svg width="45" height="45" viewBox="0 0 100 100" class="heraldPartyhud-npcHpContainer">
                    <circle cx="50" cy="50" r="45" id="heraldPartyhud-npcHpBackground" class="heraldPartyhud-npcHpBackground"  data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"  stroke-dasharray="300" stroke-dashoffset="200" />
                    <circle cx="50" cy="50" r="45" id="heraldPartyhud-npcHpBar" class="heraldPartyhud-npcHpBar"  data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"  stroke-dasharray="300" stroke-dashoffset="200" />
                </svg>
            </div>
            <div id="heraldPartyhud-npcTempBarContainer" class="heraldPartyhud-npcTempBarContainer" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}">
                <svg width="54" height="54" viewBox="0 0 100 100" class="heraldPartyhud-npcTempHpContainer">
                  <circle cx="50" cy="50" r="45" id="heraldPartyhud-npcTempHpBar" class="heraldPartyhud-npcTempHpBar"  data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"  stroke-dasharray="300" stroke-dashoffset="200" />
                </svg>
            </div>
            <div id="heraldPartyhud-npcImageWrapper" class="heraldPartyhud-npcImageWrapper">
                <div id="heraldPartyhud-npcImageContainer" class="heraldPartyhud-npcImageContainer" style="border: 2px solid ${userColor};">
                    <img src="${npc.img}" alt="npc" class="heraldPartyhud-npcImageView">
                    <div class="heraldPartyhud-npcTooltipContainer"  data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}" style="display: none;"></div>
                </div>
            </div>
        </div>
        <div id="heraldPartyhud-npcItemBottom" class="heraldPartyhud-npcItemBottom">
            <div class="heraldPartyhud-npcAcContainer"  data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}">
                <div class="heraldPartyhud-npcAcValue"  data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}">10</div>
                <img src="/modules/herald-partyhud/assets/ac_icon.webp" alt="Armor Class" class="heraldPartyhud-npcAcImage" />  
            </div>
             <div id="heraldPartyhud-npcBarValueContainer" class="heraldPartyhud-npcBarValueContainer">
              <div id="heraldPartyhud-npcHpValueContainer" class="heraldPartyhud-npcHpValueContainer">
                <div class="heraldPartyhud-npcHpValue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
                <div class="heraldPartyhud-npcTempMaxHpValue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
              </div>
              
                 <div class="heraldPartyhud-npcTempHpValue" data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"></div>
            </div>
        </div>
    </div>
    
    `;
  }
  if (npcActor) {
    npcActor.innerHTML = npcListView;

    document
      .querySelectorAll(".heraldPartyhud-npcImageContainer")
      .forEach((container) => {
        const tooltip = container.querySelector(
          ".heraldPartyhud-npcTooltipContainer"
        );
        const actorId = container.getAttribute("data-actor-id");
        const npcId = container.getAttribute("data-npc-id");
        container.addEventListener("mouseenter", () => {
          if (tooltip) tooltip.style.display = "block";
        });

        container.addEventListener("mouseleave", () => {
          if (tooltip) tooltip.style.display = "none";
        });
        // container.addEventListener("dblclick", async (event) => {
        //   const token = await fromUuid(actorId);

        //   if (token) {
        //     token.sheet.render(true);
        //   } else {
        //     console.warn("Token not found on the current scene.");
        //   }
        // });
        // container.addEventListener("click", async (event) => {
        //   const playerlistId = container.getAttribute("data-playerlist-id");

        //   const actorData = heraldPlayerlist_listActorCanvas.find(
        //     (item) => item.playerlistId === playerlistId
        //   );

        //   if (actorData && actorData.token) {
        //     const targetToken = actorData.token;

        //     targetToken.control({ releaseOthers: true });
        //     canvas.pan({ x: targetToken.x, y: targetToken.y });
        //   }
        // });
      });
  }
  await heraldPartyhud_updateDataNpcSingleActor(data);
}

async function heraldPartyhud_updateTooltipNpcSingleActor(data) {
  const rawUserId = data.userUuid.replace("User.", "");
  const user = game.users.get(rawUserId);
  const actor = await fromUuid(data.actorUuid);
  let arrNpc = helper.heraldPartyhud_getNpcActorsInSceneOwnedByUser(user);
  for (let npc of arrNpc) {
    const npcTooltip = document.querySelector(
      `.heraldPartyhud-npcTooltipContainer[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
    );

    const hp = npc.system.attributes.hp.value;
    const maxHp = npc.system.attributes.hp.max;
    let tempHp = npc.system.attributes.hp.temp || 0;
    const tempMaxHp = npc.system.attributes.hp.tempmax || 0;
    const totalMaxHp = maxHp + tempMaxHp;
    const hpPercent = (hp / totalMaxHp) * 100;
    let ac = npc.system.attributes.ac.value;
  }
}

async function heraldPartyhud_updateDataNpcSingleActor(data) {
  const rawUserId = data.userUuid.replace("User.", "");
  const user = game.users.get(rawUserId);
  const actor = await fromUuid(data.actorUuid);
  let arrNpc = helper.heraldPartyhud_getNpcActorsInSceneOwnedByUser(user);

  for (let npc of arrNpc) {
    const hp = npc.system.attributes.hp.value;
    const maxHp = npc.system.attributes.hp.max;
    let tempHp = npc.system.attributes.hp.temp || 0;
    const tempmaxhp = npc.system.attributes.hp.tempmax || 0;
    const totalMaxHp = maxHp + tempmaxhp;
    const hpPercent = (hp / totalMaxHp) * 100;
    let tempPercent = (tempHp / totalMaxHp) * 100;
    if (tempPercent > 100) {
      tempPercent = 100;
    }
    let ac = npc.system.attributes.ac.value;

    const npcHpBar = document.querySelector(
      `.heraldPartyhud-npcHpBar[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
    );
    const npcHpValue = document.querySelector(
      `.heraldPartyhud-npcHpValue[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
    );

    const npcTempHpBar = document.querySelector(
      `.heraldPartyhud-npcTempBarContainer[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
    );

    const npcTempHpValue = document.querySelector(
      `.heraldPartyhud-npcTempHpValue[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
    );
    const npcAcValue = document.querySelector(
      `.heraldPartyhud-npcAcValue[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
    );

    const npcTempMaxHpValue = document.querySelector(
      `.heraldPartyhud-npcTempMaxHpValue[data-actor-id="${actor.uuid}"][data-npc-id="${npc.uuid}"]`
    );

    if (npcHpBar) {
      let npcHpBarValue = 300 - hpPercent;
      npcHpBar.style.strokeDashoffset = npcHpBarValue;

      let hpColor = "#389454";
      if (hpPercent < 0) {
        hpColor = "#8B0000";
      } else if (hpPercent <= 25) {
        hpColor = "#bc3c04";
      } else if (hpPercent <= 50) {
        hpColor = "#c47404";
      } else if (hpPercent <= 75) {
        hpColor = "#8c9c04";
      } else {
        hpColor = "#389454";
      }

      npcHpBar.style.stroke = hpColor;
    }

    if (npcHpValue) {
      npcHpValue.innerText = hp + "/" + totalMaxHp;
    }

    if (tempHp > 0) {
      if (npcTempHpValue) {
        npcTempHpValue.innerText = "+" + tempHp;
      }

      let npcTempValuebar = 0;
      npcTempValuebar = 300 - tempPercent;
      if (npcTempHpBar) {
        npcTempHpBar.innerHTML = `
         <svg width="54" height="54" viewBox="0 0 100 100" class="heraldPartyhud-npcTempHpContainer">
          <circle cx="50" cy="50" r="45" id="heraldPartyhud-npcTempHpBar" class="heraldPartyhud-npcTempHpBar"  data-actor-id="${actor.uuid}" data-npc-id="${npc.uuid}"  stroke-dasharray="300" stroke-dashoffset="${npcTempValuebar}" />
        </svg>
        
        `;
      }
    } else {
      if (npcTempHpValue) {
        npcTempHpValue.innerText = "";
      }
      if (npcTempHpBar) {
        npcTempHpBar.innerHTML = ``;
      }
    }

    if (tempmaxhp && npcTempMaxHpValue) {
      if (tempmaxhp > 0) {
        npcTempMaxHpValue.innerText = `(+${tempmaxhp})`;
        npcTempMaxHpValue.style.color = "#05b4ff"; 
      } else {
        npcTempMaxHpValue.innerText = `(${tempmaxhp})`;
        npcTempMaxHpValue.style.color = "#b0001d"; 
      }
    }

    if (npcAcValue) {
      npcAcValue.innerText = ac;
    }
  }
}

export { heraldPartyhud_renderNpcSingleActor };
