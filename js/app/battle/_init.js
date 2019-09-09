/*
 * Battle
 */

import { BattleModel } from './_models.js';
import { BattleView } from './_views.js';

const items = [
  {
    name: 'ベースシステム/下層',
    proportion: 9,
    developed: 8
  },
  {
    name: 'ベースシステム/上層',
    proportion: 9,
    developed: 0
  },
  {
    name: '攻撃',
    proportion: 9,
    developed: 0
  },
  {
    name: 'フェイント',
    proportion:3,
    developed: 0
  },
  {
    name: '全力攻撃',
    proportion: 6,
    developed: 0
  },
  {
    name: 'ダメージ効果',
    proportion: 9,
    developed: 0
  },
  {
    name: '部位狙い',
    proportion: 3,
    developed: 0
  },
  {
    name: '部位の故障',
    proportion: 3,
    developed: 0
  },
  {
    name: '全力防御',
    proportion: 1,
    developed: 0
  },
  {
    name: '射撃',
    proportion: 2,
    developed: 0
  },
  {
    name: '狙い',
    proportion: 1,
    developed: 0
  },
  {
    name: '術法: ベース',
    proportion: 6,
    developed: 0
  },
  {
    name: '術法: 直接攻撃',
    proportion: 9,
    developed: 0
  },
  {
    name: '術法: 間接攻撃',
    proportion: 6,
    developed: 0
  },
  {
    name: '術法: 回復',
    proportion: 3,
    developed: 0
  },
  {
    name: '術法: 防御',
    proportion: 3,
    developed: 0
  },
  {
    name: '術法: 補助',
    proportion: 3,
    developed: 0
  },
  {
    name: '術法: 特殊',
    proportion: 12,
    developed: 0
  },
  {
    name: '移動',
    proportion: 1,
    developed: 1
  },
  {
    name: '姿勢変更',
    proportion: 2,
    developed: 0
  },
  {
    name: '装備変更',
    proportion: 2,
    developed: 0
  },
  {
    name: '反応判定',
    proportion: 3,
    developed: 0
  },
  {
    name: '恐怖判定',
    proportion: 3,
    developed: 0
  },
  {
    name: 'クリティカル',
    proportion: 3,
    developed: 0
  },
  {
    name: 'ファンブル',
    proportion: 3,
    developed: 0
  },
  {
    name: '自動行動',
    proportion: 12,
    developed: 0
  },
  {
    name: '最終試験',
    proportion: 18,
    developed: 0
  }
]

function renderProgress() {
  let progress = 0;
  let total = 0;
  const len = items.length;
  const table1 = document.getElementById('table-1');
  const table2 = document.getElementById('table-2');
  const table3 = document.getElementById('table-3');
  const template = document.getElementById('developing-progress-template');
  for (let i = 0; i < len; i++) {
    const item = items[i];
    const row = document.importNode(template.content, true);
    row.querySelector('td:first-child').textContent = item.name;
    if (item.proportion === item.developed) {
      progress += item.proportion;
      row.querySelector('tr').style.backgroundColor = 'rgba(153, 204, 153, .5)';
      row.querySelector('td:last-child').textContent = '完了';
    } else if (item.developed > 0) {
      progress += item.developed;
      row.querySelector('tr').style.backgroundColor = 'rgba(153, 153, 153, .3)';
      row.querySelector('td:last-child').textContent = '開発中';
    }
    total += item.proportion;
    if (i < 9) table1.appendChild(row);
    else if (i < 18) table2.appendChild(row);
    else table3.appendChild(row);
  }
  const result = Math.floor(progress / total * 10000) / 100;
  document.getElementById('progress').textContent = result;
}

export default class Battle {
  constructor() {
    this._len = 8;
    this._model = this._set();
    this._view = new BattleView(this._model);
  }

  init() {
    renderProgress();
    this._view.init();
    this._model.startTurn();
  }

  _set(cp = 10) {
    const model = new BattleModel();
    const pattern = [
      [0, 10, 13, 6],
      [1, 11, 5, 15],
      [2, 9, 14, 8],
      [0, 4, 14, 16],
      [10, 5, 12, 7],
      [1, 3, 13, 17],
      [9, 3, 8, 15],
      [2, 12, 6, 16],
      [11, 4, 7, 17]
    ];
    const registered = [];
    for (let i = 0; i < 2; i++) {
      const p = Math.floor(Math.random() * 9);
      for (let j = 0; j < 4; j++) {
        const id = i * 4 + j;
        const q = pattern[p][j];
        do {
          const sid = q < 9 ? pattern[p][j] + Math.floor(Math.random() * 6) * 9 :
            pattern[p][j] + Math.floor(Math.random() * 6) * 9 + 45;
          if (!registered.includes(sid)) {
            registered.push(sid);
            model.addUnit({ id: id, sid: sid, capacity: cp }, { sort: true });
          }
        } while (registered.length <= id);
      }
    }
    return model;
  }
}
