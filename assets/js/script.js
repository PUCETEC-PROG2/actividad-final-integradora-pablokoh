document.addEventListener("DOMContentLoaded", () => {
  // Inicializacion central del sitio.
  setupPageLoader();
  setupMobileNav();
  setupRevealAnimations();
  setupProductFilters();
  setupContactValidation();
  setupFooterYear();
  setupParticles();
});

// Loader inicial y transicion al navegar entre paginas internas.
function setupPageLoader() {
  const loader = document.getElementById("pageLoader");

  if (!loader) {
    return;
  }

  let isHidden = false;

  const hideLoader = () => {
    if (isHidden) return;
    isHidden = true;
    loader.classList.add("page-loader--hidden");
  };

  const showLoader = () => {
    isHidden = false;
    loader.classList.remove("page-loader--hidden");
  };

  const getTrackedImages = () =>
    Array.from(document.querySelectorAll("main img, header img, .page-loader__img")).filter(
      (img) => Boolean(img.getAttribute("src"))
    );

  const waitForImageReady = (img) =>
    new Promise((resolve) => {
      const finish = () => resolve();

      if (img.complete && img.naturalWidth > 0) {
        if (typeof img.decode === "function") {
          img.decode().then(finish).catch(finish);
        } else {
          finish();
        }
        return;
      }

      img.addEventListener("load", finish, { once: true });
      img.addEventListener("error", finish, { once: true });
    });

  const waitForAssetsReady = async () => {
    const images = getTrackedImages();
    if (!images.length) {
      return;
    }

    const allAssets = Promise.allSettled(images.map(waitForImageReady));
    const timeout = new Promise((resolve) => setTimeout(resolve, 9000));
    await Promise.race([allAssets, timeout]);
  };

  const hideLoaderWhenAssetsAreReady = async () => {
    await waitForAssetsReady();
    requestAnimationFrame(() => {
      requestAnimationFrame(hideLoader);
    });
  };

  if (document.readyState === "complete") {
    hideLoaderWhenAssetsAreReady();
  } else {
    window.addEventListener("load", hideLoaderWhenAssetsAreReady, { once: true });
  }

  // Si se vuelve desde cache del navegador, oculta el loader inmediatamente.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      hideLoader();
    }
  });

  const links = document.querySelectorAll("a[href]");

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;

      const href = link.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const isSamePageAnchor =
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        Boolean(url.hash);

      if (isSamePageAnchor) return;

      event.preventDefault();
      showLoader();
      setTimeout(() => {
        window.location.href = url.href;
      }, 120);
    });
  });
}
// Menu hamburguesa para pantallas pequenas.
function setupMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Entrada progresiva de secciones al hacer scroll.
function setupRevealAnimations() {
  const revealElements = document.querySelectorAll(".reveal");

  if (!revealElements.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          instance.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((element, index) => {
    const delay = Math.min(index * 80, 360);
    element.style.transitionDelay = `${delay}ms`;
    observer.observe(element);
  });
}

// Filtros por categoria para la pagina de productos.
function setupProductFilters() {
  const productGrid = document.getElementById("productGrid");

  if (!productGrid) {
    return;
  }

  const cards = Array.from(productGrid.querySelectorAll(".product-card"));
  const buttons = Array.from(document.querySelectorAll(".filter-btn"));
  const filterText = document.getElementById("filtroActual");
  const emptyState = document.getElementById("emptyState");

  const filterLabels = {
    todos: "todos los productos",
    cuerdas: "cuerdas",
    percusion: "percusion",
    teclados: "teclados"
  };

  const setActiveButton = (currentFilter) => {
    buttons.forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === currentFilter);
    });
  };

  const applyFilter = (value) => {
    const filter = filterLabels[value] ? value : "todos";
    let visibleCount = 0;

    cards.forEach((card) => {
      const showCard = filter === "todos" || card.dataset.category === filter;
      card.hidden = !showCard;
      if (showCard) {
        visibleCount += 1;
      }
    });

    if (filterText) {
      filterText.textContent =
        filter === "todos"
          ? "Mostrando todos los instrumentos disponibles."
          : `Mostrando instrumentos de: ${filterLabels[filter]}.`;
    }

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }

    setActiveButton(filter);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.filter || "todos");
    });
  });

  const queryFilter = new URLSearchParams(window.location.search).get("categoria");
  applyFilter(queryFilter || "todos");
}

// Validacion requerida por la rubrica del formulario de contacto.
function setupContactValidation() {
  const form = document.getElementById("contactForm");

  if (!form) {
    return;
  }

  const status = document.getElementById("formStatus");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const fields = {
    nombre: {
      input: form.elements.nombre,
      validate: (value) => {
        if (!value.trim()) return "El nombre es obligatorio.";
        if (value.trim().length < 3) return "El nombre debe tener al menos 3 caracteres.";
        return "";
      }
    },
    ciudad: {
      input: form.elements.ciudad,
      validate: (value) => (!value.trim() ? "La ciudad es obligatoria." : "")
    },
    email: {
      input: form.elements.email,
      validate: (value) => {
        if (!value.trim()) return "El email es obligatorio.";
        if (!emailRegex.test(value.trim())) return "Ingresa un email con formato valido.";
        return "";
      }
    },
    asunto: {
      input: form.elements.asunto,
      validate: (value) => (!value.trim() ? "El asunto es obligatorio." : "")
    },
    descripcion: {
      input: form.elements.descripcion,
      validate: (value) => {
        if (!value.trim()) return "La descripcion es obligatoria.";
        if (value.trim().length < 10) return "La descripcion debe tener al menos 10 caracteres.";
        return "";
      }
    }
  };

  function setFieldError(name, message) {
    const errorContainer = form.querySelector(`[data-error-for="${name}"]`);
    const field = fields[name].input;

    if (errorContainer) {
      errorContainer.textContent = message;
    }

    field.classList.toggle("input-invalid", Boolean(message));
  }

  function validateField(name) {
    const config = fields[name];
    const error = config.validate(config.input.value);
    setFieldError(name, error);
    return !error;
  }

  Object.keys(fields).forEach((name) => {
    const field = fields[name].input;
    ["input", "blur"].forEach((eventName) => {
      field.addEventListener(eventName, () => {
        validateField(name);
      });
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Valida todos los campos antes de permitir el envio.
    const isValid = Object.keys(fields).every((name) => validateField(name));

    if (!isValid) {
      if (status) {
        status.textContent = "Corrige los errores del formulario antes de enviar.";
        status.className = "form-status error";
      }
      return;
    }

    if (status) {
      status.textContent = "Mensaje enviado correctamente (simulacion).";
      status.className = "form-status success";
    }

    form.reset();
    Object.keys(fields).forEach((name) => setFieldError(name, ""));
  });
}

// Actualiza el anio legal automaticamente en todos los footers.
function setupFooterYear() {
  const yearNodes = document.querySelectorAll("[data-current-year]");

  if (!yearNodes.length) {
    return;
  }

  const currentYear = String(new Date().getFullYear());
  yearNodes.forEach((node) => {
    node.textContent = currentYear;
  });
}

// Fondo interactivo de particulas con ajuste para scroll en moviles.
function setupParticles() {
  const canvas = document.getElementById("particle-canvas");

  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  let width = 0;
  let height = 0;
  let previousWidth = 0;
  let previousHeight = 0;
  let particles = [];
  const pointer = { x: null, y: null };
  const getParticleCount = () => Math.max(32, Math.min(80, Math.floor(window.innerWidth / 19)));

  function resizeCanvas(force = false) {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    const widthDelta = Math.abs(nextWidth - previousWidth);
    const heightDelta = Math.abs(nextHeight - previousHeight);
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // En moviles, el scroll suele cambiar levemente el alto por la barra del navegador.
    // Ignorar esos cambios evita saltos visuales en las particulas.
    const shouldIgnoreMobileShift =
      !force &&
      isTouchDevice &&
      widthDelta < 2 &&
      heightDelta > 0 &&
      heightDelta < 180;

    if (shouldIgnoreMobileShift) {
      return;
    }

    previousWidth = nextWidth;
    previousHeight = nextHeight;
    width = canvas.width = nextWidth;
    height = canvas.height = nextHeight;

    if (!particles.length) {
      return;
    }

    particles.forEach((particle) => {
      particle.x = Math.min(Math.max(particle.x, 0), width);
      particle.y = Math.min(Math.max(particle.y, 0), height);
    });
  }

  function randomParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: Math.random() * 2 + 0.8
    };
  }

  function createParticles() {
    const particleCount = getParticleCount();
    particles = Array.from({ length: particleCount }, randomParticle);
  }

  function drawParticle(particle) {
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fillStyle = "rgba(220, 245, 255, 0.7)";
    context.fill();
  }

  function connectParticleLines() {
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.hypot(dx, dy);

        if (distance < 120) {
          const alpha = 1 - distance / 120;
          context.beginPath();
          context.moveTo(particles[i].x, particles[i].y);
          context.lineTo(particles[j].x, particles[j].y);
          context.strokeStyle = `rgba(150, 214, 190, ${alpha * 0.25})`;
          context.lineWidth = 1;
          context.stroke();
        }
      }
    }
  }

  function updateParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > width) {
      particle.vx *= -1;
    }

    if (particle.y < 0 || particle.y > height) {
      particle.vy *= -1;
    }

    if (pointer.x !== null && pointer.y !== null) {
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 120) {
        particle.x -= dx * 0.0025;
        particle.y -= dy * 0.0025;
      }
    }
  }

  function animate() {
    context.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      updateParticle(particle);
      drawParticle(particle);
    });

    connectParticleLines();
    requestAnimationFrame(animate);
  }

  resizeCanvas(true);
  createParticles();
  animate();

  window.addEventListener("resize", () => {
    const oldCount = particles.length;
    resizeCanvas();

    const nextCount = getParticleCount();
    if (nextCount !== oldCount) {
      createParticles();
    }
  });

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });

  window.addEventListener("pointerleave", () => {
    pointer.x = null;
    pointer.y = null;
  });
}

