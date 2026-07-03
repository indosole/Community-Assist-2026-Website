/* Community Assist — interactions */
(function () {
  "use strict";
  var doc = document;

  /* Progressive enhancement flag. Content is visible by default; the CSS only
     hides reveal elements while JS is present (`.js .reveal`), so a disabled or
     mid-failure script can never blank the page. */
  doc.documentElement.classList.add("js");

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Each independent block is isolated so a failure in one can't abort the
     rest (most importantly the reveal step, which un-hides the page). */

  /* ---------- Sticky header shadow on scroll ---------- */
  try {
    var header = doc.querySelector(".site-header");
    if (header) {
      var onScroll = function () {
        if (window.scrollY > 8) header.classList.add("scrolled");
        else header.classList.remove("scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  } catch (e) { /* no-op */ }

  /* ---------- Mobile menu ---------- */
  try {
    var burger = doc.querySelector(".hamburger");
    var sheet = doc.getElementById("mobile-sheet");
    if (burger && sheet) {
      var setMenu = function (open) {
        doc.body.classList.toggle("menu-open", open);
        burger.setAttribute("aria-expanded", String(open));
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        doc.body.style.overflow = open ? "hidden" : "";
      };
      burger.addEventListener("click", function () {
        setMenu(!doc.body.classList.contains("menu-open"));
      });
      sheet.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { setMenu(false); });
      });
      doc.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && doc.body.classList.contains("menu-open")) setMenu(false);
      });
    }
  } catch (e) { /* no-op */ }

  /* ---------- Tabs (scoped per tablist: Ways-to-give, Donate methods, …) ---------- */
  try {
    doc.querySelectorAll('[role="tablist"]').forEach(function (list) {
      var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      if (!tabs.length) return;
      var selectTab = function (tab) {
        tabs.forEach(function (t) {
          var selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          t.tabIndex = selected ? 0 : -1;
          var panel = doc.getElementById(t.getAttribute("aria-controls"));
          if (!panel) return;
          panel.classList.toggle("active", selected);
          if (selected) panel.removeAttribute("hidden");
          else panel.setAttribute("hidden", "");
        });
      };
      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { selectTab(tab); });
        tab.addEventListener("keydown", function (e) {
          var next = null;
          if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
          else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;
          if (next === null) return;
          e.preventDefault();
          tabs[next].focus();
          selectTab(tabs[next]);
        });
      });
    });
  } catch (e) { /* no-op */ }

  /* ---------- Click-to-copy bank fields ---------- */
  try {
    var resetTimers = new WeakMap();
    doc.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        var done = function () {
          btn.classList.add("copied");
          clearTimeout(resetTimers.get(btn));
          resetTimers.set(btn, setTimeout(function () { btn.classList.remove("copied"); }, 1800));
        };
        function fallbackCopy() {
          var ta = doc.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          doc.body.appendChild(ta);
          ta.select();
          try { doc.execCommand("copy"); done(); } catch (err) { /* no-op */ }
          doc.body.removeChild(ta);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      });
    });
  } catch (e) { /* no-op */ }

  /* ---------- Scroll reveal + progress bar ---------- */
  var fillBar = function () {
    var bar = doc.querySelector(".progress-fill");
    if (!bar) return;
    var pct = bar.getAttribute("data-progress") || 0;
    bar.style.width = pct + "%";
    var track = bar.parentNode; // .progress-track carries the progressbar role
    if (track && track.setAttribute) track.setAttribute("aria-valuenow", pct);
  };

  try {
    if (reduce || !("IntersectionObserver" in window)) {
      doc.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
      fillBar();
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            if (entry.target.querySelector && entry.target.querySelector(".progress-fill")) fillBar();
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
      doc.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

      // progress bar lives inside the goal section
      var goal = doc.querySelector(".goal");
      if (goal) {
        var gio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { fillBar(); gio.disconnect(); } });
        }, { threshold: 0.3 });
        gio.observe(goal);
      }
    }
  } catch (e) {
    // Safety net: never leave content hidden if the reveal logic throws.
    doc.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    fillBar();
  }

  /* ---------- Impact testimonial video(s) ---------- */
  // Works for any number of video cards in the impact carousel.
  var setupVideoCard = function (storyVideo) {
    var vid = storyVideo.querySelector("video");
    var unmuteBtn = storyVideo.querySelector(".video-unmute");
    var name = (vid && vid.getAttribute("data-name")) || "this student";

    // Present the control as a Play button (reduced-motion / blocked autoplay).
    var showPlayAffordance = function () {
      storyVideo.classList.add("is-reduced");
      if (unmuteBtn) unmuteBtn.setAttribute("aria-label", "Play " + name + "'s testimonial");
    };

    // Autoplay (muted) only when in view and motion is allowed; pause when out of view.
    if (vid && !reduce && "IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var p = vid.play();
            if (p && p.then) {
              p.then(function () { storyVideo.classList.remove("is-reduced"); }).catch(showPlayAffordance);
            }
          } else {
            vid.pause();
          }
        });
      }, { threshold: 0.4 });
      vio.observe(vid);
    } else if (vid && unmuteBtn && reduce) {
      showPlayAffordance();
    }

    // Unmute button: unmute + restart from the top; click again to re-mute.
    if (vid && unmuteBtn) {
      unmuteBtn.addEventListener("click", function () {
        if (vid.muted) {
          vid.muted = false;
          vid.currentTime = 0;
          vid.play().catch(function () {});
          storyVideo.classList.add("is-unmuted");
          storyVideo.classList.remove("is-reduced");
          unmuteBtn.setAttribute("aria-label", "Mute " + name + "'s testimonial");
        } else {
          vid.muted = true;
          storyVideo.classList.remove("is-unmuted");
          unmuteBtn.setAttribute("aria-label", "Unmute " + name + "'s testimonial");
        }
      });
    }
  };

  try {
    doc.querySelectorAll(".story-video").forEach(setupVideoCard);
  } catch (e) { /* no-op */ }

  /* ---------- Impact carousel (one card at a time: arrows + dots) ---------- */
  try {
    var carousel = doc.querySelector(".impact-carousel");
    var track = carousel && carousel.querySelector(".impact-track");
    var cards = track ? track.querySelectorAll(".story-card") : [];
    if (track && cards.length) {
      var prevBtn = carousel.querySelector(".carousel-arrow.prev");
      var nextBtn = carousel.querySelector(".carousel-arrow.next");
      var dotsWrap = carousel.parentNode.querySelector(".carousel-dots");
      var dots = dotsWrap ? dotsWrap.querySelectorAll(".carousel-dot") : [];

      var stepSize = function () {
        return cards[0].getBoundingClientRect().width + 24; // card width + gap
      };

      // Which card is most in view.
      var activeIndex = function () {
        return Math.round(track.scrollLeft / stepSize());
      };

      var atStart = function () { return track.scrollLeft <= 2; };
      var atEnd = function () { return track.scrollLeft >= track.scrollWidth - track.clientWidth - 2; };

      var update = function () {
        var multi = cards.length > 1;
        var wide = window.matchMedia("(min-width: 769px)").matches;
        var showArrows = multi && wide;
        if (prevBtn) { prevBtn.hidden = !showArrows; prevBtn.disabled = atStart(); }
        if (nextBtn) { nextBtn.hidden = !showArrows; nextBtn.disabled = atEnd(); }

        var idx = activeIndex();
        for (var i = 0; i < dots.length; i++) {
          if (i === idx) dots[i].setAttribute("aria-current", "true");
          else dots[i].removeAttribute("aria-current");
        }
      };

      var goTo = function (i) {
        i = Math.max(0, Math.min(cards.length - 1, i));
        track.scrollTo({ left: i * stepSize(), behavior: reduce ? "auto" : "smooth" });
      };

      if (prevBtn) prevBtn.addEventListener("click", function () { goTo(activeIndex() - 1); });
      if (nextBtn) nextBtn.addEventListener("click", function () { goTo(activeIndex() + 1); });
      for (var d = 0; d < dots.length; d++) {
        (function (n) { dots[n].addEventListener("click", function () { goTo(n); }); })(d);
      }
      track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
      window.addEventListener("resize", update, { passive: true });
      update();
    }
  } catch (e) { /* no-op */ }

  /* ---------- "Show more" photos in the Five-years gallery ---------- */
  try {
    var moreBtn = doc.querySelector(".pe-more-btn");
    var gallery = doc.querySelector(".pe-gallery");
    if (moreBtn && gallery) {
      moreBtn.addEventListener("click", function () {
        var expanded = gallery.classList.toggle("show-all");
        if (expanded) {
          // Reveal the newly shown photos (they never intersected while hidden).
          gallery.querySelectorAll(".pe-photo.is-extra").forEach(function (el) { el.classList.add("in"); });
        }
        moreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
        moreBtn.textContent = expanded ? "Show fewer photos" : "Show more photos";
      });
    }
  } catch (e) { /* no-op */ }
})();
