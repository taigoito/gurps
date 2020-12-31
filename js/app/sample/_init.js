/*
 * Sample
 */

import { SampleUnits } from './_models.js';
import { SampleView } from './_views.js';

export default class Sample {
  constructor() {
    this._len = 108;
    this._collection = this._set(12); //this._set();
    this._view = new SampleView(this._collection);
    this._selectCp = document.getElementById('sample-select-cp');
    this._selectSort = document.getElementById('sample-select-sort');
  }

  init() {
    this._view.init();
    this._handleEvents();
  }

  _handleEvents() {
    const update = () => this._update();
    this._selectCp.addEventListener('change', update);
    this._selectSort.addEventListener('change', update);
  }

  _update() {
    const cp = this._selectCp.value;
    const sort = this._selectSort.value;
    this._collection = this._set(cp);
    if (sort === 'skill') {
      this._collection.models = this._collection.models.sort((modelA, modelB) => {
        const skillA = modelA.getProfile('sorcery') || modelA.getProfile('mainSkill');
        const skillB = modelB.getProfile('sorcery') || modelB.getProfile('mainSkill');
        return skillA.id - skillB.id;
      });
    } else if (sort === 'equip') {
      this._collection.models = this._collection.models.sort((modelA, modelB) => {
        const itemA = modelA.getProfile('mainWeapon') ? modelA.getProfile('mainWeapon').get('itemId') : 0;
        const itemB = modelB.getProfile('mainWeapon') ? modelB.getProfile('mainWeapon').get('itemId') : 0;
        return itemA - itemB;
      });
    } else if (sort !== '') {
      this._collection.models = this._collection.models.sort((modelA, modelB) => {
        return modelA.getParamValue(sort) - modelB.getParamValue(sort);
      });
    }
    this._view.collection = this._collection;
  }

  _set(cp = 10) {
    const collection = new SampleUnits();
    for (let i = 0; i < this._len; i++) {
      collection.addUnit({ id: i, capacity: cp });
    }
    return collection;
  }
}
