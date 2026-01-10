/* h_app.js — fixed + consolidated (single parallax, no missing functions) */

/* =========================
   CONFIG
========================= */
const CURRENCY = "kr."; // shown after the number (e.g. 25.000 kr.)

const SITE_TEXT = {
  hero: {
    title: "Helgi Snær Sigurðsson",
    descriptions: [
      "Útskrift úr skóla, afmæli eða ástarjátning? Skopmynd er góð gjöf, hvert sem tilefnið er.",
      "Ég hef áratugareynslu í því að teikna skopmyndir og gerði þær fyrstu þegar ég sjálfur útskrifaðist úr menntaskóla fyrir rúmum 30 árum. Bæði hef ég teiknað nemendur fyrir útskrift en líka fólk á öllum aldri af öðrum tilefnum og má af slíkum nefna afmæli eða brúðkaup. Hér á síðunni má sjá nokkur dæmi um skopmyndir ásamt upplýsingum um hvernig hafa má samband við mig og/eða panta teikningar."
    ],
    galleryTitle: "Sýnishorn",
    contactTitle: "Hafa samband - pantanir",
    contactInfo: "Sendu myndir og upplýsingar — ég reyni að svara innan 48 klst.",
    faqTitle: "Spurt og svarað"
  },
  pricing: [
    { min: 1, price: 25000 },
    { min: 5, price: 23000 }
  ],
  faq: [
    { q: "Í hvaða stærð eru myndirnar?", a: "A3, 42 x 29,7 sm." },
    {
      q: "Hvað tekur langan tíma að teikna hverja mynd?",
      a: `Það er breytilegt og fer eftir því hversu góð ljósmyndin er sem teikna skal eftir og hvort lýsingin á því sem á að vera á myndinni sé auðskiljanleg.

Þegar búið er að senda ljósmynd í tölvupósti til að teikna eftir og lýsingu á því sem á að vera á myndinni má reikna með tveimur eða þremur dögum í bið ef allt er í lagi og eins og það á að vera. Mikilvægt er að fylgja leiðbeiningum frá teiknara og hafa um fjögur til fimm atriði sem eiga að koma fram á teikningunni, í mesta lagi.

Dæmi: <i>Jón Jónsson, er í eróbikki að hrópa ,,koma svo!”, svitinn skvettist af honum á tvær konur í æfingagöllum sem eru ósáttar á svip. Fyrir ofan Jón er borði sem stendur á ,,Fáránlega hress gaur!”.</i>`
    },
    {
      q: "Er hægt að fá myndirnar í lit?",
      a: "Nei, það er því miður ekki hægt, þetta er blýantsteikning og teikningin er líka úðuð með fixatívi, þ.e. festiúða."
    }
  ]
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
  CONTENT LOADING
========================= */
function loadContent() {
  // No async/dynamic loading, just return hardcoded text
  return SITE_TEXT;
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

  // No gallery captions or figcaption injection

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
      p.innerHTML = String(item.a).replace(/\n/g, "<br>");

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

  // Only close when clicking the close button, not background or modal container

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
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const byId = (id) => links.find((a) => a.getAttribute("href") === `#${id}`);

  // underline bar
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const underline = document.createElement("div");
  underline.className = "nav-underline-bar";
  underline.style.opacity = 0;
  nav.appendChild(underline);

  function moveUnderlineTo(el) {
    if (!el) {
      underline.style.opacity = 0;
      return;
    }
    const rect = el.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    underline.style.width = rect.width + "px";
    underline.style.left = (rect.left - navRect.left) + "px";
    underline.style.opacity = 1;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Hero: no underline
        if (entry.target.id === "hero") {
          links.forEach((l) => l.classList.remove("active"));
          underline.style.opacity = 0;
          return;
        }

        links.forEach((l) => l.classList.remove("active"));
        const link = byId(entry.target.id);
        if (link) {
          link.classList.add("active");
          moveUnderlineTo(link);
        }
      });
    },
    {
      root: null,
      rootMargin: "-30% 0px -50% 0px",
      threshold: 0.05,
    }
  );

  sections.forEach((sec) => io.observe(sec));

  window.addEventListener("resize", () => moveUnderlineTo(document.querySelector(".nav a.active")), { passive: true });
  window.addEventListener("scroll", () => moveUnderlineTo(document.querySelector(".nav a.active")), { passive: true });

  setTimeout(() => moveUnderlineTo(document.querySelector(".nav a.active")), 100);
}

/* =========================
   PARALLAX HERO (SINGLE, CLEAN)
   Uses CSS var: --parallax-y
========================= */
function setupParallax() {
  const img = document.querySelector(".hero-bg img");
  const hero = document.querySelector(".hero-parallax");
  if (!img || !hero) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  let lastShift = null;
  const maxShift = 500;

  function updateParallax() {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    // 0..1 across hero visibility
    const progress = 1 - Math.min(
      Math.max((rect.top + rect.height) / (window.innerHeight + rect.height), 0),
      1
    );

    const shift = Math.round((progress - 0.5) * 2 * maxShift);
    if (shift === lastShift) return;
    lastShift = shift;

    // feed CSS transform: translate3d(0, var(--parallax-y), 0) scale(...)
    img.style.setProperty("--parallax-y", `${shift}px`);
  }

  window.addEventListener("scroll", updateParallax, { passive: true });
  window.addEventListener("resize", updateParallax, { passive: true });
  updateParallax();
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
        statusBox.textContent =
          "Takk fyrir! Ég reyni að staðfesta pöntunina og hafa samband við þig innan 48 klukkustunda.";
        statusBox.style.background = "#f6fff8";
      }
    } catch (err) {
      if (statusBox) {
        statusBox.hidden = false;
        statusBox.textContent = err?.message || "Eitthvað fór úrskeiðis.";
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
document.addEventListener("DOMContentLoaded", () => {
  setupYear();
  setupHamburger();
  setupActiveLinkSync();
  setupParallax();

  const data = loadContent();
  injectTextContent(data);

  PRICING_TIERS = (data.pricing && data.pricing.length) ? data.pricing : [];
  setupQuantityControls();
  updateTotals();

  setupImageModal();
  setupForm();

  // File upload preview for contact form
  const photosInput = document.getElementById("photos");
  const previewBox = document.getElementById("photoPreview");
  if (photosInput && previewBox) {
    photosInput.addEventListener("change", function () {
      previewBox.innerHTML = "";
      let files = Array.from(this.files || []);
      if (files.length > 10) {
        files = files.slice(0, 10);
        alert("Þú getur aðeins valið allt að 10 myndir.");
      }
      files.forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = function (e) {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.alt = file.name;
          img.style.maxWidth = "72px";
          img.style.maxHeight = "72px";
          img.style.borderRadius = "8px";
          img.style.objectFit = "cover";
          img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
          previewBox.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }
});
