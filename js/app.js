/**
 * VillageBorrow - Professional Money Borrowing Management System
 * Core Application Logic & State Management
 */

(function () {
  "use strict";

  // Storage Key
  const STORAGE_KEY = "villageborrow_records";

  // Application State
  const state = {
    currentView: "home", // 'home' | 'new-borrowing' | 'borrowed-records'
    currentUploadedImage: null, // { file, dataUrl, name, size }
    records: []
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

    // Home Action Cards
    cardNewBorrowing: document.getElementById("cardNewBorrowing"),
    cardRecords: document.getElementById("cardRecords"),

    // New Borrowing Page
    backToHomeBtn: document.getElementById("backToHomeBtn"),
    borrowingForm: document.getElementById("borrowingForm"),
    formContainer: document.getElementById("formContainer"),
    successContainer: document.getElementById("successContainer"),

    // Form Inputs
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

    // Records Page Elements
    recordsBackHomeBtn: document.getElementById("recordsBackHomeBtn"),
    recordsNewBtn: document.getElementById("recordsNewBtn"),
    recordsTableBody: document.getElementById("recordsTableBody"),
    emptyRecordsState: document.getElementById("emptyRecordsState"),
    recordsTableContainer: document.getElementById("recordsTableContainer"),
    totalRecordsBadge: document.getElementById("totalRecordsBadge"),

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
    loadRecordsFromStorage();
    bindEvents();
    startClock();
    navigate("home");
  }

  // --- LOCAL STORAGE HANDLING ---
  function loadRecordsFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        state.records = JSON.parse(data);
      } else {
        // Initialize with realistic mock records if completely empty to show banking standard
        state.records = [
          {
            id: "VB-2026-1042",
            timestamp: "2026-10-24T10:30:00.000Z",
            surname: "Patil",
            name: "Suresh",
            phone: "9823456780",
            altName: "Baban",
            altPhone: "9823456781",
            amount: 75000,
            interestRate: 2.0,
            bondPaperName: "Patil_Bond_75k.jpg",
            bondPaperUrl: createPlaceholderBondPaperDataUrl("Patil Suresh", 75000, "2%")
          },
          {
            id: "VB-2026-1043",
            timestamp: "2026-11-01T14:15:00.000Z",
            surname: "Rathod",
            name: "Kishor",
            phone: "9876543210",
            altName: "Kishore Anna",
            altPhone: "",
            amount: 50000,
            interestRate: 2.5,
            bondPaperName: "Rathod_Stamp_Paper_50k.jpg",
            bondPaperUrl: createPlaceholderBondPaperDataUrl("Rathod Kishor", 50000, "2.5%")
          }
        ];
        saveRecordsToStorage();
      }
    } catch (e) {
      console.warn("Could not load from localStorage, initializing in memory.", e);
      state.records = [];
    }
  }

  function saveRecordsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }

  // Generate a clean legal stamp graphic data URL for default records
  function createPlaceholderBondPaperDataUrl(borrowerName, amount, interest) {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");

    // Background paper
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, 600, 800);

    // Border
    ctx.strokeStyle = "#c59b27";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 560, 760);
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, 548, 748);

    // Official Header Stamp
    ctx.fillStyle = "#1e3a5f";
    ctx.fillRect(40, 40, 520, 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("GOVERNMENT NON-JUDICIAL STAMP PAPER", 300, 75);
    ctx.font = "13px sans-serif";
    ctx.fillText("INDIA NOTARIAL CERTIFIED MONEY BORROWING BOND", 300, 96);

    // Stamp Value
    ctx.fillStyle = "#059669";
    ctx.font = "bold 24px Georgia, serif";
    ctx.fillText("VALUE: Rs. 100", 300, 150);

    // Body Lines
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    ctx.font = "14px Georgia, serif";
    ctx.fillText("LEGAL DEED OF BORROWING & PROMISSORY AGREEMENT", 60, 200);

    ctx.font = "13px Georgia, serif";
    ctx.fillText("This agreement is executed between the Private Lender and Borrower:", 60, 240);
    ctx.fillText(`Borrower Full Name: ${borrowerName}`, 60, 280);
    ctx.fillText(`Principal Borrowed Amount: Rs. ${Number(amount).toLocaleString("en-IN")}/-`, 60, 320);
    ctx.fillText(`Agreed Monthly Interest Rate: ${interest}`, 60, 360);
    ctx.fillText("Terms: The borrower agrees to repay the principal along with accumulated", 60, 410);
    ctx.fillText("interest on prompt demand under standard rural lending guidelines.", 60, 435);

    // Notary Seal
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(460, 620, 50, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = "#dc2626";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NOTARY SEAL", 460, 615);
    ctx.fillText("VERIFIED", 460, 632);

    // Signature Line
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 670);
    ctx.lineTo(240, 670);
    ctx.stroke();
    ctx.fillStyle = "#475569";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Borrower Signature / Thumb Impression", 60, 690);

    return canvas.toDataURL("image/jpeg", 0.85);
  }

  // --- NAVIGATION ---
  function navigate(viewName) {
    state.currentView = viewName;

    // View toggling
    elements.viewHome.classList.toggle("active", viewName === "home");
    elements.viewNewBorrowing.classList.toggle("active", viewName === "new-borrowing");
    elements.viewRecords.classList.toggle("active", viewName === "borrowed-records");

    // Nav active states
    elements.navHomeBtn.classList.toggle("active", viewName === "home");
    elements.navNewBorrowingBtn.classList.toggle("active", viewName === "new-borrowing");
    elements.navRecordsBtn.classList.toggle("active", viewName === "borrowed-records");

    if (viewName === "new-borrowing") {
      // Ensure form is visible, success screen hidden
      showFormScreen();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (viewName === "borrowed-records") {
      renderRecordsTable();
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
    elements.successRefCode.textContent = record.id;
    elements.summaryName.textContent = `${record.surname} ${record.name}`;
    elements.summaryPhone.textContent = formatPhone(record.phone);
    elements.summaryAmount.textContent = `₹ ${Number(record.amount).toLocaleString("en-IN")}`;
    elements.summaryInterest.textContent = `${record.interestRate}%`;
    elements.summaryBondAttached.textContent = record.bondPaperName || "Bond Image Attached";

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

    // Image Upload Handlers
    setupImageUpload();

    // Form Submission & Validation
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

  // --- IMAGE UPLOAD HANDLING ---
  function setupImageUpload() {
    const { dropZone, fileInput, changeImageBtn, removeImageBtn, viewImageThumbBtn } = elements;

    // Trigger file chooser when drop zone clicked
    dropZone.addEventListener("click", (e) => {
      // Don't re-trigger if clicking preview actions
      if (e.target.closest("#changeImageBtn") || e.target.closest("#removeImageBtn") || e.target.closest("#viewImageThumbBtn")) {
        return;
      }
      fileInput.click();
    });

    // Drag & Drop
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

    // Change Image button
    changeImageBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    // Remove Image button
    removeImageBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearUploadedImage();
    });

    // Click on thumbnail to view preview modal
    viewImageThumbBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.currentUploadedImage) {
        openModal(state.currentUploadedImage.dataUrl, `Bond Paper: ${state.currentUploadedImage.name}`);
      }
    });
  }

  function processImageFile(file) {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showBondImageError("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    // Size limit: 10MB
    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      showBondImageError("Image size exceeds the 10MB limit. Please upload a smaller image.");
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

  // --- FORM VALIDATION & SUBMISSION ---
  function handleFormSubmit(e) {
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

    // Form is Valid -> Construct Record
    const newRecordId = generateRecordReferenceId();
    const newRecord = {
      id: newRecordId,
      timestamp: new Date().toISOString(),
      surname: surnameVal,
      name: nameVal,
      phone: phoneVal,
      altName: altNameVal,
      altPhone: altPhoneVal,
      amount: amountVal,
      interestRate: interestVal,
      bondPaperName: state.currentUploadedImage.name,
      bondPaperUrl: state.currentUploadedImage.dataUrl
    };

    // Prepend to records list
    state.records.unshift(newRecord);
    saveRecordsToStorage();

    // Show Confirmation Screen
    showSuccessScreen(newRecord);
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

  // --- RECORDS TABLE RENDERING ---
  function renderRecordsTable() {
    const records = state.records;
    elements.totalRecordsBadge.textContent = `${records.length} ${records.length === 1 ? "Record" : "Records"}`;

    if (!records || records.length === 0) {
      elements.recordsTableContainer.style.display = "none";
      elements.emptyRecordsState.style.display = "block";
      return;
    }

    elements.recordsTableContainer.style.display = "block";
    elements.emptyRecordsState.style.display = "none";
    elements.recordsTableBody.innerHTML = "";

    records.forEach((record) => {
      const tr = document.createElement("tr");

      const dateStr = record.timestamp
        ? new Date(record.timestamp).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })
        : "-";

      tr.innerHTML = `
        <td>
          <span style="font-weight: 700; color: var(--navy-900); font-family: monospace;">${record.id}</span>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--navy-900);">${escapeHtml(record.surname)} ${escapeHtml(record.name)}</div>
          ${record.altName ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Alias: ${escapeHtml(record.altName)}</div>` : ""}
        </td>
        <td>
          <div>${formatPhone(record.phone)}</div>
          ${record.altPhone ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Alt: ${formatPhone(record.altPhone)}</div>` : ""}
        </td>
        <td style="font-weight: 700; color: var(--navy-900);">
          ₹ ${Number(record.amount).toLocaleString("en-IN")}
        </td>
        <td>
          <span style="display: inline-block; background-color: var(--gold-50); color: var(--gold-600); border: 1px solid rgba(184, 138, 28, 0.2); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.8125rem;">
            ${record.interestRate}%
          </span>
        </td>
        <td>
          <button type="button" class="bond-thumbnail-btn view-bond-btn" data-record-id="${record.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View Bond Paper
          </button>
        </td>
      `;

      elements.recordsTableBody.appendChild(tr);
    });

    // Attach click listeners to "View Bond Paper" buttons
    const viewButtons = elements.recordsTableBody.querySelectorAll(".view-bond-btn");
    viewButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-record-id");
        const found = state.records.find((r) => r.id === id);
        if (found && found.bondPaperUrl) {
          openModal(found.bondPaperUrl, `Official Bond Paper: ${found.surname} ${found.name} (${found.id})`);
        }
      });
    });
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

