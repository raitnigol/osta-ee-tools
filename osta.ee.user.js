// ==UserScript==
// @name         osta-ee-tools
// @namespace    https://github.com/raitnigol/osta-ee-tools
// @version      1.0.0
// @description  Extracts osta.ee listing data into a modal (human-readable + JSON)
// @author       Rait Nigol
// @license      MIT
// @updateURL    https://github.com/raitnigol/osta-ee-tools/raw/main/osta.ee.user.js
// @downloadURL  https://github.com/raitnigol/osta-ee-tools/raw/main/osta.ee.user.js
// @icon         https://www.osta.ee/favicon.ico
// @homepageURL  https://github.com/raitnigol/osta-ee-tools
// @supportURL   https://github.com/raitnigol/osta-ee-tools/issues
// @match        https://osta.ee/*
// @match        https://www.osta.ee/*
// @match        https://*.osta.ee/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
  
    const STYLE_ID = 'osta-ee-gear-btn-style';
    const BTN_CLASS = 'osta-ee-gear-btn';
    const MODAL_OVERLAY_ID = 'osta-ee-gear-modal-overlay';
    const MODAL_ID = 'osta-ee-gear-modal';

    let activeTitleEl = null;
    let latestExtractedData = null;
    let isJsonVisible = false;
    let modalCopyJsonBtnEl = null;
    let modalToggleJsonBtnEl = null;
    let modalJsonPreEl = null;
  
    function injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
  
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        .${BTN_CLASS} {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          border-radius: 6px;
          border: 1px solid rgba(0,0,0,0.15);
          background: rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
        }
  
        .${BTN_CLASS} svg {
          width: 18px;
          height: 18px;
          display: block;
          opacity: 0.8;
        }
  
        .${BTN_CLASS}:hover {
          background: rgba(255,255,255,1);
          border-color: rgba(0,0,0,0.25);
        }

        #${MODAL_OVERLAY_ID} {
          position: fixed;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.35);
          z-index: 2147483647;
          padding: 18px;
        }

        #${MODAL_OVERLAY_ID}.open {
          display: flex;
        }

        #${MODAL_ID} {
          width: min(980px, 95vw);
          background: #fff;
          border-radius: 10px;
          border: 1px solid rgba(0,0,0,0.12);
          box-shadow: 0 18px 60px rgba(0,0,0,0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .osta-ee-gear-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          background: rgba(0,0,0,0.02);
        }

        .osta-ee-gear-modal-title {
          font-weight: 600;
          font-size: 14px;
          color: rgba(0,0,0,0.75);
        }

        .osta-ee-gear-modal-close {
          appearance: none;
          border: 1px solid rgba(0,0,0,0.12);
          background: #fff;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          line-height: 0;
        }

        .osta-ee-gear-modal-close:hover {
          border-color: rgba(0,0,0,0.25);
          background: rgba(0,0,0,0.02);
        }

        .osta-ee-gear-modal-body {
          padding: 14px;
          min-height: 110px; /* keeps layout pleasant even when blank */
          color: rgba(0,0,0,0.8);
          font-size: 13px;
          flex: 1;
          overflow: auto;
        }

        .osta-ee-gear-modal-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          background: rgba(0,0,0,0.02);
        }

        .osta-ee-gear-modal-btn {
          appearance: none;
          border: 1px solid rgba(0,0,0,0.12);
          background: #fff;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          line-height: 1;
          color: rgba(0,0,0,0.85);
        }

        .osta-ee-gear-modal-btn:hover {
          border-color: rgba(0,0,0,0.25);
          background: rgba(0,0,0,0.02);
        }

        .osta-ee-gear-modal-summary {
          padding: 14px;
        }

        .osta-ee-gear-modal-summary h3 {
          margin: 16px 0 8px;
          font-size: 13px;
          color: rgba(0,0,0,0.85);
        }

        .osta-ee-gear-kv-grid {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 6px 12px;
          align-items: start;
          font-size: 13px;
        }

        .osta-ee-gear-kv-label {
          color: rgba(0,0,0,0.6);
        }

        .osta-ee-gear-kv-value {
          color: rgba(0,0,0,0.85);
          word-break: break-word;
        }

        .osta-ee-gear-modal-json-panel {
          display: none;
          margin: 0;
          padding: 14px;
          max-height: none;
          overflow: auto;
          background: rgba(0,0,0,0.03);
          border-top: 1px solid rgba(0,0,0,0.08);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            'Liberation Mono', 'Courier New', monospace;
          font-size: 12px;
          white-space: pre;
        }

        .osta-ee-gear-modal-json-panel.open {
          display: block;
        }

        .osta-ee-gear-description {
          white-space: pre-wrap;
          line-height: 1.35;
        }
      `;
      document.head.appendChild(style);
    }
  
    function ensureModal() {
      let overlay = document.getElementById(MODAL_OVERLAY_ID);
      if (overlay) return;

      overlay = document.createElement('div');
      overlay.id = MODAL_OVERLAY_ID;

      overlay.innerHTML = `
        <div id="${MODAL_ID}" role="dialog" aria-modal="true" aria-label="Settings">
          <div class="osta-ee-gear-modal-header">
            <div class="osta-ee-gear-modal-title">Settings</div>
            <button type="button" class="osta-ee-gear-modal-close" aria-label="Close">×</button>
          </div>
          <div class="osta-ee-gear-modal-body">
            <div class="osta-ee-gear-modal-controls">
              <button
                type="button"
                class="osta-ee-gear-modal-btn osta-ee-gear-modal-copy-json"
              >
                Copy as JSON
              </button>
              <button
                type="button"
                class="osta-ee-gear-modal-btn osta-ee-gear-modal-toggle-json"
                aria-expanded="false"
              >
                Show JSON
              </button>
            </div>
            <div class="osta-ee-gear-modal-summary"></div>
            <pre class="osta-ee-gear-modal-json-panel"></pre>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const closeBtn = overlay.querySelector('.osta-ee-gear-modal-close');
      closeBtn.addEventListener('click', () => closeModal());

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });

      modalCopyJsonBtnEl = overlay.querySelector(
        '.osta-ee-gear-modal-copy-json'
      );
      modalToggleJsonBtnEl = overlay.querySelector(
        '.osta-ee-gear-modal-toggle-json'
      );
      modalJsonPreEl = overlay.querySelector('.osta-ee-gear-modal-json-panel');

      if (modalCopyJsonBtnEl) {
        modalCopyJsonBtnEl.addEventListener('click', async () => {
          if (!latestExtractedData) {
            console.warn('Copy as JSON: no extracted data yet');
            return;
          }
          const jsonText = JSON.stringify(latestExtractedData, null, 2);
          await copyTextToClipboard(jsonText);
        });
      }

      if (modalToggleJsonBtnEl) {
        modalToggleJsonBtnEl.addEventListener('click', () => {
          setJsonVisible(!isJsonVisible);
        });
      }
    }

    function openModal(titleEl) {
      activeTitleEl = titleEl || null;
      ensureModal();
      const overlay = document.getElementById(MODAL_OVERLAY_ID);
      overlay.classList.add('open');
      setJsonVisible(false);
      refreshModalContent();
      window.addEventListener('keydown', onKeyDown);
    }

    function closeModal() {
      activeTitleEl = null;
      const overlay = document.getElementById(MODAL_OVERLAY_ID);
      if (overlay) overlay.classList.remove('open');
      setJsonVisible(false);
      window.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal();
    }

    function setJsonVisible(visible) {
      isJsonVisible = !!visible;
      if (modalJsonPreEl) {
        modalJsonPreEl.classList.toggle('open', isJsonVisible);
      }
      if (modalToggleJsonBtnEl) {
        modalToggleJsonBtnEl.textContent = isJsonVisible
          ? 'Hide JSON'
          : 'Show JSON';
        modalToggleJsonBtnEl.setAttribute(
          'aria-expanded',
          isJsonVisible ? 'true' : 'false'
        );
      }
    }

    async function copyTextToClipboard(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return;
        }
      } catch (err) {
        // Fall back below.
        console.error('Clipboard API failed, falling back', err);
      }

      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'readonly');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('execCommand(copy) returned false');
      } catch (err) {
        console.error('Copy to clipboard failed', err);
      }
    }

    function refreshModalContent() {
      latestExtractedData = extractListingData();
      renderListingSummary(latestExtractedData);

      if (modalJsonPreEl) {
        const jsonText = JSON.stringify(latestExtractedData, null, 2);
        modalJsonPreEl.textContent = jsonText;
        setJsonVisible(isJsonVisible);
      }
    }

    function escapeHtml(value) {
      const s = String(value);
      return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function normalizeText(value) {
      if (value == null) return '';
      return String(value)
        .replaceAll(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function textOrNull(el) {
      if (!el) return null;
      const text = normalizeText(el.textContent);
      return text ? text : null;
    }

    function parseNumber(value) {
      if (value == null) return null;
      const raw = String(value);
      const cleaned = raw
        .replaceAll(/\u00A0/g, ' ')
        .replace(/[^0-9,.\-]/g, '')
        .trim();
      if (!cleaned) return null;

      // Handle "1.234,56" vs "1,234.56" vs "1234,56" vs "1234.56".
      const hasComma = cleaned.includes(',');
      const hasDot = cleaned.includes('.');

      let normalized = cleaned;
      if (hasComma && hasDot) {
        // Assume thousands separators are the dot and decimals are the comma.
        normalized = cleaned.replaceAll('.', '').replace(',', '.');
      } else if (hasComma && !hasDot) {
        normalized = cleaned.replace(',', '.');
      } else {
        // Only dot or only digits.
        normalized = cleaned;
      }

      const num = Number(normalized);
      return Number.isFinite(num) ? num : null;
    }

    function parseEuro(value) {
      if (value == null) return null;
      const euroLike = String(value).replaceAll('€', '');
      return parseNumber(euroLike);
    }

    function pad2(n) {
      return String(n).padStart(2, '0');
    }

    function formatISOWithOffset(date) {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
      const yyyy = date.getFullYear();
      const mm = pad2(date.getMonth() + 1);
      const dd = pad2(date.getDate());
      const HH = pad2(date.getHours());
      const MM = pad2(date.getMinutes());
      const SS = pad2(date.getSeconds());

      const offsetMinutes = -date.getTimezoneOffset(); // local minus UTC
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const abs = Math.abs(offsetMinutes);
      const offH = pad2(Math.floor(abs / 60));
      const offM = pad2(abs % 60);
      return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}${sign}${offH}:${offM}`;
    }

    function parseEstonianDateTime(value) {
      const raw = normalizeText(value);
      if (!raw) return { text: null, iso: null };

      // Examples: "L 28.03.2026 19:52:06", "24.03.2026 19:44"
      const m = raw.match(
        /(?:^[A-Z]\s+)?(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/
      );
      if (!m) return { text: raw, iso: null };

      const day = Number(m[1]);
      const month = Number(m[2]);
      const year = Number(m[3]);
      const hour = m[4] != null ? Number(m[4]) : 0;
      const minute = m[5] != null ? Number(m[5]) : 0;
      const second = m[6] != null ? Number(m[6]) : 0;

      const dt = new Date(year, month - 1, day, hour, minute, second);
      if (Number.isNaN(dt.getTime())) return { text: raw, iso: null };

      return { text: raw, iso: formatISOWithOffset(dt) };
    }

    function pickFirstVisible(elements) {
      if (!elements) return null;
      const list = Array.from(elements);
      for (const el of list) {
        if (!el) continue;
        if (el.offsetParent === null) continue; // display:none and detached
        const cs = window.getComputedStyle(el);
        if (cs && cs.visibility === 'hidden') continue;
        return el;
      }
      return null;
    }

    function uniqueStrings(arr) {
      const out = [];
      const seen = new Set();
      for (const v of arr) {
        const s = String(v);
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
      }
      return out;
    }

    function getFieldByTableHeader(root, headerText) {
      if (!root || !headerText) return null;
      const wanted = normalizeText(headerText);
      if (!wanted) return null;

      const candidates = Array.from(root.querySelectorAll('*'));
      for (const el of candidates) {
        if (el.offsetParent === null) continue; // avoid hidden mobile/desktop clones
        if (el.closest(`.${BTN_CLASS}`)) continue; // never let our injected UI pollute extraction
        const t = normalizeText(el.textContent);
        if (t !== wanted && t.replace(/:$/, '') !== wanted) continue;

        const tr = el.closest('tr');
        if (tr) {
          const tds = tr.querySelectorAll('td, th');
          if (tds && tds.length >= 2) {
            return textOrNull(tds[1]) || textOrNull(tds[0]);
          }
        }

        if (el.nextElementSibling) {
          const v = textOrNull(el.nextElementSibling);
          if (v) return v;
        }

        const parent = el.parentElement;
        if (parent) {
          const children = Array.from(parent.children);
          const idx = children.indexOf(el);
          if (idx >= 0 && children[idx + 1]) {
            const v = textOrNull(children[idx + 1]);
            if (v) return v;
          }
        }
      }
      return null;
    }

    function splitMethodsText(text) {
      const t = normalizeText(text);
      if (!t) return [];
      return t
        .split(/[\n,;•|]+/g)
        .map((s) => normalizeText(s))
        .filter(Boolean);
    }

    function extractFirstEuroFromText(text) {
      if (text == null) return null;
      const raw = String(text);
      const m = raw.match(/(\d[\d\s.,]*)\s*€/);
      if (!m) return null;
      return parseEuro(m[1]);
    }

    function normalizeUrl(url) {
      if (!url) return null;
      const s = String(url);
      try {
        return new URL(s, location.href).href;
      } catch {
        return s;
      }
    }

    function isProbablyImageUrl(url) {
      return /\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(url);
    }

    function collectImageUrls(scope) {
      const urls = [];
      if (!scope) return urls;

      const imgs = Array.from(scope.querySelectorAll('img'));
      for (const img of imgs) {
        const candidate =
          img.getAttribute('data-src') ||
          img.getAttribute('data-original') ||
          img.getAttribute('src') ||
          img.currentSrc;

        const norm = normalizeUrl(candidate);
        if (!norm) continue;
        if (!isProbablyImageUrl(norm)) continue;
        urls.push(norm);
      }

      return uniqueStrings(urls);
    }

    function findInputByLabelLikeText(root, labelText) {
      if (!root || !labelText) return null;
      const wanted = String(labelText).toLowerCase();
      const inputs = Array.from(root.querySelectorAll('input'));

      for (const input of inputs) {
        const placeholder = input.getAttribute('placeholder');
        const ariaLabel = input.getAttribute('aria-label');
        const name = input.getAttribute('name');
        const id = input.getAttribute('id');
        const type = (input.getAttribute('type') || '').toLowerCase();

        const parentText = normalizeText(
          (input.closest('label') || input.parentElement || input).textContent
        ).toLowerCase();

        const hay = `${placeholder || ''} ${ariaLabel || ''} ${name || ''} ${
          id || ''
        } ${parentText}`;

        if (!hay.toLowerCase().includes(wanted)) continue;
        if (type === 'hidden') return input; // hidden can still hold the value
        return input;
      }

      return null;
    }

    function getVisibleTextValue(el) {
      if (!el) return null;
      if (typeof el.value === 'string' && el.value.trim()) return el.value.trim();
      return textOrNull(el);
    }

    function parseListingId(listingIdEl) {
      if (!listingIdEl) return null;
      const raw = normalizeText(listingIdEl.textContent);
      if (!raw) return null;

      const stripped = raw.replace(/^Eseme\s*ID\s*:\s*/i, '').trim();
      const m = stripped.match(/^([0-9]+)$/) || stripped.match(/([0-9]+)/);
      return m ? m[1] : null;
    }

    function parseEstonianDate(value) {
      const raw = normalizeText(value);
      if (!raw) return null;
      const m = raw.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (!m) return null;
      const day = Number(m[1]);
      const month = Number(m[2]);
      const year = Number(m[3]);
      if (
        !Number.isFinite(day) ||
        !Number.isFinite(month) ||
        !Number.isFinite(year)
      ) {
        return null;
      }
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }

    function getDataListValueByHeader(root, headerText) {
      if (!root || !headerText) return null;
      const wanted = normalizeText(headerText);
      if (!wanted) return null;

      const tables = root.querySelectorAll('table.data-list');
      for (const table of tables) {
        const rows = table.querySelectorAll('tr');
        for (const tr of rows) {
          const th = tr.querySelector('th');
          if (!th) continue;
          if (th.offsetParent === null) continue;
          const thText = normalizeText(th.textContent).replace(/:$/, '');
          if (thText !== wanted) continue;
          const td = tr.querySelector('td');
          if (!td || td.offsetParent === null) continue;
          if (!td) return null;
          return normalizeText(td.textContent);
        }
      }
      return null;
    }

    function getTableValueCellByHeader(root, headerText) {
      if (!root || !headerText) return null;
      const wanted = normalizeText(headerText);
      if (!wanted) return null;

      const rows = root.querySelectorAll('tr');
      for (const tr of rows) {
        const th = tr.querySelector('th');
        if (!th) continue;
        if (th.offsetParent === null) continue;
        const thText = normalizeText(th.textContent).replace(/:$/, '');
        if (thText !== wanted) continue;
        const td = tr.querySelector('td');
        if (!td || td.offsetParent === null) continue;
        if (!td) return null;
        return td;
      }
      return null;
    }

    function scoreImageUrl(url) {
      // Prefer "full-size" images (e.g. /item/13/...), over thumbnails (e.g. /item/9/...)
      const m = String(url).match(/\/item\/(\d+)\//);
      if (!m) return 0;
      const bucket = Number(m[1]);
      if (bucket >= 13) return 3;
      if (bucket >= 12) return 2;
      if (bucket >= 9) return 1;
      return 0;
    }

    function imageBaseKey(url) {
      try {
        const u = new URL(url, location.href);
        const basePath = u.pathname.replace(/\/item\/\d+\//, '/item/');
        return `${u.origin}${basePath}`;
      } catch {
        return null;
      }
    }

    function extractMainGalleryImageUrls(productRoot) {
      if (!productRoot) return [];

      const slider =
        productRoot.querySelector('.js-offers-media-slider') ||
        productRoot.querySelector('.lightgallery');
      if (!slider) return [];

      const candidates = Array.from(
        slider.querySelectorAll(
          '.lightgallery[data-src], .lightgallery[data-original], img[data-src], img[data-original]'
        )
      );
      const bestByKey = new Map(); // baseKey -> { url, rank }

      for (const el of candidates) {
        const dataSrc = el.getAttribute('data-src');
        const dataOriginal = el.getAttribute('data-original');
        const src = el.getAttribute('src');
        const candidateUrl = dataSrc || dataOriginal || src;
        if (!candidateUrl) continue;
        if (/pixel\.png/i.test(candidateUrl)) continue;
        if (!/\/item\//i.test(candidateUrl)) continue;

        const norm = normalizeUrl(candidateUrl);
        if (!norm || !/\/item\//i.test(norm)) continue;
        if (/pixel\.png/i.test(norm)) continue;

        const rank = scoreImageUrl(norm);
        if (rank <= 0) continue;

        const baseKey = imageBaseKey(norm);
        if (!baseKey) continue;

        const existing = bestByKey.get(baseKey);
        if (!existing || rank > existing.rank) {
          bestByKey.set(baseKey, { url: norm, rank });
        }
      }

      return Array.from(bestByKey.values())
        .sort((a, b) => b.rank - a.rank)
        .map((v) => v.url);
    }

    function countTopLevelQuestions(questionsRoot) {
      if (!questionsRoot) return { question_count: null, answered_question_count: null };

      const allItems = Array.from(
        questionsRoot.querySelectorAll('li.comments-list__item')
      );
      const topLevel = allItems.filter((li) => li.parentElement === questionsRoot);
      if (topLevel.length === 0) {
        return { question_count: 0, answered_question_count: 0 };
      }

      let answered = 0;
      for (const li of topLevel) {
        // Seller reply blocks use a nested <article class="review" itemprop="review">
        if (li.querySelector('article.review[itemprop="review"]')) answered += 1;
      }

      return {
        question_count: topLevel.length,
        answered_question_count: answered
      };
    }

    function extractListingData() {
      const now = new Date();
      const productRoot =
        (activeTitleEl &&
          (activeTitleEl.closest(
            'article.offer-details__section[itemtype="http://schema.org/Product"]'
          ) ||
            activeTitleEl.closest('article[itemtype="http://schema.org/Product"]'))) ||
        document.querySelector(
          'article.offer-details__section[itemtype="http://schema.org/Product"]'
        ) ||
        document.querySelector('article[itemtype="http://schema.org/Product"]');

      const itemContent =
        (productRoot && productRoot.querySelector('#item-content')) ||
        document.querySelector('#item-content') ||
        productRoot ||
        document;

      const emptySchema = {
        schema_version: '1.0.0',
        source: 'osta.ee',
        page_type: 'listing',
        extracted_at_iso: formatISOWithOffset(now),
        extracted_at_unix_ms: Date.now(),
        page_url: location.href,
        page_title: document.title,

        listing: {
          id: null,
          title: null,
          condition: null,
          category_path: [],
          category_path_with_root: [],
          location: null,
          quantity: null,
          description_text: null,
          description_html: null,
          image_urls: [],
          image_count: null
        },

        pricing: {
          current_price_eur: null,
          buy_now_price_eur: null,
          suggested_bid_eur: null,
          minimum_bid_eur: null,
          currency: 'EUR',
          monthly_payment_eur: null
        },

        bidding: {
          bid_count: null,
          last_bidder_name: null,
          has_bids: null,
          auction_extension_text: null
        },

        timing: {
          start_time_text: null,
          start_time_iso: null,
          end_time_text: null,
          end_time_iso: null,
          time_left_text: null,
          is_ended: null
        },

        seller: {
          username: null,
          profile_url: null,
          authenticated: null,
          trust_percent: null,
          feedback_count: null,
          successful_sales_12m: null,
          member_since_text: null,
          member_since_iso: null,
          follower_count: null,
          other_items_count: null
        },

        shipping: {
          methods_text: [],
          raw_text: null
        },

        payment: {
          methods_text: [],
          raw_text: null
        },

        engagement: {
          watch_count: null,
          view_count: null
        },

        questions: {
          question_count: null,
          answered_question_count: null
        },

        raw: {
          breadcrumb_text: null,
          visible_price_text: null,
          visible_time_text: null
        }
      };

      if (!productRoot) return emptySchema;

      // Listing
      const titleEl =
        (activeTitleEl && activeTitleEl.querySelector('span') ? null : null) ||
        productRoot.querySelector('h1.header-title[itemprop="name"]') ||
        (activeTitleEl ? activeTitleEl : null);

      const listingIdEl =
        productRoot.querySelector('li.relations__list-item[itemprop="productID"]') ||
        productRoot.querySelector('[itemprop="productID"]');

      const title = textOrNull(titleEl);
      const listingId = parseListingId(listingIdEl);

      const breadcrumbNameEls = document.querySelectorAll(
        '#subcategories .breadcrumb [itemprop="name"]'
      );
      const breadcrumbNames = Array.from(breadcrumbNameEls)
        .map((el) => normalizeText(el.textContent))
        .filter(Boolean);

      const category_path_with_root = breadcrumbNames.length
        ? breadcrumbNames
        : [];
      const category_path =
        category_path_with_root[0] === 'Kõik kategooriad'
          ? category_path_with_root.slice(1)
          : category_path_with_root;

      const descriptionEl = productRoot.querySelector(
        '.offer-details__description[itemprop="description"]'
      );
      const description_text = descriptionEl
        ? normalizeText(descriptionEl.textContent)
        : null;
      const description_html = descriptionEl
        ? descriptionEl.innerHTML.trim()
        : null;

      const image_urls = extractMainGalleryImageUrls(productRoot);

      const conditionText =
        getFieldByTableHeader(itemContent, 'Seisukord') ||
        getFieldByTableHeader(itemContent, 'Condition') ||
        null;
      const locationText =
        getFieldByTableHeader(itemContent, 'Asukoht') ||
        getFieldByTableHeader(itemContent, 'Location') ||
        null;
      const quantityText =
        getFieldByTableHeader(itemContent, 'Kogus') ||
        getFieldByTableHeader(itemContent, 'Quantity') ||
        null;
      const quantityNum = parseNumber(quantityText);
      const quantity = quantityNum != null ? Math.trunc(quantityNum) : null;

      // Pricing
      const currentPriceEl = pickFirstVisible(
        productRoot.querySelectorAll('.js-current-price')
      );
      const currentPriceText = currentPriceEl
        ? getVisibleTextValue(currentPriceEl)
        : null;
      const current_price_eur = parseEuro(currentPriceText);

      const buyNowBlockEl = pickFirstVisible(
        productRoot.querySelectorAll('.js-buynow-block')
      );
      const buyNowPrice_eur = buyNowBlockEl
        ? extractFirstEuroFromText(buyNowBlockEl.textContent)
        : null;

      const bidInput = pickFirstVisible(productRoot.querySelectorAll('input[name="bid"]'));
      const suggested_bid_eur = bidInput
        ? parseNumber(bidInput.value || bidInput.getAttribute('value'))
        : null;

      const minBidInput =
        productRoot.querySelector(
          'input[type="hidden"][name*="min_bid" i], input[type="hidden"][id*="min_bid" i]'
        ) ||
        productRoot.querySelector('input[type="hidden"][value*="€" i]');
      const minimum_bid_eur = minBidInput
        ? parseEuro(minBidInput.value || minBidInput.getAttribute('value'))
        : null;

      const estoEl =
        productRoot.querySelector('[class*="esto" i]') ||
        productRoot.querySelector('[id*="esto" i]');
      const monthly_payment_eur = estoEl
        ? extractFirstEuroFromText(estoEl.textContent)
        : null;

      // Bidding
      const bidCountEl = pickFirstVisible(
        productRoot.querySelectorAll('.js-current-bids')
      );
      const bidCountText = bidCountEl ? getVisibleTextValue(bidCountEl) : null;
      const bidCountNum = parseNumber(bidCountText);
      const bid_count = bidCountNum != null ? Math.trunc(bidCountNum) : null;

      const lastBidderEl = pickFirstVisible(
        productRoot.querySelectorAll('.js-bidder-name')
      );
      const last_bidder_name = textOrNull(lastBidderEl);

      const auctionExtensionText =
        getDataListValueByHeader(productRoot, 'Pikenev lõpp') ||
        getDataListValueByHeader(productRoot, 'Auction extension') ||
        null;

      const has_bids =
        bid_count == null ? null : bid_count > 0 ? true : false;

      // Timing
      const timeLeftEl = pickFirstVisible(
        productRoot.querySelectorAll('.js-time-left-countdown')
      );
      const time_left_text = getVisibleTextValue(timeLeftEl);

      const endTimeEl = pickFirstVisible(
        productRoot.querySelectorAll('.js-date-end')
      );
      const end_time_text = getVisibleTextValue(endTimeEl);
      const parsedEnd = parseEstonianDateTime(end_time_text);

      const startTimeText =
        getDataListValueByHeader(productRoot, 'Algusaeg') ||
        getDataListValueByHeader(productRoot, 'Start time') ||
        (productRoot.querySelector('.js-date-start')
          ? getVisibleTextValue(productRoot.querySelector('.js-date-start'))
          : null);
      const parsedStart = parseEstonianDateTime(startTimeText);

      let is_ended = null;
      const combinedTimeText = `${time_left_text || ''} ${end_time_text || ''}`.trim();
      if (/lõppenud/i.test(combinedTimeText) || /auction.*ended/i.test(combinedTimeText)) {
        is_ended = true;
      } else if (combinedTimeText && /\d/.test(combinedTimeText)) {
        is_ended = false;
      }

      // Seller
      const messageBoxEl = pickFirstVisible(productRoot.querySelectorAll('.message-box'));
      let sellerUsername = null;
      let sellerProfileUrl = null;
      let sellerAuthenticated = null;
      let sellerTrust = null;
      let sellerFeedback = null;
      let sellerSuccessfulSales12m = null;
      let memberSinceText = null;
      let memberSinceIso = null;
      let followerCount = null;
      let otherItemsCount = null;

      if (messageBoxEl) {
        const msgText = messageBoxEl.textContent || '';
        sellerAuthenticated = /Autenditud kasutaja/i.test(msgText);

        const usernameAnchor =
          messageBoxEl.querySelector('.username a') ||
          messageBoxEl.querySelector('strong.username a');
        sellerUsername = textOrNull(usernameAnchor);
        sellerProfileUrl = usernameAnchor
          ? normalizeUrl(usernameAnchor.getAttribute('href'))
          : null;

        const trustEl = messageBoxEl.querySelector('.user-level-trust');
        sellerTrust = trustEl ? parseNumber(trustEl.textContent) : null;

        const feedbackAnchor = Array.from(
          messageBoxEl.querySelectorAll('a[href]')
        ).find((a) => /tagasisidet/i.test(a.textContent || ''));
        sellerFeedback = feedbackAnchor
          ? parseNumber(feedbackAnchor.textContent)
          : null;

        const salesMatch = msgText.match(
          /(\d+)\s+edukat müüki aasta jooksul/i
        );
        sellerSuccessfulSales12m = salesMatch ? parseNumber(salesMatch[1]) : null;

        const memberMatch = msgText.match(
          /Kasutaja alates\s+(\d{2}\.\d{2}\.\d{4})/i
        );
        if (memberMatch) {
          memberSinceText = normalizeText(
            `Kasutaja alates ${memberMatch[1]}`
          );
          memberSinceIso = parseEstonianDate(memberMatch[1]);
        }

        const followerEl = messageBoxEl.querySelector('.js-seller-follower-count');
        followerCount = followerEl ? parseNumber(followerEl.textContent) : null;

        const otherLink = Array.from(
          messageBoxEl.querySelectorAll('a[href]')
        ).find((a) => /Kõik\s+(müü|pakkum|kuulut)/i.test(a.textContent || ''));
        if (otherLink) {
          const otherMatch = otherLink.textContent.match(/\((\d+)\)/);
          otherItemsCount = otherMatch ? parseNumber(otherMatch[1]) : null;
        }
      }

      // Shipping & payment
      const transportCell = getTableValueCellByHeader(itemContent, 'Transport');
      const transportInnerText = transportCell
        ? transportCell.innerText || transportCell.textContent || ''
        : '';
      const shippingText = transportInnerText
        ? normalizeText(transportInnerText)
        : null;
      const shipping_methods_text = transportInnerText
        ? transportInnerText
            .split('\n')
            .map((s) => normalizeText(s))
            .filter(Boolean)
        : [];

      const paymentText =
        getFieldByTableHeader(itemContent, 'Maksmine') ||
        getFieldByTableHeader(itemContent, 'Payment') ||
        null;
      const payment_methods_text = paymentText
        ? splitMethodsText(paymentText)
        : [];

      // Engagement
      const watchCountEl = productRoot.querySelector('.add-favorite__count');
      const watch_count = watchCountEl
        ? parseNumber(getVisibleTextValue(watchCountEl))
        : null;

      const viewText =
        getDataListValueByHeader(productRoot, 'Vaadatud') ||
        getDataListValueByHeader(productRoot, 'Views') ||
        null;
      const view_count = parseNumber(viewText);

      // Questions: count visible top-level threads in #itemquestions
      const questionsRoot = productRoot.querySelector('#itemquestions');
      let questionCount = null;
      let answeredQuestionCount = null;
      if (questionsRoot) {
        const allThreads = Array.from(
          questionsRoot.querySelectorAll('li.comments-list__item')
        );
        const topLevelThreads = allThreads.filter(
          (li) => li.parentElement === questionsRoot
        );
        questionCount = topLevelThreads.length;
        answeredQuestionCount = topLevelThreads.filter((li) =>
          li.querySelector('article.review[itemprop="review"]')
        ).length;
      }

      // Raw
      const breadcrumbEl = document.querySelector('#subcategories .breadcrumb');
      const breadcrumb_text = breadcrumbEl ? normalizeText(breadcrumbEl.textContent) : null;

      const visible_price_text = currentPriceText;
      const visible_time_text = time_left_text;

      return {
        ...emptySchema,

        listing: {
          ...emptySchema.listing,
          id: listingId,
          title: title,
          condition: conditionText,
          category_path,
          category_path_with_root,
          location: locationText,
          quantity,
          description_text,
          description_html,
          image_urls,
          image_count: image_urls.length || null
        },

        pricing: {
          ...emptySchema.pricing,
          current_price_eur: current_price_eur,
          buy_now_price_eur: buyNowPrice_eur,
          suggested_bid_eur: suggested_bid_eur,
          minimum_bid_eur: minimum_bid_eur,
          monthly_payment_eur: monthly_payment_eur
        },

        bidding: {
          ...emptySchema.bidding,
          bid_count,
          last_bidder_name,
          has_bids,
          auction_extension_text: auctionExtensionText
        },

        timing: {
          ...emptySchema.timing,
          start_time_text: parsedStart.text || null,
          start_time_iso: parsedStart.iso,
          end_time_text: parsedEnd.text || null,
          end_time_iso: parsedEnd.iso,
          time_left_text,
          is_ended
        },

        seller: {
          ...emptySchema.seller,
          username: sellerUsername,
          profile_url: sellerProfileUrl,
          authenticated: sellerAuthenticated,
          trust_percent: sellerTrust,
          feedback_count: sellerFeedback,
          member_since_text: memberSinceText,
          member_since_iso: memberSinceIso,
          follower_count: followerCount,
          other_items_count: otherItemsCount,
          successful_sales_12m: sellerSuccessfulSales12m
        },

        shipping: {
          ...emptySchema.shipping,
          methods_text: shipping_methods_text,
          raw_text: shippingText
        },

        payment: {
          ...emptySchema.payment,
          methods_text: payment_methods_text,
          raw_text: paymentText
        },

        engagement: {
          ...emptySchema.engagement,
          watch_count: watch_count != null ? Math.trunc(watch_count) : null,
          view_count: view_count != null ? Math.trunc(view_count) : null
        },

        questions: {
          ...emptySchema.questions,
          question_count: questionCount,
          answered_question_count: answeredQuestionCount
        },

        raw: {
          ...emptySchema.raw,
          breadcrumb_text,
          visible_price_text,
          visible_time_text
        }
      };
    }

    function renderListingSummary(data) {
      if (!data) return;
      const modal = document.getElementById(MODAL_ID);
      if (!modal) return;

      const summaryEl = modal.querySelector('.osta-ee-gear-modal-summary');
      if (!summaryEl) return;

      const listing = data.listing;
      const pricing = data.pricing;
      const bidding = data.bidding;
      const timing = data.timing;
      const seller = data.seller;
      const shipping = data.shipping;
      const payment = data.payment;
      const engagement = data.engagement;

      function formatEuroDisplay(eur) {
        if (eur == null) return '—';
        const rounded = Math.round(eur * 100) / 100;
        if (Math.abs(rounded - Math.trunc(rounded)) < 1e-9) return `${Math.trunc(rounded)} €`;
        const s = rounded.toFixed(2).replace(/\.00$/, '');
        return `${s} €`;
      }

      function formatArray(arr) {
        if (!arr || arr.length === 0) return '—';
        return arr.join(', ');
      }

      function kv(label, valueHtml) {
        return `
          <div class="osta-ee-gear-kv-label">${escapeHtml(label)}</div>
          <div class="osta-ee-gear-kv-value">${valueHtml}</div>
        `;
      }

      const catPath = listing.category_path_with_root && listing.category_path_with_root.length
        ? listing.category_path_with_root.join(' / ')
        : '—';

      const safeDesc = listing.description_text
        ? escapeHtml(listing.description_text)
        : '—';

      summaryEl.innerHTML = `
        <div>
          <h3>Overview</h3>
          <div class="osta-ee-gear-kv-grid">
            ${kv('Title', escapeHtml(listing.title || '—'))}
            ${kv('Listing ID', escapeHtml(listing.id || '—'))}
            ${kv('Condition', escapeHtml(listing.condition || '—'))}
            ${kv('Category', escapeHtml(catPath || '—'))}
            ${kv('Location', escapeHtml(listing.location || '—'))}
            ${kv('Quantity', escapeHtml(listing.quantity != null ? String(listing.quantity) : '—'))}
            ${kv('Current price', escapeHtml(formatEuroDisplay(pricing.current_price_eur)))}
            ${kv('Buy now', escapeHtml(formatEuroDisplay(pricing.buy_now_price_eur)))}
            ${kv('Bid count', escapeHtml(bidding.bid_count != null ? String(bidding.bid_count) : '—'))}
            ${kv('Time left', escapeHtml(timing.time_left_text || '—'))}
            ${kv('End time', escapeHtml(timing.end_time_text || '—'))}
            ${kv('Seller', escapeHtml(seller.username || '—'))}
            ${kv('Trust', escapeHtml(seller.trust_percent != null ? `${seller.trust_percent}%` : '—'))}
            ${kv('Views', escapeHtml(engagement.view_count != null ? String(engagement.view_count) : '—'))}
            ${kv('Watch', escapeHtml(engagement.watch_count != null ? String(engagement.watch_count) : '—'))}
          </div>
        </div>

        <div>
          <h3>Pricing</h3>
          <div class="osta-ee-gear-kv-grid">
            ${kv('Suggested bid', escapeHtml(pricing.suggested_bid_eur != null ? formatEuroDisplay(pricing.suggested_bid_eur) : '—'))}
            ${kv('Minimum bid', escapeHtml(pricing.minimum_bid_eur != null ? formatEuroDisplay(pricing.minimum_bid_eur) : '—'))}
            ${kv('Monthly payment (ESTO)', escapeHtml(pricing.monthly_payment_eur != null ? formatEuroDisplay(pricing.monthly_payment_eur) : '—'))}
          </div>
        </div>

        <div>
          <h3>Timing</h3>
          <div class="osta-ee-gear-kv-grid">
            ${kv('Start time', escapeHtml(timing.start_time_text || '—'))}
            ${kv('End time (raw)', escapeHtml(timing.end_time_text || '—'))}
            ${kv('Auction ended', escapeHtml(timing.is_ended == null ? '—' : timing.is_ended ? 'Yes' : 'No'))}
            ${kv('Auction extension', escapeHtml(bidding.auction_extension_text || '—'))}
          </div>
        </div>

        <div>
          <h3>Seller</h3>
          <div class="osta-ee-gear-kv-grid">
            ${kv('Username', escapeHtml(seller.username || '—'))}
            ${kv('Profile URL', escapeHtml(seller.profile_url || '—'))}
            ${kv('Feedback count', escapeHtml(seller.feedback_count != null ? String(seller.feedback_count) : '—'))}
            ${kv('Member since', escapeHtml(seller.member_since_text || '—'))}
            ${kv('Followers', escapeHtml(seller.follower_count != null ? String(seller.follower_count) : '—'))}
            ${kv('Other items', escapeHtml(seller.other_items_count != null ? String(seller.other_items_count) : '—'))}
          </div>
        </div>

        <div>
          <h3>Shipping & payment</h3>
          <div class="osta-ee-gear-kv-grid">
            ${kv('Shipping methods', escapeHtml(formatArray(shipping.methods_text)))}
            ${kv('Payment methods', escapeHtml(formatArray(payment.methods_text)))}
          </div>
        </div>

        <div>
          <h3>Description</h3>
          <div class="osta-ee-gear-description">${safeDesc}</div>
        </div>

        <div>
          <h3>Debug / raw details</h3>
          <div class="osta-ee-gear-kv-grid">
            ${kv('Breadcrumb', escapeHtml(data.raw.breadcrumb_text || '—'))}
            ${kv('Visible price text', escapeHtml(data.raw.visible_price_text || '—'))}
            ${kv('Visible time text', escapeHtml(data.raw.visible_time_text || '—'))}
            ${kv('Page URL', escapeHtml(data.page_url || '—'))}
            ${kv('Extracted at', escapeHtml(data.extracted_at_iso || '—'))}
          </div>
        </div>
      `;
    }

    function addGearButtons() {
      const titles = document.querySelectorAll(
        'h1.header-title[itemprop="name"]'
      );
      if (!titles || titles.length === 0) return;

      titles.forEach((h1) => {
        const container = h1.closest('div') || h1.parentElement;
        if (!container) return;
        if (container.querySelector(`.${BTN_CLASS}`)) return;

        // Ensure absolute positioning works without affecting layout.
        const computed = window.getComputedStyle(container);
        if (computed.position === 'static' || !computed.position) {
          container.style.position = 'relative';
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = BTN_CLASS;
        btn.setAttribute('aria-label', 'Settings');
        btn.title = 'Settings';

        // Gear icon (inline SVG). No functionality for now.
        btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"></path>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-1.41 3.41 2 2 0 0 1-1.41-.59l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.82 0 2 2 0 0 1 0-2.82l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.82-2.82l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.82 2.82l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;

        // Modal open/close for now.
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openModal(h1);
        });

        container.appendChild(btn);
      });
    }
  
    function start() {
      injectStyles();
      addGearButtons();
  
      // Handle dynamic navigation / late content render.
      const obs = new MutationObserver(() => {
        addGearButtons();
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
  
    window.addEventListener('load', start);
    if (document.readyState !== 'loading') start();
  })();
  
