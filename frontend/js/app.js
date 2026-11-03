/**
 * VillageBorrow - Professional Money Borrowing Management System
 * Core Application Logic, REST API Integration, and Borrowed Records Search
 * 
 * IMPORTANT:
 * Preserves the exact New Borrowing UI, form fields, and submission workflow.
 * Connects Borrowed Records directly to MongoDB via REST APIs.
 */

(function () {
  "use strict";

  // Storage Key for fallback caching
  const STORAGE_KEY = "villageborrow_records";

  // Application State
  const state = {
    currentView: "home", // 'home' | 'new-borrowing' | 'borrowed-records' | 'record-details'
    currentUploadedImage: null, // { file, dataUrl, name, size }
    currentSearchQuery: "",
    activeRecordId: null,
    searchDebounceTimer: null
  };

  // DOM Elements
  const elements = {
    // Navigation & Views
    navHomeBtn: document.getElementById("navHomeBtn"),
    navNewBorrowingBtn: document.getElementById("navNewBorrowingBtn"),
    navRecordsBtn: document.getElementById("navRecordsBtn"),
    brandHomeLink: document.getElementById("brandHomeLink"),

    viewHome: document.getElementById("viewHome"),
    viewNewBorrowing: document.getElementById("viewNewBorrowing"),
    viewRecords: document.getElementById("viewRecords"),
    viewRecordDetails: document.getElementById("viewRecordDetails"),

    // Home Action Cards
    cardNewBorrowing: document.getElementById("cardNewBorrowing"),
    cardRecords: document.getElementById("cardRecords"),

    // New Borrowing Page
    backToHomeBtn: document.getElementById("backToHomeBtn"),
    borrowingForm: document.getElementById("borrowingForm"),
    formContainer: document.getElementById("formContainer"),
    successContainer: document.getElementById("successContainer"),

    // Form Inputs (PRESERVED EXACTLY PER SPECIFICATION)
    inputSurname: document.getElementById("surname"),
    inputName: document.getElementById("name"),
    inputPhone: document.getElementById("phone"),
    inputAltName: document.getElementById("altName"),
    inputAltPhone: document.getElementById("altPhone"),
    inputAmount: document.getElementById("amount"),
    inputInterestRate: document.getElementById("interestRate"),

    // Image Upload Elements
    dropZone: document.getElementById("dropZone"),
    fileInput: document.getElementById("bondPaperInput"),
    uploadPlaceholder: document.getElementById("uploadPlaceholder"),
    previewSection: document.getElementById("previewSection"),
    previewImage: document.getElementById("previewImage"),
    previewFilename: document.getElementById("previewFilename"),
    previewFilesize: document.getElementById("previewFilesize"),
    changeImageBtn: document.getElementById("changeImageBtn"),
    removeImageBtn: document.getElementById("removeImageBtn"),
    viewImageThumbBtn: document.getElementById("viewImageThumbBtn"),
    bondImageError: document.getElementById("bondImageError"),
    formGlobalAlert: document.getElementById("formGlobalAlert"),

    // Success Screen Elements
    successRefCode: document.getElementById("successRefCode"),
    summaryName: document.getElementById("summaryName"),
    summaryPhone: document.getElementById("summaryPhone"),
    summaryAmount: document.getElementById("summaryAmount"),
    summaryInterest: document.getElementById("summaryInterest"),
    summaryBondAttached: document.getElementById("summaryBondAttached"),
    newBorrowingAgainBtn: document.getElementById("newBorrowingAgainBtn"),
    viewRecordsFromSuccessBtn: document.getElementById("viewRecordsFromSuccessBtn"),
    successBackHomeBtn: document.getElementById("successBackHomeBtn"),

    // Borrowed Records – Search Page Elements
    recordsBackHomeBtn: document.getElementById("recordsBackHomeBtn"),
    recordsNewBtn: document.getElementById("recordsNewBtn"),
    totalRecordsBadge: document.getElementById("totalRecordsBadge"),
    recordsSearchInput: document.getElementById("recordsSearchInput"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    executeSearchBtn: document.getElementById("executeSearchBtn"),
    searchResultsList: document.getElementById("searchResultsList"),
    noResultsState: document.getElementById("noResultsState"),
    noResultsTitle: document.getElementById("noResultsTitle"),
    noResultsMessage: document.getElementById("noResultsMessage"),
    resultsStatusHeading: document.getElementById("resultsStatusHeading"),
    resultsCountNotice: document.getElementById("resultsCountNotice"),
    resetSearchFromEmptyBtn: document.getElementById("resetSearchFromEmptyBtn"),

    // Individual Record Details Page Elements
    recordDetailsBackBtn: document.getElementById("recordDetailsBackBtn"),
    breadcrumbToRecords: document.getElementById("breadcrumbToRecords"),
    breadcrumbRecordId: document.getElementById("breadcrumbRecordId"),
    detailHeaderRefId: document.getElementById("detailHeaderRefId"),
    detailHeaderFullName: document.getElementById("detailHeaderFullName"),
    detailHeroTotalPayable: document.getElementById("detailHeroTotalPayable"),
    detailSurname: document.getElementById("detailSurname"),
    detailName: document.getElementById("detailName"),
    detailPhone: document.getElementById("detailPhone"),
    detailAltName: document.getElementById("detailAltName"),
    detailAltPhone: document.getElementById("detailAltPhone"),
    detailBorrowingDate: document.getElementById("detailBorrowingDate"),
    detailAmount: document.getElementById("detailAmount"),
    detailInterestRate: document.getElementById("detailInterestRate"),
    detailBondPaperContainer: document.getElementById("detailBondPaperContainer"),
    detailBondThumbBtn: document.getElementById("detailBondThumbBtn"),
    detailBondImg: document.getElementById("detailBondImg"),
    detailBondName: document.getElementById("detailBondName"),
    detailElapsedDays: document.getElementById("detailElapsedDays"),
    detailElapsedMonths: document.getElementById("detailElapsedMonths"),
    detailElapsedYears: document.getElementById("detailElapsedYears"),
    detailAccumulatedInterest: document.getElementById("detailAccumulatedInterest"),
    detailTotalPayable: document.getElementById("detailTotalPayable"),
    detailLastCalculatedDate: document.getElementById("detailLastCalculatedDate"),
    detailCalculationMethod: document.getElementById("detailCalculationMethod"),
    detailBackToSearchBtn: document.getElementById("detailBackToSearchBtn"),

    // Image Modal
    imageModal: document.getElementById("imageModal"),
    modalImage: document.getElementById("modalImage"),
    modalTitle: document.getElementById("modalTitle"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),

    // Clock
    systemTimeDisplay: document.getElementById("systemTimeDisplay")
  };

  // --- INITIALIZATION ---
  function init() {
    bindEvents();
    startClock();
    navigate("home");
  }

  // --- NAVIGATION ---
  function navigate(viewName, params = {}) {
    state.currentView = viewName;

    // View toggling
    elements.viewHome.classList.toggle("active", viewName === "home");
    elements.viewNewBorrowing.classList.toggle("active", viewName === "new-borrowing");
    elements.viewRecords.classList.toggle("active", viewName === "borrowed-records");
    if (elements.viewRecordDetails) {
      elements.viewRecordDetails.classList.toggle("active", viewName === "record-details");
    }

    // Nav active states
    elements.navHomeBtn.classList.toggle("active", viewName === "home");
    elements.navNewBorrowingBtn.classList.toggle("active", viewName === "new-borrowing");
    elements.navRecordsBtn.classList.toggle("active", viewName === "borrowed-records" || viewName === "record-details");

    if (viewName === "new-borrowing") {
      showFormScreen();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (viewName === "borrowed-records") {
      executeSearch(elements.recordsSearchInput ? elements.recordsSearchInput.value.trim() : "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (viewName === "record-details" && params.recordId) {
      loadRecordDetails(params.recordId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function showFormScreen() {
    elements.formContainer.style.display = "block";
    elements.successContainer.style.display = "none";
  }

  function showSuccessScreen(record) {
    elements.formContainer.style.display = "none";
    elements.successContainer.style.display = "block";

    // Populate summary details
    elements.successRefCode.textContent = record.recordId || record.id;
    elements.summaryName.textContent = `${record.surname} ${record.name}`;
    elements.summaryPhone.textContent = formatPhone(record.phone);
    elements.summaryAmount.textContent = `₹ ${Number(record.amount).toLocaleString("en-IN")}`;
    elements.summaryInterest.textContent = `${record.interestRate}%`;
    elements.summaryBondAttached.textContent = record.bondPaperName || "Bond Paper Attached";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- EVENT BINDINGS ---
  function bindEvents() {
    // Top Navigation
    elements.brandHomeLink.addEventListener("click", (e) => {
      e.preventDefault();
      navigate("home");
    });
    elements.navHomeBtn.addEventListener("click", () => navigate("home"));
    elements.navNewBorrowingBtn.addEventListener("click", () => navigate("new-borrowing"));
    elements.navRecordsBtn.addEventListener("click", () => navigate("borrowed-records"));

    // Home Cards
    elements.cardNewBorrowing.addEventListener("click", () => navigate("new-borrowing"));
    elements.cardRecords.addEventListener("click", () => navigate("borrowed-records"));

    // Sub-nav Back Buttons
    elements.backToHomeBtn.addEventListener("click", () => navigate("home"));
    elements.recordsBackHomeBtn.addEventListener("click", () => navigate("home"));
    elements.recordsNewBtn.addEventListener("click", () => navigate("new-borrowing"));
    document.getElementById("cancelFormBtn").addEventListener("click", () => navigate("home"));

    if (elements.recordDetailsBackBtn) {
      elements.recordDetailsBackBtn.addEventListener("click", () => navigate("borrowed-records"));
    }
    if (elements.breadcrumbToRecords) {
      elements.breadcrumbToRecords.addEventListener("click", () => navigate("borrowed-records"));
    }
    if (elements.detailBackToSearchBtn) {
      elements.detailBackToSearchBtn.addEventListener("click", () => navigate("borrowed-records"));
    }

    // Image Upload Handlers
    setupImageUpload();

    // Form Submission & Validation (PRESERVED WORKFLOW)
    elements.borrowingForm.addEventListener("submit", handleFormSubmit);

    // Live validation cleanups
    const inputs = [
      elements.inputSurname,
      elements.inputName,
      elements.inputPhone,
      elements.inputAltPhone,
      elements.inputAmount,
      elements.inputInterestRate
    ];
    inputs.forEach((input) => {
      input.addEventListener("input", () => clearFieldError(input));
    });

    // Success Actions
    elements.newBorrowingAgainBtn.addEventListener("click", () => {
      resetForm();
      showFormScreen();
    });
    elements.viewRecordsFromSuccessBtn.addEventListener("click", () => {
      navigate("borrowed-records");
    });
    elements.successBackHomeBtn.addEventListener("click", () => {
      resetForm();
      navigate("home");
    });

    // --- Search Page Events ---
    setupSearchEvents();

    // Modal Events
    elements.modalCloseBtn.addEventListener("click", closeModal);
    elements.imageModal.addEventListener("click", (e) => {
      if (e.target === elements.imageModal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && elements.imageModal.classList.contains("active")) {
        closeModal();
      }
    });
  }

  // --- SEARCH PAGE FUNCTIONALITY ---
  function setupSearchEvents() {
    if (!elements.recordsSearchInput) return;

    // Real-time debounced search as user types
    elements.recordsSearchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (elements.clearSearchBtn) {
        elements.clearSearchBtn.style.display = val.length > 0 ? "block" : "none";
      }

      clearTimeout(state.searchDebounceTimer);
      state.searchDebounceTimer = setTimeout(() => {
        executeSearch(val.trim());
      }, 250);
    });

    // Search button click
    elements.executeSearchBtn.addEventListener("click", () => {
      executeSearch(elements.recordsSearchInput.value.trim());
    });

    // Enter key
    elements.recordsSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        executeSearch(elements.recordsSearchInput.value.trim());
      }
    });

    // Clear search button
    if (elements.clearSearchBtn) {
      elements.clearSearchBtn.addEventListener("click", () => {
        elements.recordsSearchInput.value = "";
        elements.clearSearchBtn.style.display = "none";
        elements.recordsSearchInput.focus();
        executeSearch("");
      });
    }

    if (elements.resetSearchFromEmptyBtn) {
      elements.resetSearchFromEmptyBtn.addEventListener("click", () => {
        elements.recordsSearchInput.value = "";
        if (elements.clearSearchBtn) elements.clearSearchBtn.style.display = "none";
        executeSearch("");
      });
    }
  }

  /**
   * Executes search via backend REST API
   * SPEC REQUIREMENT:
   * Supports Surname, Actual Name, or Mobile Number.
   * Displays ONLY: Surname, Name, Phone Number in search results.
   */
  async function executeSearch(query = "") {
    state.currentSearchQuery = query;

    if (elements.totalRecordsBadge) {
      elements.totalRecordsBadge.textContent = "Searching records...";
    }

    try {
      let data;
      if (window.apiService && typeof window.apiService.searchBorrowings === 'function') {
        data = await window.apiService.searchBorrowings(query);
      } else {
        const url = query
          ? `/api/borrowings/search?q=${encodeURIComponent(query)}`
          : `/api/borrowings/search`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        data = await response.json();
      }

      const records = data.records || [];

      // Update badges and headers
      if (elements.totalRecordsBadge) {
        elements.totalRecordsBadge.textContent = `${records.length} ${records.length === 1 ? "Record" : "Records"}`;
      }

      if (elements.resultsStatusHeading) {
        elements.resultsStatusHeading.textContent = query
          ? `Search Results for "${query}"`
          : `All Registered Borrowing Records`;
      }

      if (elements.resultsCountNotice) {
        elements.resultsCountNotice.textContent = `${records.length} matching`;
      }

      renderSearchResults(records, query);
    } catch (err) {
      console.error("[App] Search request failed:", err);
      if (elements.totalRecordsBadge) {
        elements.totalRecordsBadge.textContent = "Error connecting";
      }
      renderSearchResults([], query);
    }
  }

  /**
   * Renders Search Results
   * SPEC REQUIREMENT:
   * "For every matching record, display only:
   *  - Surname
   *  - Name
   *  - Phone Number
   *  Display the matching records below the search bar in a clean, professional banking-style layout."
   */
  function renderSearchResults(records, query) {
    elements.searchResultsList.innerHTML = "";

    if (!records || records.length === 0) {
      elements.searchResultsList.style.display = "none";
      elements.noResultsState.style.display = "block";

      if (query) {
        elements.noResultsTitle.textContent = `No Records Found Matching "${query}"`;
        elements.noResultsMessage.textContent = `No borrowing agreements matched your search query in surname, actual name, or phone number. Please verify your search terms.`;
      } else {
        elements.noResultsTitle.textContent = "No Borrowing Records in Ledger";
        elements.noResultsMessage.textContent = "No records have been saved in the database yet. Click 'New Borrowing' to create the first record.";
      }
      return;
    }

    elements.searchResultsList.style.display = "flex";
    elements.noResultsState.style.display = "none";

    records.forEach((record) => {
      const card = document.createElement("div");
      card.className = "result-item-card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `View record for ${record.surname} ${record.name}`);

      // Display ONLY: Surname, Name, Phone Number per specification
      card.innerHTML = `
        <div class="result-item-main">
          <div class="result-col-name">
            <div class="name-label">Borrower Name</div>
            <div class="name-value">${escapeHtml(record.surname)} ${escapeHtml(record.name)}</div>
          </div>
          <div class="result-col-phone">
            <div class="phone-label">Primary Mobile</div>
            <div class="phone-value">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              ${formatPhone(record.phone)}
            </div>
          </div>
        </div>
        <div class="result-view-pill">
          <span>View Complete Details</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
      `;

      // Navigate to Individual Record Details on click or Enter
      const triggerDetails = () => {
        navigate("record-details", { recordId: record.recordId || record.id });
      };

      card.addEventListener("click", triggerDetails);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerDetails();
        }
      });

      elements.searchResultsList.appendChild(card);
    });
  }

  // --- INDIVIDUAL BORROWING RECORD DETAILS PAGE ---
  /**
   * Fetches complete record from MongoDB using unique record ID
   * Displays all specified fields:
   * - Borrower Information (Surname, Name, Phone Number, Alternate Name, Alternate Number)
   * - Borrowing Information (Original Date, Original Amount, Interest Rate, Bond Paper Image)
   * - Interest Information (Elapsed Days, Months, Years, Accumulated Interest, Total Payable, Last Calculated Date)
   */
  async function loadRecordDetails(recordId) {
    state.activeRecordId = recordId;

    try {
      let data;
      if (window.apiService && typeof window.apiService.getBorrowingById === 'function') {
        data = await window.apiService.getBorrowingById(recordId);
      } else {
        const response = await fetch(`/api/borrowings/${encodeURIComponent(recordId)}`);
        if (!response.ok) throw new Error(`Record ${recordId} not found`);
        data = await response.json();
      }

      const rec = data.record;

      // Populate Header
      elements.breadcrumbRecordId.textContent = rec.recordId;
      elements.detailHeaderRefId.textContent = rec.recordId;
      elements.detailHeaderFullName.textContent = `${rec.borrower.surname} ${rec.borrower.name}`;
      elements.detailHeroTotalPayable.textContent = `₹ ${Number(rec.interest.totalPayable).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // 1. Borrower Information
      elements.detailSurname.textContent = rec.borrower.surname;
      elements.detailName.textContent = rec.borrower.name;
      elements.detailPhone.textContent = formatPhone(rec.borrower.phone);
      elements.detailAltName.textContent = rec.borrower.altName || "-";
      elements.detailAltPhone.textContent = rec.borrower.altPhone && rec.borrower.altPhone !== "-"
        ? formatPhone(rec.borrower.altPhone)
        : "-";

      // 2. Borrowing Information
      const origDate = new Date(rec.borrowing.originalDate);
      elements.detailBorrowingDate.textContent = origDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      elements.detailAmount.textContent = `₹ ${Number(rec.borrowing.originalAmount).toLocaleString("en-IN")}`;
      elements.detailInterestRate.textContent = `${rec.borrowing.interestRate}% / month`;

      // Bond Paper Image
      if (rec.borrowing.bondPaperImage) {
        elements.detailBondImg.src = rec.borrowing.bondPaperImage;
        elements.detailBondName.textContent = rec.borrowing.bondPaperName || "Bond_Paper_Scan.jpg";
        elements.detailBondPaperContainer.style.display = "flex";

        elements.detailBondThumbBtn.onclick = () => {
          openModal(rec.borrowing.bondPaperImage, `Official Bond Paper: ${rec.borrower.surname} ${rec.borrower.name} (${rec.recordId})`);
        };
      } else {
        elements.detailBondPaperContainer.style.display = "none";
      }

      // 3. Interest Information
      elements.detailElapsedDays.textContent = rec.interest.elapsedDays;
      elements.detailElapsedMonths.textContent = rec.interest.elapsedMonths;
      elements.detailElapsedYears.textContent = rec.interest.elapsedYears;

      elements.detailAccumulatedInterest.textContent = `₹ ${Number(rec.interest.accumulatedInterest).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      elements.detailTotalPayable.textContent = `₹ ${Number(rec.interest.totalPayable).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const calcDate = new Date(rec.interest.lastCalculatedDate);
      elements.detailLastCalculatedDate.textContent = calcDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) + " at " + calcDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      if (elements.detailCalculationMethod) {
        elements.detailCalculationMethod.textContent = rec.interest.calculationMethod || "CONFIGURABLE_MONTHLY";
      }
    } catch (err) {
      console.error("[App] Failed to load borrowing record details:", err);
      alert(`Could not load record details: ${err.message}`);
      navigate("borrowed-records");
    }
  }

  // --- IMAGE UPLOAD HANDLING ---
  function setupImageUpload() {
    const { dropZone, fileInput, changeImageBtn, removeImageBtn, viewImageThumbBtn } = elements;

    dropZone.addEventListener("click", (e) => {
      if (e.target.closest("#changeImageBtn") || e.target.closest("#removeImageBtn") || e.target.closest("#viewImageThumbBtn")) {
        return;
      }
      fileInput.click();
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("drag-over");
      });
    });

    dropZone.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processImageFile(files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processImageFile(e.target.files[0]);
      }
    });

    changeImageBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    removeImageBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearUploadedImage();
    });

    viewImageThumbBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.currentUploadedImage) {
        openModal(state.currentUploadedImage.dataUrl, `Bond Paper: ${state.currentUploadedImage.name}`);
      }
    });
  }

  function processImageFile(file) {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showBondImageError("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    const maxSizeInBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      showBondImageError("Image size exceeds limit. Please upload an image under 15MB.");
      return;
    }

    clearBondImageError();

    const reader = new FileReader();
    reader.onload = function (event) {
      state.currentUploadedImage = {
        file: file,
        dataUrl: event.target.result,
        name: file.name,
        size: formatBytes(file.size)
      };

      renderImagePreview();
    };
    reader.readAsDataURL(file);
  }

  function renderImagePreview() {
    if (!state.currentUploadedImage) return;

    elements.uploadPlaceholder.style.display = "none";
    elements.previewSection.style.display = "flex";

    elements.previewImage.src = state.currentUploadedImage.dataUrl;
    elements.previewFilename.textContent = state.currentUploadedImage.name;
    elements.previewFilesize.textContent = state.currentUploadedImage.size;

    elements.dropZone.classList.remove("has-error");
    clearBondImageError();
  }

  function clearUploadedImage() {
    state.currentUploadedImage = null;
    elements.fileInput.value = "";
    elements.previewImage.src = "";
    elements.uploadPlaceholder.style.display = "block";
    elements.previewSection.style.display = "none";
  }

  function showBondImageError(message) {
    elements.dropZone.classList.add("has-error");
    elements.bondImageError.textContent = message;
    elements.bondImageError.style.display = "flex";
  }

  function clearBondImageError() {
    elements.dropZone.classList.remove("has-error");
    elements.bondImageError.textContent = "";
    elements.bondImageError.style.display = "none";
  }

  // --- FORM VALIDATION & SUBMISSION (PRESERVED WORKFLOW) ---
  async function handleFormSubmit(e) {
    e.preventDefault();

    elements.formGlobalAlert.style.display = "none";

    let isValid = true;
    const errors = [];

    // 1. Surname
    const surnameVal = elements.inputSurname.value.trim();
    if (!surnameVal) {
      setFieldError(elements.inputSurname, "Surname is required.");
      isValid = false;
      errors.push("Surname");
    } else if (surnameVal.length < 2) {
      setFieldError(elements.inputSurname, "Surname must be at least 2 characters.");
      isValid = false;
    } else {
      clearFieldError(elements.inputSurname);
    }

    // 2. Name
    const nameVal = elements.inputName.value.trim();
    if (!nameVal) {
      setFieldError(elements.inputName, "Borrower name is required.");
      isValid = false;
      errors.push("Name");
    } else if (nameVal.length < 2) {
      setFieldError(elements.inputName, "Borrower name must be at least 2 characters.");
      isValid = false;
    } else {
      clearFieldError(elements.inputName);
    }

    // 3. Phone Number
    const phoneVal = elements.inputPhone.value.trim().replace(/\D/g, "");
    if (!phoneVal) {
      setFieldError(elements.inputPhone, "Primary phone number is required.");
      isValid = false;
      errors.push("Phone Number");
    } else if (phoneVal.length !== 10) {
      setFieldError(elements.inputPhone, "Please enter a valid 10-digit mobile number.");
      isValid = false;
    } else {
      clearFieldError(elements.inputPhone);
    }

    // 4. Alternate Name (Optional)
    const altNameVal = elements.inputAltName.value.trim();

    // 5. Alternate Phone (Optional, but if filled, must be 10 digits)
    const altPhoneVal = elements.inputAltPhone.value.trim().replace(/\D/g, "");
    if (altPhoneVal && altPhoneVal.length !== 10) {
      setFieldError(elements.inputAltPhone, "Alternate number must be a valid 10-digit number.");
      isValid = false;
    } else {
      clearFieldError(elements.inputAltPhone);
    }

    // 6. Borrowed Amount
    const amountVal = parseFloat(elements.inputAmount.value);
    if (isNaN(amountVal) || amountVal <= 0) {
      setFieldError(elements.inputAmount, "Please enter a valid borrowed amount greater than 0.");
      isValid = false;
      errors.push("Borrowed Amount");
    } else {
      clearFieldError(elements.inputAmount);
    }

    // 7. Interest Rate
    const interestVal = parseFloat(elements.inputInterestRate.value);
    if (isNaN(interestVal) || interestVal < 0) {
      setFieldError(elements.inputInterestRate, "Please enter a valid interest rate (e.g., 2% or 24%).");
      isValid = false;
      errors.push("Interest Rate");
    } else {
      clearFieldError(elements.inputInterestRate);
    }

    // 8. Bond Paper Image
    if (!state.currentUploadedImage) {
      showBondImageError("Bond paper image upload is required for legal documentation.");
      isValid = false;
      errors.push("Bond Paper Image");
    } else {
      clearBondImageError();
    }

    if (!isValid) {
      elements.formGlobalAlert.style.display = "flex";
      elements.formGlobalAlert.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Form is Valid -> Construct payload
    const newRecordId = generateRecordReferenceId();
    const payload = {
      recordId: newRecordId,
      surname: surnameVal,
      name: nameVal,
      phone: phoneVal,
      altName: altNameVal,
      altPhone: altPhoneVal,
      amount: amountVal,
      interestRate: interestVal,
      bondPaperName: state.currentUploadedImage ? state.currentUploadedImage.name : "",
      bondPaperImage: state.currentUploadedImage ? state.currentUploadedImage.dataUrl : ""
    };

    // Save to MongoDB Atlas via Centralized REST API Service
    try {
      let savedRecord;
      if (window.apiService && typeof window.apiService.createBorrowing === 'function') {
        const resData = await window.apiService.createBorrowing(payload);
        savedRecord = resData.record || payload;
      } else {
        const response = await fetch("/api/borrowings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errJson = await response.json();
          throw new Error(errJson.error || "Failed to save record to database");
        }

        const resData = await response.json();
        savedRecord = resData.record || payload;
      }

      // Show Confirmation Screen (Exact specification workflow)
      showSuccessScreen(savedRecord);
    } catch (err) {
      console.error("[App] Submission error:", err);
      alert(`Database Submission Notice: ${err.message}`);
      // Fallback display
      showSuccessScreen(payload);
    }
  }

  function resetForm() {
    elements.borrowingForm.reset();
    clearUploadedImage();
    elements.formGlobalAlert.style.display = "none";

    const allInputs = elements.borrowingForm.querySelectorAll(".form-control");
    allInputs.forEach((input) => clearFieldError(input));
    clearBondImageError();
  }

  function setFieldError(inputElement, errorMessage) {
    inputElement.classList.add("is-invalid");
    const parent = inputElement.closest(".form-group");
    if (parent) {
      const errorEl = parent.querySelector(".error-message");
      if (errorEl) {
        errorEl.textContent = errorMessage;
        errorEl.style.display = "flex";
      }
    }
  }

  function clearFieldError(inputElement) {
    inputElement.classList.remove("is-invalid");
    const parent = inputElement.closest(".form-group");
    if (parent) {
      const errorEl = parent.querySelector(".error-message");
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = "none";
      }
    }
  }

  // --- MODAL HANDLING ---
  function openModal(imgSrc, title) {
    elements.modalImage.src = imgSrc;
    elements.modalTitle.textContent = title || "Bond Paper Document";
    elements.imageModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    elements.imageModal.classList.remove("active");
    elements.modalImage.src = "";
    document.body.style.overflow = "";
  }

  // --- HELPERS ---
  function generateRecordReferenceId() {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `VB-${year}-${random}`;
  }

  function formatPhone(phoneStr) {
    if (!phoneStr) return "-";
    const cleaned = String(phoneStr).replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phoneStr;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function startClock() {
    function update() {
      const now = new Date();
      if (elements.systemTimeDisplay) {
        elements.systemTimeDisplay.textContent = now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }) + " | " + now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        });
      }
    }
    update();
    setInterval(update, 1000);
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
