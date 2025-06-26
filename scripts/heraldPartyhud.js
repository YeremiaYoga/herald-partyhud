import * as helper from "./helper.js";
import * as npclist from "./npcList.js";

let heraldPartyhud_listPlayerParty = [];

let hp0 = "#8B0000";
let hp25 = "#bc3c04";
let hp50 = "#c47404";
let hp75 = "#8c9c04";
let hp100 = "#389454";
let hpgradient = "#302c2c";

async function heraldPartyhud_renderHtml() {
  try {
    const response = await fetch(
      "/modules/herald-partyhud/templates/heraldPartyhud.html"
    );
    const html = await response.text();

    const div = document.createElement("div");
    div.innerHTML = html;
    const heraldPartyhud = div.firstChild;
    heraldPartyhud.id = "heraldPartyhud";

    document.body.appendChild(heraldPartyhud);
    const location = game.settings.get("herald-partyhud", "partyhudLocation");
    const [top, left] = location.split("|");
    heraldPartyhud.style.top = top;
    heraldPartyhud.style.left = left;
    await heraldPartyhud_renderButtonAccess();
    // await heraldPartyhud_renderView();
    helper.heraldPartyhud_dragPosition(heraldPartyhud);
    await heraldPartyhud_renderParty();
  } catch (err) {
    console.error("Failed to load template heraldHud.html:", err);
  }
}
async function heraldPartyhud_renderButtonAccess() {
  const selectPartyBtn = document.getElementById(
    "heraldPartyhud-selectPartyButton"
  );
  if (selectPartyBtn) {
    selectPartyBtn.addEventListener("click", async () => {
      console.log("Select Party Button clicked");
      await heraldPartyhud_selectPartyDialog();
    });
  }

  const partyCollapseBtn = document.getElementById(
    "heraldPartyhud-partyCollapseContainer"
  );
  if (partyCollapseBtn) {
    partyCollapseBtn.addEventListener("click", async () => {
      const collapseValue = await game.settings.get(
        "herald-partyhud",
        "collapseParty"
      );

      await game.settings.set(
        "herald-partyhud",
        "collapseParty",
        !collapseValue
      );

      if (!collapseValue) {
        await heraldPartyhud_universalChecker();
        await heraldPartyhud_renderParty();
      } else {
        let partyContainer = document.getElementById(
          "heraldPartyhud-partyContainer"
        );
        if (partyContainer) {
          partyContainer.innerHTML = "";
        }
        clearInterval(heraldPartyhud_checkerValue);
      }

      await game.settings.set(
        "herald-partyhud",
        "collapseParty",
        !collapseValue
      );
    });
  }

  const npcCollapseBtn = document.getElementById(
    "heraldPartyhud-npcCollapseContainer"
  );
  if (npcCollapseBtn) {
    npcCollapseBtn.addEventListener("click", async () => {
      console.log("NPC Collapse Button clicked");
      // TODO: Tambahkan logika collapse NPC view
    });
  }
}

async function heraldPartyhud_selectPartyDialog() {
  const user = game.user;
  const selectedActor = user.character;
  if (!user || !selectedActor)
    return ui.notifications.warn("User or Actor not found");

  const folders = game.folders.filter((f) => f.type === "JournalEntry");

  let heraldCoreFolder = null;
  let heraldCorePartyFolder = null;

  for (let folder of folders) {
    if (folder.name === "Herald Core") heraldCoreFolder = folder;

    if (folder.name === "Party" && folder.folder?.id === heraldCoreFolder?.id) {
      heraldCorePartyFolder = folder;
    }
  }

  if (!heraldCorePartyFolder) {
    return ui.notifications.warn("Herald Core > Party folder not found.");
  }

  const partyJournals = game.journal.filter(
    (j) => j.folder?.id === heraldCorePartyFolder.id
  );

  const userUuid = user.uuid;
  const actorUuid = selectedActor.uuid;

  let listRadioButton = ``;

  for (let pj of partyJournals) {
    const hasPage =
      user.isGM ||
      pj.pages.some((page) => page.name === `${userUuid} | ${actorUuid}`);

    if (hasPage) {
      const selectedParty = await game.settings.get(
        "herald-partyhud",
        "partyhudSelected"
      );
      const isChecked = selectedParty === pj.id ? "checked" : "";
      listRadioButton += `
        <div style="margin-bottom: 5px;">
          <label>
            <input type="radio" name="party-choice" value="${pj.id}" ${isChecked}>
            ${pj.name}
          </label>
        </div>
      `;
    }
  }

  if (!listRadioButton) {
    return ui.notifications.warn(
      "No matching Party Journal found for this user."
    );
  }

  new Dialog({
    title: "Select Your Party",
    content: `
      <form>
        ${listRadioButton}
      </form>
    `,
    buttons: {
      confirm: {
        label: "Select",
        callback: async (html) => {
          const selectedId = html
            .find("input[name='party-choice']:checked")
            .val();
          if (selectedId) {
            await game.settings.set(
              "herald-partyhud",
              "partyhudSelected",
              selectedId
            );
            await game.settings.set("herald-partyhud", "collapseParty", true);

            await heraldPartyhud_renderParty();
          }
        },
      },
      cancel: {
        label: "Refresh",
        callback: async () => {
          await heraldPartyhud_renderHtml();
        },
      },
    },
    default: "confirm",
  }).render(true);
}

async function heraldPartyhud_renderParty() {
  let partyContainer = document.getElementById("heraldPartyhud-partyContainer");
  const selectedParty = await game.settings.get(
    "herald-partyhud",
    "partyhudSelected"
  );
  const collapseValue = await game.settings.get(
    "herald-partyhud",
    "collapseParty"
  );

  if (!selectedParty || !collapseValue) {
    return;
  }

  heraldPartyhud_listPlayerParty = [];

  const journal = game.journal.get(selectedParty);
  const pages = journal.pages;
  for (let page of pages) {
    const parts = page.name.split("|").map((s) => s.trim());

    if (parts.length === 2) {
      const userUuid = parts[0];
      const actorUuid = parts[1];

      heraldPartyhud_listPlayerParty.push({
        userUuid,
        actorUuid,
        journalId: journal.id,
        pageId: page.id,
      });
    }
  }

  let arrParty = "";

  for (let data of heraldPartyhud_listPlayerParty) {
    const rawUserId = data.userUuid.replace("User.", "");
    const user = game.users.get(rawUserId);
    const userColor = user.color;
    const actor = await fromUuid(data.actorUuid);
    arrParty += `
    <div id="heraldPartyhud-playerContainer" class="heraldPartyhud-playerContainer">
      <div id="heraldPartyhud-actorContainer" class="heraldPartyhud-actorContainer">
        <div id="heraldPartyhud-actorTopContainer" class="heraldPartyhud-actorTopContainer">
      
        </div>
        <div id="heraldPartyhud-actorMiddleContainer" class="heraldPartyhud-actorMiddleContainer">
          <div id="heraldPartyhud-leftMiddleActor" class="heraldPartyhud-leftMiddleActor">
            <div id="heraldPartyhud-actorImageContainer" class="heraldPartyhud-actorImageContainer" data-actor-id="${actor.uuid}">
              <div id="heraldPartyhud-actorImageDiv" class="heraldPartyhud-actorImageDiv" style="border: 2.5px solid ${userColor};">
                  <img src="${actor.img}" alt="Image" class="heraldPartyhud-actorImage"  />
                  <div id="heraldPartyhud-actorTooltipContainer" class="heraldPartyhud-actorTooltipContainer" data-actor-id="${actor.uuid}" style="display: none;" >
                  </div>
              </div>
            </div>
          </div>
          <div id="heraldPartyhud-midMiddleActor" class="heraldPartyhud-midMiddleActor">
            <div id="heraldPartyhud-actorName" class="heraldPartyhud-actorName">
              ${actor.name}
            </div>
            <div id="heraldPartyhud-actorBarContainer" class="heraldPartyhud-actorBarContainer" style="background-color:${userColor};">
              <div id="heraldPartyhud-hpBarBackground" class="heraldPartyhud-hpBarBackground">
                <div id="heraldPartyhud-hpBar" class="heraldPartyhud-hpBar"  data-actor-id="${actor.uuid}"></div>
                <div class="heraldPartyhud-hpValueContainer">
                  <div id="heraldPartyhud-hpValue" class="heraldPartyhud-hpValue"  data-actor-id="${actor.uuid}"></div>
                  <div id="heraldPartyhud-tempMaxHpValue" class="heraldPartyhud-tempMaxHpValue"  data-actor-id="${actor.uuid}"></div>
                </div>
                <div id="heraldPartyhud-tempHpTop" class="heraldPartyhud-tempHpTop"  data-actor-id="${actor.uuid}"></div>
                <div id="heraldPartyhud-tempHpBottom" class="heraldPartyhud-tempHpBottom"  data-actor-id="${actor.uuid}"></div>
              </div>
            <div id="heraldPartyhud-tempHpValue" class="heraldPartyhud-tempHpValue"  data-actor-id="${actor.uuid}"></div>
            </div>
          </div>
          <div id="heraldPartyhud-rightMiddleActor" class="heraldPartyhud-rightMiddleActor">
          
          </div>
        </div>
        <div id="heraldPartyhud-actorBottomContainer" class="heraldPartyhud-actorBottomContainer">
          <div class="heraldPartyhud-acContainer"  data-actor-id="${actor.uuid}">
            <img src="/modules/herald-partyhud/assets/ac_icon.webp" alt="Armor Class" class="heraldPartyhud-acImage" />
            <div class="heraldPartyhud-acValue"  data-actor-id="${actor.uuid}"></div>
          </div>
          <div class="heraldPartyhud-tempShieldContainer" data-actor-id="${actor.uuid}"></div>
          <div id="heraldPartyhud-listEffectContainer" class="heraldPartyhud-listEffectContainer" data-actor-id="${actor.uuid}"></div>
          <div id="heraldPartyhud-listEffectTooltip" class="heraldPartyhud-listEffectTooltip" data-actor-id="${actor.uuid}"></div>
        </div>
    
      </div>
      <div id="heraldPartyhud-npcListContainer" class="heraldPartyhud-npcListContainer" data-actor-id="${actor.uuid}">
        <div id="heraldPartyhud-npcCollapseButton" class="heraldPartyhud-npcCollapseButton" data-actor-id="${actor.uuid}">
        
        </div>
        <div id="heraldPartyhud-npcList" class="heraldPartyhud-npcList" data-actor-id="${actor.uuid}">
        
        </div>
      </div>
    </div>
    `;
  }

  if (partyContainer) {
    partyContainer.innerHTML = arrParty;

    document
      .querySelectorAll(".heraldPartyhud-actorImageContainer")
      .forEach((container) => {
        const tooltip = container.querySelector(
          ".heraldPartyhud-actorTooltipContainer"
        );
        const actorId = container.getAttribute("data-actor-id");
        container.addEventListener("mouseenter", () => {
          if (tooltip) tooltip.style.display = "block";
        });

        container.addEventListener("mouseleave", () => {
          if (tooltip) tooltip.style.display = "none";
        });
        container.addEventListener("dblclick", async (event) => {
          const token = await fromUuid(actorId);

          if (token) {
            token.sheet.render(true);
          } else {
            console.warn("Token not found on the current scene.");
          }
        });
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
  await heraldPartyhud_updateDataActor();
  await heraldPartyhud_updateEffectActor();
  await heraldPartyhud_updateTooltipDataActor();
  await heraldPartyhud_renderListNpc();
}

async function heraldPartyhud_renderListNpc() {
  for (let data of heraldPartyhud_listPlayerParty) {
    npclist.heraldPartyhud_renderNpcSingleActor(data);
  }
}

async function heraldPartyhud_updateTooltipDataActor() {
  for (let data of heraldPartyhud_listPlayerParty) {
    const actor = await fromUuid(data.actorUuid);
    const actorTooltip = document.querySelector(
      `.heraldPartyhud-actorTooltipContainer[data-actor-id="${actor.uuid}"]`
    );
    const hp = actor.system.attributes.hp.value;
    const maxHp = actor.system.attributes.hp.max;
    let tempHp = actor.system.attributes.hp.temp || 0;
    const tempMaxHp = actor.system.attributes.hp.tempmax || 0;
    const totalMaxHp = maxHp + tempMaxHp;
    const hpPercent = (hp / totalMaxHp) * 100;
    let ac = actor.system.attributes.ac.value;
    let arrClassActor = [];
    for (let item of actor.items) {
      if (item.type === "class") {
        arrClassActor.push(item.name);
      }
    }
    let classActorValue = arrClassActor.join("/");
    let tempmaxhptext = "";
    if (tempMaxHp) {
      if (tempMaxHp > 0) {
        tempmaxhptext = `(+${tempMaxHp})`;
      } else {
        tempmaxhptext = `(${tempMaxHp})`;
      }
    }

    let actorTooltipWidth = 300;
    let actorTooltipheight = 175;
    let widthIncrementTooltip = 10;
    let heightIncrementTooltip = 15;
    const movement = actor.system.attributes.movement;
    const movementUnits = movement.units;
    const movementTypes = [
      { key: "burrow", icon: "fa-solid fa-shovel" },
      { key: "climb", icon: "fa-solid fa-hill-rockslide" },
      {
        key: "fly",
        icon: movement.hover ? "fa-solid fa-dove" : "fa-brands fa-fly",
        suffix: movement.hover ? " (Hover)" : "",
      },
      { key: "swim", icon: "fa-solid fa-person-swimming" },
      { key: "walk", icon: "fas fa-shoe-prints" },
    ];

    let movementHTML = "";
    let movementCount = 0;

    for (const { key, icon, suffix = "" } of movementTypes) {
      const value = movement[key];
      if (value) {
        movementCount++;
        movementHTML += `
      <div>
        <i class="${icon}" style="margin-right: 5px;"></i> ${value} ${movementUnits}.${suffix}
      </div>`;
      }
    }
    const widthTooltip =
      actorTooltipWidth + (movementCount - 1) * widthIncrementTooltip;
    const heightTooltip =
      actorTooltipheight + (movementCount - 1) * heightIncrementTooltip;

    if (actorTooltip) {
      actorTooltip.style.width = `${widthTooltip}px`;
      actorTooltip.style.height = `${heightTooltip}px`;
    }

    const system = actor.system;

    const skills = [
      { value: system.skills.prc.passive, icon: "fa-solid fa-eye" },
      {
        value: system.skills.inv.passive,
        icon: "fa-solid fa-magnifying-glass",
      },
      { value: system.skills.ins.passive, icon: "fa-solid fa-brain" },
    ];

    let insightHTML = "";
    let inspirationHtml = "";
    let inspirationValue = actor.system.attributes.inspiration;
    if (inspirationValue) {
      inspirationHtml = `
        <div style="margin-right:10px;">
          <i class="fa-brands fa-phoenix-squadron" style="font-size: 24px; color: orange;"></i>
        </div>
      `;
    }
    for (const { value, icon } of skills) {
      insightHTML += `
    <div>
      <i class="${icon}" style="margin-right: 5px;"></i> ${value || 0}
    </div>`;
    }

    if (actorTooltip) {
      actorTooltip.innerHTML = `
      <div id="heraldPartyhud-actorTooltipTop" class="heraldPartyhud-actorTooltipTop">
        <h3>${actor.name}</h3>
         
      </div>
      <div id="heraldPartyhud-actorTooltipMiddle" class="heraldPartyhud-actorTooltipMiddle">
        <div id="heraldPartyhud-leftMiddleTooltip" class="heraldPartyhud-leftMiddleTooltip">
          <div >
            <i class="fas fa-heart" style="margin-right: 5px;"></i>  ${hp}/${totalMaxHp} ${tempmaxhptext} HP
          </div>
          <div>
            <i class="fas fa-shield-alt" style="margin-right: 5px;"></i> ${
              ac || 0
            } AC
          </div>
          ${movementHTML}
        </div>
        <div id="heraldPartyhud-rightMiddleTooltip" class="heraldPartyhud-rightMiddleTooltip">
          ${insightHTML}
        </div>
      </div>
      <div id="heraldPartyhud-actorTooltipBottom" class="heraldPartyhud-actorTooltipBottom">
        <div  class="heraldPartyhud-topBottomTooltip">
          ${inspirationHtml}
        </div>
        <div  class="heraldPartyhud-bottomBottomTooltip">
          <div>Level ${actor.system.details?.level || "Unknown"}</div>
          <div> ${classActorValue || "Unknown"}</div>
          <div> - </div>
          <div>
            <div> ${actor.system.details?.race || "Unknown"}</div>
          </div>
        </div>
      </div>
      `;
    }
  }
}

async function heraldPartyhud_updateDataActor() {
  for (let data of heraldPartyhud_listPlayerParty) {
    const actor = await fromUuid(data.actorUuid);

    const hp = actor.system.attributes.hp.value;
    const maxHp = actor.system.attributes.hp.max;
    let tempHp = actor.system.attributes.hp.temp || 0;
    const tempmaxhp = actor.system.attributes.hp.tempmax || 0;
    const totalMaxHp = maxHp + tempmaxhp;
    const hpPercent = (hp / totalMaxHp) * 100;
    let tempPercent = (tempHp / totalMaxHp) * 100;
    if (tempPercent > 100) {
      tempPercent = 100;
    }
    let ac = actor.system.attributes.ac.value;

    if (tempHp > totalMaxHp) {
      tempHp = totalMaxHp;
      actor.update({
        "system.attributes.hp.temp": totalMaxHp,
      });
    }

    const hpBar = document.querySelector(
      `.heraldPartyhud-hpBar[data-actor-id="${actor.uuid}"]`
    );
    const hpValue = document.querySelector(
      `.heraldPartyhud-hpValue[data-actor-id="${actor.uuid}"]`
    );
    const tempMaxHpValue = document.querySelector(
      `.heraldPartyhud-tempMaxHpValue[data-actor-id="${actor.uuid}"]`
    );
    const tempHpTop = document.querySelector(
      `.heraldPartyhud-tempHpTop[data-actor-id="${actor.uuid}"]`
    );
    const tempHpBottom = document.querySelector(
      `.heraldPartyhud-tempHpBottom[data-actor-id="${actor.uuid}"]`
    );
    const tempHpValue = document.querySelector(
      `.heraldPartyhud-tempHpValue[data-actor-id="${actor.uuid}"]`
    );
    const tempShieldContainer = document.querySelector(
      `.heraldPartyhud-tempShieldContainer[data-actor-id="${actor.uuid}"]`
    );

    const acValue = document.querySelector(
      `.heraldPartyhud-acValue[data-actor-id="${actor.uuid}"]`
    );
    if (hpBar) {
      if (hp > 0) {
        hpBar.style.width = `${hpPercent}%`;
        if (hpPercent < 0) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp0} 98%)`;
        } else if (hpPercent <= 25) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp25} 98%)`;
        } else if (hpPercent <= 50) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp50} 98%)`;
        } else if (hpPercent <= 75) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp75} 98%)`;
        } else {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp100} 98%)`;
        }
        if (hpValue) {
          hpValue.innerText = hp + "/" + totalMaxHp;
        }
      } else {
        let temphpValue = hp;
        let negativeBlockMax = hp + totalMaxHp;
        if (negativeBlockMax < 0) {
          temphpValue = totalMaxHp * -1;

          await actor.data.update({
            "system.attributes.hp.value": temphpValue,
          });
        }
        const negativeHpPercent = (temphpValue / totalMaxHp) * -100;
        hpBar.style.width = `${negativeHpPercent}%`;
        if (negativeHpPercent > 0) {
          hpBar.style.background = `linear-gradient(to right, ${hpgradient} 2%, ${hp0} 98%)`;
        }
        if (hpValue) {
          hpValue.innerText = temphpValue + "/" + totalMaxHp;
        }
      }
    }
    if (tempMaxHpValue) {
      if (tempmaxhp) {
        if (tempmaxhp > 0) {
          tempMaxHpValue.innerText = `(+${tempmaxhp})`;
          tempMaxHpValue.style.color = "#05b4ff";
        } else {
          tempMaxHpValue.innerText = `(${tempmaxhp})`;
          tempMaxHpValue.style.color = "#b0001d";
        }
      }
    }
    if (tempHp && tempHp > 0) {
      if (tempHpTop) tempHpTop.style.width = `${tempPercent}%`;
      if (tempHpBottom) tempHpBottom.style.width = `${tempPercent}%`;
      if (tempHpValue) tempHpValue.innerText = `+${tempHp}`;
      if (tempShieldContainer) {
        tempShieldContainer.innerHTML = `<img src="/modules/herald-partyhud/assets/tempshield_icon.png" alt="shield" class="heraldPartyhud-tempShieldImg" />`;
      }

      if (tempPercent < 10) {
        const adjustedWidth = tempPercent + 8;
        if (tempHpTop) tempHpTop.style.width = `${adjustedWidth}%`;
        if (tempHpBottom) tempHpBottom.style.width = `${adjustedWidth}%`;
      }
    } else {
      if (tempHpTop) tempHpTop.style.width = "";
      if (tempHpBottom) tempHpBottom.style.width = "";
      if (tempHpValue) tempHpValue.innerText = "";
      if (tempShieldContainer) tempShieldContainer.innerHTML = "";
    }

    if (acValue) {
      acValue.innerText = ac;
    }
  }
}

async function heraldPartyhud_updateEffectActor() {
  for (let data of heraldPartyhud_listPlayerParty) {
    const actor = await fromUuid(data.actorUuid);

    let effectlist = ``;
    let arrEffect = [];

    for (let effect of actor.effects) {
      arrEffect.push(effect);
    }
    for (let item of actor.items) {
      if (item.effects) {
        for (let effect of item.effects) {
          arrEffect.push(effect);
        }
      }
    }
    let activeEffect = ``;
    let disableEffect = ``;

    arrEffect.forEach((effect) => {
      if (effect.target !== actor) {
        return;
      }
      let stackDiv = "";
      if (/\(\d+\)/.test(effect.name)) {
        const match = effect.name.match(/\((\d+)\)/);
        if (match) {
          const number = parseInt(match[1], 10);
          stackDiv = `<div class="heraldPartyhud-stackEffect">${number}</div>`;
        }
      }
      let durationDiv = "";
      if (effect.duration.remaining > 0) {
        let totalSeconds = effect.duration.remaining || 0;
        let rounds = Math.floor(totalSeconds / 6);
        let secondsLeft = totalSeconds % 6;
        let secondText = ``;
        if (secondsLeft > 0) {
          secondText = `(${secondsLeft} Second)`;
        }
        durationDiv = `
            <div class="heraldPartyhud-detailEffectDuration">
              (${rounds} Round)${secondText}
            </div>`;
      }
      let effectDisabled = "";

      if (effect.disabled) {
        effectDisabled = `<div class="heraldPartyhud-detailEffectDisable">Disabled</div>`;
      }

      const effectDetailDiv = `
      <div class="heraldPartyhud-effectTooltip" style="display: none;">
        <h3>${effect.name}</h3>
        <div>
          <div>${effect.description}</div>
        </div>
        <div id="heraldPartyhud-detailEffectBottom" class="heraldPartyhud-detailEffectBottom">
          <div id="heraldPartyhud-detailEffectType" class="heraldPartyhud-detailEffectType">
            ${effect.isTemporary ? "Temporary" : "Passive"}
          </div>
          ${durationDiv}
          ${effectDisabled}
        </div>
      </div>`;

      if (!effect.disabled) {
        activeEffect += `
         <div id="heraldPartyhud-effectContainer" data-effect-id="${
           effect.id
         }" class="heraldPartyhud-effectContainer">
          <div class="heraldPartyhud-effectItem">
            <img src="${effect.img}" alt="${effect.name}" 
            class="heraldPartyhud-playerEffect" ${
              effect.disabled
                ? 'style="filter: brightness(85%); opacity: 0.7;"'
                : ""
            } />
            ${stackDiv}
          </div>
          ${effectDetailDiv}
        </div>`;
      } else {
        disableEffect += `
        <div id="heraldPartyhud-effectContainer" data-effect-id="${
          effect.id
        }" class="heraldPartyhud-effectContainer">
          <div class="heraldPartyhud-effectItem">
            <img src="${effect.img}" alt="${effect.name}" 
            class="heraldPartyhud-playerEffect" ${
              effect.disabled
                ? 'style="filter: brightness(85%); opacity: 0.7;"'
                : ""
            } />
            ${stackDiv}
          </div>
          ${effectDetailDiv}
        </div>
      `;
      }
    });
    effectlist = activeEffect + disableEffect;

    if (effectlist == ``) {
      effectlist = `
      <div>
        <div class="heraldPartyhud-playerEffect" style="opacity: 0;"></div>
      </div>`;
    }
    const listEffect = document.querySelector(
      `.heraldPartyhud-listEffectContainer[data-actor-id="${actor.uuid}"]`
    );
    if (listEffect) {
      listEffect.innerHTML = effectlist;

      document
        .querySelectorAll(".heraldPartyhud-effectContainer")
        .forEach((item) => {
          // const detailDiv = item.querySelector(".heraldPartyhud-effectTooltip");
          const effectId = item.getAttribute("data-effect-id");
          const detailDiv = document.querySelector(
            `.heraldPartyhud-listEffectTooltip[data-actor-id="${actor.uuid}"]`
          );

          if (!item.hasAttribute("data-hover-listener")) {
            item.addEventListener("mouseenter", async () => {
              const effect = arrEffect.find((e) => e.id === effectId);

              let stackDiv = "";
              if (/\(\d+\)/.test(effect.name)) {
                const match = effect.name.match(/\((\d+)\)/);
                if (match) {
                  const number = parseInt(match[1], 10);
                  stackDiv = `<div class="heraldPartyhud-stackEffect">${number}</div>`;
                }
              }
              let durationDiv = "";
              if (effect.duration.remaining > 0) {
                let totalSeconds = effect.duration.remaining || 0;
                let rounds = Math.floor(totalSeconds / 6);
                let secondsLeft = totalSeconds % 6;
                let secondText = ``;
                if (secondsLeft > 0) {
                  secondText = `(${secondsLeft} Second)`;
                }
                durationDiv = `
              <div class="heraldPartyhud-detailEffectDuration">
                (${rounds} Round)${secondText}
              </div>`;
              }
              let effectDisabled = "";

              if (effect.disabled) {
                effectDisabled = `<div class="heraldPartyhud-detailEffectDisable">Disabled</div>`;
              }
              const enrichedDescription = await TextEditor.enrichHTML(
                effect.description ?? "",
                {
                  async: true,
                  secrets: true,
                  documents: true,
                }
              );

              if (detailDiv) {
                detailDiv.innerHTML = `
                <h3>${effect.name}</h3>
                <div>
                  <div>${enrichedDescription}</div>
                </div>
                <div id="heraldPartyhud-detailEffectBottom" class="heraldPartyhud-detailEffectBottom">
                  <div id="heraldPartyhud-detailEffectType" class="heraldPartyhud-detailEffectType">
                    ${effect.isTemporary ? "Temporary" : "Passive"}
                  </div>
                  ${durationDiv}
                  ${effectDisabled}
                </div>`;
                detailDiv.style.display = "block";
              }
            });
            item.addEventListener("mouseleave", () => {
              if (detailDiv) detailDiv.style.display = "none";
            });
            item.setAttribute("data-hover-listener", "true");
          }

          if (!item.hasAttribute("data-contextmenu-listener")) {
            item.addEventListener("contextmenu", function (event) {
              event.preventDefault();
              const actorUuid = actor.uuid;
              const effectId = this.getAttribute("data-effect-id");

              // heraldHud_settingEffect(effectId, actorUuid);
            });
            item.setAttribute("data-contextmenu-listener", "true");
          }
        });
    }
  }
  await heraldPartyhud_universalChecker();
}

let heraldPartyhud_checkerValue;
async function heraldPartyhud_universalChecker() {
  if (heraldPartyhud_checkerValue) {
    clearInterval(heraldPartyhud_checkerValue);
  }

  heraldPartyhud_checkerValue = setInterval(async () => {
    await heraldPartyhud_updateEffectActor();
  }, 6000);
}
Hooks.on("updateActor", async (actor, data) => {
  await heraldPartyhud_updateDataActor();
  await heraldPartyhud_updateTooltipDataActor();
  await heraldPartyhud_renderListNpc();
});

Hooks.on("createActiveEffect", async (effect) => {
  await heraldPartyhud_updateEffectActor();
  await heraldPartyhud_updateDataActor();
});

Hooks.on("updateEffect", async (effect, changes, options, userId) => {
  await heraldPartyhud_updateEffectActor();
  await heraldPartyhud_updateDataActor();
});

Hooks.on("deleteActiveEffect", async (effect) => {
  await heraldPartyhud_updateEffectActor();
  await heraldPartyhud_updateDataActor();
});

Hooks.once("renderDialog", (app, html, data) => {
  html.closest(".dialog").css("z-index", 1000);
});

export { heraldPartyhud_renderHtml };
