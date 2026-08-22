(function () {
  'use strict';

  var page = document.querySelector('.profile-page');
  if (!page) return;

  var sections = Array.prototype.slice.call(page.querySelectorAll('[data-resume-section]'));
  var navItems = Array.prototype.slice.call(page.querySelectorAll('[data-resume-nav]'));
  var cases = Array.prototype.slice.call(page.querySelectorAll('[data-resume-case]'));
  var count = page.querySelector('[data-resume-count]');

  /* 用观察而不是滚动事件做目录高亮，滚动快时也不会闪烁。 */
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navItems.forEach(function (item) {
          item.classList.toggle('is-active', item.dataset.resumeNav === entry.target.dataset.resumeSection);
        });
      });
    }, { rootMargin: '-28% 0px -58% 0px', threshold: 0 });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* 项目过滤：保留在页面内，避免打断阅读上下文。 */
  page.querySelectorAll('[data-resume-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      var filter = button.dataset.resumeFilter;
      page.querySelectorAll('[data-resume-filter]').forEach(function (item) {
        var active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      var visible = 0;
      cases.forEach(function (item) {
        var show = filter === 'all' || item.dataset.category === filter;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (count) count.textContent = String(visible).padStart(2, '0');
    });
  });

  var toggle = page.querySelector('[data-resume-toggle]');
  var note = page.querySelector('[data-resume-note]');
  if (toggle && note) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-pressed') !== 'true';
      toggle.setAttribute('aria-pressed', String(open));
      note.hidden = !open;
      toggle.querySelector('span').textContent = open ? '−' : '+';
    });
  }
})();
