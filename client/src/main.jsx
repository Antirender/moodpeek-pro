import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@picocss/pico/css/pico.min.css"
import "./styles/mood.css"
import "./styles/semantic.css"
import "./styles/pico-overrides.css"
import "./styles/print.css" // Import print styles for PDF export
import "./styles/responsive.css" // Import responsive utilities
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { getTheme, applyTheme } from './lib/theme'
import { loadImageURL, purgeExternalUrls } from './lib/imageLoader'

const HERO_CACHE_KEY = 'moodpeek::hero-bg';
const HERO_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const HERO_QUERY = 'calm sky aurora';
const HERO_SIZE = { w: 1600, h: 900 };
const HERO_FALLBACK = 'linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(235,243,255,0.6) 45%, rgba(222,247,236,0.65) 100%)';

let hasPurgedCache = false;
let heroStylesInjected = false;
let heroSetupStarted = false;

function ensurePurgeOnce() {
  if (hasPurgedCache) return;
  hasPurgedCache = true;
  purgeExternalUrls();
}

// Apply saved theme on initial load
applyTheme(getTheme())

// Purge any external image URLs from localStorage (guarded to avoid duplicate logs in dev)
ensurePurgeOnce()

function ensureBackgroundElement() {
  let bgElement = document.getElementById('bg-premade');
  if (!bgElement) {
    bgElement = document.createElement('div');
    bgElement.id = 'bg-premade';
    bgElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bgElement);
  }
  if (!heroStylesInjected) {
    heroStylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
      #bg-premade {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: -1;
        background-size: cover;
        background-position: center;
        opacity: 0.18;
        transition: background-image 1s ease, opacity 0.5s ease;
        background-image: ${HERO_FALLBACK};
      }
      @media (prefers-color-scheme: dark) {
        #bg-premade {
          opacity: 0.1;
        }
      }
    `;
    document.head.appendChild(style);
  }
  return bgElement;
}

function readCachedHero() {
  try {
    const cached = localStorage.getItem(HERO_CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (!parsed?.url || !parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > HERO_CACHE_TTL) {
      localStorage.removeItem(HERO_CACHE_KEY);
      return null;
    }
    return parsed.url;
  } catch (error) {
    console.warn('[hero-bg] Failed to read cache', error);
    return null;
  }
}

function writeCachedHero(url) {
  try {
    localStorage.setItem(HERO_CACHE_KEY, JSON.stringify({ url, savedAt: Date.now() }));
  } catch (error) {
    console.warn('[hero-bg] Failed to persist cache', error);
  }
}

function clearHeroCache() {
  try {
    localStorage.removeItem(HERO_CACHE_KEY);
  } catch (error) {
    // ignore cache clear failures
  }
}

function preload(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function resolveHeroUrl() {
  const cachedUrl = readCachedHero();
  if (cachedUrl) {
    const isValid = await preload(cachedUrl);
    if (isValid) {
      console.info('[hero-bg] Reusing cached background');
      return cachedUrl;
    }
    clearHeroCache();
  }

  try {
    const result = await loadImageURL('hero', HERO_QUERY, HERO_SIZE);
    writeCachedHero(result.url);
    console.info('[hero-bg] Loaded fresh background from', result.source);
    return result.url;
  } catch (error) {
    console.warn('[hero-bg] Failed to fetch Unsplash hero', error);
    return null;
  }
}

function setupHeroBackground() {
  if (heroSetupStarted) return;
  heroSetupStarted = true;
  const bgElement = ensureBackgroundElement();
  resolveHeroUrl().then((url) => {
    if (url) {
      bgElement.style.backgroundImage = `url(${url})`;
    } else {
      bgElement.style.backgroundImage = HERO_FALLBACK;
    }
  });
}

setupHeroBackground();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
