/* Community Assist — interactions */
(function () {
  "use strict";
  var doc = document;

  /* ---------- Sticky header shadow on scroll ---------- */
  var header = doc.querySelector(".site-header");
  var onScroll = function () {
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  var burger = doc.querySelector(".hamburger");
  var sheet = doc.getElementById("mobile-sheet");
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

  /* ---------- Ways-to-give tabs ---------- */
  var tabs = Array.prototype.slice.call(doc.querySelectorAll('[role="tab"]'));
  var selectTab = function (tab) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
      var panel = doc.getElementById(t.getAttribute("aria-controls"));
      panel.classList.toggle("active", selected);
      if (selected) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "");
    });
  };
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        var next = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
        tabs[next].focus();
        selectTab(tabs[next]);
      }
    });
  });

  /* ---------- Click-to-copy bank fields ---------- */
  var resetTimers = new WeakMap();
  doc.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () {
        btn.classList.add("copied");
        clearTimeout(resetTimers.get(btn));
        resetTimers.set(btn, setTimeout(function () { btn.classList.remove("copied"); }, 1800));
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
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
    });
  });

  /* ---------- Scroll reveal + progress bar ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fillBar = function () {
    var bar = doc.querySelector(".progress-fill");
    if (bar) bar.style.width = (bar.getAttribute("data-progress") || 0) + "%";
  };

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

  /* ---------- Impact testimonial video ---------- */
  var storyVideo = doc.querySelector(".story-video");
  if (storyVideo) {
    var vid = storyVideo.querySelector("video");
    var unmuteBtn = storyVideo.querySelector(".video-unmute");

    // Autoplay (muted) only when in view and motion is allowed; pause when out of view.
    if (vid && !reduce && "IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { vid.play().catch(function () {}); }
          else { vid.pause(); }
        });
      }, { threshold: 0.4 });
      vio.observe(vid);
    } else if (vid && unmuteBtn && reduce) {
      // Reduced motion: no autoplay. Present the control as a play button.
      storyVideo.classList.add("is-reduced");
      unmuteBtn.setAttribute("aria-label", "Play Chintya's testimonial");
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
          unmuteBtn.setAttribute("aria-pressed", "true");
          unmuteBtn.setAttribute("aria-label", "Mute Chintya's testimonial");
        } else {
          vid.muted = true;
          storyVideo.classList.remove("is-unmuted");
          unmuteBtn.setAttribute("aria-pressed", "false");
          unmuteBtn.setAttribute("aria-label", "Unmute Chintya's testimonial");
        }
      });
    }
  }
})();
