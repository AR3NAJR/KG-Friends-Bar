/* ==================================================================
   KG FRIENDS — animazioni
   Tutto il file rispetta prefers-reduced-motion: se l'utente ha
   richiesto meno movimento, le animazioni via scroll vengono
   disattivate e i contenuti restano semplicemente visibili.
   ================================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("js-ready");

  // Anno corrente nel footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------------
     Se l'utente preferisce meno movimento: rendiamo tutto visibile
     da subito e usciamo, senza montare pin, scrub o parallax.
     ---------------------------------------------------------------- */
  if (reduceMotion) {
    gsap.set("[data-reveal]", { opacity: 1, y: 0 });
    gsap.set(".scene", { opacity: 1, position: "relative" });
    setupMapVeil();
    return;
  }

  /* ==================================================================
     1. L'ARCO CELESTE — indicatore di progresso globale
     ================================================================== */
  (function celestialArc() {
    const path = document.getElementById("arcPath");
    const body = document.getElementById("celestialBody");
    if (!path || !body) return;

    const len = path.getTotalLength();
    const skyColors = ["#F4A65B", "#FF7E6B", "#4A3358", "#FBF3E7"]; // giorno -> luna

    function paint(progress) {
      const pt = path.getPointAtLength(progress * len);
      // il viewBox è 100x20 con preserveAspectRatio="none": le coordinate
      // corrispondono direttamente a percentuali di larghezza/altezza.
      body.style.left = pt.x + "%";
      body.style.top = (pt.y / 20) * 100 + "%";
      const color = gsap.utils.interpolate(skyColors, progress);
      body.style.background = color;
      body.style.boxShadow = `0 0 14px 3px ${color}`;
    }

    paint(0);

    ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => paint(self.progress),
    });
  })();

  /* ==================================================================
     2. HERO — ingresso al caricamento della pagina
     ================================================================== */
  (function heroIntro() {
    const els = gsap.utils.toArray(".hero [data-reveal]");
    if (!els.length) return;
    gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } })
      .to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.12 });
  })();

  /* ==================================================================
     3. REVEAL GENERICO per il resto della pagina
     ================================================================== */
  (function scrollReveals() {
    const els = gsap.utils.toArray("[data-reveal]").filter(
      (el) => !el.closest(".hero")
    );
    els.forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });
  })();

  /* ==================================================================
     4. THE EXPERIENCE — scrollytelling giorno -> notte
     ================================================================== */
  (function experience() {
    const section = document.getElementById("experience");
    const sky = document.getElementById("experienceSky");
    const scenes = gsap.utils.toArray(".scene");
    const lights = gsap.utils.toArray(".experience__lights span");
    const progressBar = document.getElementById("experienceProgress");
    if (!section || !sky || !scenes.length) return;

    gsap.set(scenes, { autoAlpha: 0, y: 24 });
    gsap.set(lights, { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        pin: "#experiencePin",
        onUpdate: (self) => {
          if (progressBar) progressBar.style.width = self.progress * 100 + "%";
        },
      },
    });

    // Il "cielo" è un banner verticale alto 4x il riquadro: farlo scorrere
    // verso l'alto rivela in sequenza oro -> tramonto -> viola -> notte.
    tl.to(sky, { yPercent: -75, duration: 1 }, 0);

    // Scena 1 — L'aperitivo
    tl.to(scenes[0], { autoAlpha: 1, y: 0, duration: 0.08 }, 0.02)
      .to(scenes[0], { autoAlpha: 0, y: -24, duration: 0.08 }, 0.26);

    // Scena 2 — Il tramonto
    tl.to(scenes[1], { autoAlpha: 1, y: 0, duration: 0.08 }, 0.36)
      .to(scenes[1], { autoAlpha: 0, y: -24, duration: 0.08 }, 0.60);

    // Scena 3 — La notte (resta visibile fino alla fine)
    tl.to(scenes[2], { autoAlpha: 1, y: 0, duration: 0.08 }, 0.70);

    // Le lucine si accendono mentre si entra nella fase notturna
    tl.to(lights, { opacity: 1, duration: 0.001, stagger: 0.025 }, 0.62);
  })();

  /* ==================================================================
     5. MENU — tilt 3D + glow al passaggio del mouse
     ================================================================== */
  (function drinkTilt() {
    const cards = gsap.utils.toArray(".drink-card");
    cards.forEach((card) => {
      const rotX = gsap.quickTo(card, "rotateX", { duration: 0.5, ease: "power3.out" });
      const rotY = gsap.quickTo(card, "rotateY", { duration: 0.5, ease: "power3.out" });
      const lift = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });

      card.style.perspective = "800px";

      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        rotY((px - 0.5) * 14);
        rotX((0.5 - py) * 14);
        lift(-6);
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      });

      card.addEventListener("pointerleave", () => {
        rotX(0);
        rotY(0);
        lift(0);
      });
    });
  })();

  /* ==================================================================
     6. SOCIAL PROOF — contatore animato + marquee recensioni
     ================================================================== */
  (function reviews() {
    const numEl = document.getElementById("reviewNumber");
    const countEl = document.getElementById("reviewCount");
    const section = document.getElementById("reviews");
    if (numEl && countEl && section) {
      const data = { n: 0, c: 0 };
      gsap.to(data, {
        n: 4.0,
        c: 430,
        duration: 1.8,
        ease: "power2.out",
        scrollTrigger: { trigger: section, start: "top 75%", once: true },
        onUpdate: () => {
          numEl.textContent = data.n.toFixed(1);
          countEl.textContent = Math.round(data.c);
        },
      });
    }

    const marquee = document.getElementById("reviewsMarquee");
    if (marquee) {
      const loop = gsap.to(marquee, {
        xPercent: -50,
        repeat: -1,
        duration: 32,
        ease: "none",
      });
      marquee.addEventListener("mouseenter", () => loop.pause());
      marquee.addEventListener("mouseleave", () => loop.play());
    }
  })();

  /* ==================================================================
     7. FOOTER — mappa: un tap per "sbloccare" lo scroll interno
     ================================================================== */
  setupMapVeil();

  function setupMapVeil() {
    const veil = document.getElementById("mapVeil");
    const frame = document.querySelector(".footer__map-frame");
    if (!veil || !frame) return;
    frame.style.pointerEvents = "none";
    veil.addEventListener("click", () => {
      veil.classList.add("is-hidden");
      frame.style.pointerEvents = "auto";
    });
  }

  // Ricalcola le posizioni dopo che i font sono pronti (evita scarti di layout)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
