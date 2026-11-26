// ================= DYNAMIC SECTION LOADER =================
async function loadIncludes() {
  const includes = Array.from(document.querySelectorAll('[data-include]'));
  if (includes.length === 0) {
    return true;
  }

  // If sections are already rendered inline in index.html, use them immediately!
  const hasInlineContent = includes.some((el) => el.children.length > 0);
  if (hasInlineContent) {
    return true;
  }

  try {
    await Promise.all(includes.map(async (el) => {
      const file = el.getAttribute('data-include');
      const sep = file.indexOf('?') === -1 ? '?' : '&';
      const res = await fetch(`${file}${sep}_v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} loading ${file}`);
      const html = await res.text();
      el.outerHTML = html;
    }));
    return true;
  } catch (err) {
    console.warn('Dynamic section fetch skipped (using inline fallback):', err);
    const hasInlineContent = includes.some((el) => el.children.length > 0);
    if (window.location.protocol === 'file:' && !hasInlineContent) {
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#38bdf8;color:#050811;padding:16px 24px;border-radius:12px;font-family:sans-serif;font-size:14px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,0.4);z-index:9999;text-align:center;max-width:90%;';
      banner.innerHTML = 'To view modular sections locally, open with <strong>Live Server</strong> in VS Code or open <code>dist/index.html</code>.';
      document.body.appendChild(banner);
    }
    return true;
  }
}

// ================= APP INITIALIZER =================
function initApp() {
  var hero         = document.getElementById('home'),
      spotlight    = document.getElementById('heroSpotlight'),
      profileStage = document.getElementById('profileStage'),
      canvas       = document.getElementById('heroCanvas'),
      progress     = document.querySelector('.progress-bar'),
      reduce       = matchMedia('(prefers-reduced-motion: reduce)').matches,
      clamp        = function(v, a, b) { return Math.min(b, Math.max(a, v)); };

  // ================= HERO INTERACTIVE SPOTLIGHT & 3D TILT =================
  if (hero && !reduce) {
    var spotRaf = 0;
    var pointerX = 0, pointerY = 0;

    hero.addEventListener('mousemove', function(e) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (spotRaf) return;
      spotRaf = requestAnimationFrame(function() {
        spotRaf = 0;
        var rect = hero.getBoundingClientRect();
        var x = pointerX - rect.left;
        var y = pointerY - rect.top;
        if (spotlight) {
          spotlight.style.setProperty('--spot-x', x + 'px');
          spotlight.style.setProperty('--spot-y', y + 'px');
        }
      });
    }, { passive: true });

    if (profileStage) {
      profileStage.addEventListener('mousemove', function(e) {
        if (window.innerWidth <= 960) return;
        var rect = profileStage.getBoundingClientRect();
        var nx = (e.clientX - rect.left) / rect.width - 0.5;
        var ny = (e.clientY - rect.top) / rect.height - 0.5;
        var rx = clamp(-ny * 6, -3.5, 3.5);
        var ry = clamp(nx * 6, -3.5, 3.5);
        profileStage.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        profileStage.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      }, { passive: true });

      profileStage.addEventListener('mouseleave', function() {
        profileStage.style.setProperty('--rx', '0deg');
        profileStage.style.setProperty('--ry', '0deg');
      });
    }
  }

  // ================= LIGHTWEIGHT TECHNICAL NETWORK CANVAS =================
  if (canvas && hero && canvas.getClientRects().length) {
    var ctx = canvas.getContext('2d');
    var cWidth = 0, cHeight = 0;
    var nodes = [];
    var mouse = { x: -9999, y: -9999 };
    var heroVisible = true;
    var animId = 0;

    function setupCanvas() {
      var rect = hero.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      cWidth = rect.width;
      cHeight = rect.height;
      canvas.width = cWidth * dpr;
      canvas.height = cHeight * dpr;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = window.innerWidth < 768 ? 14 : 28;
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * cWidth,
          y: Math.random() * cHeight,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.4 + 1,
          alpha: Math.random() * 0.35 + 0.15
        });
      }
    }

    function renderCanvas() {
      if (!ctx) return;
      ctx.clearRect(0, 0, cWidth, cHeight);

      var maxDist = 155;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        if (!reduce) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > cWidth) a.vx *= -1;
          if (a.y < 0 || a.y > cHeight) a.vy *= -1;
        }

        // Subtle connections between nearby nodes
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            var lineAlpha = (1 - dist / maxDist) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(56, 189, 248, ' + lineAlpha.toFixed(3) + ')';
            ctx.lineWidth = 0.8;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Subtle connection to cursor when close
        var mdx = a.x - mouse.x;
        var mdy = a.y - mouse.y;
        var mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 170) {
          var mAlpha = (1 - mDist / 170) * 0.22;
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(125, 211, 252, ' + mAlpha.toFixed(3) + ')';
          ctx.lineWidth = 0.9;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, ' + a.alpha + ')';
        ctx.fill();
      }
    }

    function loopCanvas() {
      if (!heroVisible || reduce || document.hidden) {
        animId = 0;
        return;
      }
      renderCanvas();
      animId = requestAnimationFrame(loopCanvas);
    }

    setupCanvas();
    renderCanvas();
    if (!reduce) {
      loopCanvas();
    }

    hero.addEventListener('mousemove', function(e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });

    hero.addEventListener('mouseleave', function() {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    window.addEventListener('resize', function() {
      setupCanvas();
      renderCanvas();
    });

    if ('IntersectionObserver' in window) {
      var heroIo = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          heroVisible = entry.isIntersecting;
          if (heroVisible && !animId && !reduce) {
            loopCanvas();
          }
        });
      }, { threshold: 0.01 });
      heroIo.observe(hero);
    }

    document.addEventListener('visibilitychange', function() {
      if (!document.hidden && heroVisible && !animId && !reduce) {
        loopCanvas();
      }
    });
  }

  // ================= PROGRESS BAR =================
  function updateProgress() {
    if (!progress) return;
    var max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + clamp(scrollY / Math.max(max, 1), 0, 1) + ')';
  }

  // ================= SCROLLSPY =================
  var scrollIds = ['home', 'about', 'skills', 'experience', 'achievements', 'portfolio', 'contact'];
  var targets = scrollIds.map(function(id) { return document.getElementById(id); }).filter(Boolean);
  var navAnchors = [].slice.call(document.querySelectorAll('.nav-left a, .nav-right a, .mobile-menu a'));

  function updateSpy() {
    var y = scrollY + 160;
    var current = 'home';
    targets.forEach(function(el) { if (el.offsetTop <= y) current = el.id; });
    navAnchors.forEach(function(a) {
      var isActive = a.getAttribute('href') === '#' + current;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // ================= COMBINED SCROLL =================
  var rafId = 0;
  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(function() {
      rafId = 0;
      updateProgress();
      updateSpy();
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // ================= REVEAL =================
  var revealEls = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
    revealEls.forEach(function(el) { io.observe(el); });
  } else {
    revealEls.forEach(function(el) { el.classList.add('is-visible'); });
  }

  // ================= SKILLS DISCIPLINE NAVIGATOR =================
  var navItems = [].slice.call(document.querySelectorAll('.skills-nav-item'));
  var discBlocks = [].slice.call(document.querySelectorAll('.discipline-block'));

  if (navItems.length && discBlocks.length) {
    navItems.forEach(function(item) {
      item.addEventListener('click', function(e) {
        var targetId = item.getAttribute('data-target');
        var targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          var offset = window.innerWidth <= 900 ? 80 : 120;
          var rect = targetEl.getBoundingClientRect();
          var targetY = window.pageYOffset + rect.top - offset;
          window.scrollTo({
            top: targetY,
            behavior: reduce ? 'auto' : 'smooth'
          });
          navItems.forEach(function(n) { n.classList.toggle('active', n === item); });

          if (window.innerWidth <= 900) {
            var navBox = document.getElementById('skillsNav');
            if (navBox) {
              var targetScroll = item.offsetLeft - (navBox.clientWidth / 2) + (item.clientWidth / 2);
              navBox.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
          }
        }
      });
    });

    function updateDisciplineSpy() {
      var scrollCenter = window.scrollY + (window.innerHeight * 0.35);
      var currentId = '';

      for (var i = 0; i < discBlocks.length; i++) {
        var blk = discBlocks[i];
        var top = blk.offsetTop;
        var bottom = top + blk.offsetHeight;
        if (scrollCenter >= top && scrollCenter < bottom) {
          currentId = blk.id;
          break;
        } else if (scrollCenter >= top) {
          currentId = blk.id;
        }
      }

      if (currentId) {
        navItems.forEach(function(n) {
          var isMatch = n.getAttribute('data-target') === currentId;
          n.classList.toggle('active', isMatch);
          if (isMatch && window.innerWidth <= 900) {
            var navBox = document.getElementById('skillsNav');
            if (navBox) {
              var targetScroll = n.offsetLeft - (navBox.clientWidth / 2) + (n.clientWidth / 2);
              navBox.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
          }
        });
      }
    }

    window.addEventListener('scroll', function() {
      requestAnimationFrame(updateDisciplineSpy);
    }, { passive: true });
  }

  // ================= MOBILE MENU =================
  var navToggle = document.getElementById('navToggle'),
      mobileMenu = document.getElementById('mobileMenu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      var open = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    [].slice.call(mobileMenu.querySelectorAll('a')).forEach(function(a) {
      a.addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function(e) {
      if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !navToggle.contains(e.target)) {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // ================= PROJECT CAROUSELS =================
  function initCarousel(root) {
    var track = root.querySelector('.carousel-track'),
        viewport = root.querySelector('.carousel-viewport'),
        controls = root.querySelector('.carousel-controls'),
        pagination = root.querySelector('[data-carousel-pagination]'),
        status = root.querySelector('.carousel-status');
    if (!track || !viewport || !controls || !pagination) return null;

    var cards = [].slice.call(track.children),
        previous = root.querySelector('[data-carousel-prev]'),
        next = root.querySelector('[data-carousel-next]'),
        pageIndex = 0,
        pageCount = 0,
        perView = 1,
        visibleCards = [],
        interval = 0,
        resumeTimer = 0,
        resizeFrame = 0,
        touchStartX = 0,
        touchStartY = 0,
        pointerInside = false,
        focusInside = false,
        inViewport = true,
        dots = [],
        focusableDefaults = [],
        reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    cards.forEach(function(card) {
      [].slice.call(card.querySelectorAll('a,button,input,select,textarea,[tabindex]')).forEach(function(element) {
        focusableDefaults.push({
          card: card,
          element: element,
          tabindex: element.getAttribute('tabindex')
        });
      });
    });

    function getPerView() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    function stopAutoplay() {
      if (interval) {
        window.clearInterval(interval);
        interval = 0;
      }
    }

    function canAutoplay() {
      return !reducedMotion && !document.hidden && !pointerInside && !focusInside && inViewport && pageCount > 1;
    }

    function startAutoplay() {
      stopAutoplay();
      if (resumeTimer) {
        window.clearTimeout(resumeTimer);
        resumeTimer = 0;
      }
      if (canAutoplay()) {
        interval = window.setInterval(function() {
          goTo(pageIndex + 1, true);
        }, 5000);
      }
    }

    function resumeAfterInteraction() {
      stopAutoplay();
      if (resumeTimer) window.clearTimeout(resumeTimer);
      if (!pointerInside && !focusInside) {
        resumeTimer = window.setTimeout(function() {
          resumeTimer = 0;
          if (canAutoplay()) {
            goTo(pageIndex + 1, true);
            startAutoplay();
          }
        }, 5000);
      }
    }

    function clearClones() {
      [].slice.call(track.querySelectorAll('[data-carousel-clone]')).forEach(function(clone) {
        clone.remove();
      });
    }

    function makeClone(card) {
      var clone = card.cloneNode(true);
      clone.removeAttribute('id');
      clone.setAttribute('data-carousel-clone', '');
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('inert', '');
      [].slice.call(clone.querySelectorAll('a,button,input,select,textarea,[tabindex]')).forEach(function(el) {
        el.setAttribute('tabindex', '-1');
      });
      [].slice.call(clone.querySelectorAll('img')).forEach(function(img) {
        img.loading = 'lazy';
      });
      return clone;
    }

    function setVisibleImages() {
      [].slice.call(track.querySelectorAll('img')).forEach(function(img) {
        img.loading = 'lazy';
      });
      var start = pageIndex * perView;
      for (var i = 0; i < perView; i++) {
        var card = visibleCards[(start + i) % visibleCards.length];
        if (card) {
          [].slice.call(card.querySelectorAll('img')).forEach(function(img) {
            img.loading = 'eager';
          });
        }
      }
    }

    function getLogicalPage() {
      if (!pageCount) return 0;
      return ((pageIndex % pageCount) + pageCount) % pageCount;
    }

    function updateControls() {
      var logicalPage = getLogicalPage();
      var firstVisible = logicalPage * perView;
      focusableDefaults.forEach(function(item) {
        var cardIndex = cards.indexOf(item.card);
        var active = !item.card.hidden && cardIndex >= firstVisible && cardIndex < firstVisible + perView;
        if (active) {
          if (item.tabindex === null) item.element.removeAttribute('tabindex');
          else item.element.setAttribute('tabindex', item.tabindex);
        } else {
          item.element.setAttribute('tabindex', '-1');
        }
      });
      dots.forEach(function(dot, index) {
        var active = index === logicalPage;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
        dot.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (status && visibleCards.length) {
        var first = logicalPage * perView + 1;
        var last = Math.min(first + perView - 1, visibleCards.length);
        status.textContent = 'Showing projects ' + first + ' to ' + last + ' of ' + visibleCards.length;
      } else if (status) {
        status.textContent = 'No projects match this filter.';
      }
    }

    function setPosition(animate) {
      var firstCard = track.querySelector('[data-carousel-clone]') || visibleCards[0];
      if (!firstCard || !visibleCards.length) {
        track.style.transform = 'translate3d(0,0,0)';
        return;
      }
      var gap = parseFloat(window.getComputedStyle(track).gap) || 0;
      var unit = firstCard.getBoundingClientRect().width + gap;
      var offset = visibleCards.length > perView ? perView + pageIndex * perView : 0;
      if (!animate) track.style.transition = 'none';
      track.style.transform = 'translate3d(' + (-(offset * unit)) + 'px,0,0)';
      if (!animate) {
        track.offsetHeight;
        track.style.removeProperty('transition');
      }
      setVisibleImages();
      updateControls();
    }

    function goTo(targetPage, animate) {
      if (pageCount <= 1) return;
      pageIndex = targetPage;
      setPosition(animate !== false);
    }

    function rebuild(preferredPage) {
      stopAutoplay();
      if (resumeTimer) {
        window.clearTimeout(resumeTimer);
        resumeTimer = 0;
      }
      clearClones();
      perView = getPerView();
      visibleCards = cards.filter(function(card) {
        return !card.hidden;
      });
      cards.forEach(function(card) {
        card.style.display = card.hidden ? 'none' : '';
      });
      pageCount = Math.ceil(visibleCards.length / perView);
      pageIndex = Math.max(0, Math.min(preferredPage || 0, pageCount - 1));

      pagination.textContent = '';
      dots = [];
      if (visibleCards.length > perView) {
        var lastPageStart = (pageCount - 1) * perView;
        var leading = [];
        for (var leadingIndex = 0; leadingIndex < perView; leadingIndex++) {
          leading.push(visibleCards[(lastPageStart + leadingIndex) % visibleCards.length]);
        }
        for (var i = leading.length - 1; i >= 0; i--) {
          track.insertBefore(makeClone(leading[i]), track.firstChild);
        }
        for (var cloneIndex = 0; cloneIndex < pageCount * perView; cloneIndex++) {
          track.appendChild(makeClone(visibleCards[cloneIndex % visibleCards.length]));
        }
      }

      for (var dotIndex = 0; dotIndex < pageCount; dotIndex++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (dotIndex + 1) + ' of ' + pageCount);
        dot.setAttribute('aria-pressed', 'false');
        dot.addEventListener('click', function(index) {
          return function() {
            goTo(index, true);
            resumeAfterInteraction();
          };
        }(dotIndex));
        pagination.appendChild(dot);
        dots.push(dot);
      }

      controls.hidden = pageCount <= 1;
      if (previous) previous.hidden = pageCount <= 1;
      if (next) next.hidden = pageCount <= 1;
      setPosition(false);
      startAutoplay();
    }

    if (previous) {
      previous.addEventListener('click', function() {
        goTo(pageIndex - 1, true);
        resumeAfterInteraction();
      });
    }
    if (next) {
      next.addEventListener('click', function() {
        goTo(pageIndex + 1, true);
        resumeAfterInteraction();
      });
    }
    root.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(pageIndex + (event.key === 'ArrowRight' ? 1 : -1), true);
        resumeAfterInteraction();
      }
    });
    root.addEventListener('pointerenter', function(event) {
      if (event.pointerType === 'touch') return;
      pointerInside = true;
      stopAutoplay();
      if (resumeTimer) {
        window.clearTimeout(resumeTimer);
        resumeTimer = 0;
      }
    });
    root.addEventListener('pointerleave', function(event) {
      if (event.pointerType === 'touch') return;
      pointerInside = false;
      startAutoplay();
    });
    root.addEventListener('focusin', function(event) {
      if (!event.target.matches(':focus-visible')) return;
      focusInside = true;
      stopAutoplay();
      if (resumeTimer) {
        window.clearTimeout(resumeTimer);
        resumeTimer = 0;
      }
    });
    root.addEventListener('focusout', function() {
      window.setTimeout(function() {
        focusInside = root.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
        if (!focusInside) startAutoplay();
      }, 0);
    });
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });
    viewport.addEventListener('touchstart', function(event) {
      if (!event.touches.length) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      stopAutoplay();
    }, { passive: true });
    viewport.addEventListener('touchend', function(event) {
      if (!event.changedTouches.length) return;
      var deltaX = event.changedTouches[0].clientX - touchStartX;
      var deltaY = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
        goTo(pageIndex + (deltaX < 0 ? 1 : -1), true);
      }
      resumeAfterInteraction();
    }, { passive: true });
    track.addEventListener('transitionend', function(event) {
      if (event.target !== track || event.propertyName !== 'transform') return;
      if (pageIndex >= pageCount) {
        pageIndex = 0;
        setPosition(false);
      } else if (pageIndex < 0) {
        pageIndex = pageCount - 1;
        setPosition(false);
      }
    });

    if ('IntersectionObserver' in window) {
      var carouselObserver = new IntersectionObserver(function(entries) {
        inViewport = entries[0].isIntersecting;
        if (inViewport) startAutoplay();
        else stopAutoplay();
      }, { threshold: 0.1 });
      carouselObserver.observe(root);
    }

    window.addEventListener('resize', function() {
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(function() {
        resizeFrame = 0;
        var oldPageStart = getLogicalPage() * perView;
        var newPerView = getPerView();
        if (newPerView !== perView) rebuild(Math.floor(oldPageStart / newPerView));
        else setPosition(false);
      });
    }, { passive: true });

    rebuild(0);
    return {
      refresh: function() {
        rebuild(0);
      },
      resumeAfterInteraction: resumeAfterInteraction
    };
  }

  var carousels = [].slice.call(document.querySelectorAll('[data-carousel]')).map(initCarousel);

  // ================= PORTFOLIO FILTER =================
  var filterRow = document.querySelector('.filters');
  if (filterRow) {
    var filterBtns = [].slice.call(filterRow.querySelectorAll('.filter-btn')),
        grid       = document.getElementById('projectsGrid');
    if (grid) {
      filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var filter = (btn.dataset.filter || 'all').toLowerCase().trim();
          filterBtns.forEach(function(b) {
            b.classList.toggle('active', b === btn);
          });
          var allCards = [].slice.call(grid.querySelectorAll('.project-card'));
          allCards.forEach(function(card) {
            var cat = (card.getAttribute('data-category') || card.getAttribute('data-cat') || '').toLowerCase().trim();
            var match = filter === 'all' || cat === filter;
            card.hidden = !match;
          });
          if (carousels[0]) {
            carousels[0].refresh();
            carousels[0].resumeAfterInteraction();
          }
        });
      });
    }
  }

  // ================= CONTACT FORM =================
  var contactForm = document.getElementById('mainContactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var nameEl = document.getElementById('name');
      var emailEl = document.getElementById('email');
      var msgEl = document.getElementById('message');
      var name    = nameEl ? nameEl.value.trim() : '';
      var email   = emailEl ? emailEl.value.trim() : '';
      var message = msgEl ? msgEl.value.trim() : '';
      if (!name || !email || !message) return;
      var subject = encodeURIComponent('Portfolio contact from ' + name);
      var body    = encodeURIComponent(message + '\n\n— ' + name + ' (' + email + ')');
      location.href = 'mailto:khengvatanautdom@gmail.com?subject=' + subject + '&body=' + body;
    });
  }

  // Initial trigger
  onScroll();
}

// Start app once sections are loaded
loadIncludes().then(function() {
  initApp();
});
