const Navigation = {
  /**
   * Initialize navigation event listeners
   */
  init() {
    const navLinks = document.querySelectorAll("a[data-section]");
    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const targetId = link.dataset.section;
        this.navigateTo(targetId);

        const menu = document.querySelector(".menu-links");
        if (menu && menu.classList.contains("open")) {
          this.toggleMenu();
        }
      });
    });

    window.addEventListener("popstate", () => {
      this.handleRouteChange();
    });

    this.handleRouteChange();
  },

  /**
   * Show a specific section and hide others
   * @param {string} sectionId - ID of section to show
   */
  showSection(sectionId) {
    const sections = document.querySelectorAll(".page-section");
    sections.forEach((section) => {
      section.classList.remove("active");
      section.hidden = true;
    });

    const resolvedId = this.resolveSectionId(sectionId);
    const targetSection = document.getElementById(resolvedId);
    if (targetSection) {
      targetSection.classList.add("active");
      targetSection.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  /**
   * Toggle hamburger menu
   */
  toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu?.classList.toggle("open");
    icon?.classList.toggle("open");
  },

  /**
   * Initialize hamburger menu toggle
   */
  initHamburger() {
    const hamburgerIcon = document.querySelector(".hamburger-icon");
    if (hamburgerIcon) {
      hamburgerIcon.addEventListener("click", () => {
        this.toggleMenu();
      });
    }
  },

  /**
   * Keep sections in sync with the URL hash
   */
  handleRouteChange() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const targetId = this.pathToSection(path);
    const resolvedId = this.resolveSectionId(targetId);
    this.showSection(resolvedId);
    if (this.sectionToPath(resolvedId) !== path) {
      this.replacePath(resolvedId);
    }
  },

  /**
   * Ensure the hash matches a valid section
   * @param {string} sectionId
   */
  resolveSectionId(sectionId) {
    if (!sectionId) {
      return "home";
    }

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      return sectionId;
    }

    return "home";
  },

  /**
   * Convert section id to path
   * @param {string} sectionId
   */
  sectionToPath(sectionId) {
    if (!sectionId || sectionId === "home") {
      return "/";
    }

    return `/${sectionId}`;
  },

  /**
   * Convert path to section id
   * @param {string} path
   */
  pathToSection(path) {
    if (!path || path === "/") {
      return "home";
    }

    return path.replace(/^\//, "");
  },

  /**
   * Navigate to section using History API
   * @param {string} sectionId
   */
  navigateTo(sectionId) {
    const resolvedId = this.resolveSectionId(sectionId);
    const nextPath = this.sectionToPath(resolvedId);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    this.showSection(resolvedId);
  },

  /**
   * Replace current path to match section
   * @param {string} sectionId
   */
  replacePath(sectionId) {
    const nextPath = this.sectionToPath(sectionId);
    if (window.location.pathname !== nextPath) {
      window.history.replaceState({}, "", nextPath);
    }
  },

};

export default Navigation;
