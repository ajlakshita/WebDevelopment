/**
 * expand.js — Click-to-expand modal for all cards across the site.
 * Reads data attributes from the card and opens a beautiful overlay panel.
 */

// ─── Modal markup (injected once) ────────────────────────────────────────────
function createModal() {
  const overlay = document.createElement("div");
  overlay.id = "card-modal-overlay";
  overlay.innerHTML = `
    <div id="card-modal" role="dialog" aria-modal="true">
      <button id="card-modal-close" aria-label="Close">&times;</button>
      <div id="card-modal-accent"></div>
      <div id="card-modal-body">
        <div id="card-modal-icon"></div>
        <div id="card-modal-content">
          <p id="card-modal-kicker"></p>
          <h2 id="card-modal-title"></h2>
          <p id="card-modal-desc"></p>
        </div>
      </div>
      <img id="card-modal-image" alt="" />
    </div>
  `;
  document.body.appendChild(overlay);

  // Close on overlay click or button
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  overlay.querySelector("#card-modal-close").addEventListener("click", closeModal);

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  return overlay;
}

function openModal({ kicker, title, description, image, accentColor }) {
  const overlay = document.getElementById("card-modal-overlay") || createModal();

  overlay.querySelector("#card-modal-kicker").textContent = kicker || "";
  overlay.querySelector("#card-modal-title").textContent = title || "";
  overlay.querySelector("#card-modal-desc").textContent = description || "";
  overlay.querySelector("#card-modal-icon").textContent = (title || "?").charAt(0).toUpperCase();
  overlay.querySelector("#card-modal-icon").style.background = accentColor + "22";
  overlay.querySelector("#card-modal-icon").style.color = accentColor;
  overlay.querySelector("#card-modal-icon").style.borderColor = accentColor + "55";
  overlay.querySelector("#card-modal-accent").style.background =
    `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`;

  const imgEl = overlay.querySelector("#card-modal-image");
  if (image) {
    imgEl.src = image;
    imgEl.style.display = "block";
  } else {
    imgEl.style.display = "none";
  }

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const overlay = document.getElementById("card-modal-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

// ─── Accent color extraction via CSS custom property ─────────────────────────
function getAccent(card) {
  return getComputedStyle(card).getPropertyValue("--accent").trim() || "#1a56db";
}

// ─── Attach listeners dynamically (handles late-rendered cards) ───────────────
function attachExpand(card) {
  if (card.dataset.expandBound) return;
  card.dataset.expandBound = "1";
  card.style.cursor = "pointer";

  card.addEventListener("click", () => {
    // School card
    if (card.classList.contains("school-card")) {
      openModal({
        kicker: card.querySelector(".school-category")?.textContent || "Research School",
        title: card.querySelector(".school-acronym")?.textContent || "",
        description: (card.querySelector(".school-name")?.textContent || "") +
          "\n\n" + (card.querySelector(".school-description")?.textContent || ""),
        image: null,
        accentColor: getAccent(card),
      });
      return;
    }

    // Research card
    if (card.classList.contains("research-card")) {
      const img = card.querySelector(".research-image");
      openModal({
        kicker: "Research Area",
        title: card.querySelector("h3")?.textContent || "",
        description: card.querySelector("p")?.textContent || "",
        image: img?.src || null,
        accentColor: "#1a56db",
      });
      return;
    }

    // Home pub card
    if (card.classList.contains("home-pub-card")) {
      openModal({
        kicker: card.querySelector(".home-pub-meta")?.textContent || "Publication",
        title: card.querySelector(".home-pub-title")?.textContent || "",
        description: (card.querySelector(".home-pub-authors")?.textContent || "") +
          "\n" + (card.querySelector(".home-pub-footer")?.textContent || ""),
        image: null,
        accentColor: "#0891b2",
      });
      return;
    }

    // Pub card
    if (card.classList.contains("pub-card")) {
      openModal({
        kicker: card.querySelector(".pub-tag")?.textContent || "Publication",
        title: card.querySelector(".pub-title")?.textContent || "",
        description: (card.querySelector(".pub-journal")?.textContent || "") +
          "\n" + (card.querySelector(".pub-authors")?.textContent || "") +
          "\n" + (card.querySelector(".pub-meta")?.textContent || ""),
        image: null,
        accentColor: "#7c3aed",
      });
      return;
    }

    // Home chips (research area chips)
    if (card.classList.contains("home-chip")) {
      openModal({
        kicker: "Research Area",
        title: card.querySelector("h4")?.textContent || "",
        description: card.querySelector("p")?.textContent || "",
        image: null,
        accentColor: "#059669",
      });
    }
  });
}

export function initExpand() {
  const CARD_SELECTOR = ".school-card, .research-card, .home-pub-card, .pub-card, .home-chip";

  const attach = () => {
    document.querySelectorAll(CARD_SELECTOR).forEach(attachExpand);
  };

  attach();

  const observer = new MutationObserver(attach);
  observer.observe(document.body, { childList: true, subtree: true });
}
