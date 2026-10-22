import './style.css';
import { flowers, flowerById, validateCatalog } from './data/flowers.js';
import { createVisitState } from './core/visit.js';
import { createWorld } from './scene/world.js';
import { makePortraits } from './ui/portraits.js';

const $ = selector => document.querySelector(selector);
const state = createVisitState();
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduced = preference.matches, manualMotion = false, world = null;
const portraits = new Map();

function showFlower(id) {
  const flower = flowerById.get(id); if (!flower) return;
  $('#detail-name').textContent = flower.name;
  $('#detail-english').textContent = flower.english;
  $('#detail-family').textContent = flower.family;
  $('#detail-description').textContent = flower.description;
  $('#detail-meaning').textContent = `“${flower.meaning}”`;
  const image = document.createElement('img'); image.src = portraits.get(id); image.alt = `ดอก${flower.name}สามมิติในกระถางดินปั้น`;
  $('#flower-portrait').replaceChildren(image);
  $('#flower-dialog').dataset.flowerId = id;
  world?.setPaused(true);
  if (!$('#flower-dialog').open) $('#flower-dialog').showModal();
}

function setMotion(value) {
  reduced = value;
  $('#motion-button').setAttribute('aria-pressed', String(value));
  $('#motion-button').setAttribute('aria-label', value ? 'เปิดการเคลื่อนไหว' : 'ลดการเคลื่อนไหว');
  $('#motion-button span').textContent = value ? 'ลดการเคลื่อนไหวแล้ว' : 'เคลื่อนไหวปกติ';
  world?.setReducedMotion(value);
}

function finishVisit(phase) {
  state.complete(); document.body.dataset.view = phase;
  $('#back-button').disabled = false;
  $('#intro').hidden = phase === 'inside';
  $('#inside-title').hidden = phase !== 'inside';
  $('#greeting').hidden = phase !== 'inside';
  $('#scene-caption').hidden = phase === 'inside';
  $('#open-button').disabled = false;
  (phase === 'inside' ? $('#back-button') : $('#open-button')).focus({ preventScroll: true });
}

$('#open-button').addEventListener('click', () => {
  if (!world || !state.enter()) return;
  $('#open-button').disabled = true;
  $('#intro').hidden = true;
  $('#scene-caption').hidden = true;
  world.enter();
});
$('#back-button').addEventListener('click', () => {
  if (!world || !state.leave()) return;
  $('#back-button').disabled = true; $('#greeting').hidden = true; world.leave();
});
$('#greeting-close').addEventListener('click', () => { $('#greeting').hidden = true; });
$('#motion-button').addEventListener('click', () => { manualMotion = true; setMotion(!reduced); });
preference.addEventListener('change', event => { if (!manualMotion) setMotion(event.matches); });
$('#help-button').addEventListener('click', () => { world?.setPaused(true); $('#help-dialog').showModal(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
}));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('close', () => world?.setPaused(false)));
$('#reload-button').addEventListener('click', () => window.location.reload());

// Yield one frame so the loading state is painted even on slower mobile devices.
requestAnimationFrame(() => setTimeout(() => {
  try {
    validateCatalog(flowers);
    makePortraits(flowers).forEach((url, id) => portraits.set(id, url));
    for (const [index, flower] of flowers.entries()) {
      const button = document.createElement('button'); button.className = 'flower-item'; button.dataset.flowerId = flower.id;
      button.setAttribute('aria-label', `สำรวจ${flower.name} ${flower.english}`);
      const image = document.createElement('img'); image.src = portraits.get(flower.id); image.alt = ''; image.width = 80; image.height = 56;
      const name = document.createElement('span'); name.className = 'flower-name'; name.textContent = flower.name;
      const number = document.createElement('span'); number.className = 'flower-index'; number.textContent = String(index + 1).padStart(2, '0');
      button.append(number, image, name); button.addEventListener('click', () => showFlower(flower.id)); $('#flower-list').append(button);
    }
    $('.flower-count').textContent = `01 — ${String(flowers.length).padStart(2, '0')}`;
    world = createWorld($('#scene'), { onFlower: showFlower, onVisitComplete: finishVisit, reducedMotion: reduced });
    world.renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault(); world.dispose(); world = null; $('#error').hidden = false;
    });
    document.body.dataset.view = 'outside';
    $('#open-label').textContent = 'Welcome / Open'; $('#open-button').disabled = false;
    setMotion(reduced); $('#loading').hidden = true;
  } catch (error) {
    console.error('Bloomie Days could not start:', error);
    world?.dispose(); $('#loading').hidden = true; $('#error').hidden = false;
  }
}, 0));

if (import.meta.hot) import.meta.hot.dispose(() => world?.dispose());
