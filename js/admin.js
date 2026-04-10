// Admin Panel Logic
const LS_THEME = 'pres-theme';
const LS_NOTES = 'pres-notes';
const LS_HIDDEN = 'pres-hidden-slides';

let onThemeChange = null;
let onNotesToggle = null;
let onGoToSlide = null;
let onHiddenChange = null;

export function initAdmin({ totalSlides, slideNames, onTheme, onNotes, onGoto, onHidden }) {
  onThemeChange = onTheme;
  onNotesToggle = onNotes;
  onGoToSlide = onGoto;
  onHiddenChange = onHidden;

  const toggle = document.getElementById('admin-toggle');
  const overlay = document.getElementById('admin-overlay');
  const panel = document.getElementById('admin-panel');

  // Toggle panel
  toggle.addEventListener('click', () => {
    panel.classList.toggle('open');
    overlay.classList.toggle('visible');
  });

  overlay.addEventListener('click', () => {
    panel.classList.remove('open');
    overlay.classList.remove('visible');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      panel.classList.remove('open');
      overlay.classList.remove('visible');
      e.stopPropagation();
    }
  });

  // Theme
  const themeSelect = document.getElementById('theme-select');
  const savedTheme = localStorage.getItem(LS_THEME) || 'github-cosmos';
  themeSelect.value = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeSelect.addEventListener('change', () => {
    const theme = themeSelect.value;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LS_THEME, theme);
    if (onThemeChange) onThemeChange(theme);
  });

  // Notes toggle
  const notesToggle = document.getElementById('notes-toggle');
  const savedNotes = localStorage.getItem(LS_NOTES) === 'true';
  notesToggle.checked = savedNotes;
  if (onNotesToggle) onNotesToggle(savedNotes);

  notesToggle.addEventListener('change', () => {
    const show = notesToggle.checked;
    localStorage.setItem(LS_NOTES, show);
    if (onNotesToggle) onNotesToggle(show);
  });

  // Go to slide
  const gotoInput = document.getElementById('goto-input');
  const gotoBtn = document.getElementById('goto-btn');

  gotoBtn.addEventListener('click', () => {
    const num = parseInt(gotoInput.value, 10);
    if (num >= 1 && num <= totalSlides && onGoToSlide) {
      onGoToSlide(num);
      panel.classList.remove('open');
      overlay.classList.remove('visible');
    }
  });

  gotoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      gotoBtn.click();
      e.stopPropagation();
    }
    e.stopPropagation();
  });

  // PDF export
  const pdfBtn = document.getElementById('pdf-btn');
  pdfBtn.addEventListener('click', () => {
    const hidden = getHiddenSlides();
    const allSlides = document.querySelectorAll('.slide');
    allSlides.forEach((s) => {
      const num = parseInt(s.dataset.number, 10);
      if (hidden.has(num)) {
        s.classList.add('print-hidden');
      }
      s.classList.add('active');
      s.style.opacity = '1';
      s.style.visibility = 'visible';
    });
    window.print();
    allSlides.forEach((s) => {
      s.classList.remove('print-hidden');
    });
  });

  // Slide checklist
  const checklist = document.getElementById('slide-checklist');
  const hidden = getHiddenSlides();

  for (let i = 1; i <= totalSlides; i++) {
    const item = document.createElement('div');
    item.className = 'slide-check-item' + (hidden.has(i) ? ' is-hidden' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !hidden.has(i);
    cb.dataset.slideNum = i;

    const lbl = document.createElement('span');
    lbl.textContent = `${i}. ${slideNames[i - 1] || 'Slide ' + i}`;

    cb.addEventListener('change', () => {
      const current = getHiddenSlides();
      if (cb.checked) {
        current.delete(i);
        item.classList.remove('is-hidden');
      } else {
        current.add(i);
        item.classList.add('is-hidden');
      }
      localStorage.setItem(LS_HIDDEN, JSON.stringify([...current]));
      if (onHiddenChange) onHiddenChange(current);
    });

    item.appendChild(cb);
    item.appendChild(lbl);
    checklist.appendChild(item);
  }
}

export function getHiddenSlides() {
  try {
    const raw = localStorage.getItem(LS_HIDDEN);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}
