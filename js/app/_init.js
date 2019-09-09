/*
 * App
 */

import { Units } from './_models.js';

export default class App {
  init(part) {
    if (part === 'sample') {
      const units = new Units();
      // パラメータ
      units.addUnit({ id: 0 });
      units.setParam(0, 8); // "武術"のセットに伴い、"ST"もセットされる
      units.putParam(0, 0); // "ST"の上昇に伴い、"武術"も上昇する
      units.unsetParam(0, 0); // "ST"の削除に伴い、"武術"も下降する
      // 装備
      units.setEquip(0, 0, 2); // "バスタードソード"
      units.setEquip(0, 4, 30); // "革の帽子"
      units.setEquip(0, 5, 30); // "革服"
      units.setEquip(0, 5, 31); // "革鎧"
      units.unsetEquip(0, 4); // 解除
      console.log(units);
    }
    if (part === 'battle') {
      console.log('In development...');
    }
  }
}
