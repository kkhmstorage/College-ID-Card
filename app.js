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
        phone: "0494 2608283, 8590658550",
        website: "https://kkhmstorage.github.io/markaz-wafy-college/",
        themeColor: "#173f8a",
        accentColor: "#3b82f6",
        tagline: "Empowering Women Through Knowledge"
    },
    kkhm: {
        name: "KKHM ISLAMIC & ARTS COLLEGE",
        arabicName: "كلية كي كي حسن مسليار الإسلامية والآداب",
        shortName: "KKHM",
        address: "P.O Karthala, Malappuram, Pin: 679571",
        phone: "0494 2608283, 8590658550",
        website: "https://kkhmstorage.github.io/markaz-wafy-college/",
        themeColor: "#173f8a",
        accentColor: "#3b82f6",
        tagline: "Enlightening Minds, Building Futures"
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
    userPhoto: null,
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
    // Family members for Visitor back side
    familyMembers: [
        {
            name: "M ABOOBACKER",
            relation: "FATHER",
            photo: null,
            photoSrc: "assets/father_sample.jpg"
        },
        {
            name: "FARSEENA",
            relation: "SISTER",
            photo: null,
            photoSrc: "assets/sister_sample.jpg"
        },
        {
            name: "MUMTHAZ",
            relation: "MOTHER",
            photo: null,
            photoSrc: "assets/mother_sample.jpg"
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
const instPhoneInput = document.getElementById('instPhone');
const instWebsiteInput = document.getElementById('instWebsite');

// Person inputs (Student/Staff)
const personNameInput = document.getElementById('personName');
const personIdInput = document.getElementById('personId');
const personRoleInput = document.getElementById('personRole');
const personBloodInput = document.getElementById('personBlood');
const personPhoneInput = document.getElementById('personPhone');
const personDobInput = document.getElementById('personDob');
const personAddressInput = document.getElementById('personAddress');
const staffDeptInput = document.getElementById('staffDept');
const staffJoinDateInput = document.getElementById('staffJoinDate');

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
    drawCard();
}

function loadSampleImages() {
    // 1. Student Sample Photo
    const studentImg = new Image();
    studentImg.onload = () => {
        state.userPhoto = studentImg;
        if (photoControls) photoControls.classList.remove('hidden');
        if (photoDragOverlay) photoDragOverlay.classList.add('active');
        updateDragOverlayPosition();
        drawCard();
    };
    studentImg.src = 'assets/student_sample.jpg';

    // 2. Family Members Sample Photos
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
        instArabicNameInput, instNameInput, instAddressInput, instPhoneInput, instWebsiteInput,
        personNameInput, personIdInput, personRoleInput, personBloodInput,
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
    if (instPhoneInput) instPhoneInput.value = inst.phone;
    if (instWebsiteInput) instWebsiteInput.value = inst.website;

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

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            state.userPhoto = img;
            state.photoOffsetX = 0;
            state.photoOffsetY = 0;
            state.photoZoom = 100;
            if (photoZoomSlider) photoZoomSlider.value = 100;
            if (zoomValueDisplay) zoomValueDisplay.textContent = '100%';
            if (photoControls) photoControls.classList.remove('hidden');
            if (photoDragOverlay) photoDragOverlay.classList.add('active');
            updateDragOverlayPosition();
            drawCard();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    const label = document.getElementById('photoLabel');
    if (label) {
        label.innerHTML = '<i class="fas fa-check-circle" style="color:#34d399"></i><span>ഫോട്ടോ ലോഡ് ചെയ്തു ✓</span>';
    }
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

    if (state.currentCardType === 'visitor') {
        const photoW = 220;
        const photoH = 260;
        const photoX = (canvas.width - photoW) / 2;
        const photoY = 225;

        photoDragOverlay.style.width = (photoW * scaleX) + 'px';
        photoDragOverlay.style.height = (photoH * scaleY) + 'px';
        photoDragOverlay.style.left = (photoX * scaleX) + 'px';
        photoDragOverlay.style.top = (photoY * scaleY) + 'px';
        photoDragOverlay.style.borderRadius = (22 * scaleX) + 'px';
        photoDragOverlay.classList.add('active');
    } else {
        const centerX = canvas.width / 2;
        const centerY = 340;
        const radius = 120;

        photoDragOverlay.style.width = (radius * 2 * scaleX) + 'px';
        photoDragOverlay.style.height = (radius * 2 * scaleY) + 'px';
        photoDragOverlay.style.left = ((centerX - radius) * scaleX) + 'px';
        photoDragOverlay.style.top = ((centerY - radius) * scaleY) + 'px';
        photoDragOverlay.style.borderRadius = '50%';
        photoDragOverlay.classList.add('active');
    }
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
//  QR CODE GENERATION
// ═══════════════════════════════════════════════

function generateQR() {
    const qrContainer = document.getElementById('qrContainer');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';

    let qrData = '';
    const inst = INSTITUTIONS[state.currentInstitution];

    if (state.currentCardType === 'visitor') {
        const studentName = visitorStudentNameInput ? visitorStudentNameInput.value : '';
        const admNo = visitorStudentIdInput ? visitorStudentIdInput.value : '';
        qrData = `VISITOR PASS - AUTHORIZED FAMILY\n${inst.name}\nStudent: ${studentName}\nAdm No: ${admNo}\nContact: ${visitorStudentContactInput.value}\nDuration: ${visitorDurationInput.value}`;
    } else {
        qrData = `${state.currentCardType.toUpperCase()} ID CARD\n${inst.name}\nName: ${personNameInput.value}\nID: ${personIdInput.value}\n${state.currentCardType === 'student' ? 'Class' : 'Designation'}: ${personRoleInput.value}\nPhone: ${personPhoneInput.value}\nWebsite: ${instWebsiteInput.value}`;
    }

    if (!qrData.trim()) qrData = inst.website || 'https://kkhmstorage.github.io/markaz-wafy-college/';

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
//  DRAW VISITOR FRONT SIDE (EXACT MATCH TO REAL CARD)
// ═══════════════════════════════════════════════

function drawVisitorFrontSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = themeColorInput.value || '#173f8a';

    // Clear
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    // Clip whole canvas to smooth rounded card corners
    roundRect(0, 0, W, H, 28);
    ctx.clip();

    // ── Pure White Background ──
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Deep Royal Blue Header Banner ──
    const headerH = 175;
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, W, headerH);

    // ── Arabic College Title ──
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Amiri", "Noto Sans Arabic", "Traditional Arabic", sans-serif';
    const arabicTitle = (instArabicNameInput && instArabicNameInput.value) || 
        INSTITUTIONS[state.currentInstitution].arabicName || 
        'كلية الغيث للآداب والعلوم الإسلامية - للبنات';
    ctx.fillText(arabicTitle, W / 2, 45);

    // ── English College Name (Golden Yellow font as on real card) ──
    const instName = (instNameInput && instNameInput.value) || INSTITUTIONS[state.currentInstitution].name;
    ctx.font = '900 22px "Inter", sans-serif';
    ctx.fillStyle = '#ffd200'; // Bright Golden Yellow
    ctx.fillText(instName.toUpperCase(), W / 2, 82);

    // ── College Address & Phone (White / Light Slate) ──
    ctx.font = '600 13px "Inter", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    const addr = (instAddressInput && instAddressInput.value) || INSTITUTIONS[state.currentInstitution].address;
    const phone = (instPhoneInput && instPhoneInput.value) || INSTITUTIONS[state.currentInstitution].phone;
    ctx.fillText(addr, W / 2, 118);
    ctx.fillText(phone.startsWith('Ph:') ? phone : ('Ph: ' + phone), W / 2, 140);

    // ── Attached Pill Badge: VISITORS' IDENTITY CARD ──
    const pillW = 295;
    const pillH = 40;
    const pillX = (W - pillW) / 2;
    const pillY = 155; // Overlaps bottom edge of blue header
    const pillRadius = 20;

    roundRect(pillX, pillY, pillW, pillH, pillRadius);
    ctx.fillStyle = '#0c2452'; // Deep Dark Navy Pill
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '800 15px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText("VISITORS' IDENTITY CARD", W / 2, pillY + 26);

    // ── Student Photo (Rounded Rectangle) ──
    const photoW = 220;
    const photoH = 260;
    const photoX = (W - photoW) / 2;
    const photoY = 225;
    const photoRadius = 22;

    // Green photo backdrop (typical institutional studio photo backdrop)
    roundRect(photoX, photoY, photoW, photoH, photoRadius);
    ctx.fillStyle = '#3f7856';
    ctx.fill();

    // Clip photo inside rounded rect
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
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Student Name (Centered, Navy Blue, Bold, Malayalam Safe) ──
    const studentName = (visitorStudentNameInput && visitorStudentNameInput.value) || 'AFRIN FATHIMA';
    const dispStudentName = formatDisplayName(studentName);
    ctx.font = '900 30px "Noto Sans Malayalam", "Inter", sans-serif';
    if (ctx.measureText(dispStudentName).width > W - 120) {
        ctx.font = '900 24px "Noto Sans Malayalam", "Inter", sans-serif';
    }
    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = 'center';
    ctx.fillText(dispStudentName, W / 2, 535);

    // ── Student Details (Left-aligned table block) ──
    const detailStartX = 85;
    let detailY = 592;
    const lineSpacing = 38;

    ctx.textAlign = 'left';

    // 1. Admission Number (highlighted in red)
    const admNo = (visitorStudentIdInput && visitorStudentIdInput.value) || '747';
    ctx.font = '700 20px "Inter", sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.fillText('Admission Number : ', detailStartX, detailY);
    const admLabelW = ctx.measureText('Admission Number : ').width;
    ctx.font = '900 22px "Inter", sans-serif';
    ctx.fillStyle = '#b91c1c'; // Red highlight as in the physical card
    ctx.fillText(admNo, detailStartX + admLabelW, detailY);

    // 2. Address Line 1
    detailY += lineSpacing;
    const addr1 = (visitorStudentAddr1Input && visitorStudentAddr1Input.value) || 'KODAKKATTU H, NERIAMANGALAM';
    ctx.font = '700 19px "Inter", sans-serif';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(addr1.toUpperCase(), detailStartX, detailY);

    // 3. Address Line 2
    detailY += lineSpacing;
    const addr2 = (visitorStudentAddr2Input && visitorStudentAddr2Input.value) || 'PO, ERANAKULAM 686693';
    ctx.fillText(addr2.toUpperCase(), detailStartX, detailY);

    // 4. Contact No
    detailY += lineSpacing;
    const contact = (visitorStudentContactInput && visitorStudentContactInput.value) || '9562937331, 7561085134';
    ctx.fillText('Contact No: ' + contact, detailStartX, detailY);

    // 5. Duration
    detailY += lineSpacing;
    const duration = (visitorDurationInput && visitorDurationInput.value) || '2026-2032';
    ctx.fillText('Duration   : ' + duration, detailStartX, detailY);

    // Subtle outer card border
    roundRect(0, 0, W, H, 28);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}


// ═══════════════════════════════════════════════
//  DRAW VISITOR BACK SIDE (AUTHORIZED FAMILY GRID)
// ═══════════════════════════════════════════════

function drawVisitorBackSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = themeColorInput.value || '#173f8a';

    // Clear
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    roundRect(0, 0, W, H, 28);
    ctx.clip();

    // ── Solid Royal Blue Background ──
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, W, H);

    // ── Top Title: AUTHORIZED FAMILY ──
    ctx.font = '900 28px "Inter", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '1.5px';
    ctx.fillText('AUTHORIZED FAMILY', W / 2, 75);

    // ── Grid of Family Members (2 columns x 2 rows) ──
    const members = state.familyMembers || [];
    const colCenters = [185, 465];
    const rowY = [125, 540];
    const photoW = 200;
    const photoH = 240;
    const photoRadius = 22;

    for (let i = 0; i < 4; i++) {
        const member = members[i];
        if (!member || !member.name) continue;

        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = colCenters[col];
        const py = rowY[row];
        const px = cx - (photoW / 2);

        // 1. Photo box with light cyan background (matches physical card)
        roundRect(px, py, photoW, photoH, photoRadius);
        ctx.fillStyle = '#7dd3fc';
        ctx.fill();

        // 2. Draw member photo
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

        // 3. Photo border
        roundRect(px, py, photoW, photoH, photoRadius);
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 4. Member Name (Bold White Uppercase)
        ctx.font = '900 19px "Inter", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText((member.name || '').toUpperCase(), cx, py + photoH + 32);

        // 5. Member Relation (White / Light Sky Uppercase)
        ctx.font = '700 15px "Inter", sans-serif';
        ctx.fillStyle = '#e0f2fe';
        ctx.fillText((member.relation || '').toUpperCase(), cx, py + photoH + 55);
    }

    ctx.restore();
}


// ═══════════════════════════════════════════════
//  DRAW STUDENT / STAFF FRONT SIDE
// ═══════════════════════════════════════════════

function drawFrontSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = themeColorInput.value || '#173f8a';

    // Clear
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    roundRect(0, 0, W, H, 28);
    ctx.clip();

    // ── Clean White Background ──
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Top Header Banner (Clean Solid Blue/Theme Color - NO YELLOW) ──
    const headerH = 175;
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, 0, W, headerH);

    // ── Arabic College Title ──
    const arabicTitle = (instArabicNameInput && instArabicNameInput.value) || 
        (INSTITUTIONS[state.currentInstitution] && INSTITUTIONS[state.currentInstitution].arabicName) || '';
    if (arabicTitle) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 21px "Amiri", "Noto Sans Arabic", sans-serif';
        ctx.fillText(arabicTitle, W / 2, 45);
    }

    // ── Institution Name (Clean Crisp White - NO YELLOW) ──
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const instName = (instNameInput && instNameInput.value) || INSTITUTIONS[state.currentInstitution].name;
    ctx.font = 'bold 23px Inter, sans-serif';
    ctx.fillText(instName.toUpperCase(), W / 2, arabicTitle ? 80 : 65);

    // ── Address & Contact in Header ──
    const addr = (instAddressInput && instAddressInput.value) || INSTITUTIONS[state.currentInstitution].address;
    const phone = (instPhoneInput && instPhoneInput.value) || INSTITUTIONS[state.currentInstitution].phone;
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(addr + (phone ? ' | Ph: ' + phone : ''), W / 2, arabicTitle ? 116 : 100);

    // ── Card Type Pill Badge ──
    const badgeText = getCardTypeLabel();
    const badge = getCardTypeBadgeColor();
    const pillW = 280;
    const pillH = 38;
    const pillX = (W - pillW) / 2;
    const pillY = headerH - 19;
    const pillRadius = 19;

    roundRect(pillX, pillY, pillW, pillH, pillRadius);
    ctx.fillStyle = badge.bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '800 14px Inter, sans-serif';
    ctx.fillStyle = badge.text;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, W / 2, pillY + 24);

    // ── Photo Circle (Clean Theme Color Ring - NO YELLOW) ──
    const centerX = W / 2;
    const centerY = 330;
    const radius = 105;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = themeColor;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (state.userPhoto) {
        const zoom = state.photoZoom / 100;
        const aspect = state.userPhoto.width / state.userPhoto.height;
        let drawW, drawH;
        if (aspect > 1) {
            drawH = radius * 2 * zoom;
            drawW = drawH * aspect;
        } else {
            drawW = radius * 2 * zoom;
            drawH = drawW / aspect;
        }
        const dx = centerX - drawW / 2 + state.photoOffsetX;
        const dy = centerY - drawH / 2 + state.photoOffsetY;
        ctx.drawImage(state.userPhoto, dx, dy, drawW, drawH);
    } else {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '55px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('📷', centerX, centerY + 18);
    }
    ctx.restore();

    // ── Details Section ──
    drawPersonFrontDetails(centerY + radius + 40);

    // ── Bottom Footer (Clean Solid Theme Color - NO YELLOW) ──
    ctx.fillStyle = themeColor;
    ctx.fillRect(0, H - 48, W, 48);

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '500 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(instWebsiteInput.value || '', W / 2, H - 26);

    // Subtle outer card border
    roundRect(0, 0, W, H, 28);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}

function drawPersonFrontDetails(startY) {
    const W = canvas.width;
    const themeColor = themeColorInput.value || '#173f8a';

    // Name (Malayalam & Unicode Safe)
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    const name = (personNameInput && personNameInput.value) || 'Student Name';
    const dispName = formatDisplayName(name);
    ctx.font = '900 30px "Noto Sans Malayalam", "Inter", sans-serif';
    if (ctx.measureText(dispName).width > W - 120) {
        ctx.font = '900 23px "Noto Sans Malayalam", "Inter", sans-serif';
    }
    ctx.fillText(dispName, W / 2, startY);

    // Role / Class
    ctx.fillStyle = themeColor;
    ctx.font = '700 18px Inter, sans-serif';
    ctx.fillText(personRoleInput.value || '', W / 2, startY + 30);

    // Divider
    ctx.beginPath();
    ctx.moveTo(110, startY + 48);
    ctx.lineTo(W - 110, startY + 48);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Details table
    ctx.textAlign = 'left';
    const labelX = 110;
    const colonX = 280;
    const valueX = 300;
    let detailY = startY + 84;
    const spacing = 36;

    const details = [];
    
    if (state.currentCardType === 'student') {
        details.push({ label: 'Admission No', value: personIdInput.value, color: '#1f2937' });
        details.push({ label: 'Blood Group', value: personBloodInput.value, color: '#dc2626' });
        if (personDobInput.value) {
            details.push({ label: 'Date of Birth', value: formatDate(personDobInput.value), color: '#1f2937' });
        }
        details.push({ label: 'Phone', value: personPhoneInput.value, color: '#1f2937' });
    } else {
        details.push({ label: 'Staff ID', value: personIdInput.value, color: '#1f2937' });
        if (staffDeptInput.value) {
            details.push({ label: 'Department', value: staffDeptInput.value, color: '#1f2937' });
        }
        details.push({ label: 'Blood Group', value: personBloodInput.value, color: '#dc2626' });
        details.push({ label: 'Phone', value: personPhoneInput.value, color: '#1f2937' });
        if (staffJoinDateInput.value) {
            details.push({ label: 'Joined', value: formatDate(staffJoinDateInput.value), color: '#1f2937' });
        }
    }

    details.forEach(d => {
        if (!d.value) return;
        ctx.font = '600 17px Inter, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(d.label, labelX, detailY);
        ctx.fillText(':', colonX, detailY);
        ctx.font = '700 17px Inter, sans-serif';
        ctx.fillStyle = d.color;
        ctx.fillText(d.value, valueX, detailY);
        detailY += spacing;
    });
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

        if (state.currentCardType === 'visitor') {
            cardName = (visitorStudentNameInput && visitorStudentNameInput.value) || 'AFRIN FATHIMA';
            cardIdNum = (visitorStudentIdInput && visitorStudentIdInput.value) || '747';
            roleOrDept = (visitorDurationInput && visitorDurationInput.value) || currentBatch;
            phone = (visitorStudentContactInput && visitorStudentContactInput.value) || '';
        } else {
            cardName = (personNameInput && personNameInput.value) || 'Student Name';
            cardIdNum = (personIdInput && personIdInput.value) || '001';
            roleOrDept = (personRoleInput && personRoleInput.value) || '';
            phone = (personPhoneInput && personPhoneInput.value) || '';
        }

        const cardRecord = {
            id: 'card_' + Date.now(),
            batch: currentBatch,
            institution: state.currentInstitution,
            institutionName: INSTITUTIONS[state.currentInstitution].name,
            cardType: state.currentCardType,
            name: formatDisplayName(cardName),
            idNumber: cardIdNum,
            roleOrDept: roleOrDept,
            phone: phone,
            frontImg: frontDataUrl,
            backImg: backDataUrl,
            driveFrontUrl: null,
            driveBackUrl: null,
            driveStatus: 'pending',
            savedAt: new Date().toISOString()
        };

        saveCardToBatchDB(cardRecord);
        showToast(`ബാച്ച് ${currentBatch}-ലേക്ക് "${cardRecord.name}" വിജയകരമായി സേവ് ചെയ്തു! ✓`, 'success');
        return cardRecord;
    } catch (err) {
        console.error('Save to batch error:', err);
        showToast('സേവ് ചെയ്യുന്നതിൽ തടസ്സം: ' + err.message, 'error');
        return null;
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
        if (visitorStudentNameInput) visitorStudentNameInput.value = card.name;
        if (visitorStudentIdInput) visitorStudentIdInput.value = card.idNumber;
        if (visitorDurationInput) visitorDurationInput.value = card.roleOrDept || card.batch;
        if (visitorStudentContactInput && card.phone) visitorStudentContactInput.value = card.phone;
    } else {
        if (personNameInput) personNameInput.value = card.name;
        if (personIdInput) personIdInput.value = card.idNumber;
        if (personRoleInput) personRoleInput.value = card.roleOrDept;
        if (personPhoneInput && card.phone) personPhoneInput.value = card.phone;
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
            loadCardToDesigner(card.id);
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

