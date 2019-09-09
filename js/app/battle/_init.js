/*
 * Battle
 */

import { BattleModel } from './_models.js';
import { BattleView } from './_views.js';

export default class Battle {
  constructor() {
    this._len = 8;
    this._collection = this._set();
    this._view = new BattleView(this._collection);
  }
  
  init() {
    //this._view.init();
  }

  _set(cp = 10) {
    const collection = new BattleModel();
    for (let i = 0; i < this._len; i++) {
      collection.addUnit({ id: i, capacity: cp });
    }
    return collection;
  }
}
