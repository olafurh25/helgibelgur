// Collapse mobile header when not on hero/top
function setupMobileHeaderCollapse() {
  const hero = document.querySelector("#hero");
  if (!hero) return;

  const mq = window.matchMedia("(max-width: 768px)");

  const apply = (isOnHero) => {
    // Only collapse on mobile widths
    if (!mq.matches) {
      document.body.classList.remove("nav-collapsed");
      return;
    }
    document.body.classList.toggle("nav-collapsed", !isOnHero);
  };

  const io = new IntersectionObserver(
    (entries) => {
      // "On hero" when hero is meaningfully visible
      const entry = entries[0];
      apply(entry.isIntersecting);
    },
    {
      root: null,
      threshold: 0.15, // tweak: higher means "must see more hero to count as top"
    }
  );

  io.observe(hero);

  // Re-evaluate when switching orientations / resizing
  mq.addEventListener?.("change", () => {
    // force a refresh by checking hero visibility
    const rect = hero.getBoundingClientRect();
    const isOnHero = rect.top < window.innerHeight && rect.bottom > 0;
    apply(isOnHero);
  });
}
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
    contactInfo: "Sendu myndir og upplýsingar, ég reyni að svara innan tveggja sólahringa.",
    faqTitle: "Spurt og svarað"
  },
  pricing: [
    { min: 1, price: 25000 },
    { min: 5, price: 20000 }
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
    },
    {
      q: "Er hægt að láta teikna eftir hvernig mynd sem er?",
      a: "Nei, ljósmyndin þarf að vera með hárri upplausn og í fókus. Góð leið til að sjá hvort hún er nógu góð er að þysja (e. zoom) inn í myndina og ef hún helst í fókus þá er upplausnin nægilega mikil. Ef myndin verður óskýr þá er upplausnin ekki nógu góð."
    },
    {
      q: "Hversu miklar upplýsingar þurfa að vera í lýsingu á því sem á að vera á teikningunni?",
      a: `Það er gott að nefna fjögur eða fimm atriði. Ef of mikið er í lýsingunni er hætt við að það komist ekki allt fyrir á teikningunni.

Dæmi: <i>Jón Jónsson, er í eróbikki að hrópa ,,koma svo!”, svitinn skvettist af honum á tvær konur í æfingagöllum sem eru ósáttar á svip. Fyrir ofan Jón er borði sem stendur á ,,Fáránlega hress gaur!”.</i>`

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
  let scrollY = 0;
  const modal = $("#img-modal");
  const modalImg = $("#img-modal-img");
  if (!modal || !modalImg) return;

  const closeBtn = modal.querySelector(".img-modal-close");
  const leftBtn = modal.querySelector(".img-modal-chevron-left");
  const rightBtn = modal.querySelector(".img-modal-chevron-right");
  const galleryImgs = document.querySelectorAll(".gallery .card img");
  if (!galleryImgs.length) {
    console.warn("No gallery images found for modal setup.");
    return;
  }

  let currentIdx = 0;


  // --- Modal zoom/pan logic (register once) ---
  (function setupModalZoomPan() {
    const img = document.getElementById('img-modal-img');
    if (!img) return;

    let lastScale = 1;
    let startDistance = 0;
    let currentScale = 1;
    let origin = { x: 0, y: 0 };
    let lastOrigin = { x: 0, y: 0 };
    let isPinching = false;

    // Desktop scroll-to-zoom and pan
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let imgOffset = { x: 0, y: 0 };
    let panOffset = { x: 0, y: 0 };

    function setDesktopTransform(scale, offset) {
      img.style.transformOrigin = `center center`;
      img.style.transform = `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`;
    }

    // Scroll to zoom (desktop only, always centered)
    img.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.pointerType === 'touch') return; // ignore pinch-zoom gesture
      e.preventDefault();
      let scaleDelta = e.deltaY < 0 ? 1.15 : 0.87;
      let newScale = Math.max(1, Math.min(4, currentScale * scaleDelta));
      if (newScale !== currentScale) {
        // Always center zoom on container
        panOffset.x = 0;
        panOffset.y = 0;
        currentScale = newScale;
        lastScale = newScale;
        setDesktopTransform(currentScale, panOffset);
      }
    }, { passive: false });

    // Click and drag to pan (when zoomed)
    img.addEventListener('mousedown', (e) => {
      if (currentScale === 1) return;
      isDragging = true;
      dragStart = { x: e.clientX, y: e.clientY };
      imgOffset = { ...panOffset };
      img.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panOffset.x = imgOffset.x + (e.clientX - dragStart.x);
      panOffset.y = imgOffset.y + (e.clientY - dragStart.y);
      setDesktopTransform(currentScale, panOffset);
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        img.style.cursor = currentScale > 1 ? 'grab' : '';
      }
    });

    img.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        img.style.cursor = currentScale > 1 ? 'grab' : '';
      }
    });

    // Change cursor on zoom
    img.addEventListener('mousemove', () => {
      img.style.cursor = currentScale > 1 ? (isDragging ? 'grabbing' : 'grab') : '';
    });

    // Reset pan/zoom on modal close
    function resetZoomPan() {
      currentScale = 1;
      lastScale = 1;
      panOffset = { x: 0, y: 0 };
      setDesktopTransform(1, { x: 0, y: 0 });
      img.style.cursor = '';
    }

    // Reset zoom when modal closes
    if (closeBtn) {
      closeBtn.addEventListener('click', resetZoomPan);
    }

    // Also reset on modal background click and close modal
    const modalBg = document.querySelector('.img-modal-bg');
    if (modalBg) {
      modalBg.addEventListener('click', function() {
        resetZoomPan && resetZoomPan();
        closeModal();
      });
    }

    // Integrate with mobile pinch-to-zoom
    function setTransform(scale, origin) {
      // If desktop, use pan/zoom
      if (window.matchMedia('(pointer: fine)').matches) {
        setDesktopTransform(scale, panOffset);
      } else {
        img.style.transformOrigin = `${origin.x}px ${origin.y}px`;
        img.style.transform = `scale(${scale})`;
      }
    }

    function getDistance(t1, t2) {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function getMidpoint(t1, t2) {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    }

    img.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      img.setPointerCapture(e.pointerId);
    });

    let pointers = [];

    img.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') return;
      pointers = pointers.filter(p => p.pointerId !== e.pointerId);
      pointers.push(e);
      if (pointers.length === 2) {
        isPinching = true;
        const [t1, t2] = pointers;
        const dist = getDistance(t1, t2);
        if (!startDistance) {
          startDistance = dist;
          lastOrigin = getMidpoint(t1, t2);
        }
        currentScale = Math.max(1, Math.min(4, lastScale * (dist / startDistance)));
        origin = getMidpoint(t1, t2);
        setTransform(currentScale, origin);
      }
    });

    img.addEventListener('pointerup', (e) => {
      pointers = pointers.filter(p => p.pointerId !== e.pointerId);
      if (isPinching && pointers.length < 2) {
        lastScale = currentScale;
        startDistance = 0;
        isPinching = false;
      }
    });

    img.addEventListener('pointercancel', (e) => {
      pointers = pointers.filter(p => p.pointerId !== e.pointerId);
      if (pointers.length < 2) {
        lastScale = currentScale;
        startDistance = 0;
        isPinching = false;
      }
    });

    img.addEventListener('pointerout', (e) => {
      pointers = pointers.filter(p => p.pointerId !== e.pointerId);
    });
  })();

  function showImage(idx) {
    currentIdx = idx;
    const img = galleryImgs[currentIdx];
    modalImg.src = img.src;
    modalImg.alt = img.alt || "";
  }

  function openModal(src, alt, idx) {
  modalImg.src = src;
  modalImg.alt = alt || "";

  scrollY = window.scrollY;

  modal.style.display = "flex";
  document.body.classList.add("modal-open");

  // hard lock scroll
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";

  modal.focus();
  if (typeof idx === "number") currentIdx = idx;
}

function closeModal() {
  modal.style.display = "none";
  modalImg.src = "";

  document.body.classList.remove("modal-open");

  // unlock scroll + restore position
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, scrollY);
}


  galleryImgs.forEach((img, idx) => {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => openModal(img.src, img.alt, idx));
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(img.src, img.alt, idx);
      }
    });
    img.tabIndex = 0;
  });

  // Enable pan/zoom for modal images (do not force cursor to default)

  leftBtn?.addEventListener("click", () => {
    showImage(currentIdx - 1);
  });
  rightBtn?.addEventListener("click", () => {
    showImage(currentIdx + 1);
  });

  closeBtn?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (modal.style.display === "flex") {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showImage(currentIdx - 1);
      if (e.key === "ArrowRight") showImage(currentIdx + 1);
    }
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

  // Close menu when clicking anywhere outside nav + hamburger
  document.addEventListener("click", (e) => {
    const isOpen = nav.classList.contains("active");
    if (!isOpen) return;

    const clickedInsideNav = nav.contains(e.target);
    const clickedHamburger = hamburger.contains(e.target);

    if (!clickedInsideNav && !clickedHamburger) {
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

  // File upload preview for contact form with remove option
  const photosInput = document.getElementById("photos");
  const previewBox = document.getElementById("photoPreview");
  let selectedFiles = [];
  if (photosInput && previewBox) {
    function renderPreview() {
      previewBox.innerHTML = "";
      selectedFiles.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = function (e) {
          const wrapper = document.createElement("div");
          wrapper.style.position = "relative";
          wrapper.style.display = "inline-block";
          const img = document.createElement("img");
          img.src = e.target.result;
          img.alt = file.name;
          img.style.maxWidth = "72px";
          img.style.maxHeight = "72px";
          img.style.borderRadius = "8px";
          img.style.objectFit = "cover";
          img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)";
          // Remove button
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = "×";
          btn.title = "Fjarlægja mynd";
          btn.style.position = "absolute";
          btn.style.top = "-8px";
          btn.style.right = "-8px";
          btn.style.background = "#fff";
          btn.style.border = "1px solid #ccc";
          btn.style.borderRadius = "50%";
          btn.style.width = "22px";
          btn.style.height = "22px";
          btn.style.cursor = "pointer";
          btn.style.fontWeight = "bold";
          btn.style.color = "#333";
          btn.style.boxShadow = "0 1px 4px rgba(0,0,0,0.10)";
          btn.addEventListener("click", function () {
            selectedFiles.splice(idx, 1);
            updateInputFiles();
            renderPreview();
          });
          wrapper.appendChild(img);
          wrapper.appendChild(btn);
          previewBox.appendChild(wrapper);
        };
        reader.readAsDataURL(file);
      });
    }

    function updateInputFiles() {
      // Create a new DataTransfer to update the input's files
      const dt = new DataTransfer();
      selectedFiles.forEach(f => dt.items.add(f));
      photosInput.files = dt.files;
    }

    photosInput.addEventListener("change", function () {
      let files = Array.from(this.files || []);
      if (files.length > 10) {
        files = files.slice(0, 10);
        alert("Þú getur aðeins valið allt að 10 myndir.");
      }
      // Add new files, avoiding duplicates by name+size
      files.forEach(file => {
        if (!file.type.startsWith("image/")) return;
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
          selectedFiles.push(file);
        }
      });
      if (selectedFiles.length > 10) {
        selectedFiles = selectedFiles.slice(0, 10);
      }
      updateInputFiles();
      renderPreview();
    });
  }
  setupMobileHeaderCollapse();
});
