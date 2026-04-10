import { transitionSlide, animateSlideContent } from './transitions.js';
import { initAdmin, getHiddenSlides } from './admin.js';

const TOTAL_SLIDES = 38;
const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const LS_CURRENT = 'pres-current-slide';

let currentSlide = 1;
let isTransitioning = false;
let slides = [];
let hiddenSlides = new Set();
let notesVisible = false;
let lastScale = -1;

const scaler = document.getElementById('slide-scaler');
const container = document.getElementById('slide-container');
const counter = document.getElementById('slide-counter');
const sectionLabel = document.getElementById('section-label');
const progressBar = document.getElementById('progress-bar');
const notesOverlay = document.getElementById('notes-overlay');

// Viewport scaling
function fitToViewport() {
  const scaleX = window.innerWidth / DESIGN_WIDTH;
  const scaleY = window.innerHeight / DESIGN_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  if (scale !== lastScale) {
    scaler.style.transform = `translate(-50%, -50%) scale(${scale})`;
    lastScale = scale;
  }
}

window.addEventListener('resize', () => requestAnimationFrame(fitToViewport));

// Slide loading
async function loadSlide(num) {
  const padded = String(num).padStart(3, '0');
  const url = `${import.meta.env.BASE_URL}slides/slide-${padded}.html`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load slide ${num}`);
    const html = await resp.text();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const slide = wrapper.querySelector('.slide');
    if (slide) {
      container.appendChild(slide);
      return slide;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function loadAllSlides() {
  const promises = [];
  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    promises.push(loadSlide(i));
  }
  slides = await Promise.all(promises);
}

// Visible slides management
function getVisibleSlides() {
  return slides.filter((s, i) => s && !hiddenSlides.has(i + 1));
}

function getVisibleIndex() {
  const visible = getVisibleSlides();
  const currentEl = slides[currentSlide - 1];
  return visible.indexOf(currentEl);
}

function getSlideElement(num) {
  return slides[num - 1] || null;
}

// Navigation
function goToSlide(num, direction = 'right') {
  if (num < 1 || num > TOTAL_SLIDES || num === currentSlide || isTransitioning) return;

  const oldSlide = getSlideElement(currentSlide);
  const newSlide = getSlideElement(num);
  if (!oldSlide || !newSlide) return;

  isTransitioning = true;

  transitionSlide(oldSlide, newSlide, direction, () => {
    setTimeout(() => { isTransitioning = false; }, 80);
  });

  currentSlide = num;
  localStorage.setItem(LS_CURRENT, currentSlide);
  updateUI();
}

function nextSlide() {
  const visible = getVisibleSlides();
  const idx = getVisibleIndex();
  if (idx < visible.length - 1) {
    const nextEl = visible[idx + 1];
    const nextNum = parseInt(nextEl.dataset.number, 10);
    goToSlide(nextNum, 'right');
  }
}

function prevSlide() {
  const visible = getVisibleSlides();
  const idx = getVisibleIndex();
  if (idx > 0) {
    const prevEl = visible[idx - 1];
    const prevNum = parseInt(prevEl.dataset.number, 10);
    goToSlide(prevNum, 'left');
  }
}

function goToFirst() {
  const visible = getVisibleSlides();
  if (visible.length > 0) {
    const num = parseInt(visible[0].dataset.number, 10);
    goToSlide(num, 'left');
  }
}

function goToLast() {
  const visible = getVisibleSlides();
  if (visible.length > 0) {
    const num = parseInt(visible[visible.length - 1].dataset.number, 10);
    goToSlide(num, 'right');
  }
}

// UI updates
function updateUI() {
  const visible = getVisibleSlides();
  const idx = getVisibleIndex();
  const totalVisible = visible.length;

  // Counter
  counter.textContent = `${idx + 1} / ${totalVisible}`;

  // Section label
  const currentEl = getSlideElement(currentSlide);
  if (currentEl) {
    sectionLabel.textContent = currentEl.dataset.section || '';
  }

  // Progress bar
  const progress = totalVisible > 1 ? (idx / (totalVisible - 1)) * 100 : 100;
  progressBar.style.width = `${progress}%`;

  // Speaker notes
  updateNotes();
}

function updateNotes() {
  if (!notesVisible) {
    notesOverlay.classList.remove('visible');
    return;
  }
  const currentEl = getSlideElement(currentSlide);
  if (currentEl) {
    const notes = currentEl.querySelector('.speaker-notes');
    notesOverlay.innerHTML = `<h4>Speaker Notes</h4><p>${notes ? notes.innerHTML : 'No notes for this slide.'}</p>`;
    notesOverlay.classList.add('visible');
  }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  // Don't handle if admin panel is focused
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ':
    case 'PageDown':
      e.preventDefault();
      nextSlide();
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      e.preventDefault();
      prevSlide();
      break;
    case 'Home':
      e.preventDefault();
      goToFirst();
      break;
    case 'End':
      e.preventDefault();
      goToLast();
      break;
    case 'f':
    case 'F':
      e.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
      break;
  }
});

// Touch navigation
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) nextSlide();
    else prevSlide();
  }
}, { passive: true });

// Slide names for admin checklist
const SLIDE_NAMES = [
  'LangGraph Agents on Microsoft Foundry',
  'What is Microsoft Foundry v2?',
  'The 3 Agent Types',
  'Why Hosted Agents?',
  'How Hosted Agents Work',
  'The Hosting Adapter',
  'What Foundry Manages For You',
  'agent.yaml',
  'azure.yaml',
  'Dockerfile',
  'One Command Deployment: azd up',
  'Telemetry & Monitoring',
  'What is LangGraph?',
  'The ReAct Pattern',
  'Building a LangGraph Agent',
  'Giving Your Agent Tools',
  'The Integration Stack',
  'Connecting to Foundry Models',
  'from_langgraph() Bridge',
  'Deployment Flow',
  'What You Get After Deployment',
  'Gotchas & Lessons Learned',
  'Demo: Logistics Analyst Agent',
  'The Scenario',
  'The Data',
  'How the Agent Works',
  'The System Prompt',
  'The Tools',
  'The Complete Architecture',
  'LIVE DEMO: Agent in Action',
  'LIVE DEMO: Foundry Portal',
  'Sample Output: Stock Shortages',
  'Sample Output: Supplier Scorecard',
  'Telemetry Verification',
  'Demo: Key Takeaways',
  'What\'s Next: MCP & A2A',
  'Resources',
  'Thank You / Q&A',
];

// Initialize
async function init() {
  fitToViewport();
  await loadAllSlides();

  hiddenSlides = getHiddenSlides();

  // Restore saved slide
  const saved = parseInt(localStorage.getItem(LS_CURRENT), 10);
  if (saved >= 1 && saved <= TOTAL_SLIDES && !hiddenSlides.has(saved)) {
    currentSlide = saved;
  } else {
    const visible = getVisibleSlides();
    currentSlide = visible.length > 0 ? parseInt(visible[0].dataset.number, 10) : 1;
  }

  // Show initial slide
  const initialSlide = getSlideElement(currentSlide);
  if (initialSlide) {
    initialSlide.style.visibility = 'visible';
    initialSlide.style.opacity = '1';
    initialSlide.classList.add('active');
  }

  updateUI();

  // Init admin
  initAdmin({
    totalSlides: TOTAL_SLIDES,
    slideNames: SLIDE_NAMES,
    onTheme: () => {},
    onNotes: (show) => {
      notesVisible = show;
      updateNotes();
    },
    onGoto: (num) => {
      if (!hiddenSlides.has(num)) {
        const dir = num > currentSlide ? 'right' : 'left';
        goToSlide(num, dir);
      }
    },
    onHidden: (newHidden) => {
      hiddenSlides = newHidden;
      // If current slide is now hidden, move to next visible
      if (hiddenSlides.has(currentSlide)) {
        const visible = getVisibleSlides();
        if (visible.length > 0) {
          const num = parseInt(visible[0].dataset.number, 10);
          goToSlide(num, 'right');
        }
      }
      updateUI();
    },
  });
}

init();
