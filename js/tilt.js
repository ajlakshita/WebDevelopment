/**
 * tilt.js — 3D perspective tilt on hover for cards
 * Uses mouse position relative to the card center to calculate
 * rotateX / rotateY transforms for a premium interactive feel.
 */

const TILT_MAX = 12; // degrees
const SHINE_OPACITY = 0.12;

function applyTilt(card) {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const rotateY = ((x - cx) / cx) * TILT_MAX;
    const rotateX = -((y - cy) / cy) * TILT_MAX;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;
    card.style.transition = "transform 0.08s ease";

    // Update shine
    let shine = card.querySelector(".tilt-shine");
    if (!shine) {
      shine = document.createElement("div");
      shine.className = "tilt-shine";
      card.appendChild(shine);
    }
    const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
    shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,${SHINE_OPACITY}) 0%, transparent 70%)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    card.style.transition = "transform 0.5s cubic-bezier(0.23,1,0.32,1)";
    const shine = card.querySelector(".tilt-shine");
    if (shine) shine.style.background = "none";
  });
}

export function initTilt(selector = ".school-card, .research-card") {
  const attach = () => {
    document.querySelectorAll(selector).forEach((card) => {
      if (!card.dataset.tiltBound) {
        card.dataset.tiltBound = "1";
        applyTilt(card);
      }
    });
  };

  // Initial attach + observe DOM mutations (cards rendered dynamically)
  attach();
  const observer = new MutationObserver(attach);
  observer.observe(document.body, { childList: true, subtree: true });
}
