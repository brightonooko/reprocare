// ReproCare — Interactive Behaviors & Bilingual State

(function () {
  'use strict';

  const STORAGE_KEY = 'rc_lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) === 'sw' ? 'sw' : 'en';

  /* ------------------------------------------------------------------------
     Bilingual Engine (handles both [data-i18n] and .en-text / .sw-text)
     ------------------------------------------------------------------------ */
  function applyLang(lang) {
    currentLang = lang === 'sw' ? 'sw' : 'en';
    localStorage.setItem(STORAGE_KEY, currentLang);
    document.documentElement.lang = currentLang;

    const dict = (typeof translations !== 'undefined' && translations[currentLang]) || {};

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] === undefined) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll('.en-text').forEach((el) => {
      el.style.display = currentLang === 'en' ? '' : 'none';
    });

    document.querySelectorAll('.sw-text').forEach((el) => {
      el.style.display = currentLang === 'sw' ? '' : 'none';
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const active = btn.getAttribute('data-lang') === currentLang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  window.applyLang = applyLang;

  /* ------------------------------------------------------------------------
     Sticky Header & Accessible Dropdown
     ------------------------------------------------------------------------ */
  function initHeader() {
    const header = document.getElementById('siteHeader');
    if (header) {
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 12);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    document.querySelectorAll('.nav-item.has-dropdown').forEach((item) => {
      const trigger = item.querySelector('.dropdown-trigger');
      if (!trigger) return;

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = item.classList.toggle('dropdown-open');
        trigger.setAttribute('aria-expanded', String(isOpen));
      });

      document.addEventListener('click', (e) => {
        if (!item.contains(e.target)) {
          item.classList.remove('dropdown-open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          item.classList.remove('dropdown-open');
          trigger.setAttribute('aria-expanded', 'false');
          trigger.focus();
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     Mobile Navigation Drawer
     ------------------------------------------------------------------------ */
  function initMobileDrawer() {
    const toggle = document.getElementById('menuToggle');
    const drawer = document.getElementById('mobileDrawer');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', () => {
      setOpen(!drawer.classList.contains('open'));
    });

    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) setOpen(false);
    });

    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Homepage Topic Search & Category Filter
     ------------------------------------------------------------------------ */
  function initTopicFilter() {
    const grid = document.getElementById('topicsGrid');
    if (!grid) return;

    const input = document.getElementById('topicSearch');
    const clearBtn = document.getElementById('topicSearchClear');
    const emptyState = document.getElementById('noResults');
    const chips = document.querySelectorAll('[data-topic-filter]');
    const cards = Array.from(grid.querySelectorAll('.topic-card'));

    let activeCategory = 'all';

    function runFilter() {
      const q = (input ? input.value : '').trim().toLowerCase();
      if (clearBtn) clearBtn.classList.toggle('visible', q.length > 0);
      const words = q.split(/\s+/).filter(Boolean);

      let visibleCount = 0;

      cards.forEach((card) => {
        const categories = (card.getAttribute('data-category') || '').split(/\s+/);
        const catMatch = activeCategory === 'all' || categories.includes(activeCategory);

        const searchPool = [
          card.getAttribute('data-search') || '',
          card.textContent || ''
        ].join(' ').toLowerCase();

        const queryMatch = words.length === 0 || words.every((w) => searchPool.includes(w));
        const show = catMatch && queryMatch;

        card.classList.toggle('hidden', !show);
        if (show) visibleCount++;
      });

      if (emptyState) {
        emptyState.classList.toggle('show', visibleCount === 0);
      }
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activeCategory = chip.getAttribute('data-topic-filter') || 'all';
        chips.forEach((c) => {
          const isCurrent = c === chip;
          c.classList.toggle('active', isCurrent);
          c.setAttribute('aria-pressed', String(isCurrent));
        });
        runFilter();
      });
    });

    if (input) {
      let timer;
      input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(runFilter, 120);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const firstLink = grid.querySelector('.topic-card:not(.hidden) a.card-link');
          if (firstLink) window.location.href = firstLink.href;
        }
      });
    }

    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        runFilter();
        input.focus();
      });
    }
  }

  /* ------------------------------------------------------------------------
     Clickable Topic Cards (keyboard & mouse accessible)
     ------------------------------------------------------------------------ */
  function initClickableCards() {
    document.querySelectorAll('.topic-card').forEach((card) => {
      const link = card.querySelector('a.card-link');
      if (!link) return;

      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        window.location.href = link.href;
      });
    });
  }

  /* ------------------------------------------------------------------------
     Accessible Accordions
     ------------------------------------------------------------------------ */
  function initAccordions() {
    document.querySelectorAll('.accordion').forEach((group) => {
      const triggers = group.querySelectorAll('.accordion-trigger');
      triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
          const body = trigger.nextElementSibling;
          if (!body) return;
          const isOpen = trigger.getAttribute('aria-expanded') === 'true';

          triggers.forEach((other) => {
            other.setAttribute('aria-expanded', 'false');
            if (other.nextElementSibling) {
              other.nextElementSibling.classList.remove('open');
            }
          });

          if (!isOpen) {
            trigger.setAttribute('aria-expanded', 'true');
            body.classList.add('open');
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     FAQ Directory Search & Category Filter (faqs.html)
     ------------------------------------------------------------------------ */
  function initFaqDirectory() {
    const faqRoot = document.getElementById('faqDirectory');
    if (!faqRoot) return;

    const input = document.getElementById('faqSearch');
    const clearBtn = document.getElementById('faqSearchClear');
    const chips = document.querySelectorAll('[data-faq-filter]');
    const categories = Array.from(faqRoot.querySelectorAll('.faq-category'));
    const emptyState = document.getElementById('faqEmpty');

    let activeCat = 'all';

    function filterFaqs() {
      const q = (input ? input.value : '').trim().toLowerCase();
      if (clearBtn) clearBtn.classList.toggle('visible', q.length > 0);
      const words = q.split(/\s+/).filter(Boolean);

      let totalVisible = 0;

      categories.forEach((section) => {
        const secCat = section.getAttribute('data-faq-category');
        const catAllowed = activeCat === 'all' || secCat === activeCat;
        const items = Array.from(section.querySelectorAll('.accordion-item'));
        let sectionVisible = 0;

        items.forEach((item) => {
          const text = (item.textContent || '').toLowerCase();
          const match = catAllowed && (words.length === 0 || words.every((w) => text.includes(w)));
          item.classList.toggle('hidden', !match);
          if (match) sectionVisible++;
        });

        section.classList.toggle('hidden', sectionVisible === 0);
        totalVisible += sectionVisible;
      });

      if (emptyState) emptyState.classList.toggle('show', totalVisible === 0);
    }

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activeCat = chip.getAttribute('data-faq-filter') || 'all';
        chips.forEach((c) => {
          const active = c === chip;
          c.classList.toggle('active', active);
          c.setAttribute('aria-pressed', String(active));
        });
        filterFaqs();
      });
    });

    if (input) {
      input.addEventListener('input', filterFaqs);
    }

    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        filterFaqs();
        input.focus();
      });
    }
  }

  /* ------------------------------------------------------------------------
     Contraception Method Filter (conditions/contraception.html)
     ------------------------------------------------------------------------ */
  function initMethodFilter() {
    const grid = document.getElementById('methodsGrid');
    if (!grid) return;

    const chips = document.querySelectorAll('[data-method-filter]');
    const cards = Array.from(grid.querySelectorAll('.method-card'));

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const filter = chip.getAttribute('data-method-filter') || 'all';
        chips.forEach((c) => {
          const active = c === chip;
          c.classList.toggle('active', active);
          c.setAttribute('aria-pressed', String(active));
        });

        cards.forEach((card) => {
          const tags = (card.getAttribute('data-tags') || '').split(/\s+/);
          const show = filter === 'all' || tags.includes(filter);
          card.classList.toggle('hidden', !show);
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Interactive Anatomy Explorer & Cycle Phase Tabs (reproductive-system.html)
     ------------------------------------------------------------------------ */
  function initAnatomyExplorer() {
    const explorer = document.getElementById('anatomyExplorer');
    if (explorer) {
      const organButtons = explorer.querySelectorAll('[data-organ]');
      const svgParts = explorer.querySelectorAll('.anatomy-part');
      const svgLabels = explorer.querySelectorAll('.anatomy-label');

      function selectOrgan(organId) {
        organButtons.forEach((btn) => {
          const active = btn.getAttribute('data-organ') === organId;
          btn.classList.toggle('active', active);
          btn.setAttribute('aria-pressed', String(active));
        });
        svgParts.forEach((part) => {
          part.classList.toggle('active', part.getAttribute('data-part') === organId);
        });
        svgLabels.forEach((lbl) => {
          lbl.classList.toggle('active', lbl.getAttribute('data-part') === organId);
        });
      }

      organButtons.forEach((btn) => {
        btn.addEventListener('click', () => selectOrgan(btn.getAttribute('data-organ')));
      });

      svgParts.forEach((part) => {
        part.addEventListener('click', () => selectOrgan(part.getAttribute('data-part')));
      });

      svgLabels.forEach((lbl) => {
        lbl.addEventListener('click', () => selectOrgan(lbl.getAttribute('data-part')));
      });
    }

    const cycleRoot = document.getElementById('cycleExplorer');
    if (cycleRoot) {
      const tabs = cycleRoot.querySelectorAll('.cycle-tab');
      const panels = cycleRoot.querySelectorAll('.cycle-panel');

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-phase');
          tabs.forEach((t) => {
            const active = t === tab;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', String(active));
          });
          panels.forEach((panel) => {
            panel.classList.toggle('active', panel.getAttribute('data-phase-panel') === target);
          });
        });
      });
    }
  }

  /* ------------------------------------------------------------------------
     Table of Contents Scroll Spy (Inner Pages)
     ------------------------------------------------------------------------ */
  function initTocSpy() {
    const tocLinks = Array.from(document.querySelectorAll('.toc-list a[href^="#"]'));
    if (!tocLinks.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    tocLinks.forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      const section = document.getElementById(id);
      if (section) map.set(section, link);
    });

    if (!map.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tocLinks.forEach((l) => l.classList.remove('active'));
            const activeLink = map.get(entry.target);
            if (activeLink) activeLink.classList.add('active');
          }
        });
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    );

    map.forEach((_, section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------------
     Contact Form with Client-Side Validation (find-help.html)
     ------------------------------------------------------------------------ */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const nameEl = document.getElementById('contactName');
    const emailEl = document.getElementById('contactEmail');
    const msgEl = document.getElementById('contactMessage');
    const feedback = document.getElementById('formFeedback');

    function setFieldError(input, errId, show) {
      if (!input) return;
      input.classList.toggle('invalid', show);
      const err = document.getElementById(errId);
      if (err) err.classList.toggle('visible', show);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const nameVal = (nameEl?.value || '').trim();
      const emailVal = (emailEl?.value || '').trim();
      const msgVal = (msgEl?.value || '').trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

      setFieldError(nameEl, 'errName', !nameVal);
      if (!nameVal) valid = false;

      setFieldError(emailEl, 'errEmail', !emailOk);
      if (!emailOk) valid = false;

      setFieldError(msgEl, 'errMessage', msgVal.length < 8);
      if (msgVal.length < 8) valid = false;

      if (!valid) return;

      if (feedback) {
        feedback.classList.add('show');
        form.reset();
        setTimeout(() => feedback.classList.remove('show'), 7000);
      }
    });

    [
      [nameEl, 'errName'],
      [emailEl, 'errEmail'],
      [msgEl, 'errMessage']
    ].forEach(([el, errId]) => {
      if (!el) return;
      el.addEventListener('input', () => setFieldError(el, errId, false));
    });
  }

  /* ------------------------------------------------------------------------
     Progressive Reveal on Scroll
     ------------------------------------------------------------------------ */
  function initReveals() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileDrawer();
    initTopicFilter();
    initClickableCards();
    initAccordions();
    initFaqDirectory();
    initMethodFilter();
    initAnatomyExplorer();
    initTocSpy();
    initContactForm();
    initReveals();

    applyLang(currentLang);

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang')));
    });
  });
})();
