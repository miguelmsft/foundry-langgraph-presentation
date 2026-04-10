import gsap from 'gsap';

const DURATION = 0.55;
const EASE = 'power2.inOut';
let activeContentTL = null;

function getTransitionType(slide) {
  const type = slide?.dataset?.type || 'content';
  switch (type) {
    case 'title-slide': return 'zoom';
    case 'transition': case 'recap': return 'dissolve';
    case 'code-example': return 'fade-scale';
    default: return 'slide';
  }
}

function killAllTweens(slide) {
  if (!slide) return;
  gsap.killTweensOf(slide);
  gsap.killTweensOf(slide.querySelectorAll('*'));
}

export function transitionSlide(oldSlide, newSlide, direction, onComplete) {
  const transType = getTransitionType(newSlide);
  if (activeContentTL) { activeContentTL.kill(); activeContentTL = null; }
  killAllTweens(oldSlide);
  killAllTweens(newSlide);

  const xDir = direction === 'right' ? 1 : -1;

  // Position BEFORE making visible (prevents flash)
  switch (transType) {
    case 'zoom':
      gsap.set(newSlide, { opacity: 0, scale: 0.92, xPercent: 0 }); break;
    case 'dissolve':
      gsap.set(newSlide, { opacity: 0, xPercent: 0 }); break;
    case 'fade-scale':
      gsap.set(newSlide, { opacity: 0, scale: 0.97, y: 12, xPercent: 0 }); break;
    default:
      gsap.set(newSlide, { opacity: 0, xPercent: 100 * xDir }); break;
  }

  newSlide.style.visibility = 'visible';
  newSlide.classList.add('active');

  const tl = gsap.timeline({
    onComplete: () => { cleanupOld(oldSlide); if (onComplete) onComplete(); }
  });

  switch (transType) {
    case 'zoom':
      tl.to(oldSlide, { opacity: 0, scale: 1.05, duration: DURATION, ease: EASE, overwrite: 'auto' }, 0);
      tl.to(newSlide, { opacity: 1, scale: 1, duration: DURATION, ease: EASE, overwrite: 'auto' }, 0);
      break;
    case 'dissolve':
      tl.to(oldSlide, { opacity: 0, duration: DURATION * 0.8, ease: 'power1.out', overwrite: 'auto' }, 0);
      tl.to(newSlide, { opacity: 1, duration: DURATION, ease: 'power1.in', overwrite: 'auto' }, 0);
      break;
    case 'fade-scale':
      tl.to(oldSlide, { opacity: 0, scale: 1.02, duration: DURATION * 0.7, ease: EASE, overwrite: 'auto' }, 0);
      tl.to(newSlide, { opacity: 1, scale: 1, y: 0, duration: DURATION, ease: EASE, overwrite: 'auto' }, 0);
      break;
    default:
      tl.to(oldSlide, { opacity: 0, xPercent: -30 * xDir, duration: DURATION, ease: EASE, overwrite: 'auto' }, 0);
      tl.to(newSlide, { opacity: 1, xPercent: 0, duration: DURATION, ease: EASE, overwrite: 'auto' }, 0);
      break;
  }
}

function cleanupOld(slide) {
  slide.classList.remove('active');
  gsap.set(slide, { opacity: 0, visibility: 'hidden', x: 0, y: 0, xPercent: 0, scale: 1 });
}

export function animateSlideContent(slide) {
  if (activeContentTL) { activeContentTL.kill(); activeContentTL = null; }
  killAllTweens(slide);
}
