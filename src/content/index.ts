import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import type { Root } from 'react-dom/client';
import { OverlayButton } from './overlay';
import { PromptModal } from './modal';
import type { AnalysisCompleteMessage, AnalysisResult } from '../shared/types';

// --- Extension enabled state ---
let extensionEnabled = true;
chrome.storage.local.get('extensionEnabled').then((data) => {
  extensionEnabled = data.extensionEnabled !== false;
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'extensionEnabled' in changes) {
    extensionEnabled = changes.extensionEnabled.newValue !== false;
    if (!extensionEnabled) { removeOverlay(); removeModal(); }
  }
});

// --- Overlay state ---
let overlayHostEl: HTMLElement | null = null;
let overlayRoot: Root | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let isAnalyzing = false;
let currentImg: HTMLImageElement | null = null;
let currentImgRect: DOMRect | null = null;

// --- Modal state ---
let modalHostEl: HTMLElement | null = null;
let modalRoot: Root | null = null;

function removeOverlay() {
  overlayRoot?.unmount();
  overlayRoot = null;
  overlayHostEl?.remove();
  overlayHostEl = null;
}

function removeModal() {
  modalRoot?.unmount();
  modalRoot = null;
  modalHostEl?.remove();
  modalHostEl = null;
}

function calcAspectRatio(w: number, h: number): string {
  if (!w || !h) return '';
  const ratio = w / h;
  const standards = [
    { label: '1:1',   value: 1 / 1 },
    { label: '4:5',   value: 4 / 5 },
    { label: '5:4',   value: 5 / 4 },
    { label: '3:4',   value: 3 / 4 },
    { label: '4:3',   value: 4 / 3 },
    { label: '2:3',   value: 2 / 3 },
    { label: '3:2',   value: 3 / 2 },
    { label: '9:16',  value: 9 / 16 },
    { label: '16:9',  value: 16 / 9 },
    { label: '16:10', value: 16 / 10 },
    { label: '9:21',  value: 9 / 21 },
    { label: '21:9',  value: 21 / 9 },
  ];
  let closest = standards[0];
  let minDiff = Math.abs(ratio - standards[0].value);
  for (const s of standards.slice(1)) {
    const diff = Math.abs(ratio - s.value);
    if (diff < minDiff) { minDiff = diff; closest = s; }
  }
  return closest.label;
}

function showOverlay(img: HTMLImageElement) {
  const src = img.currentSrc || img.src;
  if (!src || src.startsWith('data:')) return;

  removeOverlay();

  const rect = img.getBoundingClientRect();
  if (rect.width < 40 || rect.height < 40) return;

  currentImg = img;
  currentImgRect = rect;

  const aspectRatio = calcAspectRatio(img.naturalWidth, img.naturalHeight);

  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    `top:${rect.top}px`,
    `left:${rect.left}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    'z-index:2147483647',
    'pointer-events:none',
  ].join(';');

  const shadow = host.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  container.style.cssText = 'width:100%;height:100%;position:relative;pointer-events:none';
  shadow.appendChild(container);

  document.body.appendChild(host);
  overlayHostEl = host;

  overlayRoot = createRoot(container);
  overlayRoot.render(
    createElement(OverlayButton, {
      imageUrl: src,
      aspectRatio,
      onAnalyzing: () => { isAnalyzing = true; },
    })
  );
}

function showModal(result: AnalysisResult) {
  removeModal();
  removeOverlay();
  isAnalyzing = false;

  const rect = currentImgRect;
  if (!rect) return;

  const MODAL_W = 440;
  const MODAL_MAX_H = 490;

  // Prefer right side; fall back to left
  const spaceRight = window.innerWidth - rect.right - 12;
  let left = spaceRight >= MODAL_W
    ? rect.right + 12
    : Math.max(8, rect.left - MODAL_W - 12);

  // Clamp horizontally
  left = Math.max(8, Math.min(left, window.innerWidth - MODAL_W - 8));

  // Clamp vertically
  let top = rect.top;
  if (top + MODAL_MAX_H > window.innerHeight - 12) {
    top = Math.max(8, window.innerHeight - MODAL_MAX_H - 12);
  }

  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    `top:${top}px`,
    `left:${left}px`,
    `width:${MODAL_W}px`,
    'z-index:2147483647',
    'pointer-events:none',
  ].join(';');

  const shadow = host.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  container.style.cssText = 'width:100%;pointer-events:auto;';
  shadow.appendChild(container);

  document.body.appendChild(host);
  modalHostEl = host;

  modalRoot = createRoot(container);
  modalRoot.render(
    createElement(PromptModal, { result, onClose: removeModal })
  );
}

// Listen for analysis result from background
chrome.runtime.onMessage.addListener((message: AnalysisCompleteMessage) => {
  if (message.type === 'ANALYSIS_COMPLETE') {
    showModal(message.result);
  }
});

// Close modal on outside click
document.addEventListener('click', () => {
  if (modalHostEl) removeModal();
});

/** Walk composedPath to find the nearest img element (handles overlays on top of images). */
function findImg(e: MouseEvent): HTMLImageElement | null {
  // 1. composedPath — most reliable, sees through shadow DOM and overlays
  const path = e.composedPath ? e.composedPath() : [];
  for (const node of path) {
    if (node instanceof HTMLImageElement) return node;
  }
  // 2. Walk ancestors of target
  let el = e.target as HTMLElement | null;
  while (el) {
    if (el instanceof HTMLImageElement) return el;
    el = el.parentElement;
  }
  // 3. elementFromPoint fallback — finds what's visually under the cursor
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  if (hit instanceof HTMLImageElement) return hit;
  let parent = hit?.parentElement ?? null;
  while (parent) {
    if (parent instanceof HTMLImageElement) return parent;
    parent = parent.parentElement;
  }
  return null;
}

// Use capture:true so Pinterest/other SPAs can't block us with stopPropagation
document.addEventListener('mouseover', (e) => {
  if (!extensionEnabled) return;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (isAnalyzing || modalHostEl) return;
  const img = findImg(e);
  if (img) showOverlay(img);
}, true);

document.addEventListener('mouseout', (e) => {
  if (isAnalyzing) return;
  const img = findImg(e);
  if (img) hideTimer = setTimeout(removeOverlay, 300);
}, true);
