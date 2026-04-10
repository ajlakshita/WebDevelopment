const API_CONFIG = {
  BASE_URL: "https://vit-research-portal-be.vercel.app",

  ENDPOINTS: {
    HOME: "/api/home",
    RESEARCH_AREAS_API: "/research/researchData",
    SCHOOLS_API: "/school/schoolData",
    PUBLICATIONS_API: "/publish/publishData",
    CONTACT_INFO_API: "/contact/info",
    SUBMISSION_REVIEW: "/submission/review",
  },

  TIMEOUT: 5000,
  DEBUG: false,
};

export default API_CONFIG;
