import * as helper from "./helper.js";

let heraldPartyhud_listPlayerParty = [];

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
    console.log(pj);
    const hasPage = pj.pages.some(
      (page) => page.name === `${userUuid} | ${actorUuid}`
    );
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
    const actor = user.character;

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
              <div id="heraldPartyhud-hpBarBackground" class="heraldPartyhud-hpBarBackground"></div>
            </div>
          </div>
          <div id="heraldPartyhud-rightMiddleActor" class="heraldPartyhud-rightMiddleActor">
          
          </div>
        </div>
        <div id="heraldPartyhud-actorBottomContainer" class="heraldPartyhud-actorBottomContainer">
      
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
}

async function heraldPartyhud_renderView() {}

export { heraldPartyhud_renderHtml };
