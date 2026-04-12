import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import type { Root } from 'react-dom/client';
import { OverlayButton } from './overlay';
import { PromptModal } from './modal';
import type { AnalysisCompleteMessage, AnalysisResult } from '../shared/types';

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

function showOverlay(img: HTMLImageElement) {
  const src = img.currentSrc || img.src;
  if (!src || src.startsWith('data:')) return;

  removeOverlay();

  const rect = img.getBoundingClientRect();
  if (rect.width < 40 || rect.height < 40) return;

  currentImg = img;
  currentImgRect = rect;

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
