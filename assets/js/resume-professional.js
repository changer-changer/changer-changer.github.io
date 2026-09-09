(function () {
  'use strict';
  var lightbox = document.getElementById('resume-lightbox');
  var image = lightbox && lightbox.querySelector('img');
  var caption = lightbox && lightbox.querySelector('p');

  function closeLightbox() {
    if (!lightbox) return;
    if (typeof lightbox.close === 'function') lightbox.close();
    else lightbox.removeAttribute('open');
    if (image) image.removeAttribute('src');
  }

  document.querySelectorAll('[data-lightbox]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (!lightbox || !image) return;
      image.src = button.getAttribute('data-image') || '';
      image.alt = button.getAttribute('data-caption') || '证据图片';
      if (caption) caption.textContent = button.getAttribute('data-caption') || '';
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
      else lightbox.setAttribute('open', 'open');
    });
  });

  document.querySelectorAll('[data-lightbox-close]').forEach(function (button) {
    button.addEventListener('click', closeLightbox);
  });
  if (lightbox) lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeLightbox();
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'p') { event.preventDefault(); window.print(); }
  });
  document.querySelectorAll('[data-print-resume]').forEach(function (button) { button.addEventListener('click', function () { window.print(); }); });
})();
