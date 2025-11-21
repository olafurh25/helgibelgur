// ---- CONFIG: edit pricing + currency here ----
const CURRENCY = "kr.";
const PRICING_TIERS = [
  // minQty, unit price
  { min: 1,  price: 15000 },
  { min: 5,  price: 13000 },
  { min: 10, price: 11000 },
  { min: 20, price: 9000 },
];
// ----------------------------------------------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// === Hamburger Menu ===
const hamburger = $("#hamburger");
const nav = $("#nav");

if (hamburger && nav) {
  hamburger.addEventListener("click", () => {
    const isActive = nav.classList.toggle("active");
    hamburger.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", isActive);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isActive ? "hidden" : "";
  });
  
  // Close menu when clicking on a nav link
  $$(".nav a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
  
  // Close menu when clicking on overlay
  nav.addEventListener("click", (e) => {
    if (e.target === nav) {
      nav.classList.remove("active");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  });
}

const qtyInput = $("#qty");
const unitPriceEl = $("#unitPrice");
const subtotalEl = $("#subtotal");
const tierListEl = $("#tierList");

const form = $("#orderForm");
const quantityField = $("#quantity");
const unitPriceField = $("#unitPriceField");
const subtotalField = $("#subtotalField");
const statusBox = $("#formStatus");

// Build tier list UI
function formatMoney(n) {
  // Format with thousands separator, no decimals, currency after value
  // Place a dot at the first non-zero digit from the right (Icelandic style: 15.000 kr.)
  if (typeof n !== 'number') n = Number(n);
  let s = n.toString();
  // Insert dot as thousands separator
  s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return s + ' ' + CURRENCY;
}
function activeTier(qty){
  let current = PRICING_TIERS[0];
  for (const t of PRICING_TIERS){
    if (qty >= t.min) current = t;
  }
  return current;
}
function renderTiers(qty){
  tierListEl.innerHTML = "";
  PRICING_TIERS.forEach(t => {
    const next = document.createElement("div");
    next.className = "tier" + (qty >= t.min && activeTier(qty).min === t.min ? " active" : "");
    next.innerHTML = `
      <span>${t.min}+ portrett</span>
      <span class="badge">${formatMoney(t.price)} á mynd</span>
    `;
    tierListEl.appendChild(next);
  });
}
function updateTotals(){
  const q = Math.max(0, parseInt(qtyInput.value || "0", 10));
  qtyInput.value = q;
  quantityField.value = q; // sync to form
  const tier = activeTier(q);
  const sub = tier.price * q;
  unitPriceEl.textContent = formatMoney(tier.price);
  subtotalEl.textContent  = formatMoney(sub);
  unitPriceField.value = tier.price;
  subtotalField.value = sub.toFixed(2);
  renderTiers(q);
}

// Stepper
$$(".step").forEach(btn => {
  btn.addEventListener("click", () => {
    const step = parseInt(btn.dataset.step, 10);
    qtyInput.value = Math.max(0, (parseInt(qtyInput.value || "0", 10) + step));
    updateTotals();
  });
});

// Keep calculator and form quantity in sync both ways
qtyInput.addEventListener("input", updateTotals);
quantityField.addEventListener("input", () => {
  qtyInput.value = Math.max(0, parseInt(quantityField.value || "0", 10));
  updateTotals();
});

// Year
$("#year").textContent = new Date().getFullYear();

// Validate + submit Formspree
function showError(id, msg) {
  const el = document.querySelector(`.error[data-for="${id}"]`);
  const input = document.getElementById(id);
  if (el) {
    if (msg) {
      el.textContent = msg;
      el.style.display = '';
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  }
  if (input) {
    if (msg) {
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  }
}
function validEmail(s){ return /^\S+@\S+\.\S+$/.test(s); }

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusBox.hidden = true; statusBox.textContent = "";

  const name = $("#name").value.trim();
  const email = $("#email").value.trim();
  const phone = $("#phone").value.trim();
  let hasError = false;

  // Name validation
  if (!name) {
    showError("name", "Vinsamlegast sláðu inn nafn.");
    hasError = true;
  } else {
    showError("name", "");
  }

  // Email validation
  if (!validEmail(email)) {
    showError("email", "Vinsamlegast sláðu inn gilt netfang.");
    hasError = true;
  } else {
    showError("email", "");
  }

  // Phone validation: allow 7-15 digits, optionally with space or dash after first three
  // Accept: 5551234, 555 1234, 555-1234, 555 123 4567, 555-123-4567, etc.
  const phoneValid = /^\d{3}([ -]?\d{3,})?$/.test(phone.replace(/\s+/g, ' ').replace(/-+/g, '-')) &&
    phone.replace(/[^\d]/g, '').length >= 7 && phone.replace(/[^\d]/g, '').length <= 15;
  if (!phoneValid) {
    showError("phone", "Vinsamlegast sláðu inn gilt símanúmer.");
    hasError = true;
  } else {
    showError("phone", "");
  }

  if (hasError) return;

  // Ensure totals are fresh
  updateTotals();

  // Format phone to only digits before sending
  const data = new FormData(form);
  if (data.has('phone')) {
    data.set('phone', phone.replace(/[^\d]/g, ''));
  }
  // Set Icelandic field names for price and date
  if (data.has('einingarverd')) {
    data.set('einingarverd', unitPriceField.value);
  }
  if (data.has('samtalsverd')) {
    data.set('samtalsverd', subtotalField.value);
  }
  // Add date field in Icelandic
  if (data.has('dagsetning')) {
    data.set('dagsetning', new Date().toLocaleDateString('is-IS'));
  }
  try{
    const res = await fetch(form.action, { method:"POST", body:data, headers:{ "Accept":"application/json" }});
    if (res.ok){
      form.reset();
      updateTotals();
      statusBox.hidden = false;
      statusBox.textContent = "Takk fyrir! Ég reyni að staðfesta pöntunina og hafa samband við þig innan 48 klukkustunda.";
      statusBox.style.background = "#f6fff8";
    }else{
      const err = await res.json().catch(()=>({}));
      throw new Error(err?.errors?.[0]?.message || "Something went wrong. Please email me.");
    }
  }catch(err){
    statusBox.hidden = false;
    statusBox.textContent = err.message;
    statusBox.style.background = "#fff6f6";
  }
});

// Init
updateTotals();

// === Parallax Hero (append at bottom) ===
(() => {
  const img = document.querySelector('.hero-bg img');
  const hero = document.querySelector('.hero-parallax');
  if (!img || !hero) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  let lastY = -1;
  const maxShift = 40; // tweak: 20–80

  function onScroll(){
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return; // off-screen, skip

    const progress = 1 - Math.min(Math.max((rect.top + rect.height) / (window.innerHeight + rect.height), 0), 1);
    const shift = Math.round((progress - 0.5) * 2 * maxShift); // -max..max
    if (shift === lastY) return;
    lastY = shift;
    img.style.setProperty('--parallax-y', `${shift}px`);
  }

  function loop(){ onScroll(); requestAnimationFrame(loop); }
  loop();

  window.addEventListener('resize', onScroll, { passive: true });
})();

// --- Active link sync with section in view ---
(() => {
  const links = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  // IntersectionObserver to set .active on nav links
  const byId = id => links.find(a => a.getAttribute('href') === `#${id}`);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        links.forEach(l => l.classList.remove('active'));
        const link = byId(entry.target.id);
        link && link.classList.add('active');
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -55% 0px',  // favor the section nearest the top
    threshold: 0.2
  });

  sections.forEach(sec => io.observe(sec));
})();

// === Image Modal Zoom ===
function setupImageModal() {
  const modal = document.getElementById('img-modal');
  const modalImg = document.getElementById('img-modal-img');
  const closeBtn = modal.querySelector('.img-modal-close');
  const galleryImgs = document.querySelectorAll('.gallery .card img');

  function openModal(src, alt) {
    modalImg.src = src;
    modalImg.alt = alt || '';
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    modal.focus();
  }
  function closeModal() {
    modal.style.display = 'none';
    modalImg.src = '';
    document.body.classList.remove('modal-open');
  }
  galleryImgs.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', e => {
      openModal(img.src, img.alt);
    });
  });
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal || e.target === modal.querySelector('.img-modal-bg')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (modal.style.display === 'flex' && (e.key === 'Escape' || e.key === 'Esc')) closeModal();
  });
}
setupImageModal();
