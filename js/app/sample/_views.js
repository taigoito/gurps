/*
 * Sample views
 */

class SampleView {
  constructor(collection) {
    this._prefix = 'sample';
    this.collection = collection;
    this._list = document.getElementById(`${this._prefix}-list`);
    this._detail = document.getElementById(`${this._prefix}-unit`);
  }

  // 初期化の時点でユニット一覧のビューは生成・表示しておく
  init() {
    // ビューを生成
    this._view = new ListView(this.collection, this._prefix);
    // ビューを表示
    this._view.render();
    // ルーター起動
    this._handleEvents();
    this._hashChangeHandler();
  }

  // ルーター
  _handleEvents() {
    const myTouch = 'ontouchend' in document && window.innerWidth < 1024 ? 'touchend' : 'click';
    this._list.addEventListener(myTouch, (event) => {
      let elem = event.target;
      while (elem && elem !== this._list) {
        if (elem.dataset.index) {
          event.preventDefault();
          window.location.hash = elem.dataset.index - 0;
        }
        elem = elem.parentNode;
      }
    });
    window.addEventListener('hashchange', () => this._hashChangeHandler());
  }

  // ユニット一覧から詳細へ飛ぶとき、ページ上部へスクロールする
  // ユニット詳細から一覧へ戻るとき、元の位置を記憶しておきスクロールを戻す
  _scrollHandler() {
    this._scrollY = window.scrollY || window.pageYOffset;
  }

  // ハッシュの有無で一覧と詳細のどちらをレンダリングするか決まる
  // ページIDとコレクションの添え字はずれるので注意
  _hashChangeHandler() {
    this._pageId = location.hash.slice(1);
    this._index = this._pageId - 1;
    if (this._pageId) {
      this._renderDetail(this._index);
    } else {
      this._renderList();
    }
  }

  // 詳細のレンダリングは、新しいビューを生成
  _renderDetail(index) {
    // スクロールイベントハンドラを解除
    window.removeEventListener('scroll', () => this._scrollHandler());
    if (this.collection.length > 8) scrollTo(0, 0);
    // モード変更
    this._viewMode = 'detail';
    // ビューを生成
    const view = new DetailView(this.collection.at(index), this._prefix);
    view.render();
    // ビューを表示
    this._list.classList.remove('show');
  }

  // 一覧のレンダリングは、ビューを再利用
  _renderList() {
    // スクロールイベントハンドラ
    this._scrollY = window.scrollY || window.pageYOffset;
    window.addEventListener('scroll', () => this._scrollHandler());
    scrollTo(0, this._scrollY);
    // モード変更
    this._viewMode = 'list';
    // ビューは生成済みなので、表示するだけ
    this._list.classList.add('show');
    // 詳細の中身(生成したHTML)は空にする
    this._detail.innerHTML = '';
  }

  // ユニットの更新に伴うレンダリングの更新
  set collection(models) {
    this._collection = models;
    if (this._viewMode === 'list') {
      this._view.collection = models;
      this._view.render();
    } else if (this._viewMode === 'detail') {
      const view = new DetailView(models.at(this._index), this._prefix);
      view.render();
    }
  }

  get collection() {
    return this._collection;
  }
}

class ListView {
  constructor(collection, prefix) {
    this._prefix = prefix;
    this.collection = collection;
  }

  render() {
    const list = document.getElementById(`${this._prefix}-list`);
    const template = document.getElementById(`${this._prefix}-list-template`);
    const tbody = list.querySelector('tbody');
    tbody.innerHTML = '';

    this.collection.models.forEach((model) => {
      const row = document.importNode(template.content, true);
      row.querySelector(`.${this._prefix}-list-row`).dataset.index = model.id + 1;
      row.querySelector(`.${this._prefix}-list-row-no`).textContent = model.id + 1;
      row.querySelector(`.${this._prefix}-list-row-name`).textContent = model.getProfile('name');
      row.querySelector(`.${this._prefix}-list-row-gender`).textContent = model.getProfile('gender');
      row.querySelector(`.${this._prefix}-list-row-st`).textContent = model.getParamValue('ST');
      row.querySelector(`.${this._prefix}-list-row-dx`).textContent = model.getParamValue('DX');
      row.querySelector(`.${this._prefix}-list-row-ag`).textContent = model.getParamValue('AG');
      row.querySelector(`.${this._prefix}-list-row-vt`).textContent = model.getParamValue('VT');
      row.querySelector(`.${this._prefix}-list-row-in`).textContent = model.getParamValue('IN');
      row.querySelector(`.${this._prefix}-list-row-wl`).textContent = model.getParamValue('WL');
      row.querySelector(`.${this._prefix}-list-row-cm`).textContent = model.getParamValue('CM');
      row.querySelector(`.${this._prefix}-list-row-hp`).textContent = model.getParamValue('HP');

      const battleSkill = model.getProfile('mainSkill') || {};
      const mainSkill = model.getProfile('sorcery') || battleSkill;
      const mainWeapon = model.getProfile('mainWeapon') || {};
      row.querySelector(`.${this._prefix}-list-row-skill`).textContent = Object.keys(mainSkill).length ? mainSkill.get('name') : '-';
      row.querySelector(`.${this._prefix}-list-row-equip`).textContent = Object.keys(mainWeapon).length ? mainWeapon.get('name') : '-';

      tbody.appendChild(row);
    });
  }
}

class DetailView {
  constructor(model, prefix) {
    this._prefix = prefix;
    this.model = model;
  }

  render() {
    const detail = document.getElementById(`${this._prefix}-unit`);
    const template = document.getElementById(`${this._prefix}-unit-template`);
    this._section = document.importNode(template.content, true);
    detail.innerHTML = '';

    this._fillProfile();
    this._fillAbility();
    this._fillSkills();
    this._fillEquips();

    detail.appendChild(this._section);
  }

  _fillProfile() {
    const section = this._section.querySelector(`.${this._prefix}-unit-profile`);
    section.querySelector(`.${this._prefix}-unit-profile-name`).textContent = this.model.getProfile('name');
    section.querySelector(`.${this._prefix}-unit-profile-gender`).textContent = this.model.getProfile('gender');
    section.querySelector(`.${this._prefix}-unit-profile-cp`).textContent = this.model.getProfile('capacity');
  }

  _fillAbility() {
    const section = this._section.querySelector(`.${this._prefix}-unit-ability`);
    const template = document.getElementById(`${this._prefix}-unit-ability-template`);
    const tbody = section.querySelector('tbody');

    const ability = this.model.parameters.models.filter((param) => param.get('parameterType') === 0);
    ability.forEach((param) => {
      const row = document.importNode(template.content, true);
      row.querySelector(`.${this._prefix}-unit-ability-name`).textContent = param.get('name');
      row.querySelector(`.${this._prefix}-unit-ability-value`).textContent = param.get('value');
      row.querySelector(`.${this._prefix}-unit-ability-cp`).textContent = `${param.get('cp')} CP`;

      tbody.appendChild(row);
    });
  }

  _fillSkills() {
    const section = this._section.querySelector(`.${this._prefix}-unit-skills`);
    const template = document.getElementById(`${this._prefix}-unit-skill-template`);
    const tbody = section.querySelector('tbody');

    const skills = this.model.parameters.models.filter((param) => param.get('cp') > 0 && param.get('parameterType') === 1);
    const len1 = skills.length;
    for (let i = 0; i < len1; i += 2) {
      const row = document.importNode(template.content, true);
      const len2 = i + 1 < len1 ? 2 : 1

      for (let j = 0; j < len2; j++) {
        const param = skills[i + j];
        row.querySelector(`.${this._prefix}-unit-skill-name-${j + 1}`).textContent = param.get('name');
        row.querySelector(`.${this._prefix}-unit-skill-value-${j + 1}`).textContent = param.get('value');
        row.querySelector(`.${this._prefix}-unit-skill-cp-${j + 1}`).textContent = `${param.get('cp')} CP`;
      }

      if (len2 === 1) {
        row.querySelector(`.${this._prefix}-unit-skill-name-2`).classList.add('border-bottom-0');
        row.querySelector(`.${this._prefix}-unit-skill-value-2`).classList.add('border-bottom-0');
        row.querySelector(`.${this._prefix}-unit-skill-cp-2`).classList.add('border-bottom-0');
      }

      tbody.appendChild(row);
    }
  }

  _fillEquips() {
    const section = this._section.querySelector(`.${this._prefix}-unit-equips`);
    const template = document.getElementById(`${this._prefix}-unit-equip-template`);
    const tbody = section.querySelector('tbody');

    if (this.model.equipments.models[1].id === 1) {
      const sub = this.model.equipments.models.shift();
      const main = this.model.equipments.models.shift();
      this.model.equipments.models.unshift(sub);
      this.model.equipments.models.unshift(main);
    }

    this.model.equipments.models.forEach((equip) => {
      const row = document.importNode(template.content, true);
      const equipName = (equip.id === 0 && equip.get('itemId') !== equip.get('usualUsage') || equip.id === 1) ?
        equip.get('secondName') : equip.get('name');
      row.querySelector(`.${this._prefix}-unit-equip-name`).textContent = equipName;
      if (equip.id < 4) {
        row.querySelector(`.${this._prefix}-unit-equip-head-1`).textContent = 'Dmg: ';
        row.querySelector(`.${this._prefix}-unit-equip-cell-1`).textContent = `${equip.get('dmg').name}(${equip.get('dmgType').name})`;
        row.querySelector(`.${this._prefix}-unit-equip-head-2`).textContent = 'Lv: ';
        row.querySelector(`.${this._prefix}-unit-equip-cell-2`).textContent = equip.get('level');
        row.querySelector(`.${this._prefix}-unit-equip-head-3`).textContent = equip.id < 3 ? 'P-EV: ' : 'B-EV: ';
        row.querySelector(`.${this._prefix}-unit-equip-cell-3`).textContent = equip.get('ev');
      } else {
        row.querySelector(`.${this._prefix}-unit-equip-head-1`).textContent = 'DR: ';
        row.querySelector(`.${this._prefix}-unit-equip-cell-1`).textContent = equip.get('dr');
        row.querySelector(`.${this._prefix}-unit-equip-head-2`).textContent = 'WT: ';
        row.querySelector(`.${this._prefix}-unit-equip-cell-2`).textContent = equip.get('wt');
        row.querySelector(`.${this._prefix}-unit-equip-head-3`).textContent = 'D-EV: ';
        row.querySelector(`.${this._prefix}-unit-equip-cell-3`).textContent = equip.get('ev');
      }
      tbody.appendChild(row);
    });
  }
}

export { SampleView };
