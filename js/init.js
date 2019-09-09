/*
 * Author: Taigo Ito
 * Site: https://qwel.design
 * Twitter: @taigoito
 * Location: Fukui, Japan
 */

import App from './app/_init.js';
import Router from './_router.js';

const HOST = 'http://localhost';
const ROOT = '/gurps/';

// App and Router
const app = new App()
const router = new Router({
  root: ROOT,
  launch: app.init
});

router.init();

// Docs nav
const docsNav = () => {
  const myTouch = 'ontouchend' in document && window.innerWidth < 1024 ? 'touchend' : 'click';
  document.addEventListener(myTouch, (event) => {
    if (event.srcElement.dataset.role === 'toggle-item') {
      event.preventDefault();
      const panel = event.target.parentNode.querySelector('.docs-nav-item');
      const h = panel.querySelectorAll('li').length * 27 + 'px';
      if (panel.classList.contains('show')) {
        panel.classList.remove('show');
        panel.style.height = 0;
      } else {
        panel.classList.add('show');
        panel.style.height = h;
      }
    }
  });
}

docsNav();

// Random image and Preloader init
const randomImage = () => {
  const elem = document.getElementById('cover-image');
  const srcDir = `${HOST}${ROOT}images/`;
  const imagesCount = 10;
  const r = ('00' + Math.floor(Math.random() * imagesCount)).substr(-2);
  const src = `${srcDir}landscape${r}.jpg`;
  elem.style.backgroundImage = `url(${src})`;
  const img = new Image;
  img.src = src;
  const promise = new Promise((resolve, reject) => {
    img.onload = function () {
      resolve();
    };
    img.onerror = function () {
      reject();
    };
  });
  promise.then(preloader.load);
  return promise;
}

randomImage();
