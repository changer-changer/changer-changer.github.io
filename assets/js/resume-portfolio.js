(function () {
  'use strict';

  var lightbox = document.getElementById('resume-lightbox');
  var lightboxImage = lightbox && lightbox.querySelector('img');
  var lightboxCaption = lightbox && lightbox.querySelector('p');

  function openLightbox(button) {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = button.getAttribute('data-image') || '';
    lightboxImage.alt = button.getAttribute('data-caption') || '证据图片';
    if (lightboxCaption) lightboxCaption.textContent = button.getAttribute('data-caption') || '';
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', 'open');
  }

  function closeLightbox() {
    if (!lightbox) return;
    if (typeof lightbox.close === 'function') lightbox.close();
    else lightbox.removeAttribute('open');
    if (lightboxImage) lightboxImage.src = '';
  }

  document.querySelectorAll('[data-lightbox]').forEach(function (button) {
    button.addEventListener('click', function () { openLightbox(button); });
  });
  document.querySelectorAll('[data-lightbox-close]').forEach(function (button) {
    button.addEventListener('click', closeLightbox);
  });
  if (lightbox) {
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeLightbox();
  });

  document.querySelectorAll('[data-print-resume]').forEach(function (button) {
    button.addEventListener('click', function () { window.print(); });
  });

  document.querySelectorAll('details').forEach(function (detail) {
    detail.addEventListener('toggle', function () {
      var mark = detail.querySelector('summary span');
      if (mark) mark.textContent = detail.open ? '−' : '＋';
    });
  });
})();
