const ComponentRenderer = {
  /**
   * Format stat values for display
   * @param {string|number} value
   * @returns {string}
   */
  formatStatValue(value) {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return value ?? "-";
  },

  /**
   * Render home page data from API
   * @param {Object} homeData
   */
  renderHome(homeData) {
    if (!homeData) return;

    const statsContainer = document.getElementById("home-stats");
    if (statsContainer && Array.isArray(homeData.stats)) {
      statsContainer.innerHTML = homeData.stats
        .map(
          (stat) => `
        <div class="home-stat-card">
          <p class="home-stat-label">${stat.label}</p>
          <h3 class="home-stat-value">${this.formatStatValue(
            stat.value
          )}</h3>
        </div>
      `
        )
        .join("");
    }

    const publicationsContainer =
      document.getElementById("home-publications");
    if (
      publicationsContainer &&
      Array.isArray(homeData.featuredPublications)
    ) {
      publicationsContainer.innerHTML = homeData.featuredPublications
        .map((pub, i) => {
          const authorsRaw = pub.authors?.length ? pub.authors : ["VIT Research Team"];
          const authors = authorsRaw.slice(0, 2).join(", ") + (authorsRaw.length > 2 ? " et al." : "");
          const type = pub.status ? pub.status.replace(/_/g, " ") : "Publication";
          const num = String(i + 1).padStart(2, "0");
          return `
          <article class="home-pub-card">
            <div class="home-pub-top">
              <span class="home-pub-num">${num}</span>
              <span class="home-pub-type">${type}</span>
            </div>
            <h4 class="home-pub-title">${pub.title}</h4>
            <p class="home-pub-authors">${authors}</p>
            <div class="home-pub-arrow">&rarr;</div>
          </article>
        `;
        })
        .join("");
    }

    const researchContainer = document.getElementById("home-research-areas");
    const viewAllBtn = document.getElementById("view-all-research-btn");
    
    if (researchContainer && Array.isArray(homeData.researchAreas)) {
      let isExpanded = false;
      const allAreas = homeData.researchAreas;
      const initialAreas = allAreas.slice(0, 6);
      
      const renderCards = (areas) => {
        researchContainer.innerHTML = areas.map((area) => {
          const title = area.title || area.name || "";
          const letter = title.trim().charAt(0).toUpperCase() || "A";
          return `
            <div class="home-chip">
              <div class="research-letter" style="margin-bottom: 0.8rem; width: 42px; height: 42px; font-size: 1.1rem; border-radius: 10px;">${letter}</div>
              <h4>${title}</h4>
              <p>${area.description ?? ""}</p>
            </div>
          `;
        }).join("");
      };

      renderCards(initialAreas);

      if (viewAllBtn && allAreas.length > 6) {
        viewAllBtn.onclick = null; // Remove inline onclick if any
        viewAllBtn.replaceWith(viewAllBtn.cloneNode(true));
        const newBtn = document.getElementById("view-all-research-btn");
        
        newBtn.addEventListener("click", () => {
          isExpanded = !isExpanded;
          if (isExpanded) {
            renderCards(allAreas);
            newBtn.textContent = "Show Less";
          } else {
            renderCards(initialAreas);
            newBtn.textContent = "View All";
            // Scroll back to section so user doesn't get lost
            researchContainer.parentElement.scrollIntoView({ behavior: 'smooth' });
          }
        });
      } else if (viewAllBtn) {
        viewAllBtn.style.display = "none";
      }
    }

    const schoolsContainer = document.getElementById("home-schools");
    if (schoolsContainer && Array.isArray(homeData.schools)) {
      schoolsContainer.innerHTML = homeData.schools
        .map(
          (school) => `
        <div class="school-card" style="margin-bottom: 0;">
          <div class="school-card-inner">
            <div class="school-card-top">
              <div class="school-monogram">${(school.acronym || "SC").charAt(0)}</div>
              <div class="school-card-meta">
                <span class="school-acronym">${school.acronym || "School"}</span>
                <span class="school-category">${school.category || ""}</span>
              </div>
            </div>
            <p class="school-name" style="margin: 0.8rem 0 0.4rem;">${school.school_name || school.name || ""}</p>
            <p class="school-description">${school.description ?? ""}</p>
          </div>
        </div>
      `
        )
        .join("");
    }
  },

  /**
   * Render home page data using local JSON fallback
   * @param {Object} data
   */
  renderHomeFromLocal(data) {
    if (!data) return;

    const statsContainer = document.getElementById("home-stats");
    if (statsContainer && Array.isArray(data.stats)) {
      statsContainer.innerHTML = data.stats
        .map(
          (stat) => `
        <div class="home-stat-card">
          <p class="home-stat-label">${stat.label}</p>
          <h3 class="home-stat-value">${stat.number ?? "-"}</h3>
        </div>
      `
        )
        .join("");
    }

    const publicationsContainer =
      document.getElementById("home-publications");
    if (publicationsContainer && Array.isArray(data.publications)) {
      publicationsContainer.innerHTML = data.publications
        .slice(0, 6)
        .map(
          (pub) => `
        <article class="home-pub-card">
          <p class="home-pub-meta">${pub.tag}</p>
          <h4 class="home-pub-title">${pub.title}</h4>
          <p class="home-pub-authors">${pub.authors}</p>
          <div class="home-pub-footer">
            <span class="home-pub-doi">${pub.journal}</span>
          </div>
        </article>
      `
        )
        .join("");
    }
  },
  /**
   * Render stats section
   * @param {Array} stats - Array of stat objects
   */
  renderStats(stats) {
    const statsContainer = document.getElementById("stats");
    if (!statsContainer || !stats) return;

    statsContainer.innerHTML = stats
      .map(
        (stat) => `
      <div class="stat-box">
        <h2 class="stat-number">${stat.number}</h2>
        <p>${stat.label}</p>
      </div>
    `
      )
      .join("");
  },

  /**
   * Render about section
   * @param {Object} aboutData - About page data
   * @param {Object} aboutStats - Stats data for NIRF and global impact
   */
  renderAbout(aboutData, aboutStats) {
    this.renderAboutFromApi(aboutData, aboutStats);
  },

  /**
   * Render about section with API-style structure
   * @param {Object} aboutData
   * @param {Object} aboutStats
   */
  renderAboutFromApi(aboutData, aboutStats) {
    const aboutVision = document.getElementById("about-vision");
    const aboutOverview = document.getElementById("about-overview");
    const aboutMission = document.getElementById("about-mission");
    const aboutCulture = document.getElementById("about-culture");
    const aboutOffice = document.getElementById("about-office");
    const aboutPillars = document.getElementById("about-pillars");
    const aboutFacilities = document.getElementById("about-facilities");
    const aboutPartnerships = document.getElementById("about-partnerships");
    const aboutStatsContainer = document.getElementById("about-stats");

    if (aboutVision && aboutData?.vision) {
      aboutVision.textContent = aboutData.vision;
    }

    if (aboutOverview && aboutData?.overview) {
      aboutOverview.textContent = aboutData.overview;
    }

    if (aboutMission && Array.isArray(aboutData?.mission)) {
      aboutMission.innerHTML = aboutData.mission
        .map((item) => `<li>${item}</li>`)
        .join("");
    }

    if (aboutCulture && aboutData?.researchCulture) {
      aboutCulture.textContent = aboutData.researchCulture;
    }

    if (aboutOffice && aboutData?.researchOffice) {
      aboutOffice.textContent = aboutData.researchOffice;
    }

    if (aboutPillars && Array.isArray(aboutData?.pillars)) {
      aboutPillars.innerHTML = aboutData.pillars
        .map((item) => `<li>${item}</li>`)
        .join("");
    }

    if (aboutFacilities && Array.isArray(aboutData?.facilities)) {
      aboutFacilities.innerHTML = aboutData.facilities
        .map((item) => `<li>${item}</li>`)
        .join("");
    }

    if (aboutPartnerships && Array.isArray(aboutData?.partnerships)) {
      aboutPartnerships.innerHTML = aboutData.partnerships
        .map((item) => `<li>${item}</li>`)
        .join("");
    }

    if (aboutStatsContainer && aboutStats) {
      const nirfRank = aboutStats.nirfRanking;
      const globalImpact = aboutStats.globalImpact;

      aboutStatsContainer.innerHTML = `
        <div class="about-stat-card">
          <p class="about-stat-title">${nirfRank.title}</p>
          <h3 class="about-stat-value">${nirfRank.rank}</h3>
          <p class="about-stat-subtitle">${nirfRank.subtitle}</p>
          <span class="about-stat-note">${nirfRank.category}</span>
        </div>

        <div class="about-stat-card">
          <p class="about-stat-title">${globalImpact.title}</p>
          <p class="about-stat-subtitle">${globalImpact.description}</p>
          <div class="about-impact-grid">
            <div>
              <h4>${globalImpact.partners.number}</h4>
              <p>${globalImpact.partners.label}</p>
            </div>
            <div>
              <h4>${globalImpact.countries.number}</h4>
              <p>${globalImpact.countries.label}</p>
            </div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Render research areas cards
   * @param {Array} researchAreas - Array of research area objects
   */
  renderResearchAreas(researchAreas) {
    const container = document.getElementById("research-areas-container");
    if (!container || !researchAreas) return;

    if (!Array.isArray(researchAreas) || researchAreas.length === 0) {
      container.innerHTML =
        '<p class="section-description">No research areas available for this letter.</p>';
      return;
    }

    const sortedAreas = [...researchAreas].sort((a, b) => {
      const nameA = (a.title ?? a.name ?? "").toLowerCase();
      const nameB = (b.title ?? b.name ?? "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    container.innerHTML = `
      <div class="research-scroll-row" aria-label="Research areas horizontal cards">
        ${sortedAreas
          .map((area) => {
            const title = area.title ?? area.name ?? "";
            const letter = title.trim().charAt(0).toUpperCase() || "A";
            const image =
              area.image ||
              "https://images.pexels.com/photos/256381/pexels-photo-256381.jpeg";
            return `
              <article class="research-card">
                ${
                  image
                    ? `<div class="research-image-wrapper"><img class="research-image" src="${image}" alt="${title} research area" loading="lazy" decoding="async" /></div>`
                    : ""
                }
                <div class="research-letter">${letter}</div>
                <h3>${title}</h3>
                <p>${area.description ?? ""}</p>
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  },

  /**
   * Render research areas from API
   * @param {Array} researchAreas
   */
  renderResearchAreasFromApi(researchAreas) {
    this.renderResearchAreas(researchAreas);
  },

  /**
   * Render schools/centers
   * @param {Array} schoolsData - Array of school category objects
   */
  renderSchools(schoolsData) {
    const container = document.querySelector("#schools .schools-grid");
    if (!container || !schoolsData) return;

    container.innerHTML = schoolsData
      .map(
        (school) => {
          const acronym = school.acronym || "SC";
          const name = school.school_name || school.name || "";
          const category = school.category || "";
          const description = school.description ?? "";
          return `
      <article class="school-card">
        <div class="school-card-inner">
          <div class="school-card-top">
            <div class="school-monogram">${acronym.charAt(0)}</div>
            <div class="school-card-meta">
              <span class="school-acronym">${acronym}</span>
              <span class="school-category">${category}</span>
            </div>
          </div>
          <p class="school-name">${name}</p>
          <p class="school-description">${description}</p>

        </div>
      </article>
    `;
        }
      )
      .join("");
  },

  /**
   * Render schools from API
   * @param {Array} schools
   */
  renderSchoolsFromApi(schools) {
    this.renderSchools(schools);
  },

  /**
   * Render publications
   * @param {Array} publications - Array of publication objects
   */
  renderPublications(publications) {
    const container = document.querySelector(".pub-grid");
    if (!container || !publications) return;

    container.innerHTML = publications
      .map(
        (pub) => {
          const title = pub.title || "Untitled Publication";
          const journal = pub.journal || pub.publisher || "Publication";
          const authors = Array.isArray(pub.authors)
            ? pub.authors.join(", ")
            : pub.authors || "VIT Research Team";
          const status = pub.status ? pub.status.replace(/_/g, " ") : "";
          const doi = pub.doi ? `DOI: ${pub.doi}` : "";

          return `
      <div class="pub-card">
        <div class="pub-tag">${status || pub.tag || "Research"}</div>
        <h4 class="pub-title">${title}</h4>
        <p class="pub-journal">${journal}</p>
        <p class="pub-authors">Authors: ${authors}</p>
        <div class="pub-meta">
          <span>${doi}</span>
        </div>
      </div>
    `;
        }
      )
      .join("");
  },

  /**
   * Render publications from API
   * @param {Array} publications
   */
  renderPublicationsFromApi(publications) {
    this.renderPublications(publications);
  },

  /**
   * Render contact information
   * @param {Object} contactData - Contact information object
   */
  renderContact(contactData) {
    const contactInfo = document.querySelector(".contact-info");
    const librarySection = document.querySelector(".library-section");

    if (contactInfo && contactData) {
      contactInfo.innerHTML = `
        <div class="contact-box">
          <h3 class="contact-box-title">${contactData.office.title}</h3>
          <p class="contact-text-bold">${contactData.office.institution}</p>
          <p class="contact-text-gray">${contactData.office.location}</p>
        </div>

        <div class="contact-box">
          <h3 class="contact-box-title">Direct Line</h3>
          <p class="contact-detail">
            <strong>Email:</strong>
            <a href="mailto:${contactData.contact.email}" class="email-link">
              ${contactData.contact.email}
            </a>
          </p>
          <p class="contact-detail">
            <strong>Phone:</strong> ${contactData.contact.phone}
          </p>
          <p class="contact-detail">
            <strong>Fax:</strong> ${contactData.contact.fax}
          </p>
          <p class="contact-detail-last">
            <strong>Hours:</strong> ${contactData.contact.hours}
          </p>
        </div>
      `;
    }

    if (librarySection && contactData) {
      const lib = contactData.libraryPortal;
      librarySection.innerHTML = `
        <a href="${lib.url}" target="_blank" rel="noopener noreferrer"
          class="btn btn-primary library-link">${lib.label}</a>
        <p class="library-info">${lib.description}</p>
      `;
    }
  },
};

export default ComponentRenderer;
