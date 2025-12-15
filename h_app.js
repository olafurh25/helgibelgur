/* h_app.js — rebuilt clean (no duplicates, no nested-scope bugs) */

/* =========================
   CONFIG
========================= */
const CURRENCY = "kr."; // shown after the number (e.g. 25.000 kr.)

const FALLBACK_CONTENT = {
  hero: {
    title: "HELGI SNÆR SIGURÐSSON",
    descriptions: [
      "Útskrift úr skóla, afmæli eða ástarjátning, tilefnin geta verið af ýmsu tagi þegar kemur að skopmyndum.",
      "Ég hef áratugareynslu í teikningu slíkra mynda, gerði þær fyrstu þegar ég sjálfur útskrifaðist úr menntaskóla fyrir (rosalega) mörgum árum.",
    ],
    galleryTitle: "Sýnishorn",
    contactTitle: "Hafa samband - pantanir",
    contactInfo: "Sendu myndir og upplýsingar — ég reyni að svara innan tveggja sólahringa.",
    faqTitle: "Spurt og svarað",
  },
  pricing: [
    { min: 1, price: 25000 },
    { min: 5, price: 23000 },
    { min: 10, price: 21000 },
    { min: 20, price: 20000 },
  ],
  gallery: [
    "„Líklegastur til að týnast á skipi” — Nafn",
    "„Umsögn/Lýsing.” — Nafn",
    "„Umsögn/Lýsing.” — Nafn",
    "„Umsögn/Lýsing.” — Nafn",
    "„Umsögn/Lýsing.” — Nafn",
    "„Umsögn/Lýsing.” — Nafn",
    "„Umsögn/Lýsing.” — Nafn",
    "„Umsögn/Lýsing.” — Nafn",
    "„Umsögn/Lýsing.” — Nafn",
  ],
  faq: [
    { q: "Í hvaða stærð eru myndirnar?", a: "A3..." },
    { q: "Hvað tekur langan tíma að teikna hverja mynd?", a: "Yfirleitt tekur það um..." },
    { q: "Er hægt að fá myndirnar í lit?", a: "Það fer eftir..." },
  ],
};

/* =========================
   HELPERS
========================= */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function formatMoney(n) {
  const num = Number(n || 0);
  const s = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${s} ${CURRENCY}`;
}

function validEmail(s) {
  return /^\S+@\S+\.\S+$/.test(String(s || ""));
}

function showError(id, msg) {
  const el = document.querySelector(`.error[data-for="${id}"]`);
  const input = document.getElementById(id);
  if (el) {
    el.textContent = msg || "";
    el.style.display = msg ? "" : "none";
  }
  if (input) input.classList.toggle("error", !!msg);
}

/* =========================
   TEXT.TXT PARSER
   (matches your current text.txt format)
========================= */
function parseTextSections(txt) {
  const lines = txt.split(/\r?\n/);
  let section = null;

  const data = {
    hero: { descriptions: [] },
    gallery: [],
    faq: [],
    pricing: [],
  };

  let i = 0;

  while (i < lines.length) {
    const line = (lines[i] || "").trim();

    // section headers
    if (/^1[.)]/.test(line)) { section = "hero"; i++; continue; }
    if (/^2[.)]/.test(line)) { section = "pricing"; i++; continue; }
    if (/^3[.)]/.test(line) || line.startsWith("3. Sample Image Descriptions")) {
      section = "gallery";
      i++;
      if ((lines[i] || "").trim() === "Undirtexti við hverja mynd") i++;
      continue;
    }
    if (/^4[.)]/.test(line)) { section = "faq"; i++; continue; }

    if (!section) { i++; continue; }

    // HERO
    if (section === "hero") {
      if (line === "Hero Title") data.hero.title = (lines[++i] || "").trim();
      else if (/^Hero Description \d+/.test(line)) data.hero.descriptions.push((lines[++i] || "").trim());
      else if (line === "Gallery Section Title") data.hero.galleryTitle = (lines[++i] || "").trim();
      else if (line === "Contact Section Title") data.hero.contactTitle = (lines[++i] || "").trim();
      else if (line === "Contact Info Text") data.hero.contactInfo = (lines[++i] || "").trim();
      else if (line === "FAQ Title") data.hero.faqTitle = (lines[++i] || "").trim();
      i++;
      continue;
    }

    // PRICING
    if (section === "pricing") {
      if (/^Quantity/.test(line)) {
        i++;
        while (i < lines.length && (lines[i] || "").trim()) {
          const parts = lines[i].split(/\t+/).map(s => s.trim()).filter(Boolean);
          if (parts.length >= 2) {
            const min = parseInt(parts[0], 10);
            const price = parseInt(parts[1], 10);
            if (Number.isFinite(min) && Number.isFinite(price)) data.pricing.push({ min, price });
          }
          i++;
        }
      } else {
        i++;
      }
      continue;
    }

    // GALLERY (expects "1. ..." lines)
    if (section === "gallery") {
      const m = line.match(/^\d+[.)]\s*(.+)$/);
      if (m && m[1]) data.gallery.push(m[1].trim());
      i++;
      continue;
    }

    // FAQ
    if (section === "faq") {
      if (line === "Spurning") {
        const q = (lines[++i] || "").trim();
        if ((lines[++i] || "").trim() === "Svar") {
          const a = (lines[++i] || "").trim();
          if (q && a) data.faq.push({ q, a });
        }
        i++;
        continue;
      }
      i++;
      continue;
    }

    i++;
  }

  // fill missing hero arrays safely
  if (!data.hero.descriptions) data.hero.descriptions = [];

  return data;
}

async function loadContent() {
  try {
    const res = await fetch("text.txt", { cache: "no-store" });
    if (!res.ok) throw new Error("text.txt not found");
    const txt = await res.text();
    const parsed = parseTextSections(txt);

    // Merge on top of fallback to avoid missing keys breaking UI
    return {
      hero: { ...FALLBACK_CONTENT.hero, ...(parsed.hero || {}) },
      pricing: (parsed.pricing && parsed.pricing.length) ? parsed.pricing : FALLBACK_CONTENT.pricing,
      gallery: (parsed.gallery && parsed.gallery.length) ? parsed.gallery : FALLBACK_CONTENT.gallery,
      faq: (parsed.faq && parsed.faq.length) ? parsed.faq : FALLBACK_CONTENT.faq,
    };
  } catch (e) {
    console.warn("Using fallback content:", e);
    return FALLBACK_CONTENT;
  }
}

/* =========================
   CONTENT INJECTION
========================= */
function injectTextContent(data) {
  // Hero title
  const heroTitle = document.querySelector(".hero-content .xxl");
  if (heroTitle && data.hero?.title) heroTitle.textContent = data.hero.title;

  // Hero descriptions
  const heroContent = document.querySelector(".hero-content");
  if (heroContent && data.hero?.descriptions?.length) {
    heroContent.querySelectorAll(".hero-sub").forEach((el) => el.remove());
    const h1 = heroContent.querySelector("h1");
    let after = h1;
    data.hero.descriptions.forEach((desc) => {
      const p = document.createElement("p");
      p.className = "lead hero-sub";
      p.textContent = desc;
      after.insertAdjacentElement("afterend", p);
      after = p;
    });
  }

  // Section titles
  const galleryTitle = document.querySelector("#synishorn .xl");
  if (galleryTitle && data.hero?.galleryTitle) galleryTitle.textContent = data.hero.galleryTitle;

  const contactPanels = document.querySelectorAll("#hafa-samband .panel");
  if (contactPanels.length > 1) {
    const contactTitle = contactPanels[1].querySelector("h2.xl");
    if (contactTitle && data.hero?.contactTitle) contactTitle.textContent = data.hero.contactTitle;

    const contactInfo = contactPanels[1].querySelector(".muted");
    if (contactInfo && data.hero?.contactInfo) contactInfo.textContent = data.hero.contactInfo;
  }

  const faqTitle = document.querySelector("#spurt-og-svarad .xl");
  if (faqTitle && data.hero?.faqTitle) faqTitle.textContent = data.hero.faqTitle;

  // Gallery captions
  const cards = document.querySelectorAll(".gallery .card");
  cards.forEach((card, idx) => {
    const cap = card.querySelector("figcaption");
    if (!cap) return;
    const v = data.gallery?.[idx];
    cap.innerHTML = v ? v : "&nbsp;";
    cap.style.display = "";
  });

  // FAQ items
  const faqWrap = document.querySelector("#spurt-og-svarad .wrap.narrow");
  if (faqWrap && data.faq?.length) {
    faqWrap.querySelectorAll("details.faq").forEach((el) => el.remove());
    data.faq.forEach((item) => {
      const details = document.createElement("details");
      details.className = "faq";

      const summary = document.createElement("summary");
      summary.textContent = item.q;

      const p = document.createElement("p");
      p.textContent = item.a;

      details.appendChild(summary);
      details.appendChild(p);
      faqWrap.appendChild(details);
    });
  }
}

/* =========================
   PRICING CALCULATOR
========================= */
let PRICING_TIERS = [];

function getUnitPrice(qty) {
  const tiers = [...(PRICING_TIERS || [])].sort((a, b) => a.min - b.min);
  if (!tiers.length) return 0;
  let chosen = tiers[0];
  for (const t of tiers) if (qty >= t.min) chosen = t;
  return Number(chosen.price || 0);
}

function renderTiers(activeQty) {
  const tierListEl = $("#tierList");
  if (!tierListEl) return;

  tierListEl.innerHTML = "";
  const tiers = [...(PRICING_TIERS || [])].sort((a, b) => a.min - b.min);

  let lastActiveIndex = -1;
  for (let i = 0; i < tiers.length; ++i) {
    if (activeQty >= tiers[i].min) lastActiveIndex = i;
  }
  tiers.forEach((t, i) => {
    const row = document.createElement("div");
    let cls = "tier";
    if (i < lastActiveIndex) cls += " past";
    else if (i === lastActiveIndex) cls += " active";
    row.className = cls;
    row.innerHTML = `
      <span><strong>${t.min}+</strong> stk</span>
      <span class="badge">${formatMoney(t.price)}</span>
    `;
    tierListEl.appendChild(row);
  });
}

function updateTotals() {
  const qtyInput = $("#qty");
  const quantityField = $("#quantity");

  const unitPriceEl = $("#unitPrice");
  const subtotalEl = $("#subtotal");

  const unitPriceField = $("#unitPriceField");
  const subtotalField = $("#subtotalField");
  const dateField = $("#dateField");

  const qty = Math.max(0, parseInt(qtyInput?.value || "0", 10) || 0);
  const unit = getUnitPrice(qty);
  const subtotal = qty * unit;

  if (unitPriceEl) unitPriceEl.textContent = unit ? formatMoney(unit) : "—";
  if (subtotalEl) subtotalEl.textContent = unit ? formatMoney(subtotal) : "—";

  if (quantityField) quantityField.value = String(qty);
  if (unitPriceField) unitPriceField.value = String(unit);
  if (subtotalField) subtotalField.value = String(subtotal);
  if (dateField) dateField.value = new Date().toLocaleDateString("is-IS");

  renderTiers(qty);
}

/* =========================
   IMAGE MODAL
========================= */
function setupImageModal() {
  const modal = $("#img-modal");
  const modalImg = $("#img-modal-img");
  if (!modal || !modalImg) return;

  const closeBtn = modal.querySelector(".img-modal-close");
  const galleryImgs = document.querySelectorAll(".gallery .card img");

  function openModal(src, alt) {
    modalImg.src = src;
    modalImg.alt = alt || "";
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
    modal.focus();
  }

  function closeModal() {
    modal.style.display = "none";
    modalImg.src = "";
    document.body.classList.remove("modal-open");
  }

  galleryImgs.forEach((img) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => openModal(img.src, img.alt));
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(img.src, img.alt);
      }
    });
    img.tabIndex = 0;
  });

  closeBtn?.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    const bg = modal.querySelector(".img-modal-bg");
    if (e.target === modal || e.target === bg) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (modal.style.display === "flex" && e.key === "Escape") closeModal();
  });
}

/* =========================
   HAMBURGER MENU
========================= */
function setupHamburger() {
  const hamburger = $("#hamburger");
  const nav = $("#nav");
  if (!hamburger || !nav) return;

  hamburger.addEventListener("click", () => {
    const isActive = nav.classList.toggle("active");
    hamburger.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", String(isActive));
    document.body.style.overflow = isActive ? "hidden" : "";
  });

  $$(".nav a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  nav.addEventListener("click", (e) => {
    if (e.target === nav) {
      nav.classList.remove("active");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
}

/* =========================
   ACTIVE NAV LINK SYNC
========================= */
function setupActiveLinkSync() {
  const links = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (!sections.length) return;

  const byId = (id) => links.find(a => a.getAttribute("href") === `#${id}`);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.remove("active"));
      const link = byId(entry.target.id);
      if (link) link.classList.add("active");
    });
  }, {
    root: null,
    rootMargin: "0px 0px -55% 0px",
    threshold: 0.2,
  });

  sections.forEach((sec) => io.observe(sec));
}

/* =========================
   PARALLAX HERO
========================= */
function setupParallax() {
  const img = document.querySelector(".hero-bg img");
  const hero = document.querySelector(".hero-parallax");
  if (!img || !hero) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  let lastY = null;
  const maxShift = 40;

  function onScroll() {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const progress = 1 - Math.min(Math.max((rect.top + rect.height) / (window.innerHeight + rect.height), 0), 1);
    const shift = Math.round((progress - 0.5) * 2 * maxShift);

    if (shift === lastY) return;
    lastY = shift;
    img.style.setProperty("--parallax-y", `${shift}px`);
  }

  function loop() { onScroll(); requestAnimationFrame(loop); }
  loop();

  window.addEventListener("resize", onScroll, { passive: true });
}

/* =========================
   FORM SUBMIT + VALIDATION
========================= */
function setupForm() {
  const form = $("#orderForm");
  const statusBox = $("#formStatus");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (statusBox) {
      statusBox.hidden = true;
      statusBox.textContent = "";
      statusBox.style.background = "";
    }

    const name = ($("#name")?.value || "").trim();
    const email = ($("#email")?.value || "").trim();
    const phone = ($("#phone")?.value || "").trim();

    let hasError = false;

    if (!name) { showError("name", "Vinsamlegast sláðu inn gilt nafn."); hasError = true; }
    else showError("name", "");

    if (!validEmail(email)) { showError("email", "Vinsamlegast sláðu inn gilt netfang."); hasError = true; }
    else showError("email", "");

    // allow 7–15 digits, ignore spaces/dashes
    const phoneDigits = phone.replace(/[^\d]/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      showError("phone", "Vinsamlegast sláðu inn gilt símanúmer.");
      hasError = true;
    } else {
      showError("phone", "");
    }

    if (hasError) return;

    updateTotals();

    const data = new FormData(form);
    // normalize phone to digits only
    if (data.has("phone")) data.set("phone", phoneDigits);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.errors?.[0]?.message || "Eitthvað fór úrskeiðis. Prófaðu aftur.");
      }

      form.reset();
      updateTotals();

      if (statusBox) {
        statusBox.hidden = false;
        statusBox.textContent = "Takk fyrir! Ég reyni að staðfesta pöntunina og hafa samband við þig innan 48 klukkustunda.";
        statusBox.style.background = "#f6fff8";
      }
    } catch (err) {
      if (statusBox) {
        statusBox.hidden = false;
        statusBox.textContent = err.message || "Eitthvað fór úrskeiðis.";
        statusBox.style.background = "#fff6f6";
      }
    }
  });
}

/* =========================
   QTY CONTROLS
========================= */
function setupQuantityControls() {
  const qtyInput = $("#qty");
  const quantityField = $("#quantity");
  if (!qtyInput) return;

  // +/- buttons
  $$(".step").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = parseInt(btn.getAttribute("data-step") || "0", 10);
      const current = parseInt(qtyInput.value || "0", 10) || 0;
      qtyInput.value = String(Math.max(0, current + step));
      updateTotals();
    });
  });

  qtyInput.addEventListener("input", updateTotals);

  if (quantityField) {
    quantityField.addEventListener("input", () => {
      qtyInput.value = String(Math.max(0, parseInt(quantityField.value || "0", 10) || 0));
      updateTotals();
    });
  }
}

/* =========================
   FOOTER YEAR
========================= */
function setupYear() {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  setupYear();
  setupHamburger();
  setupActiveLinkSync();
  setupParallax();

  // Load content + inject
  const data = await loadContent();
  injectTextContent(data);

  // Pricing
  PRICING_TIERS = (data.pricing && data.pricing.length) ? data.pricing : FALLBACK_CONTENT.pricing;
  setupQuantityControls();
  updateTotals();

  // Modal + form
  setupImageModal();
  setupForm();

  // File upload preview for contact form
  const photosInput = document.getElementById('photos');
  const previewBox = document.getElementById('photoPreview');
  if (photosInput && previewBox) {
    photosInput.addEventListener('change', function() {
      previewBox.innerHTML = '';
      let files = Array.from(this.files || []);
      if (files.length > 10) {
        files = files.slice(0, 10);
        alert('Þú getur aðeins valið allt að 10 myndir.');
      }
      files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = file.name;
          img.style.maxWidth = '72px';
          img.style.maxHeight = '72px';
          img.style.borderRadius = '8px';
          img.style.objectFit = 'cover';
          img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
          previewBox.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }
});
