import './style.css';
import { flowers, flowerById, validateCatalog } from './data/flowers.js';
import { createVisitState } from './core/visit.js';
import { getCatalogPage } from './core/catalog.js';
import { createWorld } from './scene/world.js';
import { createPortraitCache } from './ui/portraits.js';

const $ = selector => document.querySelector(selector);
const state = createVisitState();
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const portraits = createPortraitCache();
let reduced = preference.matches, manualMotion = false, world = null;
let page = 0, query = '', portraitFrame = null, disposed = false;

function stopPortraitQueue() {
  if (portraitFrame !== null) cancelAnimationFrame(portraitFrame);
  portraitFrame = null;
  $('#flower-list').setAttribute('aria-busy', 'false');
}

function renderCatalog({ focus = false } = {}) {
  stopPortraitQueue();
  const result = getCatalogPage(flowers, { page, query }); page = result.page;
  const tasks = [];
  $('#flower-list').replaceChildren(); $('#flower-list').scrollTop = 0;
  for (const flower of result.entries) {
    const button = document.createElement('button'); button.className = 'flower-item'; button.dataset.flowerId = flower.id;
    button.setAttribute('aria-label', `สำรวจ${flower.name} ${flower.english}`);
    const mark = document.createElement('span'); mark.className = 'flower-mark'; mark.textContent = '✿'; mark.style.color = flower.color; mark.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img'); image.alt = ''; image.width = 100; image.height = 100; image.hidden = true;
    const name = document.createElement('span'); name.className = 'flower-name'; name.textContent = flower.name;
    const english = document.createElement('span'); english.className = 'flower-english'; english.textContent = flower.english;
    button.append(mark, image, name, english); button.addEventListener('click', () => showFlower(flower.id));
    $('#flower-list').append(button); tasks.push({ flower, image, mark });
  }
  $('.flower-count').textContent = `${flowers.length} BLOOMS`;
  $('#catalog-results').textContent = result.total ? `${result.start}–${result.end} จาก ${result.total} ชนิด` : 'ไม่พบดอกไม้';
  $('#catalog-page').textContent = `${result.page + 1} / ${result.pageCount}`;
  $('#catalog-empty').hidden = result.total !== 0;
  $('#previous-page').disabled = result.page === 0;
  $('#next-page').disabled = result.page === result.pageCount - 1;
  if (focus) $('#flower-list').focus({ preventScroll: true });
  $('#flower-list').setAttribute('aria-busy', String(tasks.length > 0));
  function nextPortrait() {
    portraitFrame = null;
    if (disposed || state.phase !== 'browsing') return stopPortraitQueue();
    const task = tasks.shift();
    if (task) { task.image.src = portraits.get(task.flower); task.image.hidden = false; task.mark.hidden = true; }
    if (tasks.length) portraitFrame = requestAnimationFrame(nextPortrait);
    else $('#flower-list').setAttribute('aria-busy', 'false');
  }
  if (tasks.length) portraitFrame = requestAnimationFrame(nextPortrait);
}

function showFlower(id) {
  if (state.phase !== 'browsing' || !world) return;
  const flower = flowerById.get(id); if (!flower) return;
  $('#detail-name').textContent = flower.name;
  $('#detail-english').textContent = flower.english;
  $('#detail-family').textContent = flower.family;
  $('#detail-description').textContent = flower.description;
  $('#detail-meaning').textContent = `“${flower.meaning}”`;
  const image = document.createElement('img'); image.src = portraits.get(flower); image.alt = `ดอก${flower.name}สามมิติในกระถางดินปั้น`;
  $('#flower-portrait').replaceChildren(image);
  $('#flower-dialog').dataset.flowerId = id;
  world.setPaused(true);
  if (!$('#flower-dialog').open) $('#flower-dialog').showModal();
}

function renderPhase() {
  const phase = state.phase;
  document.body.dataset.view = phase;
  $('#intro').hidden = phase !== 'outside';
  $('#inside-toolbar').hidden = !['introducing', 'browsing'].includes(phase);
  $('#greeting').hidden = phase !== 'introducing';
  $('#flower-browser').hidden = phase !== 'browsing';
  $('#open-button').disabled = !world || phase !== 'outside';
  $('#continue-button').disabled = phase !== 'introducing';
  const status = { entering: 'กำลังเปิดประตูต้อนรับคุณ…', 'moving-to-flowers': 'ตามฟลอร่าไปชมมุมดอกไม้กันนะคะ…', leaving: 'ค่อย ๆ กลับไปหน้าร้าน…' }[phase];
  $('#journey-status').hidden = !status;
  $('#journey-status').textContent = status || '';
}

function finishVisit(phase) {
  if (!state.complete() || state.phase !== phase) return;
  renderPhase();
  if (phase === 'browsing') {
    page = 0; query = ''; $('#flower-search').value = ''; renderCatalog();
    $('#browser-title').focus({ preventScroll: true });
  } else if (phase === 'introducing') $('#greeting-name').focus({ preventScroll: true });
  else $('#open-button').focus({ preventScroll: true });
}

function setMotion(value) {
  reduced = value;
  $('#motion-button').setAttribute('aria-pressed', String(value));
  $('#motion-button').setAttribute('aria-label', value ? 'เปิดการเคลื่อนไหว' : 'ลดการเคลื่อนไหว');
  $('#motion-button span').textContent = value ? 'ลดการเคลื่อนไหวแล้ว' : 'เคลื่อนไหวปกติ';
  world?.setReducedMotion(value);
}

$('#open-button').addEventListener('click', () => {
  if (!world || !state.enter()) return;
  renderPhase(); world.enter();
});
$('#continue-button').addEventListener('click', () => {
  if (!world || !state.finishIntro()) return;
  renderPhase(); world.browse();
});
$('#back-button').addEventListener('click', () => {
  if (!world || !state.leave()) return;
  stopPortraitQueue(); renderPhase(); world.leave();
});
$('#previous-page').addEventListener('click', () => { page--; renderCatalog({ focus: true }); });
$('#next-page').addEventListener('click', () => { page++; renderCatalog({ focus: true }); });
$('#flower-search').addEventListener('input', event => { query = event.target.value; page = 0; renderCatalog(); });
$('#motion-button').addEventListener('click', () => { manualMotion = true; setMotion(!reduced); });
preference.addEventListener('change', event => { if (!manualMotion) setMotion(event.matches); });
$('#help-button').addEventListener('click', () => { world?.setPaused(true); $('#help-dialog').showModal(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => world?.setPaused(false));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});
$('#reload-button').addEventListener('click', () => window.location.reload());

function fail(error) {
  console.error('Bloomie Days could not continue:', error);
  stopPortraitQueue(); portraits.dispose(); world?.dispose(); world = null;
  $('#loading').hidden = true; $('#error').hidden = false;
}

requestAnimationFrame(() => setTimeout(() => {
  if (disposed) return;
  try {
    validateCatalog(flowers);
    world = createWorld($('#scene'), { onFlower: showFlower, onVisitComplete: finishVisit, reducedMotion: reduced });
    world.renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fail(new Error('WebGL context lost')); });
    renderPhase(); setMotion(reduced); $('#loading').hidden = true;
  } catch (error) { fail(error); }
}, 0));

if (import.meta.hot) import.meta.hot.dispose(() => { disposed = true; stopPortraitQueue(); portraits.dispose(); world?.dispose(); });
