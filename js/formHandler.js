import API_CONFIG from "./config.js";

const FormHandler = {
  /**
   * Initialize form handlers
   */
  init() {
    const contactForm = document.querySelector(".contact-message-form");
    if (contactForm) {
      const submitBtn = contactForm.querySelector(".form-btn");
      submitBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        this.submitContactForm(contactForm);
      });
    }

    const submissionForm = document.querySelector(".submission-form");
    if (submissionForm) {
      const submitReviewBtn = submissionForm.querySelector(
        ".submission-form-btn"
      );
      submitReviewBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        this.submitPublicationForm(submissionForm);
      });
    }
  },

  /**
   * Submit contact form
   * @param {HTMLFormElement} form - The contact form element
   */
  async submitContactForm(form) {
    const submitBtn = form.querySelector(".form-btn");
    const originalText = submitBtn.textContent;

    try {
      const formData = {
        name: form.querySelector("#name").value.trim(),
        email: form.querySelector("#email").value.trim(),
        subject: form.querySelector("#subject").value,
        message: form.querySelector("#message").value.trim(),
      };

      if (!this.validateForm(formData)) {
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      const response = await this.sendToBackend("/contact", formData);
      const responseData = await this.parseResponseBody(response);

      if (response.ok) {
        console.log("Message sent successfully!");
        alert("Message sent successfully! We'll get back to you soon.");

        form.reset();
        submitBtn.textContent = "Message Sent!";

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }, 3000);
      } else {
        throw new Error(
          responseData?.message ||
            `Request failed with status ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const fallbackMessage =
        "Error sending message. Please try again or contact us directly.";
      alert(error?.message || fallbackMessage);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  },

  /**
   * Submit publication review form with PDF upload
   * @param {HTMLFormElement} form - Submission form element
   */
  async submitPublicationForm(form) {
    const submitBtn = form.querySelector(".submission-form-btn");
    const originalText = submitBtn.textContent;

    try {
      const paperFile = form.querySelector("#submission-file").files?.[0] || null;

      const formData = {
        fullName: form.querySelector("#submission-name").value.trim(),
        email: form.querySelector("#submission-email").value.trim(),
        affiliation: form.querySelector("#submission-affiliation").value.trim(),
        paperTitle: form.querySelector("#submission-title").value.trim(),
        authors: form.querySelector("#submission-authors").value.trim(),
        paperType: form.querySelector("#submission-type").value,
        doi: form.querySelector("#submission-doi").value.trim(),
        abstract: form.querySelector("#submission-abstract").value.trim(),
        notes: form.querySelector("#submission-notes").value.trim(),
      };

      if (!this.validatePublicationForm(formData, paperFile)) {
        return;
      }

      const payload = new FormData();
      payload.append("fullName", formData.fullName);
      payload.append("email", formData.email);
      payload.append("affiliation", formData.affiliation);
      payload.append("paperTitle", formData.paperTitle);
      payload.append("authors", formData.authors);
      payload.append("paperType", formData.paperType);
      payload.append("doi", formData.doi);
      payload.append("abstract", formData.abstract);
      payload.append("notes", formData.notes);
      payload.append("paperFile", paperFile);

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const response = await this.sendFormDataToBackend(
        API_CONFIG.ENDPOINTS.SUBMISSION_REVIEW,
        payload
      );

      if (response.ok) {
        alert("Publication submitted successfully. It has been sent for review.");
        form.reset();
        submitBtn.textContent = "Submitted";
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }, 3000);
      } else {
        let message = "Unable to submit publication.";
        try {
          const err = await response.json();
          message = err?.message || message;
        } catch (_e) {
          // Ignore JSON parse errors and use default message.
        }
        throw new Error(message);
      }
    } catch (error) {
      console.error("Error submitting publication:", error);
      alert(error.message || "Submission failed. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  },

  /**
   * Parse JSON/text response body safely
   * @param {Response} response
   * @returns {Promise<Object|null>}
   */
  async parseResponseBody(response) {
    try {
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  },

  /**
   * Validate contact form data
   * @param {Object} data - Form data object
   * @returns {boolean} - True if valid
   */
  validateForm(data) {
    if (!data.name) {
      alert("Please enter your name");
      return false;
    }
    if (!data.email) {
      alert("Please enter your email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      alert("Please enter a valid email address");
      return false;
    }
    if (!data.message) {
      alert("Please enter your message");
      return false;
    }
    return true;
  },

  /**
   * Validate publication review submission form data
   * @param {Object} data - Publication metadata
   * @param {File|null} file - Uploaded PDF file
   * @returns {boolean}
   */
  validatePublicationForm(data, file) {
    if (!data.fullName) {
      alert("Please enter your full name");
      return false;
    }

    if (!data.email) {
      alert("Please enter your email");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      alert("Please enter a valid email address");
      return false;
    }

    if (!data.paperTitle) {
      alert("Please enter your paper title");
      return false;
    }

    if (!data.authors) {
      alert("Please enter author names");
      return false;
    }

    if (!data.abstract) {
      alert("Please provide your abstract");
      return false;
    }

    if (!file) {
      alert("Please upload your paper in PDF format");
      return false;
    }

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return false;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("PDF file must be 10 MB or less");
      return false;
    }

    return true;
  },

  /**
   * Send data to backend API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Data to send
   * @returns {Promise} - Fetch response
   */
  async sendToBackend(endpoint, data) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    console.log(`Sending to: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (API_CONFIG.DEBUG) {
      console.log(`Response status: ${response.status}`);
    }

    return response;
  },

  /**
   * Send multipart form data to backend API
   * @param {string} endpoint
   * @param {FormData} payload
   * @returns {Promise<Response>}
   */
  async sendFormDataToBackend(endpoint, payload) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    console.log(`Sending form data to: ${url}`);

    return fetch(url, {
      method: "POST",
      body: payload,
    });
  },
};

export default FormHandler;
