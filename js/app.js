import DataLoader from "./dataLoader.js";
import Navigation from "./navigation.js";
import ComponentRenderer from "./componentRenderer.js";
import FormHandler from "./formHandler.js";
import { initExpand } from "./expand.js";

const App = {
  /**
   * Build home payload with API-first dynamic data and local static fallback
   * @param {Object|null} apiHomeData
   * @param {Object|null} localHomeData
   * @returns {Object|null}
   */
  buildHomePayload(apiHomeData, localHomeData) {
    const localStats = Array.isArray(localHomeData?.stats)
      ? localHomeData.stats.map((stat) => ({
          label: stat.label,
          value: stat.number,
        }))
      : [];

    const localPublications = Array.isArray(localHomeData?.publications)
      ? localHomeData.publications.map((pub) => ({
          title: pub.title,
          journal: pub.journal,
          status: pub.tag,
          authors: pub.authors ? [pub.authors] : [],
          doi: "N/A",
          school: null,
        }))
      : [];

    const localSchools = Array.isArray(localHomeData?.schools)
      ? localHomeData.schools.flatMap((group) =>
          (group.schools || []).map((school) => ({
            acronym: school.acronym,
            school_name: school.fullname,
            category: group.category,
            description: school.focus,
          }))
        )
      : [];

    const mergedHome = {
      stats: apiHomeData?.stats?.length ? apiHomeData.stats : localStats,
      featuredPublications: apiHomeData?.featuredPublications?.length
        ? apiHomeData.featuredPublications
        : localPublications,
      researchAreas: apiHomeData?.researchAreas?.length
        ? apiHomeData.researchAreas
        : localHomeData?.researchAreas || [],
      schools: apiHomeData?.schools?.length ? apiHomeData.schools : localSchools,
    };

    const hasData =
      mergedHome.stats.length ||
      mergedHome.featuredPublications.length ||
      mergedHome.researchAreas.length ||
      mergedHome.schools.length;

    return hasData ? mergedHome : null;
  },

  /**
   * Merge API research areas with local image metadata
   * @param {Array} apiAreas
   * @returns {Promise<Array>}
   */
  async enrichResearchAreasWithLocalImages(apiAreas = []) {
    try {
      const localAreas = await DataLoader.loadLocalJSON("./data/researchAreas.json");
      if (!Array.isArray(localAreas)) return apiAreas;

      const localByTitle = new Map(
        localAreas.map((area) => [
          (area.title ?? area.name ?? "").trim().toLowerCase(),
          area,
        ])
      );

      const mergedApiAreas = apiAreas.map((area) => {
        const key = (area.title ?? area.name ?? "").trim().toLowerCase();
        const localMatch = localByTitle.get(key);
        if (!localMatch) return area;

        return {
          ...area,
          image: area.image || localMatch.image || "",
          description: area.description || localMatch.description || "",
        };
      });

      const apiKeys = new Set(
        apiAreas.map((area) =>
          (area.title ?? area.name ?? "").trim().toLowerCase()
        )
      );

      const localOnlyAreas = localAreas.filter((area) => {
        const key = (area.title ?? area.name ?? "").trim().toLowerCase();
        return key && !apiKeys.has(key);
      });

      return [...mergedApiAreas, ...localOnlyAreas];
    } catch (error) {
      console.warn("Research image enrichment skipped:", error.message);
      return apiAreas;
    }
  },

  renderLocalFirst(localData) {
    const {
      homeStaticData,
      aboutStaticData,
      contactStaticData,
    } = localData;

    const homeData = this.buildHomePayload(null, homeStaticData);

    if (homeData) {
      ComponentRenderer.renderHome(homeData);
    }

    if (aboutStaticData?.about && aboutStaticData?.aboutStats) {
      ComponentRenderer.renderAboutFromApi(
        aboutStaticData.about,
        aboutStaticData.aboutStats
      );
    }

    if (homeStaticData?.researchAreas?.length) {
      this.initAlphabetFilter(homeStaticData.researchAreas);
    }

    if (homeData?.schools?.length) {
      ComponentRenderer.renderSchoolsFromApi(homeData.schools);
    }

    if (homeStaticData?.publications?.length) {
      ComponentRenderer.renderPublicationsFromApi(homeStaticData.publications);
      this.initPublicationFilter(homeStaticData.publications);
    }

    if (contactStaticData) {
      ComponentRenderer.renderContact(contactStaticData);
    }
  },

  async hydrateWithAPI(localData) {
    const {
      homeStaticData,
      aboutStaticData,
      contactStaticData,
    } = localData;

    const [
      homeApiData,
      researchAreasData,
      schoolsData,
      publicationsData,
      contactInfo,
    ] = await Promise.all([
      DataLoader.loadHome(),
      DataLoader.loadResearchAreas(),
      DataLoader.loadSchools(),
      DataLoader.loadPublications(),
      DataLoader.loadContactInfo(),
    ]);

    const homeData = this.buildHomePayload(homeApiData, homeStaticData);

    if (homeData) {
      ComponentRenderer.renderHome(homeData);
    }

    if (aboutStaticData?.about && aboutStaticData?.aboutStats) {
      ComponentRenderer.renderAboutFromApi(
        aboutStaticData.about,
        aboutStaticData.aboutStats
      );
    }

    const areasToRender =
      researchAreasData?.data || homeStaticData?.researchAreas || [];
    if (areasToRender.length > 0) {
      const enrichedResearchAreas =
        await this.enrichResearchAreasWithLocalImages(areasToRender);
      ComponentRenderer.renderResearchAreasFromApi(enrichedResearchAreas);
      this.initAlphabetFilter(enrichedResearchAreas);
    }

    const schoolsToRender = schoolsData?.data || homeData?.schools || [];
    if (schoolsToRender.length > 0) {
      ComponentRenderer.renderSchoolsFromApi(schoolsToRender);
    }

    const apiPubs = publicationsData?.data || [];
    const localPubs = homeStaticData?.publications || [];
    const pubsToRender = apiPubs.length ? [...apiPubs, ...localPubs] : localPubs;

    if (pubsToRender.length > 0) {
      ComponentRenderer.renderPublicationsFromApi(pubsToRender);
      this.initPublicationFilter(pubsToRender);
    }

    ComponentRenderer.renderContact(contactInfo || contactStaticData);
  },

  /**
   * Initialize the application
   */
  async init() {
    console.log("Initializing VIT Research Portal...");

    this.showLoading(true);

    try {
      DataLoader.setAPIMode(true);

      const [homeStaticData, aboutStaticData, contactStaticData] = await Promise.all([
        DataLoader.loadHomeStatic(),
        DataLoader.loadAboutStatic(),
        DataLoader.loadContactStatic(),
      ]);

      const localData = {
        homeStaticData,
        aboutStaticData,
        contactStaticData,
      };

      this.renderLocalFirst(localData);

      Navigation.init();
      Navigation.initHamburger();
      FormHandler.init();

      this.showLoading(false);
      initExpand();

      this.hydrateWithAPI(localData).catch((error) => {
        console.error("Background hydration error:", error);
      });

      console.log("Application initialized successfully!");
    } catch (error) {
      console.error("Initialization error:", error);
      this.showLoading(false);
      this.showError(error.message);
    }
  },

  /**
   * Show/hide loading indicator
   * @param {boolean} show - True to show loading
   */
  showLoading(show) {
    let loader = document.getElementById("app-loader");
    if (!loader && show) {
      loader = document.createElement("div");
      loader.id = "app-loader";
      loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;
      loader.innerHTML = `
        <div style="text-align: center;">
          <div style="
            width: 50px;
            height: 50px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #333;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          "></div>
          <p style="font-size: 18px; color: #333;">Loading...</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loader);
    } else if (loader && !show) {
      loader.remove();
    }
  },

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    console.error("Error:", message);
    alert(`Error: ${message}`);
  },

  /**
   * Initialize filtering functionality for Publications
   * @param {Array} publications - Array of all loaded publication objects
   */
  initPublicationFilter(publications) {
    const filterBtns = document.querySelectorAll(".pub-filter-btn");
    if (!filterBtns.length || !publications) return;

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("btn-primary"));
        btn.classList.add("btn-primary");

        const filter = btn.dataset.filter;
        let filteredData = publications;
        
        if (filter !== "all") {
          filteredData = publications.filter((pub) => {
            const pType = (pub.type || "").toLowerCase();
            const pStatus = (pub.status || pub.tag || "").toLowerCase();
            return pType.includes(filter) || pStatus.includes(filter);
          });
        }

        ComponentRenderer.renderPublicationsFromApi(filteredData);
      });
    });
  },

  initAlphabetFilter(researchAreas) {
    const alphabetContainer = document.getElementById("alphabet-filter");
    const cardsContainer = document.getElementById("research-areas-container");

    if (!alphabetContainer || !cardsContainer) return;

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const availableLetters = alphabet.filter((letter) =>
      researchAreas.some(
        (area) =>
          (area.title ?? area.name ?? "").charAt(0).toUpperCase() === letter
      )
    );
    let selectedLetter = availableLetters[0] || "A";

    const renderAlphabet = () => {
      let visibleIndex = 0;
      alphabetContainer.innerHTML = alphabet
        .map((letter) => {
          const exists = researchAreas.some(
            (area) =>
              (area.title ?? area.name ?? "").charAt(0).toUpperCase() === letter
          );

          if (!exists) return "";
          const animationIndex = visibleIndex++;

          return exists
            ? `
            <button class="letter-btn ${
              selectedLetter === letter ? "active" : ""
            }" data-letter="${letter}" style="--letter-index:${animationIndex}">
              ${letter}
            </button>
          `
            : "";
        })
        .join("");

      document.querySelectorAll(".letter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedLetter = btn.dataset.letter;
          renderAlphabet();
          renderCards();
        });
      });
    };

    const renderCards = () => {
      const filtered = researchAreas.filter(
        (area) =>
          (area.title ?? area.name ?? "").charAt(0).toUpperCase() ===
          selectedLetter
      );

      ComponentRenderer.renderResearchAreasFromApi(filtered);
    };

    renderAlphabet();
    renderCards();
  },
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => App.init());
} else {
  App.init();
}
