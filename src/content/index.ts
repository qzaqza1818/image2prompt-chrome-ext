import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import type { Root } from 'react-dom/client';
import { OverlayButton } from './overlay';

let hostEl: HTMLElement | null = null;
let reactRoot: Root | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function removeOverlay() {
  reactRoot?.unmount();
  reactRoot = null;
  hostEl?.remove();
  hostEl = null;
}

function showOverlay(img: HTMLImageElement) {
  if (!img.src || img.src.startsWith('data:')) return;

  removeOverlay();

  const rect = img.getBoundingClientRect();
  if (rect.width < 40 || rect.height < 40) return; // skip tiny images

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
  hostEl = host;

  reactRoot = createRoot(container);
  reactRoot.render(createElement(OverlayButton, { imageUrl: img.src }));
}

document.addEventListener('mouseover', (e) => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG') {
    showOverlay(target as HTMLImageElement);
  }
});

document.addEventListener('mouseout', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG') {
    hideTimer = setTimeout(removeOverlay, 300);
  }
});
