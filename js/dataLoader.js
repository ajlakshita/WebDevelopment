import API_CONFIG from "./config.js";

const DataLoader = {
  useAPI: true,
  localCache: new Map(),

  /**
   * Load local JSON file
   * @param {string} path
   * @returns {Promise<Object|Array|null>}
   */
  async loadLocalJSON(path) {
    if (this.localCache.has(path)) {
      return this.localCache.get(path);
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      this.localCache.set(path, data);
      return data;
    } catch (error) {
      console.error(`Error loading local JSON (${path}):`, error.message);
      return null;
    }
  },

  /**
   * Load JSON from API with shared timeout/error handling
   * @param {string} endpoint
   * @returns {Promise<Object|null>}
   */
  async loadAPIJSON(endpoint) {
    let timeoutId;

    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      if (API_CONFIG.DEBUG) console.log(`Fetching: ${url}`);

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error loading API data (${endpoint}):`, error.message);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /**
   * Load static home blocks from local JSON
   * @returns {Promise<Object|null>}
   */
  async loadHomeStatic() {
    try {
      const [stats, publications, researchAreas, schools] = await Promise.all([
        this.loadLocalJSON("./data/stats.json"),
        this.loadLocalJSON("./data/publications.json"),
        this.loadLocalJSON("./data/researchAreas.json"),
        this.loadLocalJSON("./data/schools.json"),
      ]);

      return {
        stats: Array.isArray(stats) ? stats : [],
        publications: Array.isArray(publications) ? publications : [],
        researchAreas: Array.isArray(researchAreas) ? researchAreas : [],
        schools: Array.isArray(schools) ? schools : [],
      };
    } catch (error) {
      console.error("Error loading static home data:", error.message);
      return null;
    }
  },

  /**
   * Load static about data from local JSON
   * @returns {Promise<Object|null>}
   */
  async loadAboutStatic() {
    try {
      const [about, aboutStats] = await Promise.all([
        this.loadLocalJSON("./data/about.json"),
        this.loadLocalJSON("./data/aboutStats.json"),
      ]);

      if (!about || !aboutStats) return null;

      return { about, aboutStats };
    } catch (error) {
      console.error("Error loading static about data:", error.message);
      return null;
    }
  },

  /**
   * Load home page data from API
   * @returns {Promise<Object|null>} - Home data response
   */
  async loadHome() {
    return this.loadAPIJSON(API_CONFIG.ENDPOINTS.HOME);
  },

  /**
   * Load research areas from API
   * @returns {Promise<Object|null>} - Research areas response
   */
  async loadResearchAreas() {
    return this.loadAPIJSON(API_CONFIG.ENDPOINTS.RESEARCH_AREAS_API);
  },

  /**
   * Load schools from API
   * @returns {Promise<Object|null>} - Schools response
   */
  async loadSchools() {
    return this.loadAPIJSON(API_CONFIG.ENDPOINTS.SCHOOLS_API);
  },

  /**
   * Load publications from API
   * @returns {Promise<Object|null>} - Publications response
   */
  async loadPublications() {
    return this.loadAPIJSON(API_CONFIG.ENDPOINTS.PUBLICATIONS_API);
  },

  /**
   * Load contact information from API
   * @returns {Promise<Object|null>} - Contact info response
   */
  async loadContactInfo() {
    return this.loadAPIJSON(API_CONFIG.ENDPOINTS.CONTACT_INFO_API);
  },

  /**
   * Load contact information from local JSON
   * @returns {Promise<Object|null>}
   */
  async loadContactStatic() {
    return this.loadLocalJSON("./data/contact.json");
  },

  /**
   * Switch between API and local JSON mode
   * @param {boolean} useAPI - True to use API, false for local JSON
   */
  setAPIMode(useAPI) {
    this.useAPI = useAPI;
    console.log(`Data loading mode: ${useAPI ? "API" : "LOCAL JSON"}`);
  },
};

export default DataLoader;
