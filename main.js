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

  /* ---------- Ways-to-give tabs ---------- */
  try {
    var tabs = Array.prototype.slice.call(doc.querySelectorAll('[role="tab"]'));
    if (tabs.length) {
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
    }
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

  /* ---------- Impact testimonial video ---------- */
  try {
    var storyVideo = doc.querySelector(".story-video");
    if (storyVideo) {
      var vid = storyVideo.querySelector("video");
      var unmuteBtn = storyVideo.querySelector(".video-unmute");

      // Present the control as a Play button (used for reduced-motion and when
      // the browser blocks muted autoplay).
      var showPlayAffordance = function () {
        storyVideo.classList.add("is-reduced");
        if (unmuteBtn) unmuteBtn.setAttribute("aria-label", "Play Chintya's testimonial");
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
        // Reduced motion: no autoplay. Present the control as a play button.
        showPlayAffordance();
      }

      // Unmute button: unmute + restart from the top; click again to re-mute.
      // Accessible name reflects the next action; no aria-pressed (avoids a
      // contradictory "action + toggle-state" announcement).
      if (vid && unmuteBtn) {
        unmuteBtn.addEventListener("click", function () {
          if (vid.muted) {
            vid.muted = false;
            vid.currentTime = 0;
            vid.play().catch(function () {});
            storyVideo.classList.add("is-unmuted");
            storyVideo.classList.remove("is-reduced");
            unmuteBtn.setAttribute("aria-label", "Mute Chintya's testimonial");
          } else {
            vid.muted = true;
            storyVideo.classList.remove("is-unmuted");
            unmuteBtn.setAttribute("aria-label", "Unmute Chintya's testimonial");
          }
        });
      }
    }
  } catch (e) { /* no-op */ }
})();
