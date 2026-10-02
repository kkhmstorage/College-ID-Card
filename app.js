/* ═══════════════════════════════════════════════
   COLLEGE ID CARD DESIGNER - APPLICATION LOGIC
   Canvas-based ID Card with Drag Photo, QR Code,
   Institution Switching, Multiple Card Types
   ═══════════════════════════════════════════════ */

// ──── INSTITUTION DATA ────
const INSTITUTIONS = {
    kkhm: {
        name: "KKHM ISLAMIC & ARTS COLLEGE",
        shortName: "KKHM",
        address: "Markaz Campus, Athavanad",
        phone: "+91 4933 123456",
        website: "https://kkhmstorage.github.io/markaz-wafy-college/",
        themeColor: "#064e3b",
        accentColor: "#34d399",
        tagline: "Enlightening Minds, Building Futures"
    },
    algaith: {
        name: "AL-GAITH ISLAMIC & ARTS COLLEGE FOR GIRLS",
        shortName: "AL-GAITH",
        address: "Markaz Campus, Athavanad",
        phone: "+91 4933 654321",
        website: "https://kkhmstorage.github.io/markaz-wafy-college/",
        themeColor: "#7c2d12",
        accentColor: "#fb923c",
        tagline: "Empowering Women Through Knowledge"
    }
};

// ──── STATE MANAGEMENT ────
let state = {
    currentInstitution: 'kkhm',
    currentCardType: 'student',   // student | staff | visitor
    showingSide: 'front',          // front | back
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
    dragInitOffsetY: 0
};

// ──── DOM REFERENCES ────
const canvas = document.getElementById('idCardCanvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvasContainer');
const photoDragOverlay = document.getElementById('photoDragOverlay');

// Institution inputs
const instNameInput = document.getElementById('instName');
const instAddressInput = document.getElementById('instAddress');
const instPhoneInput = document.getElementById('instPhone');
const instWebsiteInput = document.getElementById('instWebsite');

// Person inputs
const personNameInput = document.getElementById('personName');
const personIdInput = document.getElementById('personId');
const personRoleInput = document.getElementById('personRole');
const personBloodInput = document.getElementById('personBlood');
const personPhoneInput = document.getElementById('personPhone');
const personDobInput = document.getElementById('personDob');
const personAddressInput = document.getElementById('personAddress');
const staffDeptInput = document.getElementById('staffDept');
const staffJoinDateInput = document.getElementById('staffJoinDate');

// Visitor inputs
const visitorNameInput = document.getElementById('visitorName');
const visitorRelationInput = document.getElementById('visitorRelation');
const visitorStudentNameInput = document.getElementById('visitorStudentName');
const visitorStudentIdInput = document.getElementById('visitorStudentId');
const visitorPhoneInput = document.getElementById('visitorPhone');
const visitorStudentClassInput = document.getElementById('visitorStudentClass');
const visitorPurposeInput = document.getElementById('visitorPurpose');

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
    switchInstitution('kkhm');
    switchCardType('student');
    setupEventListeners();
    setupDragHandlers();
    drawCard();
}

function setupEventListeners() {
    // All text inputs trigger redraw
    const allInputs = [
        instNameInput, instAddressInput, instPhoneInput, instWebsiteInput,
        personNameInput, personIdInput, personRoleInput, personBloodInput,
        personPhoneInput, personDobInput, personAddressInput,
        staffDeptInput, staffJoinDateInput,
        visitorNameInput, visitorRelationInput, visitorStudentNameInput,
        visitorStudentIdInput, visitorPhoneInput, visitorStudentClassInput,
        visitorPurposeInput,
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
    photoInput.addEventListener('change', handlePhotoUpload);
    
    // Logo upload
    logoInput.addEventListener('change', handleLogoUpload);

    // Zoom slider
    photoZoomSlider.addEventListener('input', (e) => {
        state.photoZoom = parseInt(e.target.value);
        zoomValueDisplay.textContent = state.photoZoom + '%';
        drawCard();
    });

    // Theme color change also updates preset highlight
    themeColorInput.addEventListener('input', () => {
        document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
        drawCard();
    });
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
    instNameInput.value = inst.name;
    instAddressInput.value = inst.address;
    instPhoneInput.value = inst.phone;
    instWebsiteInput.value = inst.website;

    // Update theme colors
    themeColorInput.value = inst.themeColor;
    accentColorInput.value = inst.accentColor;
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
    personSection.classList.remove('hidden');
    visitorSection.classList.add('hidden');
    departmentGroup.classList.add('hidden');
    joinDateGroup.classList.add('hidden');
    dobGroup.classList.remove('hidden');
    addressGroup.classList.remove('hidden');

    if (type === 'student') {
        document.getElementById('personSectionTitle').textContent = 'വിദ്യാർത്ഥി വിവരങ്ങൾ';
        document.getElementById('nameLabel').textContent = 'പേര്';
        document.getElementById('idLabel').textContent = 'Admission No';
        document.getElementById('roleLabel').textContent = 'ക്ലാസ്സ് / Course';
    } else if (type === 'staff') {
        document.getElementById('personSectionTitle').textContent = 'സ്റ്റാഫ് വിവരങ്ങൾ';
        document.getElementById('nameLabel').textContent = 'പേര്';
        document.getElementById('idLabel').textContent = 'Staff ID';
        document.getElementById('roleLabel').textContent = 'Designation';
        departmentGroup.classList.remove('hidden');
        joinDateGroup.classList.remove('hidden');
        dobGroup.classList.add('hidden');
    } else if (type === 'visitor') {
        personSection.classList.add('hidden');
        visitorSection.classList.remove('hidden');
    }

    generateQR();
    drawCard();
}


// ═══════════════════════════════════════════════
//  PHOTO HANDLING & DRAG
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
            photoZoomSlider.value = 100;
            zoomValueDisplay.textContent = '100%';
            photoControls.classList.remove('hidden');
            photoDragOverlay.classList.add('active');
            updateDragOverlayPosition();
            drawCard();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // Update label
    document.getElementById('photoLabel').innerHTML = '<i class="fas fa-check-circle" style="color:#34d399"></i><span>ഫോട്ടോ ലോഡ് ചെയ്തു ✓</span>';
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

    document.getElementById('logoLabel').innerHTML = '<i class="fas fa-check-circle" style="color:#34d399"></i><span>ലോഗോ ലോഡ് ചെയ്തു ✓</span>';
}

function resetPhotoPosition() {
    state.photoOffsetX = 0;
    state.photoOffsetY = 0;
    state.photoZoom = 100;
    photoZoomSlider.value = 100;
    zoomValueDisplay.textContent = '100%';
    drawCard();
}

// ──── Drag Overlay Setup ────
function updateDragOverlayPosition() {
    // Calculate the scale ratio between displayed canvas and actual canvas
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;

    // Photo circle position on canvas
    const centerX = 325;
    const centerY = 340;
    const radius = 120;

    photoDragOverlay.style.width = (radius * 2 * scaleX) + 'px';
    photoDragOverlay.style.height = (radius * 2 * scaleY) + 'px';
    photoDragOverlay.style.left = ((centerX - radius) * scaleX) + 'px';
    photoDragOverlay.style.top = ((centerY - radius) * scaleY) + 'px';
    photoDragOverlay.style.borderRadius = '50%';
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

    // Update overlay on resize
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
    qrContainer.innerHTML = '';

    let qrData = '';
    const inst = INSTITUTIONS[state.currentInstitution];

    if (state.currentCardType === 'visitor') {
        qrData = `VISITOR CARD\n${inst.name}\nVisitor: ${visitorNameInput.value}\nRelation: ${visitorRelationInput.value}\nStudent: ${visitorStudentNameInput.value}\nAdm No: ${visitorStudentIdInput.value}\nPurpose: ${visitorPurposeInput.value}\nPhone: ${visitorPhoneInput.value}`;
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

        // Wait for QR to render then capture
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
    themeColorInput.value = color;

    // Update active preset
    document.querySelectorAll('.color-preset').forEach(btn => {
        const btnColor = btn.style.background || btn.style.backgroundColor;
        // Compare by reading computed hex
        btn.classList.toggle('active', rgbToHex(btn) === color.toLowerCase());
    });

    drawCard();
}

function rgbToHex(element) {
    // Extract the color from style attribute
    const style = element.getAttribute('style');
    const match = style.match(/background:\s*(#[0-9a-fA-F]{6})/);
    return match ? match[1].toLowerCase() : '';
}


// ═══════════════════════════════════════════════
//  TOGGLE FRONT/BACK SIDE
// ═══════════════════════════════════════════════

function toggleSide() {
    state.showingSide = state.showingSide === 'front' ? 'back' : 'front';
    document.getElementById('sideLabel').textContent = state.showingSide === 'front' ? 'Back Side' : 'Front Side';
    
    // Show/hide drag overlay based on side
    if (state.showingSide === 'back') {
        photoDragOverlay.classList.remove('active');
    } else if (state.userPhoto) {
        photoDragOverlay.classList.add('active');
    }
    
    drawCard();
}


// ═══════════════════════════════════════════════
//  CANVAS DRAWING ENGINE
// ═══════════════════════════════════════════════

function drawCard() {
    if (state.showingSide === 'front') {
        drawFrontSide();
    } else {
        drawBackSide();
    }
    
    // Update drag overlay position
    if (state.userPhoto && state.showingSide === 'front') {
        updateDragOverlayPosition();
    }
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

// ──── HELPER: Lighten Color ────
function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

// ──── HELPER: Darken Color ────
function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

// ──── HELPER: Wrap Text ────
function wrapText(text, maxWidth) {
    const words = text.split('');
    let lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i];
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

// ──── Get Card Type Label ────
function getCardTypeLabel() {
    switch(state.currentCardType) {
        case 'student': return 'STUDENT IDENTITY CARD';
        case 'staff': return 'STAFF IDENTITY CARD';
        case 'visitor': return 'VISITOR PASS';
        default: return 'IDENTITY CARD';
    }
}

// ──── Get Card Type Color Badge ────
function getCardTypeBadgeColor() {
    switch(state.currentCardType) {
        case 'student': return { bg: '#059669', text: '#ffffff' };
        case 'staff': return { bg: '#2563eb', text: '#ffffff' };
        case 'visitor': return { bg: '#dc2626', text: '#ffffff' };
        default: return { bg: '#6b7280', text: '#ffffff' };
    }
}


// ═══════════════════════════════════════════════
//  DRAW FRONT SIDE
// ═══════════════════════════════════════════════

function drawFrontSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = themeColorInput.value;
    const accentColor = accentColorInput.value;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // ── Background ──
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // ── Top Header ──
    const headerGrad = ctx.createLinearGradient(0, 0, W, 0);
    headerGrad.addColorStop(0, themeColor);
    headerGrad.addColorStop(1, darkenColor(themeColor, 15));
    ctx.fillStyle = headerGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, 200);
    ctx.quadraticCurveTo(W * 0.5, 280, 0, 200);
    ctx.fill();

    // ── Decorative accent stripe ──
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.quadraticCurveTo(W * 0.5, 280, W, 200);
    ctx.quadraticCurveTo(W * 0.5, 290, 0, 210);
    ctx.fill();

    // ── Logo in header ──
    if (state.logoImage) {
        const logoSize = 55;
        const logoX = 30;
        const logoY = 25;
        
        // White circle background for logo
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw logo clipped to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(state.logoImage, logoX, logoY, logoSize, logoSize);
        ctx.restore();
    }

    // ── Institution Name ──
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    const instName = instNameInput.value || INSTITUTIONS[state.currentInstitution].name;
    ctx.font = 'bold 26px Inter, sans-serif';
    
    // Wrap institution name if too long
    const nameLines = wrapText(instName.toUpperCase(), W - 120);
    let nameY = state.logoImage ? 45 : 55;
    nameLines.forEach((line, i) => {
        ctx.fillText(line, W / 2, nameY + (i * 30));
    });

    // ── Address ──
    const addrY = nameY + (nameLines.length * 30) + 8;
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(instAddressInput.value || '', W / 2, addrY);

    // ── Card Type Badge ──
    const badge = getCardTypeBadgeColor();
    const badgeText = getCardTypeLabel();
    ctx.font = 'bold 14px Inter, sans-serif';
    const badgeW = ctx.measureText(badgeText).width + 40;
    const badgeH = 30;
    const badgeX = (W - badgeW) / 2;
    const badgeY = addrY + 18;

    roundRect(badgeX, badgeY, badgeW, badgeH, 15);
    ctx.fillStyle = badge.bg;
    ctx.fill();
    ctx.fillStyle = badge.text;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, W / 2, badgeY + 20);

    // ── Photo Circle ──
    const centerX = W / 2;
    const centerY = 340;
    const radius = 120;

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // White border
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = themeColor;
    ctx.stroke();

    // Photo or placeholder
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
        // Gradient placeholder
        const placeholderGrad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
        placeholderGrad.addColorStop(0, '#e2e8f0');
        placeholderGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = placeholderGrad;
        ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '60px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('📷', centerX, centerY + 18);
    }
    ctx.restore();

    // ── Details Section ──
    ctx.textAlign = 'center';

    if (state.currentCardType === 'visitor') {
        drawVisitorFrontDetails(centerY + radius + 40);
    } else {
        drawPersonFrontDetails(centerY + radius + 40);
    }

    // ── Bottom Footer ──
    const footerGrad = ctx.createLinearGradient(0, H - 90, 0, H);
    footerGrad.addColorStop(0, themeColor);
    footerGrad.addColorStop(1, darkenColor(themeColor, 20));
    ctx.fillStyle = footerGrad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W, H - 70);
    ctx.quadraticCurveTo(W * 0.5, H - 100, 0, H - 70);
    ctx.fill();

    // Accent stripe on footer
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(0, H - 70);
    ctx.quadraticCurveTo(W * 0.5, H - 100, W, H - 70);
    ctx.quadraticCurveTo(W * 0.5, H - 95, 0, H - 65);
    ctx.fill();

    // Website in footer
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(instWebsiteInput.value || '', W / 2, H - 25);

    // Phone in footer
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('☎ ' + (instPhoneInput.value || ''), W / 2, H - 8);
}

function drawPersonFrontDetails(startY) {
    const W = canvas.width;
    const themeColor = themeColorInput.value;

    // Name
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    const name = personNameInput.value || 'Name';
    ctx.fillText(name, W / 2, startY);

    // Role / Class
    ctx.fillStyle = themeColor;
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText(personRoleInput.value || '', W / 2, startY + 32);

    // Divider
    ctx.beginPath();
    ctx.moveTo(120, startY + 55);
    ctx.lineTo(W - 120, startY + 55);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Details table
    ctx.textAlign = 'left';
    const labelX = 100;
    const colonX = 290;
    const valueX = 310;
    let detailY = startY + 95;
    const spacing = 38;

    const details = [];
    
    if (state.currentCardType === 'student') {
        details.push({ label: 'Admission No', value: personIdInput.value, color: '#374151' });
        details.push({ label: 'Blood Group', value: personBloodInput.value, color: '#dc2626' });
        if (personDobInput.value) {
            details.push({ label: 'Date of Birth', value: formatDate(personDobInput.value), color: '#374151' });
        }
        details.push({ label: 'Phone', value: personPhoneInput.value, color: '#374151' });
    } else {
        details.push({ label: 'Staff ID', value: personIdInput.value, color: '#374151' });
        if (staffDeptInput.value) {
            details.push({ label: 'Department', value: staffDeptInput.value, color: '#374151' });
        }
        details.push({ label: 'Blood Group', value: personBloodInput.value, color: '#dc2626' });
        details.push({ label: 'Phone', value: personPhoneInput.value, color: '#374151' });
        if (staffJoinDateInput.value) {
            details.push({ label: 'Joined', value: formatDate(staffJoinDateInput.value), color: '#374151' });
        }
    }

    details.forEach(d => {
        if (!d.value) return;
        ctx.font = '600 17px Inter, sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(d.label, labelX, detailY);
        ctx.fillText(':', colonX, detailY);
        ctx.fillStyle = d.color;
        ctx.fillText(d.value, valueX, detailY);
        detailY += spacing;
    });
}

function drawVisitorFrontDetails(startY) {
    const W = canvas.width;
    const themeColor = themeColorInput.value;

    // Visitor Name
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(visitorNameInput.value || 'Visitor Name', W / 2, startY);

    // Relation Badge
    const relation = visitorRelationInput.value || '';
    if (relation) {
        ctx.font = 'bold 14px Inter, sans-serif';
        const relBadgeW = ctx.measureText(relation).width + 30;
        roundRect((W - relBadgeW) / 2, startY + 10, relBadgeW, 26, 13);
        ctx.fillStyle = '#fef3c7';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(relation, W / 2, startY + 28);
    }

    // Divider
    ctx.beginPath();
    ctx.moveTo(100, startY + 55);
    ctx.lineTo(W - 100, startY + 55);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Details
    ctx.textAlign = 'left';
    const labelX = 90;
    const colonX = 280;
    const valueX = 300;
    let detailY = startY + 95;
    const spacing = 36;

    const details = [
        { label: 'Student Name', value: visitorStudentNameInput.value },
        { label: 'Admission No', value: visitorStudentIdInput.value },
        { label: 'Class', value: visitorStudentClassInput.value },
        { label: 'Visitor Phone', value: visitorPhoneInput.value },
        { label: 'Purpose', value: visitorPurposeInput.value }
    ];

    details.forEach(d => {
        if (!d.value) return;
        ctx.font = '600 16px Inter, sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(d.label, labelX, detailY);
        ctx.fillText(':', colonX, detailY);
        ctx.fillStyle = '#374151';
        ctx.fillText(d.value, valueX, detailY);
        detailY += spacing;
    });
}


// ═══════════════════════════════════════════════
//  DRAW BACK SIDE
// ═══════════════════════════════════════════════

function drawBackSide() {
    const W = canvas.width;
    const H = canvas.height;
    const themeColor = themeColorInput.value;
    const accentColor = accentColorInput.value;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Top decorative bar
    const topGrad = ctx.createLinearGradient(0, 0, W, 0);
    topGrad.addColorStop(0, themeColor);
    topGrad.addColorStop(1, darkenColor(themeColor, 10));
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 120);

    // Accent stripe
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 120, W, 5);

    // Back side institution name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(instNameInput.value.toUpperCase(), W / 2, 50);

    // Tagline
    const inst = INSTITUTIONS[state.currentInstitution];
    ctx.font = 'italic 14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(inst.tagline, W / 2, 78);

    // Address
    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(instAddressInput.value || '', W / 2, 100);

    // ── QR Code Section ──
    const qrY = 170;
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillStyle = themeColor;
    ctx.fillText('SCAN FOR VERIFICATION', W / 2, qrY);

    if (state.qrImage) {
        const qrSize = 160;
        const qrX = (W - qrSize) / 2;
        const qrBoxY = qrY + 15;

        // QR white background box
        roundRect(qrX - 10, qrBoxY - 5, qrSize + 20, qrSize + 20, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.drawImage(state.qrImage, qrX, qrBoxY, qrSize, qrSize);
    }

    // ── Terms & Conditions Section ──
    const termsY = qrY + 210;
    
    // Title
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = themeColor;
    ctx.textAlign = 'center';
    ctx.fillText('TERMS & CONDITIONS', W / 2, termsY);

    // Divider
    ctx.beginPath();
    ctx.moveTo(100, termsY + 10);
    ctx.lineTo(W - 100, termsY + 10);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Terms text
    const terms = [
        '• This card is the property of the institution.',
        '• Must be worn at all times within campus.',
        '• If found, please return to the office.',
        '• Loss of card must be reported immediately.',
        '• This card is non-transferable.'
    ];

    if (state.currentCardType === 'visitor') {
        terms.length = 0;
        terms.push(
            '• This pass is valid for a single visit only.',
            '• Visitor must be accompanied by authorized staff.',
            '• Valid only for registered blood-relatives.',
            '• Must be returned to the office after visit.',
            '• Unauthorized persons will not be permitted.'
        );
    }

    ctx.textAlign = 'left';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#6b7280';
    let termY = termsY + 35;
    terms.forEach(term => {
        ctx.fillText(term, 70, termY);
        termY += 25;
    });

    // ── Address & Contact Section ──
    const contactY = termY + 30;

    // Decorative line
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

    // ── Person address if available ──
    const personAddr = state.currentCardType === 'visitor' ? '' : (personAddressInput.value || '');
    if (personAddr) {
        ctx.fillText('🏠 ' + personAddr, W / 2, contactY + 120);
    }

    // ── Bottom Footer ──
    const footerGrad = ctx.createLinearGradient(0, H - 70, 0, H);
    footerGrad.addColorStop(0, themeColor);
    footerGrad.addColorStop(1, darkenColor(themeColor, 15));
    ctx.fillStyle = footerGrad;
    ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, H - 60, W, 3);

    // Signature area
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    
    // Left signature
    ctx.textAlign = 'left';
    ctx.fillText('______________________', 70, H - 85);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Holder\'s Signature', 100, H - 72);

    // Right signature
    ctx.textAlign = 'right';
    ctx.fillText('______________________', W - 70, H - 85);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Authorized Signature', W - 100, H - 72);

    // Footer text
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Designed with ❤ by College ID Card System', W / 2, H - 20);
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
        filename = (visitorNameInput.value || 'visitor') + '_' + side;
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
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}


// ═══════════════════════════════════════════════
//  BOOTSTRAP
// ═══════════════════════════════════════════════

window.onload = init;

// Expose functions to global scope for onclick handlers
window.switchInstitution = switchInstitution;
window.switchCardType = switchCardType;
window.setThemeColor = setThemeColor;
window.toggleSide = toggleSide;
window.downloadCard = downloadCard;
window.downloadBothSides = downloadBothSides;
window.resetPhotoPosition = resetPhotoPosition;
