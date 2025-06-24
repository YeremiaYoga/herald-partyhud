import * as helper from "./helper.js";

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
      console.log("Party Collapse Button clicked");
      // TODO: Tambahkan logika collapse party view
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
      listRadioButton += `
        <div style="margin-bottom: 5px;">
          <label>
            <input type="radio" name="party-choice" value="${pj.id}">
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
            heraldPartyhud_listPlayerParty = [];
            const journal = game.journal.get(selectedId);
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
            <div id="heraldPartyhud-actorImageContainer" class="heraldPartyhud-actorImageContainer">
              <div id="heraldPartyhud-actorImageDiv" class="heraldPartyhud-actorImageDiv" style="border: 2.5px solid ${userColor};">
                 <img src="${actor.img}" alt="Image" class="heraldPartyhud-actorImage"  />
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
      <div id="heraldPartyhud-npcContainer" class="heraldPartyhud-npcContainer">
      
      </div>
    </div>
    `;
  }

  if (partyContainer) {
    partyContainer.innerHTML = arrParty;
  }
  await heraldPartyhud_updateDataActor();
  await heraldPartyhud_updateEffectActor();
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

    // if (tempHp > totalMaxHp) {
    //   tempHp = totalMaxHp;
    //   actor.update({
    //     "system.attributes.hp.temp": totalMaxHp,
    //   });
    // }

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
          const detailDiv = item.querySelector(".heraldPartyhud-effectTooltip");
          const effectId = item.getAttribute("data-effect-id");
          // const detailDiv = document.querySelector(
          //   `.heraldPartyhud-listEffectTooltip[data-actor-id="${actor.uuid}"]`
          // );

          if (!item.hasAttribute("data-hover-listener")) {
            item.addEventListener("mouseenter", () => {
              //   const effect = arrEffect.find((e) => e.id === effectId);

              //   let stackDiv = "";
              //   if (/\(\d+\)/.test(effect.name)) {
              //     const match = effect.name.match(/\((\d+)\)/);
              //     if (match) {
              //       const number = parseInt(match[1], 10);
              //       stackDiv = `<div class="heraldPartyhud-stackEffect">${number}</div>`;
              //     }
              //   }
              //   let durationDiv = "";
              //   if (effect.duration.remaining > 0) {
              //     let totalSeconds = effect.duration.remaining || 0;
              //     let rounds = Math.floor(totalSeconds / 6);
              //     let secondsLeft = totalSeconds % 6;
              //     let secondText = ``;
              //     if (secondsLeft > 0) {
              //       secondText = `(${secondsLeft} Second)`;
              //     }
              //     durationDiv = `
              // <div class="heraldPartyhud-detailEffectDuration">
              //   (${rounds} Round)${secondText}
              // </div>`;
              //   }
              //   let effectDisabled = "";

              //   if (effect.disabled) {
              //     effectDisabled = `<div class="heraldPartyhud-detailEffectDisable">Disabled</div>`;
              //   }

              if (detailDiv) {
                // detailDiv.innerHTML = `
                // <h3>${effect.name}</h3>
                // <div>
                //   <div>${effect.description}</div>
                // </div>
                // <div id="heraldPartyhud-detailEffectBottom" class="heraldPartyhud-detailEffectBottom">
                //   <div id="heraldPartyhud-detailEffectType" class="heraldPartyhud-detailEffectType">
                //     ${effect.isTemporary ? "Temporary" : "Passive"}
                //   </div>
                //   ${durationDiv}
                //   ${effectDisabled}
                // </div>`;
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
}

Hooks.on("updateActor", async (actor, data) => {
  await heraldPartyhud_updateDataActor();
});

Hooks.on("createActiveEffect", async (effect) => {});

Hooks.on("updateEffect", async (effect, changes, options, userId) => {});

Hooks.on("deleteActiveEffect", async (effect) => {});

export { heraldPartyhud_renderHtml };
