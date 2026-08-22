(function () {
  'use strict';

  var printButton = document.querySelector('[data-print-resume]');
  if (printButton) {
    printButton.addEventListener('click', function () { window.print(); });
  }

  /* 详情页从速览跳转时，保留稳定的锚点定位。 */
  var hash = window.location.hash;
  if (hash) {
    var target = document.querySelector(hash);
    if (target) window.setTimeout(function () { target.scrollIntoView({ block: 'start' }); }, 80);
  }
})();
