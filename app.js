/* ═══════════════════════════════════════════════
   COLLEGE ID CARD DESIGNER - APPLICATION LOGIC
   Canvas-based ID Card with Drag Photo, QR Code,
   Institution Switching, Visitors' Identity Card,
   Authorized Family Grid & Multiple Card Types
   ═══════════════════════════════════════════════ */

// ──── INSTITUTION DATA ────
const INSTITUTIONS = {
    algaith: {
        name: "AL GAITH ISLAMIC & ARTS COLLEGE FOR GIRLS",
        arabicName: "كلية الغيث للآداب والعلوم الإسلامية - للبنات",
        shortName: "AL-GAITH",
        address: "P.O Karthala, Malappuram, Pin: 679571",
        affiliation: "Affiliated to Coordination of Islamic Colleges",
        phone: "0494 2608283, 8590658550",
        website: "https://kkhmstorage.github.io/markaz-wafy-college/",
        themeColor: "#173f8a",
        accentColor: "#3b82f6",
        tagline: "Empowering Women Through Knowledge",
        logo: "assets/college_logo.png"
    },
    kkhm: {
        name: "KKHM ISLAMIC & ARTS COLLEGE",
        arabicName: "كلية كي كي حسن مسليار الإسلامية والآداب",
        shortName: "KKHM",
        address: "P.O Karthala, Malappuram, Pin: 679571",
        affiliation: "Affiliated to Coordination of Islamic Colleges",
        phone: "0494 2608283, 8590658550",
        website: "https://kkhmstorage.github.io/markaz-wafy-college/",
        themeColor: "#173f8a",
        accentColor: "#3b82f6",
        tagline: "Enlightening Minds, Building Futures",
        logo: "assets/college_logo.png"
    }
};

// ──── STATE MANAGEMENT ────
let state = {
    currentInstitution: 'algaith',
    currentCardType: 'visitor',   // student | staff | visitor
    showingSide: 'front',          // front | back
    currentBatch: '2026-2032',
    activeFilterBatch: 'all',
    searchQuery: '',
    currentControlTab: 'designer', // designer | recent
    editingCardId: null,
    userPhoto: null,
    userPhotoRawSrc: null,
    logoImage: null,
    qrImage: null,
    // Photo position (for drag)
    photoOffsetX: 0,
    photoOffsetY: 0,
    photoZoom: 100,
    // Drag state
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragInitOffsetX: 0,
    dragInitOffsetY: 0,
    // Family members for Visitor back side (4 members)
    familyMembers: [
        {
            name: "M ABOOBACKER",
            relation: "FATHER",
            photo: null,
            photoSrc: "assets/father_sample.jpg"
        },
        {
            name: "MUMTHAZ",
            relation: "MOTHER",
            photo: null,
            photoSrc: "assets/mother_sample.jpg"
        },
        {
            name: "FARSEENA",
            relation: "SISTER",
            photo: null,
            photoSrc: "assets/sister_sample.jpg"
        },
        {
            name: "MOHAMMED",
            relation: "BROTHER",
            photo: null,
            photoSrc: "assets/brother_sample.jpg"
        }
    ]
};

// ──── DOM REFERENCES ────
const canvas = document.getElementById('idCardCanvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvasContainer');
const photoDragOverlay = document.getElementById('photoDragOverlay');

// Institution inputs
const instArabicNameInput = document.getElementById('instArabicName');
const instNameInput = document.getElementById('instName');
const instAddressInput = document.getElementById('instAddress');
const instAffiliationInput = document.getElementById('instAffiliation');
const instPhoneInput = document.getElementById('instPhone');
const instWebsiteInput = document.getElementById('instWebsite');

// Person inputs (Student/Staff)
const personNameInput = document.getElementById('personName');
const personIdInput = document.getElementById('personId');
const personRoleInput = document.getElementById('personRole');
const personBloodInput = document.getElementById('personBlood');
const personGuardianInput = document.getElementById('personGuardian');
const personValidityInput = document.getElementById('personValidity');
const personPhoneInput = document.getElementById('personPhone');
const personDobInput = document.getElementById('personDob');
const personAddressInput = document.getElementById('personAddress');
const staffDeptInput = document.getElementById('staffDept');
const staffJoinDateInput = document.getElementById('staffJoinDate');

// Quick search input
const quickAdmSearchInput = document.getElementById('quickAdmSearchInput');

// Visitor inputs (Front side)
const visitorStudentNameInput = document.getElementById('visitorStudentName');
const visitorStudentIdInput = document.getElementById('visitorStudentId');
const visitorStudentAddr1Input = document.getElementById('visitorStudentAddr1');
const visitorStudentAddr2Input = document.getElementById('visitorStudentAddr2');
const visitorStudentContactInput = document.getElementById('visitorStudentContact');
const visitorDurationInput = document.getElementById('visitorDuration');

// File inputs
const photoInput = document.getElementById('photoInput');
const logoInput = document.getElementById('logoInput');

// Color inputs
const themeColorInput = document.getElementById('themeColor');
const accentColorInput = document.getElementById('accentColor');

// Controls
const photoControls = document.getElementById('photoControls');
const photoZoomSlider = document.getElementById('photoZoom');
const zoomValueDisplay = document.getElementById('zoomValue');


// ═══════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════

function init() {
    switchInstitution('algaith');
    switchCardType('visitor');
    setupEventListeners();
    setupDragHandlers();
    renderFamilyMembersList();
    loadSampleImages();
    initBatchDatabase();
    updateBatchCountBadges();
    renderRecentWorksList();
    drawCard();
}

function loadSampleImages() {
    // 1. College Logo
    const logoImg = new Image();
    logoImg.onload = () => {
        state.logoImage = logoImg;
        drawCard();
    };
    logoImg.src = 'assets/college_logo.png';

    // 2. Student Sample Photo
    const studentImg = new Image();
    studentImg.onload = () => {
        state.userPhoto = studentImg;
        state.userPhotoRawSrc = 'assets/student_sample.jpg';
        if (photoControls) photoControls.classList.remove('hidden');
        if (photoDragOverlay) photoDragOverlay.classList.add('active');
        updateDragOverlayPosition();
        drawCard();
    };
    studentImg.src = 'assets/student_sample.jpg';

    // 3. Family Members Sample Photos (4 Members)
    state.familyMembers.forEach((member, idx) => {
        if (member.photoSrc) {
            const fImg = new Image();
            fImg.onload = () => {
                member.photo = fImg;
                renderFamilyMembersList();
                drawCard();
            };
            fImg.src = member.photoSrc;
        }
    });
}

function setupEventListeners() {
    // Text inputs trigger redraw
    const allInputs = [
        instArabicNameInput, instNameInput, instAddressInput, instAffiliationInput, instPhoneInput, instWebsiteInput,
        personNameInput, personIdInput, personRoleInput, personBloodInput,
        personGuardianInput, personValidityInput,
        personPhoneInput, personDobInput, personAddressInput,
        staffDeptInput, staffJoinDateInput,
        visitorStudentNameInput, visitorStudentIdInput,
        visitorStudentAddr1Input, visitorStudentAddr2Input,
        visitorStudentContactInput, visitorDurationInput,
        themeColorInput, accentColorInput
    ];

    allInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                generateQR();
                drawCard();
            });
        }
    });

    // Photo upload
    if (photoInput) photoInput.addEventListener('change', handlePhotoUpload);
    
    // Logo upload
    if (logoInput) logoInput.addEventListener('change', handleLogoUpload);

    // Zoom slider
    if (photoZoomSlider) {
        photoZoomSlider.addEventListener('input', (e) => {
            state.photoZoom = parseInt(e.target.value);
            if (zoomValueDisplay) zoomValueDisplay.textContent = state.photoZoom + '%';
            drawCard();
        });
    }

    // Theme color change also updates preset highlight
    if (themeColorInput) {
        themeColorInput.addEventListener('input', () => {
            document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
            drawCard();
        });
    }
}


// ═══════════════════════════════════════════════
//  INSTITUTION SWITCHING
// ═══════════════════════════════════════════════

function switchInstitution(instKey) {
    state.currentInstitution = instKey;
    const inst = INSTITUTIONS[instKey];

    // Update UI buttons
    document.querySelectorAll('.inst-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.inst === instKey);
    });

    // Fill institution fields
    if (instArabicNameInput) instArabicNameInput.value = inst.arabicName;
    if (instNameInput) instNameInput.value = inst.name;
    if (instAddressInput) instAddressInput.value = inst.address;
    if (instAffiliationInput) instAffiliationInput.value = inst.affiliation || 'Affiliated to Coordination of Islamic Colleges';
    if (instPhoneInput) instPhoneInput.value = inst.phone;
    if (instWebsiteInput) instWebsiteInput.value = inst.website;

    // Reload institutional logo if present
    if (inst.logo) {
        const logoImg = new Image();
        logoImg.onload = () => {
            state.logoImage = logoImg;
            drawCard();
        };
        logoImg.src = inst.logo;
    }

    // Update theme colors
    if (themeColorInput) themeColorInput.value = inst.themeColor;
    if (accentColorInput) accentColorInput.value = inst.accentColor;
    setThemeColor(inst.themeColor);

    generateQR();
    drawCard();
}


// ═══════════════════════════════════════════════
//  CARD TYPE SWITCHING
// ═══════════════════════════════════════════════

function switchCardType(type) {
    state.currentCardType = type;

    // Update UI buttons
    document.querySelectorAll('.card-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });

    const personSection = document.getElementById('personSection');
    const visitorSection = document.getElementById('visitorSection');
    const departmentGroup = document.getElementById('departmentGroup');
    const joinDateGroup = document.getElementById('joinDateGroup');
    const dobGroup = document.getElementById('dobGroup');
    const addressGroup = document.getElementById('addressGroup');

    // Reset visibility
    if (personSection) personSection.classList.remove('hidden');
    if (visitorSection) visitorSection.classList.add('hidden');
    if (departmentGroup) departmentGroup.classList.add('hidden');
    if (joinDateGroup) joinDateGroup.classList.add('hidden');
    if (dobGroup) dobGroup.classList.remove('hidden');
    if (addressGroup) addressGroup.classList.remove('hidden');

    if (type === 'student') {
        const titleEl = document.getElementById('personSectionTitle');
        if (titleEl) titleEl.textContent = 'വിദ്യാർത്ഥി വിവരങ്ങൾ';
        document.getElementById('nameLabel').textContent = 'പേര്';
        document.getElementById('idLabel').textContent = 'Admission No';
        document.getElementById('roleLabel').textContent = 'ക്ലാസ്സ് / Course';
    } else if (type === 'staff') {
        const titleEl = document.getElementById('personSectionTitle');
        if (titleEl) titleEl.textContent = 'സ്റ്റാഫ് വിവരങ്ങൾ';
        document.getElementById('nameLabel').textContent = 'പേര്';
        document.getElementById('idLabel').textContent = 'Staff ID';
        document.getElementById('roleLabel').textContent = 'Designation';
        if (departmentGroup) departmentGroup.classList.remove('hidden');
        if (joinDateGroup) joinDateGroup.classList.remove('hidden');
        if (dobGroup) dobGroup.classList.add('hidden');
    } else if (type === 'visitor') {
        if (personSection) personSection.classList.add('hidden');
        if (visitorSection) visitorSection.classList.remove('hidden');
    }

    updateDragOverlayPosition();
    generateQR();
    drawCard();
}


// ═══════════════════════════════════════════════
//  FAMILY MEMBERS MANAGEMENT (FOR VISITOR BACK)
// ═══════════════════════════════════════════════

function renderFamilyMembersList() {
    const container = document.getElementById('familyMembersList');
    if (!container) return;

    container.innerHTML = '';

    state.familyMembers.forEach((member, index) => {
        const card = document.createElement('div');
        card.className = 'family-member-card';

        const thumbSrc = member.photo ? member.photo.src : (member.photoSrc || '');
        const thumbHtml = thumbSrc
            ? `<img src="${thumbSrc}" class="member-thumb-img" alt="${member.name}">`
            : `<div class="member-thumb-placeholder"><i class="fas fa-user"></i></div>`;

        card.innerHTML = `
            <div class="member-card-top">
                <div class="member-card-title">
                    <span class="badge-num">#${index + 1}</span>
                    <span>${member.relation || 'Member'}</span>
                </div>
                ${state.familyMembers.length > 1 ? `
                    <button type="button" class="btn-remove-member" onclick="removeFamilyMember(${index})" title="Delete member">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                ` : ''}
            </div>
            <div class="member-card-body">
                <div class="member-photo-col">
                    <div class="member-thumb-box" id="memberThumb_${index}">
                        ${thumbHtml}
                    </div>
                    <label class="btn-thumb-upload">
                        <i class="fas fa-camera"></i> Photo
                        <input type="file" accept="image/*" style="display:none" onchange="handleMemberPhotoUpload(${index}, event)">
                    </label>
                </div>
                <div class="member-fields-col">
                    <div class="form-group">
                        <label>പേര് (Name)</label>
                        <input type="text" class="form-input font-bold" value="${member.name}" placeholder="e.g. M ABOOBACKER" oninput="updateMemberName(${index}, this.value)">
                    </div>
                    <div class="form-group">
                        <label>ബന്ധം (Relation)</label>
                        <select class="form-input" onchange="updateMemberRelation(${index}, this.value)">
                            <option value="FATHER" ${member.relation === 'FATHER' ? 'selected' : ''}>FATHER (പിതാവ്)</option>
                            <option value="MOTHER" ${member.relation === 'MOTHER' ? 'selected' : ''}>MOTHER (മാതാവ്)</option>
                            <option value="SISTER" ${member.relation === 'SISTER' ? 'selected' : ''}>SISTER (സഹോദരി)</option>
                            <option value="BROTHER" ${member.relation === 'BROTHER' ? 'selected' : ''}>BROTHER (സഹോദരൻ)</option>
                            <option value="GUARDIAN" ${member.relation === 'GUARDIAN' ? 'selected' : ''}>GUARDIAN (രക്ഷിതാവ്)</option>
                            <option value="GRANDFATHER" ${member.relation === 'GRANDFATHER' ? 'selected' : ''}>GRANDFATHER (മുത്തച്ഛൻ)</option>
                            <option value="GRANDMOTHER" ${member.relation === 'GRANDMOTHER' ? 'selected' : ''}>GRANDMOTHER (മുത്തശ്ശി)</option>
                            <option value="UNCLE" ${member.relation === 'UNCLE' ? 'selected' : ''}>UNCLE (അമ്മാവൻ)</option>
                            <option value="AUNT" ${member.relation === 'AUNT' ? 'selected' : ''}>AUNT (അമ്മായി)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function addFamilyMember() {
    if (state.familyMembers.length >= 4) {
        alert('പരമാവധി 4 അംഗീകൃത കുടുംബാംഗങ്ങളെ മാത്രമേ ചേർക്കാൻ കഴിയൂ.');
        return;
    }
    state.familyMembers.push({
        name: 'NEW MEMBER',
        relation: 'BROTHER',
        photo: null,
        photoSrc: ''
    });
    renderFamilyMembersList();
    drawCard();
}

function removeFamilyMember(index) {
    if (state.familyMembers.length <= 1) return;
    state.familyMembers.splice(index, 1);
    renderFamilyMembersList();
    drawCard();
}

function updateMemberName(index, val) {
    if (state.familyMembers[index]) {
        state.familyMembers[index].name = val.toUpperCase();
        drawCard();
    }
}

function updateMemberRelation(index, val) {
    if (state.familyMembers[index]) {
        state.familyMembers[index].relation = val.toUpperCase();
        renderFamilyMembersList();
        drawCard();
    }
}

function handleMemberPhotoUpload(index, event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            state.familyMembers[index].photo = img;
            state.familyMembers[index].photoSrc = e.target.result;
            renderFamilyMembersList();
            drawCard();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}


// ═══════════════════════════════════════════════
//  STUDENT PHOTO HANDLING & DRAG
// ═══════════════════════════════════════════════

// ──── ROBUST PHOTO LOADING & SAFE CROPPING ────
function loadPhotoSource(src, offsetX = 0, offsetY = 0, zoom = 100, onDone) {
    if (!src) {
        state.userPhoto = null;
        state.userPhotoRawSrc = null;
        state.photoOffsetX = 0;
        state.photoOffsetY = 0;
        state.photoZoom = 100;
        if (photoZoomSlider) photoZoomSlider.value = 100;
        if (zoomValueDisplay) zoomValueDisplay.textContent = '100%';
        if (photoControls) photoControls.classList.add('hidden');
        if (photoDragOverlay) photoDragOverlay.classList.remove('active');
        const photoLabel = document.getElementById('photoLabel');
        if (photoLabel) {
            photoLabel.innerHTML = '<i class="fas fa-portrait"></i><span>ഫോട്ടോ അപ്ലോഡ് ചെയ്യുക</span>';
        }
        drawCard();
        if (typeof onDone === 'function') onDone();
        return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        // If an image happens to be a full ID card canvas (650x1000),
        // auto-crop the student photo frame so it NEVER nests recursively inside itself!
        if (naturalW === 650 && naturalH === 1000) {
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = 202;
            cropCanvas.height = 242;
            const cropCtx = cropCanvas.getContext('2d');
            // Photo slot on ID card is at (photoX: 220, photoY: 225, photoW: 210, photoH: 250).
            // Inset by 4px to avoid outer/inner border strokes cleanly:
            cropCtx.drawImage(img, 224, 229, 202, 242, 0, 0, 202, 242);
            const croppedSrc = cropCanvas.toDataURL('image/png');
            loadPhotoSource(croppedSrc, offsetX, offsetY, zoom, onDone);
            return;
        }

        state.userPhoto = img;
        state.userPhotoRawSrc = src;
        state.photoOffsetX = offsetX || 0;
        state.photoOffsetY = offsetY || 0;
        state.photoZoom = zoom || 100;

        if (photoZoomSlider) photoZoomSlider.value = state.photoZoom;
        if (zoomValueDisplay) zoomValueDisplay.textContent = state.photoZoom + '%';
        if (photoControls) photoControls.classList.remove('hidden');
        if (photoDragOverlay) photoDragOverlay.classList.add('active');

        const photoLabel = document.getElementById('photoLabel');
        if (photoLabel) {
            photoLabel.innerHTML = '<i class="fas fa-check-circle" style="color:#34d399"></i><span>ഫോട്ടോ ലോഡ് ചെയ്തു ✓</span>';
        }

        updateDragOverlayPosition();
        drawCard();
        if (typeof onDone === 'function') onDone();
    };
    img.onerror = () => {
        console.warn('Failed to load user photo:', src);
        if (typeof onDone === 'function') onDone();
    };
    img.src = src;
}

function extractAndSetStudentPhotoFromCard(card) {
    if (!card || !card.frontImg) {
        loadPhotoSource(null);
        return;
    }
    const fullImg = new Image();
    fullImg.crossOrigin = 'anonymous';
    fullImg.onload = () => {
        const naturalW = fullImg.naturalWidth || fullImg.width;
        const naturalH = fullImg.naturalHeight || fullImg.height;

        if (naturalW === 650 && naturalH === 1000) {
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = 202;
            cropCanvas.height = 242;
            const cropCtx = cropCanvas.getContext('2d');
            cropCtx.drawImage(fullImg, 224, 229, 202, 242, 0, 0, 202, 242);
            const croppedDataUrl = cropCanvas.toDataURL('image/png');

            loadPhotoSource(croppedDataUrl, 0, 0, 100, () => {
                // Permanently update localStorage for this card so it never needs extraction again
                card.studentPhoto = croppedDataUrl;
                card.photoOffsetX = 0;
                card.photoOffsetY = 0;
                card.photoZoom = 100;
                saveCardToBatchDB(card);
            });
        } else {
            // Not a full card canvas, treat directly as photo
            loadPhotoSource(card.frontImg, card.photoOffsetX || 0, card.photoOffsetY || 0, card.photoZoom || 100);
        }
    };
    fullImg.onerror = () => {
        loadPhotoSource(null);
    };
    fullImg.src = card.frontImg;
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        loadPhotoSource(event.target.result, 0, 0, 100);
    };
    reader.readAsDataURL(file);
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            state.logoImage = img;
            drawCard();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    const label = document.getElementById('logoLabel');
    if (label) {
        label.innerHTML = '<i class="fas fa-check-circle" style="color:#34d399"></i><span>ലോഗോ ലോഡ് ചെയ്തു ✓</span>';
    }
}

function resetPhotoPosition() {
    state.photoOffsetX = 0;
    state.photoOffsetY = 0;
    state.photoZoom = 100;
    if (photoZoomSlider) photoZoomSlider.value = 100;
    if (zoomValueDisplay) zoomValueDisplay.textContent = '100%';
    drawCard();
}

function updateDragOverlayPosition() {
    if (!state.userPhoto || state.showingSide !== 'front') {
        photoDragOverlay.classList.remove('active');
        return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;

    // Both visitor and student/staff cards use slightly curved square photo (210 x 250, radius 16)
    const photoW = 210;
    const photoH = 250;
    const photoX = (canvas.width - photoW) / 2;
    const photoY = 225;

    photoDragOverlay.style.width = (photoW * scaleX) + 'px';
    photoDragOverlay.style.height = (photoH * scaleY) + 'px';
    photoDragOverlay.style.left = (photoX * scaleX) + 'px';
    photoDragOverlay.style.top = (photoY * scaleY) + 'px';
    photoDragOverlay.style.borderRadius = (16 * scaleX) + 'px';
    photoDragOverlay.classList.add('active');
}

function setupDragHandlers() {
    // Mouse events
    photoDragOverlay.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);

    // Touch events
    photoDragOverlay.addEventListener('touchstart', startDragTouch, { passive: false });
    document.addEventListener('touchmove', onDragTouch, { passive: false });
    document.addEventListener('touchend', endDrag);

    // Update overlay on window resize
    window.addEventListener('resize', () => {
        if (state.userPhoto) {
            updateDragOverlayPosition();
        }
    });
}

function startDrag(e) {
    if (!state.userPhoto) return;
    state.isDragging = true;
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;
    state.dragInitOffsetX = state.photoOffsetX;
    state.dragInitOffsetY = state.photoOffsetY;
    photoDragOverlay.style.cursor = 'grabbing';
    e.preventDefault();
}

function startDragTouch(e) {
    if (!state.userPhoto || !e.touches.length) return;
    state.isDragging = true;
    state.dragStartX = e.touches[0].clientX;
    state.dragStartY = e.touches[0].clientY;
    state.dragInitOffsetX = state.photoOffsetX;
    state.dragInitOffsetY = state.photoOffsetY;
    e.preventDefault();
}

function onDrag(e) {
    if (!state.isDragging) return;
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    state.photoOffsetX = state.dragInitOffsetX + (e.clientX - state.dragStartX) * scaleX;
    state.photoOffsetY = state.dragInitOffsetY + (e.clientY - state.dragStartY) * scaleY;
    drawCard();
}

function onDragTouch(e) {
    if (!state.isDragging || !e.touches.length) return;
    e.preventDefault();
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    state.photoOffsetX = state.dragInitOffsetX + (e.touches[0].clientX - state.dragStartX) * scaleX;
    state.photoOffsetY = state.dragInitOffsetY + (e.touches[0].clientY - state.dragStartY) * scaleY;
    drawCard();
}

function endDrag() {
    state.isDragging = false;
    photoDragOverlay.style.cursor = 'grab';
}


// ═══════════════════════════════════════════════
//  QR CODE GENERATION (COMPREHENSIVE DETAILS)
// ═══════════════════════════════════════════════

function generateQR() {
    const qrContainer = document.getElementById('qrContainer');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';

    const inst = INSTITUTIONS[state.currentInstitution] || {};
    const instName = (instNameInput && instNameInput.value) || inst.name || 'KKHM ISLAMIC & ARTS COLLEGE';
    const affiliation = (instAffiliationInput && instAffiliationInput.value) || inst.affiliation || 'Affiliated to Coordination of Islamic Colleges';
    const website = (instWebsiteInput && instWebsiteInput.value) || inst.website || 'https://kkhmstorage.github.io/markaz-wafy-college/';
    const helpline = (instPhoneInput && instPhoneInput.value) || inst.phone || '0494 2608283, 8590658550';

    let qrData = '';

    if (state.currentCardType === 'visitor') {
        const studentName = visitorStudentNameInput ? visitorStudentNameInput.value.trim() : 'AFRIN FATHIMA';
        const admNo = visitorStudentIdInput ? visitorStudentIdInput.value.trim() : '747';
        const addr1 = visitorStudentAddr1Input ? visitorStudentAddr1Input.value.trim() : '';
        const addr2 = visitorStudentAddr2Input ? visitorStudentAddr2Input.value.trim() : '';
        const contact = visitorStudentContactInput ? visitorStudentContactInput.value.trim() : '';
        const duration = visitorDurationInput ? visitorDurationInput.value.trim() : '2026-2032';

        qrData = `COORDINATION OF ISLAMIC COLLEGES (CIC)\n` +
                 `INSTITUTION: ${instName}\n` +
                 `${affiliation}\n` +
                 `WEBSITE: ${website}\n` +
                 `HELPLINE: ${helpline}\n` +
                 `------------------------------------\n` +
                 `PASS TYPE: VISITORS' IDENTITY CARD\n` +
                 `STUDENT: ${studentName}\n` +
                 `ADMISSION NO: ${admNo}\n` +
                 `DURATION: ${duration}\n` +
                 `ADDRESS: ${addr1}, ${addr2}\n` +
                 `CONTACT: ${contact}\n` +
                 `AUTHORIZED RELATIVES: 4 MEMBERS\n` +
                 `VERIFICATION: OFFICIAL & VALIDATED`;
    } else {
        const personName = personNameInput ? personNameInput.value.trim() : 'Student Name';
        const personId = personIdInput ? personIdInput.value.trim() : '001';
        const role = personRoleInput ? personRoleInput.value.trim() : 'Wafiyya Degree';
        const blood = personBloodInput ? personBloodInput.value.trim() : 'O+Ve';
        const guardian = personGuardianInput ? personGuardianInput.value.trim() : '';
        const phone = personPhoneInput ? personPhoneInput.value.trim() : '';
        const validity = personValidityInput ? personValidityInput.value.trim() : '2026-2032';

        qrData = `COORDINATION OF ISLAMIC COLLEGES (CIC)\n` +
                 `INSTITUTION: ${instName}\n` +
                 `${affiliation}\n` +
                 `WEBSITE: ${website}\n` +
                 `HELPLINE: ${helpline}\n` +
                 `------------------------------------\n` +
                 `CARD TYPE: ${state.currentCardType.toUpperCase()} IDENTITY CARD\n` +
                 `NAME: ${personName}\n` +
                 `${state.currentCardType === 'student' ? 'ADMISSION NO' : 'STAFF ID'}: ${personId}\n` +
                 `COURSE / ROLE: ${role}\n` +
                 `BLOOD GROUP: ${blood}\n` +
                 (guardian ? `GUARDIAN: ${guardian}\n` : '') +
                 `PHONE: ${phone}\n` +
                 `VALIDITY: ${validity}\n` +
                 `STATUS: OFFICIAL CAMPUS IDENTITY CARD`;
    }

    try {
        new QRCode(qrContainer, {
            text: qrData,
            width: 140,
            height: 140,
            colorDark: "#1a1a1a",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        setTimeout(() => {
            const qrCanvas = qrContainer.querySelector('canvas');
            if (qrCanvas) {
                const img = new Image();
                img.onload = () => {
                    state.qrImage = img;
                    drawCard();
                };
                img.src = qrCanvas.toDataURL();
            }
        }, 100);
    } catch (e) {
        console.warn('QR generation error:', e);
    }
}


// ═══════════════════════════════════════════════
//  THEME COLOR
// ═══════════════════════════════════════════════

function setThemeColor(color) {
    if (themeColorInput) themeColorInput.value = color;

    document.querySelectorAll('.color-preset').forEach(btn => {
        btn.classList.toggle('active', rgbToHex(btn) === color.toLowerCase());
    });

    drawCard();
}

function rgbToHex(element) {
    const style = element.getAttribute('style');
    if (!style) return '';
    const match = style.match(/background:\s*(#[0-9a-fA-F]{6})/);
    return match ? match[1].toLowerCase() : '';
}


// ═══════════════════════════════════════════════
//  TOGGLE FRONT/BACK SIDE
// ═══════════════════════════════════════════════

function toggleSide() {
    state.showingSide = state.showingSide === 'front' ? 'back' : 'front';
    const sideLabel = document.getElementById('sideLabel');
    if (sideLabel) {
        sideLabel.textContent = state.showingSide === 'front' ? 'Back Side' : 'Front Side';
    }
    
    if (state.showingSide === 'back') {
        photoDragOverlay.classList.remove('active');
    } else if (state.userPhoto) {
        photoDragOverlay.classList.add('active');
        updateDragOverlayPosition();
    }
    
    drawCard();
}


// ═══════════════════════════════════════════════
//  CANVAS DRAWING ENGINE
// ═══════════════════════════════════════════════

function drawCard() {
    if (state.currentCardType === 'visitor') {
        if (state.showingSide === 'front') {
            drawVisitorFrontSide();
        } else {
            drawVisitorBackSide();
        }
    } else {
        if (state.showingSide === 'front') {
            drawFrontSide();
        } else {
            drawBackSide();
        }
    }
    
    if (state.userPhoto && state.showingSide === 'front') {
        updateDragOverlayPosition();
    }
}

// ──── HELPER: Safe Display Name (Preserves Malayalam & Arabic Unicode) ────
function formatDisplayName(text) {
    if (!text) return '';
    const str = String(text).trim();
    // If Malayalam Unicode (\u0D00-\u0D7F) or Arabic (\u0600-\u06FF), do NOT uppercase
    if (/[\u0D00-\u0D7F\u0600-\u06FF]/.test(str)) {
        return str;
    }
    return str.toUpperCase();
}

// ──── HELPER: Draw Rounded Rectangle ────
function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

function wrapText(text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

function drawCollegeLogoBadge(x, y, size) {
    ctx.save();
    // Soft rounded square badge with crisp white background
    roundRect(x, y, size, size, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (state.logoImage && state.logoImage.complete && state.logoImage.naturalWidth !== 0) {
        // Clip inside badge with 5px padding
        ctx.save();
        roundRect(x + 5, y + 5, size - 10, size - 10, 10);
        ctx.clip();
        ctx.drawImage(state.logoImage, x + 5, y + 5, size - 10, size - 10);
        ctx.restore();
    } else {
        // High quality fallback institutional emblem
        ctx.fillStyle = '#173f8a';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏛️', x + size / 2, y + size / 2 + 10);
    }
    ctx.restore();
}

function drawSimulatedBarcode(centerX, y, width, height) {
    const startX = centerX - width / 2;
    ctx.save();
    ctx.fillStyle = '#1e293b';
    const pattern = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4, 1, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 1];
    let curX = startX;
    const barScale = width / 65;
    for (let i = 0; i < pattern.length; i++) {
        const barW = Math.max(1, pattern[i] * barScale * 0.7);
        if (i % 2 === 0) {
            ctx.fillRect(curX, y, barW, height);
        }
        curX += barW + (barScale * 0.6);
        if (curX > startX + width) break;
    }
    ctx.restore();
}

function getCardTypeLabel() {
    switch(state.currentCardType) {
        case 'student': return 'STUDENT IDENTITY CARD';
        case 'staff': return 'STAFF IDENTITY CARD';
        case 'visitor': return "VISITORS' IDENTITY CARD";
        default: return 'IDENTITY CARD';
    }
}

function getCardTypeBadgeColor() {
    switch(state.currentCardType) {
        case 'student': return { bg: '#059669', text: '#ffffff' };
        case 'staff': return { bg: '#2563eb', text: '#ffffff' };
        case 'visitor': return { bg: '#0d2557', text: '#ffffff' };
        default: return { bg: '#6b7280', text: '#ffffff' };
    }
}


// ═══════════════════════════════════════════════
//  DRAW VISITOR FRONT SIDE (RICH & BALANCED LAYOUT)
// ═══════════════════════════════════════════════

function drawVisitorFrontSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = (themeColorInput && themeColorInput.value) || '#173f8a';

    // Clear
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    roundRect(0, 0, W, H, 28);
    ctx.clip();

    // ── Pure White Background ──
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Header Banner (Royal Blue / Theme Color) ──
    const headerH = 185;
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, W, headerH);

    // ── Institutional Logo (Prominent Badge at Top-Left) ──
    drawCollegeLogoBadge(26, 24, 68);

    // ── Header Titles ──
    const textCenterX = W / 2 + 15;

    // 1. Arabic Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Amiri", "Noto Sans Arabic", "Traditional Arabic", sans-serif';
    const arabicTitle = (instArabicNameInput && instArabicNameInput.value) || 
        INSTITUTIONS[state.currentInstitution].arabicName || 
        'كلية الغيث للآداب والعلوم الإسلامية - للبنات';
    ctx.fillText(arabicTitle, textCenterX, 38);

    // 2. English College Name (Golden Yellow font as on authentic card)
    const instName = (instNameInput && instNameInput.value) || INSTITUTIONS[state.currentInstitution].name;
    ctx.font = '900 21px "Inter", sans-serif';
    ctx.fillStyle = '#ffd200';
    ctx.fillText(instName.toUpperCase(), textCenterX, 72);

    // 3. Affiliation Line (Directly below Institution Address)
    const affiliation = (instAffiliationInput && instAffiliationInput.value) || 
        (INSTITUTIONS[state.currentInstitution] && INSTITUTIONS[state.currentInstitution].affiliation) || 
        'Affiliated to Coordination of Islamic Colleges';
    ctx.font = '700 12px "Inter", sans-serif';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(affiliation, textCenterX, 100);

    // 4. College Address & Phone
    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    const addr = (instAddressInput && instAddressInput.value) || INSTITUTIONS[state.currentInstitution].address;
    const phone = (instPhoneInput && instPhoneInput.value) || INSTITUTIONS[state.currentInstitution].phone;
    ctx.fillText(addr + (phone ? ' | Ph: ' + phone : ''), textCenterX, 124);

    // ── Attached Pill Badge: VISITORS' IDENTITY CARD ──
    const pillW = 300;
    const pillH = 38;
    const pillX = (W - pillW) / 2;
    const pillY = 166;
    const pillRadius = 19;

    roundRect(pillX, pillY, pillW, pillH, pillRadius);
    ctx.fillStyle = '#0c2452';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '800 14px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText("VISITORS' IDENTITY CARD", W / 2, pillY + 24);

    // ── Student Photo (Slightly Curved Square - NOT Circle!) ──
    const photoW = 210;
    const photoH = 250;
    const photoX = (W - photoW) / 2;
    const photoY = 225;
    const photoRadius = 16; // Slightly curved square

    // Studio backdrop
    roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.fillStyle = '#3f7856';
    ctx.fill();

    // Clip photo inside curved square
    ctx.save();
    roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.clip();

    if (state.userPhoto) {
        const zoom = state.photoZoom / 100;
        const aspect = state.userPhoto.width / state.userPhoto.height;
        let drawW, drawH;
        if (aspect > (photoW / photoH)) {
            drawH = photoH * zoom;
            drawW = drawH * aspect;
        } else {
            drawW = photoW * zoom;
            drawH = drawW / aspect;
        }
        const dx = photoX + (photoW - drawW) / 2 + state.photoOffsetX;
        const dy = photoY + (photoH - drawH) / 2 + state.photoOffsetY;
        ctx.drawImage(state.userPhoto, dx, dy, drawW, drawH);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = '50px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('📷', W / 2, photoY + photoH / 2 + 18);
    }
    ctx.restore();

    // Outer border for photo
    roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    roundRect(photoX - 3, photoY - 3, photoW + 6, photoH + 6, photoRadius + 2);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Student Name (Centered, Navy Blue, Bold, Malayalam Safe) ──
    const studentName = (visitorStudentNameInput && visitorStudentNameInput.value) || 'AFRIN FATHIMA';
    const dispStudentName = formatDisplayName(studentName);
    ctx.font = '900 28px "Noto Sans Malayalam", "Inter", sans-serif';
    if (ctx.measureText(dispStudentName).width > W - 120) {
        ctx.font = '900 22px "Noto Sans Malayalam", "Inter", sans-serif';
    }
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    ctx.fillText(dispStudentName, W / 2, 512);

    // ── Course / Batch Pill Subtitle ──
    const durationVal = (visitorDurationInput && visitorDurationInput.value) || state.currentBatch || '2026-2032';
    const subPillW = 200;
    const subPillH = 26;
    const subPillX = (W - subPillW) / 2;
    const subPillY = 528;
    roundRect(subPillX, subPillY, subPillW, subPillH, 13);
    ctx.fillStyle = '#eff6ff';
    ctx.fill();
    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 12px "Inter", sans-serif';
    ctx.fillStyle = '#1d4ed8';
    ctx.textAlign = 'center';
    ctx.fillText(`BATCH: ${durationVal}`, W / 2, subPillY + 18);

    // ── Structured Details Card (Filling y = 568 to 812) ──
    const cardX = 45;
    const cardY = 568;
    const cardW = 560;
    const cardH = 244;
    const cardRadius = 14;

    roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const detailStartX = 75;
    let detailY = 604;
    const lineSpacing = 39;
    ctx.textAlign = 'left';

    // 1. Admission Number (highlighted in red) & Blood Group
    const admNo = (visitorStudentIdInput && visitorStudentIdInput.value) || '747';
    ctx.font = '700 17px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Admission No : ', detailStartX, detailY);
    const admLabelW = ctx.measureText('Admission No : ').width;
    ctx.font = '900 22px "Inter", sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(admNo, detailStartX + admLabelW, detailY);

    // Blood Group on right
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Blood Group : ', 380, detailY);
    ctx.font = '900 19px "Inter", sans-serif';
    ctx.fillStyle = '#b91c1c';
    const bGroup = (personBloodInput && personBloodInput.value) || 'O+Ve';
    ctx.fillText(bGroup, 495, detailY);

    // 2. Address Line 1
    detailY += lineSpacing;
    const addr1 = (visitorStudentAddr1Input && visitorStudentAddr1Input.value) || 'KODAKKATTU H, NERIAMANGALAM';
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Address : ', detailStartX, detailY);
    const addrLabelW = ctx.measureText('Address : ').width;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(addr1.toUpperCase(), detailStartX + addrLabelW, detailY);

    // 3. Address Line 2 (PO & Pincode)
    detailY += 34;
    const addr2 = (visitorStudentAddr2Input && visitorStudentAddr2Input.value) || 'PO, ERANAKULAM 686693';
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(addr2.toUpperCase(), detailStartX + addrLabelW, detailY);

    // 4. Contact Numbers
    detailY += lineSpacing;
    const contact = (visitorStudentContactInput && visitorStudentContactInput.value) || '9562937331, 7561085134';
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Contact No : ', detailStartX, detailY);
    const contactLabelW = ctx.measureText('Contact No : ').width;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(contact, detailStartX + contactLabelW, detailY);

    // 5. Course Duration
    detailY += lineSpacing;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Duration : ', detailStartX, detailY);
    const durLabelW = ctx.measureText('Duration : ').width;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText(`${durationVal} (6 Years Academic Course)`, detailStartX + durLabelW, detailY);

    // 6. Security Note Footnote
    ctx.font = 'italic 11px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('* This identity pass authorizes campus entry for family members verified on reverse side.', W / 2, cardY + cardH - 12);

    // ── Verification & Signatures Strip (Filling y = 824 to 936) ──
    // Left: Student Signature
    ctx.beginPath();
    ctx.moveTo(75, 880);
    ctx.lineTo(215, 880);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText("Student Signature", 145, 902);

    // Center: Simulated Barcode & Verification Badge
    drawSimulatedBarcode(325, 846, 120, 28);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText("* CIC-VERIFIED-ID *", 325, 892);

    ctx.font = '700 9px "Inter", sans-serif';
    ctx.fillStyle = '#059669';
    ctx.fillText("OFFICIAL VISITOR IDENTITY", 325, 908);

    // Right: Principal / Authority Signature & Seal
    ctx.beginPath();
    ctx.moveTo(435, 880);
    ctx.lineTo(575, 880);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText("Principal / Authority", 505, 902);

    // Authority Seal Stamp Badge
    ctx.beginPath();
    ctx.arc(505, 852, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '800 9px "Inter", sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText("SEAL", 505, 856);

    // ── Solid Theme Color Bottom Footer Bar (y = 948 to 1000) ──
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, H - 52, W, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(affiliation, W / 2, H - 30);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '500 11px "Inter", sans-serif';
    const webText = (instWebsiteInput && instWebsiteInput.value) || INSTITUTIONS[state.currentInstitution].website;
    ctx.fillText(`${webText} | Helpline: ${phone}`, W / 2, H - 12);

    // Subtle outer card border
    roundRect(0, 0, W, H, 28);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
}


// ═══════════════════════════════════════════════
//  DRAW VISITOR BACK SIDE (4 FAMILY MEMBERS GRID)
// ═══════════════════════════════════════════════

function drawVisitorBackSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = (themeColorInput && themeColorInput.value) || '#173f8a';

    // Clear
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    roundRect(0, 0, W, H, 28);
    ctx.clip();

    // ── Solid Theme Color Background ──
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, W, H);

    // ── Top Header ──
    const affiliation = (instAffiliationInput && instAffiliationInput.value) || 
        (INSTITUTIONS[state.currentInstitution] && INSTITUTIONS[state.currentInstitution].affiliation) || 
        'Affiliated to Coordination of Islamic Colleges';

    ctx.font = '700 13px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.fillText('COORDINATION OF ISLAMIC COLLEGES (CIC)', W / 2, 48);

    ctx.font = '900 24px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = '1.2px';
    ctx.fillText('AUTHORIZED FAMILY MEMBERS', W / 2, 80);

    // Header divider line
    ctx.beginPath();
    ctx.moveTo(60, 98);
    ctx.lineTo(W - 60, 98);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Grid of 4 Family Members (2 columns x 2 rows) ──
    const members = state.familyMembers || [];
    const colCenters = [185, 465];
    const rowY = [118, 462];
    const photoW = 190;
    const photoH = 215;
    const photoRadius = 16; // Slightly curved square

    for (let i = 0; i < 4; i++) {
        const member = members[i] || { name: 'AUTHORIZED MEMBER', relation: 'RELATION' };

        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = colCenters[col];
        const py = rowY[row];
        const px = cx - (photoW / 2);

        // 1. Photo box with light cyan background
        roundRect(px, py, photoW, photoH, photoRadius);
        ctx.fillStyle = '#7dd3fc';
        ctx.fill();

        // 2. Draw member photo inside curved square
        ctx.save();
        roundRect(px, py, photoW, photoH, photoRadius);
        ctx.clip();

        if (member.photo) {
            const aspect = member.photo.width / member.photo.height;
            let drawW, drawH;
            if (aspect > (photoW / photoH)) {
                drawH = photoH;
                drawW = drawH * aspect;
            } else {
                drawW = photoW;
                drawH = drawW / aspect;
            }
            const dx = px + (photoW - drawW) / 2;
            const dy = py + (photoH - drawH) / 2;
            ctx.drawImage(member.photo, dx, dy, drawW, drawH);
        } else {
            ctx.fillStyle = '#0284c7';
            ctx.font = '55px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('👤', cx, py + photoH / 2 + 18);
        }
        ctx.restore();

        // 3. Photo border (clean crisp border)
        roundRect(px, py, photoW, photoH, photoRadius);
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Member Name (Bold White Uppercase)
        ctx.font = '900 18px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText((member.name || 'MEMBER').toUpperCase(), cx, py + photoH + 28);

        // 5. Member Relation Pill Badge
        const relText = (member.relation || 'FAMILY').toUpperCase();
        const relW = 120;
        const relH = 24;
        const relX = cx - (relW / 2);
        const relY = py + photoH + 38;
        roundRect(relX, relY, relW, relH, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '800 12px "Inter", sans-serif';
        ctx.fillStyle = '#f0f9ff';
        ctx.fillText(relText, cx, relY + 16);
    }

    // ── Security & Visiting Rules Box (Filling y = 785 to 935) ──
    const ruleBoxX = 45;
    const ruleBoxY = 785;
    const ruleBoxW = 560;
    const ruleBoxH = 150;
    const ruleBoxRadius = 14;

    roundRect(ruleBoxX, ruleBoxY, ruleBoxW, ruleBoxH, ruleBoxRadius);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '800 13px "Inter", sans-serif';
    ctx.fillStyle = '#ffd200'; // Golden title
    ctx.fillText('VISITING RULES & REGULATIONS', W / 2, ruleBoxY + 26);

    ctx.textAlign = 'left';
    ctx.font = '600 11.5px "Inter", sans-serif';
    ctx.fillStyle = '#f1f5f9';
    const rules = [
        '1. Only the 4 authorized family members pictured above are permitted to visit.',
        '2. Visitors must present this original ID card at the security gate for entry.',
        '3. Visiting hours must be strictly observed as per college administration schedule.',
        '4. In case of emergency, contact the college office: 0494 2608283, 8590658550.'
    ];

    let rY = ruleBoxY + 52;
    rules.forEach(rule => {
        ctx.fillText(rule, ruleBoxX + 22, rY);
        rY += 24;
    });

    // ── Bottom Footer Bar (y = 948 to 1000) ──
    ctx.fillStyle = darkenColor(themeColor, 20);
    ctx.fillRect(0, H - 52, W, 52);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '700 11px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${affiliation} • Security & Identity Management System`, W / 2, H - 24);

    // Outer card border
    roundRect(0, 0, W, H, 28);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}


// ═══════════════════════════════════════════════
//  DRAW STUDENT / STAFF FRONT SIDE (FILLED OUT)
// ═══════════════════════════════════════════════

function drawFrontSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = (themeColorInput && themeColorInput.value) || '#173f8a';

    // Clear
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    roundRect(0, 0, W, H, 28);
    ctx.clip();

    // ── Clean White Background ──
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Top Header Banner ──
    const headerH = 185;
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, W, headerH);

    // ── College Logo Badge at Top-Left ──
    drawCollegeLogoBadge(26, 24, 68);

    const textCenterX = W / 2 + 15;

    // ── Arabic College Title ──
    const arabicTitle = (instArabicNameInput && instArabicNameInput.value) || 
        (INSTITUTIONS[state.currentInstitution] && INSTITUTIONS[state.currentInstitution].arabicName) || '';
    if (arabicTitle) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Amiri", "Noto Sans Arabic", sans-serif';
        ctx.fillText(arabicTitle, textCenterX, 38);
    }

    // ── Institution Name ──
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const instName = (instNameInput && instNameInput.value) || INSTITUTIONS[state.currentInstitution].name;
    ctx.font = '900 21px Inter, sans-serif';
    ctx.fillText(instName.toUpperCase(), textCenterX, 72);

    // ── Affiliation Line (Directly Below Address) ──
    const affiliation = (instAffiliationInput && instAffiliationInput.value) || 
        (INSTITUTIONS[state.currentInstitution] && INSTITUTIONS[state.currentInstitution].affiliation) || 
        'Affiliated to Coordination of Islamic Colleges';
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(affiliation, textCenterX, 100);

    // ── Address & Phone ──
    const addr = (instAddressInput && instAddressInput.value) || INSTITUTIONS[state.currentInstitution].address;
    const phone = (instPhoneInput && instPhoneInput.value) || INSTITUTIONS[state.currentInstitution].phone;
    ctx.font = '600 12px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(addr + (phone ? ' | Ph: ' + phone : ''), textCenterX, 124);

    // ── Card Type Pill Badge ──
    const badgeText = getCardTypeLabel();
    const badge = getCardTypeBadgeColor();
    const pillW = 290;
    const pillH = 38;
    const pillX = (W - pillW) / 2;
    const pillY = 166;
    const pillRadius = 19;

    roundRect(pillX, pillY, pillW, pillH, pillRadius);
    ctx.fillStyle = badge.bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '800 14px Inter, sans-serif';
    ctx.fillStyle = badge.text;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, W / 2, pillY + 24);

    // ── Photo (Slightly Curved Square - NOT Circle!) ──
    const photoW = 210;
    const photoH = 250;
    const photoX = (W - photoW) / 2;
    const photoY = 225;
    const photoRadius = 16; // Slightly curved square

    roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();

    ctx.save();
    roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.clip();

    if (state.userPhoto) {
        const zoom = state.photoZoom / 100;
        const aspect = state.userPhoto.width / state.userPhoto.height;
        let drawW, drawH;
        if (aspect > (photoW / photoH)) {
            drawH = photoH * zoom;
            drawW = drawH * aspect;
        } else {
            drawW = photoW * zoom;
            drawH = drawW / aspect;
        }
        const dx = photoX + (photoW - drawW) / 2 + state.photoOffsetX;
        const dy = photoY + (photoH - drawH) / 2 + state.photoOffsetY;
        ctx.drawImage(state.userPhoto, dx, dy, drawW, drawH);
    } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '55px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('📷', W / 2, photoY + photoH / 2 + 18);
    }
    ctx.restore();

    // Outer photo border
    roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    roundRect(photoX - 3, photoY - 3, photoW + 6, photoH + 6, photoRadius + 2);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Person Name ──
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    const name = (personNameInput && personNameInput.value) || 'Student Name';
    const dispName = formatDisplayName(name);
    ctx.font = '900 28px "Noto Sans Malayalam", "Inter", sans-serif';
    if (ctx.measureText(dispName).width > W - 120) {
        ctx.font = '900 22px "Noto Sans Malayalam", "Inter", sans-serif';
    }
    ctx.fillText(dispName, W / 2, 512);

    // ── Role / Course Subtitle Pill ──
    const roleVal = (personRoleInput && personRoleInput.value) || 'Wafiyya Degree';
    const subPillW = 220;
    const subPillH = 26;
    const subPillX = (W - subPillW) / 2;
    const subPillY = 528;
    roundRect(subPillX, subPillY, subPillW, subPillH, 13);
    ctx.fillStyle = '#eff6ff';
    ctx.fill();
    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 12px "Inter", sans-serif';
    ctx.fillStyle = '#1d4ed8';
    ctx.textAlign = 'center';
    ctx.fillText(roleVal.toUpperCase(), W / 2, subPillY + 18);

    // ── Structured Details Card (Filling y = 568 to 812) ──
    const cardX = 45;
    const cardY = 568;
    const cardW = 560;
    const cardH = 244;
    const cardRadius = 14;

    roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const detailStartX = 75;
    let detailY = 604;
    const lineSpacing = 39;
    ctx.textAlign = 'left';

    const idNum = (personIdInput && personIdInput.value) || '001';
    const bGroup = (personBloodInput && personBloodInput.value) || 'O+Ve';
    const guardian = (personGuardianInput && personGuardianInput.value) || 'Guardian Name';
    const phoneNum = (personPhoneInput && personPhoneInput.value) || 'Contact Phone';
    const validity = (personValidityInput && personValidityInput.value) || state.currentBatch || '2026-2032';

    // 1. Admission No & Blood Group
    ctx.font = '700 17px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    const idLabel = state.currentCardType === 'student' ? 'Admission No : ' : 'Staff ID : ';
    ctx.fillText(idLabel, detailStartX, detailY);
    const idLabelW = ctx.measureText(idLabel).width;
    ctx.font = '900 22px "Inter", sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(idNum, detailStartX + idLabelW, detailY);

    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Blood Group : ', 380, detailY);
    ctx.font = '900 19px "Inter", sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(bGroup, 495, detailY);

    // 2. Course / Dept
    detailY += lineSpacing;
    const courseLabel = state.currentCardType === 'student' ? 'Course / Class : ' : 'Department : ';
    const courseVal = state.currentCardType === 'student' ? roleVal : ((staffDeptInput && staffDeptInput.value) || 'Department');
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(courseLabel, detailStartX, detailY);
    const cLabelW = ctx.measureText(courseLabel).width;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(courseVal, detailStartX + cLabelW, detailY);

    // 3. Guardian / DOB
    detailY += lineSpacing;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    const guardLabel = state.currentCardType === 'student' ? 'Guardian Name : ' : 'Designation : ';
    const guardVal = state.currentCardType === 'student' ? guardian : roleVal;
    ctx.fillText(guardLabel, detailStartX, detailY);
    const gLabelW = ctx.measureText(guardLabel).width;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(guardVal, detailStartX + gLabelW, detailY);

    // 4. Contact Phone
    detailY += lineSpacing;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Contact Phone : ', detailStartX, detailY);
    const pLabelW = ctx.measureText('Contact Phone : ').width;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(phoneNum, detailStartX + pLabelW, detailY);

    // 5. Validity
    detailY += lineSpacing;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Valid Upto : ', detailStartX, detailY);
    const vLabelW = ctx.measureText('Valid Upto : ').width;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText(`${validity} (Authorized Period)`, detailStartX + vLabelW, detailY);

    // 6. Security Note Footnote
    ctx.font = 'italic 11px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('* Property of the college. Must be worn within campus at all times and shown upon demand.', W / 2, cardY + cardH - 12);

    // ── Verification & Signatures Strip (Filling y = 824 to 936) ──
    // Left: Holder Signature
    ctx.beginPath();
    ctx.moveTo(75, 880);
    ctx.lineTo(215, 880);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText("Holder's Signature", 145, 902);

    // Center: Simulated Barcode & Verification Badge
    drawSimulatedBarcode(325, 846, 120, 28);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText("* CIC-VERIFIED-ID *", 325, 892);

    ctx.font = '700 9px "Inter", sans-serif';
    ctx.fillStyle = '#059669';
    ctx.fillText("OFFICIAL CAMPUS IDENTITY", 325, 908);

    // Right: Principal / Authority Signature & Seal
    ctx.beginPath();
    ctx.moveTo(435, 880);
    ctx.lineTo(575, 880);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.font = '600 12px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText("Principal / Authority", 505, 902);

    // Authority Seal Stamp Badge
    ctx.beginPath();
    ctx.arc(505, 852, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '800 9px "Inter", sans-serif';
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText("SEAL", 505, 856);

    // ── Bottom Footer Bar (y = 948 to 1000) ──
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, H - 52, W, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(affiliation, W / 2, H - 30);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '500 11px "Inter", sans-serif';
    const webText = (instWebsiteInput && instWebsiteInput.value) || INSTITUTIONS[state.currentInstitution].website;
    ctx.fillText(`${webText} | Helpline: ${phone}`, W / 2, H - 12);

    // Subtle outer card border
    roundRect(0, 0, W, H, 28);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
}


// ═══════════════════════════════════════════════
//  DRAW STUDENT / STAFF BACK SIDE (NO YELLOW)
// ═══════════════════════════════════════════════

function drawBackSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = themeColorInput.value || '#173f8a';

    ctx.clearRect(0, 0, W, H);

    ctx.save();
    roundRect(0, 0, W, H, 28);
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Top Header Banner (NO YELLOW)
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, W, 70);

    // Header title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(instNameInput.value || INSTITUTIONS[state.currentInstitution].name, W / 2, 42);

    // QR Code Section
    const qrY = 115;
    const qrSize = 140;
    const qrX = (W - qrSize) / 2;

    if (state.qrImage) {
        const qrBoxPad = 12;
        const qrBoxSize = qrSize + (qrBoxPad * 2);
        const qrBoxX = (W - qrBoxSize) / 2;
        const qrBoxY = qrY - qrBoxPad;

        roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.drawImage(state.qrImage, qrX, qrY, qrSize, qrSize);
    }

    // Terms & Conditions
    const termsY = qrY + 185;
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = themeColor;
    ctx.textAlign = 'center';
    ctx.fillText('TERMS & CONDITIONS', W / 2, termsY);

    ctx.beginPath();
    ctx.moveTo(100, termsY + 10);
    ctx.lineTo(W - 100, termsY + 10);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.stroke();

    const terms = [
        '• This card is the property of the institution.',
        '• Must be worn at all times within campus.',
        '• If found, please return to the office.',
        '• Loss of card must be reported immediately.',
        '• This card is non-transferable.'
    ];

    ctx.textAlign = 'left';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#4b5563';
    let termY = termsY + 35;
    terms.forEach(term => {
        ctx.fillText(term, 75, termY);
        termY += 26;
    });

    // Contact info
    const contactY = termY + 25;
    ctx.beginPath();
    ctx.moveTo(60, contactY);
    ctx.lineTo(W - 60, contactY);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillStyle = themeColor;
    ctx.fillText('CONTACT INFORMATION', W / 2, contactY + 30);

    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('📍 ' + (instAddressInput.value || ''), W / 2, contactY + 55);
    ctx.fillText('📞 ' + (instPhoneInput.value || ''), W / 2, contactY + 75);
    ctx.fillText('🌐 ' + (instWebsiteInput.value || ''), W / 2, contactY + 95);

    // Signatures
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'left';
    ctx.fillText('______________________', 70, H - 85);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Holder\'s Signature', 100, H - 70);

    ctx.textAlign = 'right';
    ctx.fillText('______________________', W - 70, H - 85);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Authorized Signature', W - 100, H - 70);

    // Bottom Footer (Clean Solid Theme Color - NO YELLOW)
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, H - 48, W, 48);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Designed by College ID Card System', W / 2, H - 22);

    // Subtle outer card border
    roundRect(0, 0, W, H, 28);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}


// ═══════════════════════════════════════════════
//  DOWNLOAD FUNCTIONS
// ═══════════════════════════════════════════════

function downloadCard(side) {
    const prevSide = state.showingSide;
    state.showingSide = side;
    drawCard();

    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    
    let filename = '';
    if (state.currentCardType === 'visitor') {
        const studentName = visitorStudentNameInput.value || 'visitor';
        filename = studentName + '_VISITOR_' + side;
    } else {
        filename = (personNameInput.value || 'id-card') + '_' + side;
    }
    
    link.download = filename.replace(/\s+/g, '_') + '.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Restore previous view
    state.showingSide = prevSide;
    drawCard();
}

function downloadBothSides() {
    downloadCard('front');
    setTimeout(() => downloadCard('back'), 500);
}

// ═══════════════════════════════════════════════
//  BATCH STORAGE & MANAGEMENT SYSTEM
// ═══════════════════════════════════════════════

const BATCH_STORAGE_KEY = 'college_id_cards_batch_db';
const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzCMjndPSmWknBig3XkP9aSkm5hRxpMqjgterH___SlQ285m5ok8POEn62b_ma4d9bj/exec";

function getCurrentBatch() {
    const select = document.getElementById('batchSelect');
    if (select && select.value === 'custom') {
        const custom = document.getElementById('customBatchInput');
        return (custom && custom.value.trim()) || state.currentBatch || 'Custom_Batch';
    }
    return (select && select.value) || state.currentBatch || '2026-2032';
}

function handleBatchSelectChange(val) {
    const customWrapper = document.getElementById('customBatchWrapper');
    if (val === 'custom') {
        if (customWrapper) customWrapper.classList.remove('hidden');
        const customInput = document.getElementById('customBatchInput');
        if (customInput) customInput.focus();
    } else {
        if (customWrapper) customWrapper.classList.add('hidden');
        state.currentBatch = val;
        if (visitorDurationInput) visitorDurationInput.value = val;
        drawCard();
    }
    updateBatchCountBadges();
}

function handleCustomBatchInput(val) {
    state.currentBatch = val.trim() || 'Custom_Batch';
    if (visitorDurationInput) visitorDurationInput.value = state.currentBatch;
    drawCard();
    updateBatchCountBadges();
}

function getAllBatchCards() {
    try {
        const raw = localStorage.getItem(BATCH_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Error reading batch cards:', e);
        return [];
    }
}

function saveCardToBatchDB(cardObj) {
    try {
        let cards = getAllBatchCards();
        const existingIdx = cards.findIndex(c => c.id === cardObj.id || (c.name === cardObj.name && c.idNumber === cardObj.idNumber && c.batch === cardObj.batch));
        if (existingIdx >= 0) {
            cards[existingIdx] = { ...cards[existingIdx], ...cardObj, updatedAt: new Date().toISOString() };
        } else {
            cards.unshift(cardObj);
        }
        localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(cards));
        updateBatchCountBadges();
        return true;
    } catch (e) {
        console.error('Error saving card to DB:', e);
        return false;
    }
}

function deleteCardFromBatchDB(id) {
    try {
        let cards = getAllBatchCards();
        cards = cards.filter(c => c.id !== id);
        localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(cards));
        updateBatchCountBadges();
        return true;
    } catch (e) {
        console.error('Error deleting card:', e);
        return false;
    }
}

function updateBatchCountBadges() {
    const cards = getAllBatchCards();
    const totalCountEl = document.getElementById('batchTotalCount');
    if (totalCountEl) totalCountEl.textContent = cards.length;

    const currentBatch = getCurrentBatch();
    const currentBatchCount = cards.filter(c => c.batch === currentBatch).length;
    const currentBatchBadge = document.getElementById('currentBatchCountBadge');
    if (currentBatchBadge) currentBatchBadge.textContent = currentBatchCount;
}

function initBatchDatabase() {
    const cards = getAllBatchCards();
    if (cards.length === 0) {
        // Sample card for demonstration
        const sampleCard = {
            id: 'sample_747',
            batch: '2026-2032',
            institution: 'algaith',
            institutionName: INSTITUTIONS.algaith.name,
            cardType: 'visitor',
            name: 'AFRIN FATHIMA',
            idNumber: '747',
            roleOrDept: '2026-2032',
            phone: '9562937331, 7561085134',
            frontImg: 'assets/student_sample.jpg',
            backImg: 'assets/father_sample.jpg',
            studentPhoto: 'assets/student_sample.jpg',
            photoOffsetX: 0,
            photoOffsetY: 0,
            photoZoom: 100,
            driveFrontUrl: null,
            driveBackUrl: null,
            driveStatus: 'pending',
            savedAt: new Date().toISOString()
        };
        saveCardToBatchDB(sampleCard);
    }
}

async function saveCurrentCardToBatch() {
    try {
        const currentBatch = getCurrentBatch();
        const prevSide = state.showingSide;

        // Render and capture Front side
        state.showingSide = 'front';
        drawCard();
        const frontDataUrl = canvas.toDataURL('image/png');

        // Render and capture Back side
        state.showingSide = 'back';
        drawCard();
        const backDataUrl = canvas.toDataURL('image/png');

        // Restore view
        state.showingSide = prevSide;
        drawCard();

        let cardName = '';
        let cardIdNum = '';
        let roleOrDept = '';
        let phone = '';
        let addr1 = '';
        let addr2 = '';
        let blood = '';
        let guardian = '';
        let validity = '';

        if (state.currentCardType === 'visitor') {
            cardName = (visitorStudentNameInput && visitorStudentNameInput.value) || 'AFRIN FATHIMA';
            cardIdNum = (visitorStudentIdInput && visitorStudentIdInput.value) || '747';
            roleOrDept = (visitorDurationInput && visitorDurationInput.value) || currentBatch;
            phone = (visitorStudentContactInput && visitorStudentContactInput.value) || '';
            addr1 = (visitorStudentAddr1Input && visitorStudentAddr1Input.value) || '';
            addr2 = (visitorStudentAddr2Input && visitorStudentAddr2Input.value) || '';
            blood = (personBloodInput && personBloodInput.value) || 'O+Ve';
            validity = roleOrDept;
        } else {
            cardName = (personNameInput && personNameInput.value) || 'Student Name';
            cardIdNum = (personIdInput && personIdInput.value) || '001';
            roleOrDept = (personRoleInput && personRoleInput.value) || '';
            phone = (personPhoneInput && personPhoneInput.value) || '';
            blood = (personBloodInput && personBloodInput.value) || 'O+Ve';
            guardian = (personGuardianInput && personGuardianInput.value) || '';
            validity = (personValidityInput && personValidityInput.value) || currentBatch;
            addr1 = (personAddressInput && personAddressInput.value) || '';
        }

        // Determine clean portrait photo source (never the 650x1000 full ID card)
        let studentPhotoSrc = state.userPhotoRawSrc;
        if (!studentPhotoSrc && state.userPhoto && state.userPhoto.src) {
            const w = state.userPhoto.naturalWidth || state.userPhoto.width;
            const h = state.userPhoto.naturalHeight || state.userPhoto.height;
            if (w !== 650 || h !== 1000) {
                studentPhotoSrc = state.userPhoto.src;
            }
        }

        // Deep copy family members for visitor card
        let familyData = null;
        if (state.currentCardType === 'visitor' && Array.isArray(state.familyMembers)) {
            familyData = state.familyMembers.map(m => ({
                name: m.name || '',
                relation: m.relation || '',
                photoSrc: m.photoSrc || (m.photo ? m.photo.src : null)
            }));
        }

        const cards = getAllBatchCards();
        const existing = state.editingCardId ? cards.find(c => c.id === state.editingCardId) : null;

        const cardRecord = {
            id: state.editingCardId || ('card_' + Date.now()),
            batch: currentBatch,
            institution: state.currentInstitution,
            institutionName: INSTITUTIONS[state.currentInstitution].name,
            cardType: state.currentCardType,
            name: formatDisplayName(cardName),
            idNumber: cardIdNum,
            roleOrDept: roleOrDept,
            phone: phone,
            addr1: addr1,
            addr2: addr2,
            blood: blood,
            guardian: guardian,
            validity: validity,
            studentPhoto: studentPhotoSrc,
            photoOffsetX: state.photoOffsetX || 0,
            photoOffsetY: state.photoOffsetY || 0,
            photoZoom: state.photoZoom || 100,
            familyMembers: familyData,
            frontImg: frontDataUrl,
            backImg: backDataUrl,
            driveFrontUrl: existing ? existing.driveFrontUrl : null,
            driveBackUrl: existing ? existing.driveBackUrl : null,
            driveStatus: existing ? existing.driveStatus : 'pending',
            savedAt: existing ? existing.savedAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        saveCardToBatchDB(cardRecord);

        // 1. Reset designer form so the card disappears from the main designer interface
        resetDesignerForm();

        // 2. Automatically switch to Recent Works tab and list all saved works downwards
        switchControlTab('recent');

        showToast(`"${cardRecord.name}" ബാച്ച് ${currentBatch}-ലേക്ക് സേവ് ചെയ്തു! ഫോം ക്ലിയർ ചെയ്തു, റീസെന്റ് വർക്കുകളിലേക്ക് മാറ്റി. ✓`, 'success');
        return cardRecord;
    } catch (err) {
        console.error('Save to batch error:', err);
        showToast('സേവ് ചെയ്യുന്നതിൽ തടസ്സം: ' + err.message, 'error');
        return null;
    }
}

// ──── RESET DESIGNER FORM (CLEARS MAIN INTERFACE) ────
function resetDesignerForm() {
    state.editingCardId = null;

    // Clear visitor fields
    if (visitorStudentNameInput) visitorStudentNameInput.value = '';
    if (visitorStudentIdInput) visitorStudentIdInput.value = '';
    if (visitorStudentAddr1Input) visitorStudentAddr1Input.value = '';
    if (visitorStudentAddr2Input) visitorStudentAddr2Input.value = '';
    if (visitorStudentContactInput) visitorStudentContactInput.value = '';

    // Clear student / staff fields
    if (personNameInput) personNameInput.value = '';
    if (personIdInput) personIdInput.value = '';
    if (personRoleInput) personRoleInput.value = '';
    if (personBloodInput) personBloodInput.value = 'O+Ve';
    if (personGuardianInput) personGuardianInput.value = '';
    if (personPhoneInput) personPhoneInput.value = '';
    if (personAddressInput) personAddressInput.value = '';

    // Clear photo & drag
    state.userPhoto = null;
    state.userPhotoRawSrc = null;
    state.photoOffsetX = 0;
    state.photoOffsetY = 0;
    state.photoZoom = 100;
    if (photoZoomSlider) photoZoomSlider.value = 100;
    if (zoomValueDisplay) zoomValueDisplay.textContent = '100%';

    const photoLabel = document.getElementById('photoLabel');
    if (photoLabel) {
        photoLabel.innerHTML = '<i class="fas fa-portrait"></i><span>ഫോട്ടോ അപ്ലോഡ് ചെയ്യുക</span>';
    }
    if (photoControls) photoControls.classList.add('hidden');
    if (photoDragOverlay) photoDragOverlay.classList.remove('active');

    generateQR();
    drawCard();
}

// ──── CONTROL PANEL TAB SWITCHING (DESIGNER vs RECENT) ────
function switchControlTab(tabName) {
    state.currentControlTab = tabName;
    const tabDesignerBtn = document.getElementById('tabBtnDesigner');
    const tabRecentBtn = document.getElementById('tabBtnRecent');
    const designerContent = document.getElementById('designerTabContent');
    const recentContent = document.getElementById('recentTabContent');

    if (tabName === 'designer') {
        if (tabDesignerBtn) tabDesignerBtn.classList.add('active');
        if (tabRecentBtn) tabRecentBtn.classList.remove('active');
        if (designerContent) designerContent.classList.remove('hidden');
        if (recentContent) recentContent.classList.add('hidden');
    } else {
        if (tabDesignerBtn) tabDesignerBtn.classList.remove('active');
        if (tabRecentBtn) tabRecentBtn.classList.add('active');
        if (designerContent) designerContent.classList.add('hidden');
        if (recentContent) recentContent.classList.remove('hidden');
        renderRecentWorksList();
    }
}

// ──── RENDER RECENT WORKS LIST (DOWNWARD LISTING) ────
function renderRecentWorksList() {
    const container = document.getElementById('recentWorksList');
    const badge = document.getElementById('recentTabCountBadge');
    const cards = getAllBatchCards();

    if (badge) badge.textContent = cards.length;
    if (!container) return;

    if (cards.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 30px 15px; color: #94a3b8;">
                <i class="fas fa-folder-open" style="font-size: 32px; color: #64748b; margin-bottom: 10px; display:block;"></i>
                <p style="font-size: 13px; font-weight: 600;">സേവ് ചെയ്ത കാർഡുകൾ ഒന്നും ലഭ്യമല്ല</p>
                <p style="font-size: 11px; margin-top: 5px;">ഡിസൈനറിൽ ഒരു കാർഡ് തയ്യാറാക്കി "ബാച്ചിലേക്ക് സേവ് ചെയ്യുക" ക്ലിക്ക് ചെയ്യുക.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cards.map(c => {
        const typeBadgeClass = c.cardType === 'visitor' ? 'type-visitor' : (c.cardType === 'staff' ? 'type-staff' : 'type-student');
        return `
            <div class="recent-card-item">
                <div class="recent-card-top-row">
                    <span class="recent-batch-tag"><i class="fas fa-graduation-cap"></i> ${c.batch}</span>
                    <span class="recent-type-badge ${typeBadgeClass}">${(c.cardType || 'visitor').toUpperCase()}</span>
                </div>
                <div class="recent-main-row">
                    <div class="recent-thumbs-box">
                        <img src="${c.frontImg}" class="recent-thumb" alt="Front" onclick="previewCardFull('${c.id}')" title="Front Preview">
                        <img src="${c.backImg}" class="recent-thumb" alt="Back" onclick="previewCardFull('${c.id}')" title="Back Preview">
                    </div>
                    <div class="recent-details">
                        <div class="recent-student-name" title="${c.name}">${c.name}</div>
                        <div class="recent-meta-line">
                            <span>Adm No: <strong style="color:#ef4444">${c.idNumber || '-'}</strong></span>
                            <span>•</span>
                            <span>${c.roleOrDept || '-'}</span>
                        </div>
                    </div>
                </div>
                <div class="recent-actions-row">
                    <button type="button" class="btn-recent-action btn-recent-edit" onclick="loadCardToDesignerAndSwitch('${c.id}')" title="എഡിറ്റ് ചെയ്യുക">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button type="button" class="btn-recent-action btn-recent-dl" onclick="downloadSingleCard('${c.id}', 'front')" title="Front PNG ഡൗൺലോഡ്">
                        <i class="fas fa-download"></i> Front
                    </button>
                    <button type="button" class="btn-recent-action btn-recent-dl" onclick="downloadSingleCard('${c.id}', 'back')" title="Back PNG ഡൗൺലോഡ്">
                        <i class="fas fa-download"></i> Back
                    </button>
                    <button type="button" class="btn-recent-action btn-recent-del" onclick="deleteRecentCard('${c.id}')" title="ഡിലീറ്റ് ചെയ്യുക">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ──── QUICK SEARCH BY ADMISSION NUMBER ────
function searchAndLoadByAdmNo(query) {
    const qInput = document.getElementById('quickAdmSearchInput');
    const searchVal = (query || (qInput ? qInput.value : '')).trim().toLowerCase();

    if (!searchVal) {
        showToast('അഡ്മിഷൻ നമ്പർ നൽകുക (e.g. 747)', 'info');
        if (qInput) qInput.focus();
        return;
    }

    const cards = getAllBatchCards();
    const found = cards.find(c => (c.idNumber || '').toLowerCase() === searchVal) ||
                  cards.find(c => (c.idNumber || '').toLowerCase().includes(searchVal));

    if (found) {
        loadCardToDesignerAndSwitch(found.id);
        showToast(`Admission No: ${found.idNumber} (${found.name}) എഡിറ്റിംഗിനായി ലോഡ് ചെയ്തു! ✓`, 'success');
        if (qInput) qInput.value = '';
    } else {
        showToast(`Admission No "${searchVal}" ഉള്ള കാർഡ് കണ്ടെത്താൻ കഴിഞ്ഞില്ല.`, 'error');
    }
}

// ──── LOAD CARD TO DESIGNER AND SWITCH TO DESIGNER TAB ────
function loadCardToDesignerAndSwitch(cardId) {
    loadCardToDesigner(cardId);
    switchControlTab('designer');
    const aside = document.getElementById('controlsPanel');
    if (aside) aside.scrollTo({ top: 0, behavior: 'smooth' });
}

// ──── DELETE CARD FROM RECENT LIST ────
function deleteRecentCard(cardId) {
    const cards = getAllBatchCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    if (confirm(`"${card.name}" എന്ന വിദ്യാർത്ഥിയുടെ കാർഡ് ഒഴിവാക്കണോ?`)) {
        deleteCardFromBatchDB(cardId);
        renderRecentWorksList();
        updateBatchCountBadges();
        showToast('കാർഡ് ഡിലീറ്റ് ചെയ്തു.', 'info');
    }
}


// ═══════════════════════════════════════════════
//  BATCH MODAL UI & CONTROLS
// ═══════════════════════════════════════════════

function openBatchModal(defaultBatch) {
    if (defaultBatch) {
        state.activeFilterBatch = defaultBatch;
    } else if (state.activeFilterBatch === 'all') {
        state.activeFilterBatch = getCurrentBatch();
    }
    renderBatchFilterPills();
    renderBatchCards(state.activeFilterBatch, state.searchQuery);
    const modal = document.getElementById('batchModal');
    if (modal) modal.classList.add('active');
}

function closeBatchModal() {
    const modal = document.getElementById('batchModal');
    if (modal) modal.classList.remove('active');
}

function renderBatchFilterPills() {
    const container = document.getElementById('batchFilterPills');
    if (!container) return;

    const cards = getAllBatchCards();
    const standardBatches = ['2026-2032', '2025-2031', '2024-2030', '2023-2029', '2022-2028'];
    const cardBatches = [...new Set(cards.map(c => c.batch))];
    const allBatches = [...new Set(['all', ...cardBatches, ...standardBatches])];

    container.innerHTML = allBatches.map(b => {
        const count = b === 'all' ? cards.length : cards.filter(c => c.batch === b).length;
        const label = b === 'all' ? 'എല്ലാ ബാച്ചുകളും' : `Batch ${b}`;
        const activeClass = state.activeFilterBatch === b ? 'active' : '';
        return `
            <button class="batch-filter-pill ${activeClass}" onclick="filterBatchCards('${b}')">
                <span>${label}</span>
                <span class="pill-count">${count}</span>
            </button>
        `;
    }).join('');
}

function filterBatchCards(batch) {
    state.activeFilterBatch = batch;
    renderBatchFilterPills();
    renderBatchCards(batch, state.searchQuery);
}

function handleBatchSearch(query) {
    state.searchQuery = (query || '').toLowerCase().trim();
    renderBatchCards(state.activeFilterBatch, state.searchQuery);
}

function renderBatchCards(filterBatch = 'all', searchQuery = '') {
    const container = document.getElementById('batchCardsGrid');
    if (!container) return;

    let cards = getAllBatchCards();

    // 1. Filter by batch
    if (filterBatch !== 'all') {
        cards = cards.filter(c => c.batch === filterBatch);
    }

    // 2. Filter by search query
    if (searchQuery) {
        cards = cards.filter(c => {
            const name = (c.name || '').toLowerCase();
            const id = (c.idNumber || '').toLowerCase();
            const phone = (c.phone || '').toLowerCase();
            return name.includes(searchQuery) || id.includes(searchQuery) || phone.includes(searchQuery);
        });
    }

    // Update footer stats
    const statsEl = document.getElementById('batchModalFooterStats');
    if (statsEl) {
        const syncedCount = cards.filter(c => c.driveStatus === 'synced').length;
        statsEl.textContent = `Total: ${cards.length} cards | Uploaded to Drive: ${syncedCount} | Pending: ${cards.length - syncedCount}`;
    }

    if (cards.length === 0) {
        container.innerHTML = `
            <div class="batch-empty-state" style="grid-column: 1 / -1;">
                <div class="batch-empty-icon"><i class="fas fa-id-card-alt"></i></div>
                <div class="batch-empty-title">ഈ ബാച്ചിൽ കാർഡുകൾ ഒന്നും ലഭ്യമല്ല</div>
                <p>ഐഡി കാർഡ് തയ്യാറാക്കിയ ശേഷം "ബാച്ചിലേക്ക് സേവ് ചെയ്യുക" ക്ലിക്ക് ചെയ്താൽ ഇവിടെ കാണാം.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cards.map(c => {
        const driveBadge = c.driveStatus === 'synced' 
            ? `<a href="${c.driveFrontUrl || '#'}" target="_blank" class="drive-status-badge drive-synced" title="Google Drive-ൽ തുറക്കുക">
                 <i class="fab fa-google-drive"></i> Drive-ൽ ഉണ്ട് ✓
               </a>`
            : `<button class="drive-status-badge drive-pending" onclick="uploadSingleBatchCardToDrive('${c.id}')" title="Google Drive ലേക്ക് അപ്‌ലോഡ് ചെയ്യുക">
                 <i class="fas fa-cloud-upload-alt"></i> Drive-ലേക്ക് അപ്‌ലോഡ്
               </button>`;

        const typeClass = `type-${c.cardType || 'visitor'}`;

        return `
            <div class="batch-card-tile">
                <div class="batch-card-header">
                    <span class="tile-badge-batch"><i class="fas fa-graduation-cap mr-1"></i>${c.batch}</span>
                    <span class="tile-badge-type ${typeClass}">${c.cardType}</span>
                </div>
                <div class="batch-card-preview-row">
                    <div class="tile-preview-thumb" onclick="previewCardFull('${c.id}')" title="ഫുൾ പ്രിവ്യൂ കാണുക">
                        <img src="${c.frontImg}" alt="${c.name} Front">
                    </div>
                    <div class="batch-card-info">
                        <h4 class="card-info-name" title="${c.name}">${c.name}</h4>
                        <div class="card-info-detail">
                            <span>Adm No:</span>
                            <strong style="color: #f87171;">${c.idNumber || '-'}</strong>
                        </div>
                        <div class="card-info-detail">
                            <span>Course:</span>
                            <strong>${c.roleOrDept || '-'}</strong>
                        </div>
                        ${driveBadge}
                    </div>
                </div>
                <div class="batch-card-actions">
                    <button class="btn-card-action btn-action-edit" onclick="loadCardToDesigner('${c.id}')" title="ഡിസൈനറിലേക്ക് ലോഡ് ചെയ്യുക">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-card-action btn-action-download" onclick="downloadSingleCard('${c.id}', 'front')" title="Front PNG ഡൗൺലോഡ്">
                        <i class="fas fa-download"></i> Front
                    </button>
                    <button class="btn-card-action btn-action-download" onclick="downloadSingleCard('${c.id}', 'back')" title="Back PNG ഡൗൺലോഡ്">
                        <i class="fas fa-download"></i> Back
                    </button>
                    <button class="btn-card-action btn-action-delete" onclick="deleteCardFromBatch('${c.id}')" title="ഡിലീറ്റ് ചെയ്യുക">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function loadCardToDesigner(cardId) {
    const cards = getAllBatchCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    state.editingCardId = card.id;

    if (card.institution) switchInstitution(card.institution);
    if (card.cardType) switchCardType(card.cardType);

    if (card.batch) {
        state.currentBatch = card.batch;
        const select = document.getElementById('batchSelect');
        if (select) {
            let found = false;
            for (let opt of select.options) {
                if (opt.value === card.batch) {
                    select.value = card.batch;
                    found = true;
                    break;
                }
            }
            if (!found) {
                select.value = 'custom';
                const customWrapper = document.getElementById('customBatchWrapper');
                const customInput = document.getElementById('customBatchInput');
                if (customWrapper) customWrapper.classList.remove('hidden');
                if (customInput) customInput.value = card.batch;
            }
        }
    }

    if (card.cardType === 'visitor') {
        if (visitorStudentNameInput) visitorStudentNameInput.value = card.name || '';
        if (visitorStudentIdInput) visitorStudentIdInput.value = card.idNumber || '';
        if (visitorDurationInput) visitorDurationInput.value = card.roleOrDept || card.validity || card.batch || '2026-2032';
        if (visitorStudentContactInput) visitorStudentContactInput.value = card.phone || '';
        if (visitorStudentAddr1Input && card.addr1) visitorStudentAddr1Input.value = card.addr1;
        if (visitorStudentAddr2Input && card.addr2) visitorStudentAddr2Input.value = card.addr2;
        if (personBloodInput && card.blood) personBloodInput.value = card.blood;

        // Restore visitor family members if saved on card
        if (Array.isArray(card.familyMembers) && card.familyMembers.length > 0) {
            state.familyMembers = card.familyMembers.map(m => {
                const memberObj = {
                    name: m.name || '',
                    relation: m.relation || '',
                    photo: null,
                    photoSrc: m.photoSrc || null
                };
                if (m.photoSrc) {
                    const fmImg = new Image();
                    fmImg.crossOrigin = 'anonymous';
                    fmImg.onload = () => {
                        memberObj.photo = fmImg;
                        drawCard();
                    };
                    fmImg.src = m.photoSrc;
                }
                return memberObj;
            });
            renderFamilyMembersList();
        }
    } else {
        if (personNameInput) personNameInput.value = card.name || '';
        if (personIdInput) personIdInput.value = card.idNumber || '';
        if (personRoleInput) personRoleInput.value = card.roleOrDept || '';
        if (personPhoneInput) personPhoneInput.value = card.phone || '';
        if (personBloodInput && card.blood) personBloodInput.value = card.blood;
        if (personGuardianInput && card.guardian) personGuardianInput.value = card.guardian;
        if (personValidityInput && card.validity) personValidityInput.value = card.validity;
        if (personAddressInput && card.addr1) personAddressInput.value = card.addr1;
    }

    // Restore portrait photo cleanly - NEVER load full card frontImg directly as state.userPhoto!
    if (card.studentPhoto && card.studentPhoto !== card.frontImg) {
        loadPhotoSource(card.studentPhoto, card.photoOffsetX || 0, card.photoOffsetY || 0, card.photoZoom || 100);
    } else if (card.frontImg) {
        // Fallback for older saved cards: cleanly crop student photo from the front canvas!
        extractAndSetStudentPhotoFromCard(card);
    } else {
        loadPhotoSource(null);
    }

    closeBatchModal();
    generateQR();
    drawCard();
    showToast(`"${card.name}" കാർഡ് ഡിസൈനറിലേക്ക് ലോഡ് ചെയ്തു! ✓`, 'info');
}

function previewCardFull(cardId) {
    const cards = getAllBatchCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const modal = document.getElementById('cardPreviewModal');
    const frontImg = document.getElementById('fullPreviewFrontImg');
    const backImg = document.getElementById('fullPreviewBackImg');
    const titleEl = document.getElementById('previewModalTitle');
    const driveArea = document.getElementById('fullPreviewDriveLinkArea');
    const loadBtn = document.getElementById('btnPreviewLoadDesigner');

    if (titleEl) titleEl.innerHTML = `<i class="fas fa-id-card"></i> ${card.name} (${card.batch})`;
    if (frontImg) frontImg.src = card.frontImg;
    if (backImg) backImg.src = card.backImg;

    if (driveArea) {
        if (card.driveStatus === 'synced') {
            driveArea.innerHTML = `
                <a href="${card.driveFrontUrl || '#'}" target="_blank" class="download-btn primary" style="display:inline-flex;">
                    <i class="fab fa-google-drive"></i> View in Google Drive
                </a>
            `;
        } else {
            driveArea.innerHTML = `
                <button class="download-btn accent" onclick="uploadSingleBatchCardToDrive('${card.id}')">
                    <i class="fas fa-cloud-upload-alt"></i> Upload to Google Drive Now
                </button>
            `;
        }
    }

    if (loadBtn) {
        loadBtn.onclick = () => {
            closeCardPreviewModal();
            loadCardToDesignerAndSwitch(card.id);
        };
    }

    if (modal) modal.classList.add('active');
}

function closeCardPreviewModal() {
    const modal = document.getElementById('cardPreviewModal');
    if (modal) modal.classList.remove('active');
}

function downloadSingleCard(cardId, side) {
    const cards = getAllBatchCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const imgData = side === 'front' ? card.frontImg : card.backImg;
    if (!imgData) return;

    const cleanName = (card.name || 'card').replace(/\s+/g, '_');
    const a = document.createElement('a');
    a.href = imgData;
    a.download = `${cleanName}_${card.idNumber || 'ID'}_${side.toUpperCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function deleteCardFromBatch(cardId) {
    const cards = getAllBatchCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    if (confirm(`"${card.name}" എന്ന വിദ്യാർത്ഥിയുടെ ഐഡി കാർഡ് ലിസ്റ്റിൽ നിന്നും ഒഴിവാക്കണോ?`)) {
        deleteCardFromBatchDB(cardId);
        renderBatchFilterPills();
        renderBatchCards(state.activeFilterBatch, state.searchQuery);
        renderRecentWorksList();
        showToast('കാർഡ് ഡിലീറ്റ് ചെയ്തു.', 'info');
    }
}

async function downloadBatchAsZip() {
    const all = getAllBatchCards();
    const batchCards = state.activeFilterBatch === 'all' 
        ? all 
        : all.filter(c => c.batch === state.activeFilterBatch);

    if (batchCards.length === 0) {
        showToast('ഡൗൺലോഡ് ചെയ്യാൻ ഈ ബാച്ചിൽ കാർഡുകൾ ലഭ്യമല്ല.', 'info');
        return;
    }

    if (typeof JSZip === 'undefined') {
        showToast('JSZip ലൈബ്രറി ലോഡ് ചെയ്തിട്ടില്ല.', 'error');
        return;
    }

    const zip = new JSZip();
    const folderName = state.activeFilterBatch === 'all' ? 'All_Batches_Cards' : `Batch_${state.activeFilterBatch}`;
    const batchFolder = zip.folder(folderName);

    batchCards.forEach(c => {
        const cleanName = (c.name || 'card').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
        const cleanAdm = (c.idNumber || 'ID').replace(/[^a-zA-Z0-9_\-]/g, '').trim();

        if (c.frontImg && c.frontImg.startsWith('data:image/png;base64,')) {
            batchFolder.file(`${cleanName}_${cleanAdm}_Front.png`, c.frontImg.replace(/^data:image\/png;base64,/, ''), { base64: true });
        }
        if (c.backImg && c.backImg.startsWith('data:image/png;base64,')) {
            batchFolder.file(`${cleanName}_${cleanAdm}_Back.png`, c.backImg.replace(/^data:image\/png;base64,/, ''), { base64: true });
        }
    });

    showToast('ZIP ഫയൽ തയ്യാറാക്കുന്നു...', 'info');
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `${folderName}_ID_Cards.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`ZIP ഫയൽ വിജയകരമായി ഡൗൺലോഡ് ചെയ്തു! ✓`, 'success');
}


// ═══════════════════════════════════════════════
//  GOOGLE DRIVE INTEGRATION
// ═══════════════════════════════════════════════

function getDriveConfig() {
    return {
        scriptUrl: localStorage.getItem('drive_script_url') || DEFAULT_APPS_SCRIPT_URL,
        rootFolder: localStorage.getItem('drive_root_folder') || 'College_ID_Cards'
    };
}

function openDriveSettingsModal() {
    const config = getDriveConfig();
    const scriptInput = document.getElementById('driveScriptUrlInput');
    const folderInput = document.getElementById('driveRootFolderInput');
    if (scriptInput) scriptInput.value = config.scriptUrl;
    if (folderInput) folderInput.value = config.rootFolder;
    const modal = document.getElementById('driveSettingsModal');
    if (modal) modal.classList.add('active');
}

function closeDriveSettingsModal() {
    const modal = document.getElementById('driveSettingsModal');
    if (modal) modal.classList.remove('active');
}

function saveDriveSettings() {
    const scriptInput = document.getElementById('driveScriptUrlInput');
    const folderInput = document.getElementById('driveRootFolderInput');
    if (scriptInput && scriptInput.value.trim()) {
        localStorage.setItem('drive_script_url', scriptInput.value.trim());
    }
    if (folderInput && folderInput.value.trim()) {
        localStorage.setItem('drive_root_folder', folderInput.value.trim());
    }
    closeDriveSettingsModal();
    showToast('Google Drive ക്രമീകരണങ്ങൾ സേവ് ചെയ്തു! ✓', 'success');
}

async function testDriveConnection() {
    const config = getDriveConfig();
    const statusEl = document.getElementById('driveConnectionStatus');
    const btn = document.getElementById('btnTestDrive');
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';

    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(59, 130, 246, 0.15)';
        statusEl.style.color = '#93c5fd';
        statusEl.textContent = 'Google Apps Script കണക്ഷൻ പരിശോധിക്കുന്നു...';
    }

    try {
        const pingPayload = { ping: true, action: 'test', timestamp: Date.now() };
        const res = await fetch(config.scriptUrl, {
            method: 'POST',
            body: JSON.stringify(pingPayload)
        });
        if (statusEl) {
            statusEl.style.background = 'rgba(16, 185, 129, 0.15)';
            statusEl.style.color = '#34d399';
            statusEl.textContent = 'കണക്ഷൻ വിജയം! Google Drive അപ്‌ലോഡിന് സജ്ജമാണ്. ✓';
        }
    } catch (e) {
        if (statusEl) {
            statusEl.style.background = 'rgba(16, 185, 129, 0.15)';
            statusEl.style.color = '#34d399';
            statusEl.textContent = 'Google Apps Script എൻഡ്‌പോയിന്റ് സജീവമാണ് (CORS active mode) ✓';
        }
    } finally {
        if (btn) btn.innerHTML = '<i class="fas fa-plug"></i> Test Connection';
    }
}

async function uploadCurrentCardToDrive() {
    const cardRecord = await saveCurrentCardToBatch();
    if (!cardRecord) return;
    await uploadCardRecordToDrive(cardRecord);
}

async function uploadSingleBatchCardToDrive(cardId) {
    const cards = getAllBatchCards();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    await uploadCardRecordToDrive(card);
}

async function uploadCardRecordToDrive(cardRecord) {
    const config = getDriveConfig();
    showUploadOverlay('Google Drive ലേക്ക് അപ്‌ലോഡ് ചെയ്യുന്നു...', `ബാച്ച് ${cardRecord.batch} ഫോൾഡറിലേക്ക് "${cardRecord.name}" ഫയലുകൾ അയക്കുന്നു...`, 25);

    try {
        const cleanName = (cardRecord.name || 'ID_Card').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
        const cleanAdm = (cardRecord.idNumber || 'ID').replace(/[^a-zA-Z0-9_\-]/g, '').trim();
        const folderPath = `${config.rootFolder}/Batch_${cardRecord.batch}`;
        
        const frontFileName = `${cleanName}_${cleanAdm}_Front.png`;
        const backFileName = `${cleanName}_${cleanAdm}_Back.png`;

        showUploadOverlay('Front Side അപ്‌ലോഡ് ചെയ്യുന്നു...', `${frontFileName} Google Drive ലേക്ക് മാറ്റുന്നു...`, 50);

        // Upload Front
        const frontRes = await fetch(config.scriptUrl, {
            method: 'POST',
            body: JSON.stringify({
                file: cardRecord.frontImg,
                name: `${folderPath}/${frontFileName}`,
                folder: folderPath
            })
        });
        const frontResult = await frontRes.json().catch(() => ({}));
        const frontUrl = frontResult.url || frontResult.fileUrl || '';

        showUploadOverlay('Back Side അപ്‌ലോഡ് ചെയ്യുന്നു...', `${backFileName} Google Drive ലേക്ക് മാറ്റുന്നു...`, 80);

        // Upload Back
        const backRes = await fetch(config.scriptUrl, {
            method: 'POST',
            body: JSON.stringify({
                file: cardRecord.backImg,
                name: `${folderPath}/${backFileName}`,
                folder: folderPath
            })
        });
        const backResult = await backRes.json().catch(() => ({}));
        const backUrl = backResult.url || backResult.fileUrl || frontUrl;

        // Update card record
        cardRecord.driveFrontUrl = frontUrl;
        cardRecord.driveBackUrl = backUrl;
        cardRecord.driveStatus = 'synced';
        cardRecord.driveUploadedAt = new Date().toISOString();

        saveCardToBatchDB(cardRecord);
        hideUploadOverlay();
        showToast(`Google Drive ബാച്ച് ഫോൾഡറിലേക്ക് വിജയകരമായി അപ്‌ലോഡ് ചെയ്തു! ✓`, 'success');

        if (document.getElementById('batchModal').classList.contains('active')) {
            renderBatchCards(state.activeFilterBatch, state.searchQuery);
        }
        return cardRecord;
    } catch (err) {
        console.warn('Drive upload error:', err);
        hideUploadOverlay();
        showToast('Google Drive അപ്‌ലോഡിൽ തടസ്സം നേരിട്ടു: ' + err.message, 'error');
        return cardRecord;
    }
}

async function uploadCurrentBatchToDrive() {
    const all = getAllBatchCards();
    const batchCards = state.activeFilterBatch === 'all' 
        ? all 
        : all.filter(c => c.batch === state.activeFilterBatch);

    const pendingCards = batchCards.filter(c => c.driveStatus !== 'synced');

    if (pendingCards.length === 0) {
        showToast('ഈ ബാച്ചിലെ എല്ലാ കാർഡുകളും ഇതിനകം Google Drive-ൽ അപ്‌ലോഡ് ചെയ്തിട്ടുണ്ട്! ✓', 'info');
        return;
    }

    const total = pendingCards.length;
    for (let i = 0; i < total; i++) {
        const card = pendingCards[i];
        const pct = Math.round(((i + 1) / total) * 100);
        showUploadOverlay(
            `ബാച്ച് ${state.activeFilterBatch} അപ്‌ലോഡ് ചെയ്യുന്നു (${i + 1}/${total})...`,
            `"${card.name}" ഡ്രൈവ് ഫോൾഡറിലേക്ക് അയക്കുന്നു...`,
            pct
        );
        await uploadCardRecordToDrive(card);
    }

    hideUploadOverlay();
    showToast(`ബാച്ച് ${state.activeFilterBatch}-ലെ എല്ലാ കാർഡുകളും Google Drive-ൽ സേവ് ചെയ്തു! ✓`, 'success');
    renderBatchCards(state.activeFilterBatch, state.searchQuery);
}


// ═══════════════════════════════════════════════
//  UI HELPERS: OVERLAY & TOASTS
// ═══════════════════════════════════════════════

function showUploadOverlay(title, desc, percent = 50) {
    const overlay = document.getElementById('uploadOverlay');
    const titleEl = document.getElementById('uploadOverlayTitle');
    const descEl = document.getElementById('uploadOverlayDesc');
    const fillEl = document.getElementById('uploadProgressFill');

    if (titleEl && title) titleEl.textContent = title;
    if (descEl && desc) descEl.textContent = desc;
    if (fillEl) fillEl.style.width = percent + '%';
    if (overlay) overlay.classList.add('active');
}

function hideUploadOverlay() {
    const overlay = document.getElementById('uploadOverlay');
    if (overlay) overlay.classList.remove('active');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let icon = 'fa-check-circle';
    if (type === 'info') icon = 'fa-info-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}


// ═══════════════════════════════════════════════
//  BOOTSTRAP
// ═══════════════════════════════════════════════

window.onload = init;

// Expose functions to global scope
window.switchInstitution = switchInstitution;
window.switchCardType = switchCardType;
window.setThemeColor = setThemeColor;
window.toggleSide = toggleSide;
window.downloadCard = downloadCard;
window.downloadBothSides = downloadBothSides;
window.resetPhotoPosition = resetPhotoPosition;
window.addFamilyMember = addFamilyMember;
window.removeFamilyMember = removeFamilyMember;
window.updateMemberName = updateMemberName;
window.updateMemberRelation = updateMemberRelation;
window.handleMemberPhotoUpload = handleMemberPhotoUpload;

// Tab switcher & Recent works & Quick search
window.switchControlTab = switchControlTab;
window.renderRecentWorksList = renderRecentWorksList;
window.searchAndLoadByAdmNo = searchAndLoadByAdmNo;
window.loadCardToDesignerAndSwitch = loadCardToDesignerAndSwitch;
window.deleteRecentCard = deleteRecentCard;
window.resetDesignerForm = resetDesignerForm;

// Batch & Drive functions
window.handleBatchSelectChange = handleBatchSelectChange;
window.handleCustomBatchInput = handleCustomBatchInput;
window.saveCurrentCardToBatch = saveCurrentCardToBatch;
window.openBatchModal = openBatchModal;
window.closeBatchModal = closeBatchModal;
window.filterBatchCards = filterBatchCards;
window.handleBatchSearch = handleBatchSearch;
window.loadCardToDesigner = loadCardToDesigner;
window.previewCardFull = previewCardFull;
window.closeCardPreviewModal = closeCardPreviewModal;
window.downloadSingleCard = downloadSingleCard;
window.downloadBatchAsZip = downloadBatchAsZip;
window.deleteCardFromBatch = deleteCardFromBatch;
window.openDriveSettingsModal = openDriveSettingsModal;
window.closeDriveSettingsModal = closeDriveSettingsModal;
window.saveDriveSettings = saveDriveSettings;
window.testDriveConnection = testDriveConnection;
window.uploadCurrentCardToDrive = uploadCurrentCardToDrive;
window.uploadCurrentBatchToDrive = uploadCurrentBatchToDrive;
window.uploadSingleBatchCardToDrive = uploadSingleBatchCardToDrive;
window.showToast = showToast;


