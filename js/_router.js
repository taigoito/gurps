// Router

import Scrolling from './_scrolling.js';

export default class Router {
  constructor(options = {}) {
    this._root = options.root;
    this._url = location.pathname; // 前ページの履歴として保持
    this._launch = options.launch;
  }

  init() {
    this._handleEvents();
    if (typeof this._launch === 'function') {
      this._launch(this._parsePart(this._url));
    }
  }

  _handleEvents() {
    const myTouch = 'ontouchend' in document && window.innerWidth < 1024 ? 'touchend' : 'click';
    document.addEventListener(myTouch, (event) => {
      if (event.srcElement.dataset.role === 'navigate') {
        event.preventDefault();
        const href = event.target.getAttribute('href');
        history.pushState(null, null, href);
        this._urlChangeHandler();
      }
    });
    window.addEventListener('popstate', () => this._urlChangeHandler());
  }

  async _urlChangeHandler() {
    const url = location.pathname;
    if (this._url !== url) { // ハッシュだけの変更は無視する
      const diff = this._findDiff(url);
      const html = await this._fetchHTML(url);
      if (diff === 'part') {
        if (url === this._root) {
          this._leave();
        } else {
          this._enter();
        }
      } else {
        this._rewriteHref(html);
      }
      const promise = diff ? this._flip(diff, html) :
        new Promise((resolve, reject) => resolve());
      promise.then(() => {
        if (this._parsePart(this._url) === 'docs' && this._parsePart(url) === 'docs') {
          const scrolling = new Scrolling({
            offset: 10
          });
          scrolling.scroll('.article');
        } else if (typeof this._launch === 'function') {
          this._launch(this._parsePart(url));
        }
        this._url = url;
      });
    }
  }

  async _fetchHTML(url) {
    try {
      const parser = new DOMParser();
      const resp = await fetch(url, {
        method: 'GET',
        mode: 'same-origin',
        headers: {
          'Content-Type': 'text/html',
        }
      });
      return parser.parseFromString(await resp.text(), 'text/html').body;
    } catch (error) {
      return null;
    }
  }

  _findDiff(url) {
    if (this._parsePart(this._url) !== this._parsePart(url)) {
      return 'part';
    } else if (this._parsePart(this._url) === 'docs' && this._parseChapter(this._url) === this._parseChapter(url)) {
      return 'section';
    } else if (this._parsePart(this._url) === 'docs') {
      return 'article';
    } else {
      return false;
    }
  }

  _enter() {
    document.body.classList.remove('entrance');
  }

  _leave() {
    document.body.classList.add('entrance');
  }

  _rewriteHref(html) {
    const nav = document.getElementById('navigation');
    if (nav) {
      const ref = html.querySelector('#navigation').querySelectorAll('a');
      [].forEach.call(nav.querySelectorAll('a'), (elem, i) => {
        elem.href = ref[i].href;
      });
    }
  }

  _flip(diff, html) {
    if (diff === 'part') {
      const elem = document.getElementById('main');
      return this._hide(elem).then(() => {
        elem.innerHTML = html.querySelector('#main').innerHTML;
        return this._show(elem);
      });
    } else if (diff === 'article') {
      const elem = document.querySelector('.article');
      return this._hide(elem).then(() => {
        elem.innerHTML = html.querySelector('.article').innerHTML;
        return this._show(elem);
      });
    } else if (diff === 'section') {
      const elem = document.querySelector('.section');
      return this._hide(elem).then(() => {
        elem.innerHTML = html.querySelector('.section').innerHTML;
        return this._show(elem);
      });
    }
  }

  _show(elem) {
    elem.style.visibility = '';
    return this._animationEnd(elem, () => {
      elem.classList.add('anim-show');
    }).then(() => {
      elem.classList.remove('anim-show');
    });
  }

  _hide(elem) {
    return this._animationEnd(elem, () => {
      elem.classList.add('anim-hide');
    }).then(() => {
      elem.style.visibility = 'hidden';
      elem.classList.remove('anim-hide');
    });
  }

  _parsePart(url) {
    return url.replace(this._root, '').split('/')[0];
  }

  _parseChapter(url) {
    return url.replace(this._root, '').split('/')[1].split('-')[0];
  }

  _parseSection(url) {
    return url.replace(this._root, '').split('/')[1].split('-')[1];
  }

  _animationEnd(elem, func) {
    let callback;
    const promise = new Promise((resolve, reject) => {
      callback = () => resolve(elem);
      elem.addEventListener('animationend', callback);
    });
    func();
    promise.then((elem) => {
      elem.removeEventListener('animationend', callback);
    });
    return promise;
  }
}
