/*
 * Sample models
 */

import { Unit, Units } from '../_models.js';

const base = [
  { // DX, AG優先
    ability: [-2, 4, 2, 0, 1],
    skills: ['剣術'],
    equips: [3, 9, 13],
    missile: [18, 17]
  },
  { // DX, IN優先
    ability: [-4, 4, 4, -2, 1],
    skills: ['剣術', 's'],
    equips: [1, 10, 14]
  },
  { // DX, ST優先
    ability: [0, 4, 2, -2, 1],
    skills: ['剣術'],
    equips: [7, 10, 14],
    missile: [19]
  },
  { // ST, DX優先
    ability: [4, 0, 0, -2, 1],
    skills: ['武術', '弓術'],
    equips: [8, 12, 16],
    missile: [20]
  },
  { // ST, AG優先
    ability: [4, -2, 2, -2, 1],
    skills: ['武術'],
    equips: [6, 12, 16]
  },
  { // ST, IN優先
    ability: [4, -2, 0, 0, 1],
    skills: ['武術', 's'],
    equips: [5, 11, 15]
  },
  { // IN, ST優先
    ability: [0, -2, 2, 4, 1],
    skills: ['s', '武術'],
    equips: [4, 11, 15]
  },
  { // IN, DX優先
    ability: [-4, -2, 4, 4, 1],
    skills: ['s', '剣術'],
    equips: [3, 9, 13]
  },
  { // IN, AG優先
    ability: [-2, 0, 2, 4, 1],
    skills: ['s', '柔術'],
    equips: [0]
  }
];

const fixArrs = [
  [
    [['ST', true]], // 男性
    [['AG', true]] // 女性
  ],
  [
    [ // DX優先
      [['ST', true]],
      [['WL', false], ['DX', true]],
      [['IN', true]]
    ],
    [ // ST優先
      [['IN', true]],
      [['WL', true], ['WL', true]],
      [['DX', true]]
    ],
    [ // IN優先
      [['DX', true]],
      [['WL', false], ['IN', true]],
      [['ST', true]]
    ],
  ],
];

const sorceryArr = [
  '蒼龍術',
  '朱鳥術',
  '白虎術',
  '玄武術',
  '陽術',
  '陰術'
];

const equipsArrs = [
  [0, 0, 0, 30],
  [1, 0, 27, 31],
  [2, 0, 27, 31],
  [3, 0, 27, 32],
  [4, 0, 27, 32],
  [5, 0, 28, 32],
  [6, 0, 0, 32],
  [7, 0, 27, 32],
  [8, 0, 28, 32],
  [9, 0, 27, 32],
  [10, 0, 27, 32],
  [11, 0, 28, 34],
  [12, 0, 28, 34],
  [13, 0, 0, 32],
  [14, 0, 0, 32],
  [15, 0, 0, 33],
  [16, 0, 0, 33]
];

class SampleUnit extends Unit {
  initialize() {
    super.initialize();
    this.profile.id = this.id;
    this.profile.initialize();

    // IDから性別:g, 能力値:a, 出自:b, 装備:e を割り振り
    this.sid = this.get('sid') || this.id;
    const i = this.sid === undefined ? Math.floor(Math.random() * 54) : this.sid % 54;
    const g = this.sid === undefined ? Math.floor(Math.random() * 2) : Math.floor(this.sid / 54) % 2;
    const a = i % 9;
    const a1 = Math.floor(i / 3) % 3;
    const a2 = Math.floor(i / 9) % 3;
    const b = (i + Math.floor(i / 18)) % 6;
    this._born(g, a, a1, a2);
    this._grow(g, a, b);
    this._equip(g, a, b);
  }

  // 能力値の決定
  _born(g, a, a1, a2) {
    // baseArrの添え字をid、値をcpとし、順次パラメータとして追加
    const baseArr = base[a].ability.slice();
    baseArr.forEach((value, index) => this.setParam(index, value));

    // fixArrを作成し、配列の要素を引数として、順次パラメータを更新
    const fixArr = this._makeBirthArr(g, a1, a2);
    const len = fixArr.length;
    for (let i = 0; i < len; i++) {
      if (this.getParamTotal() < 10) {
        this.putParam(fixArr[i][0], fixArr[i][1], 10); // capacity:10
      } else {
        break;
      }
    }
  }

  // 技能の決定
  _grow(g, a, b) {
    const skillsArr = this._makeGrowthArr(g, a, b);
    const len = skillsArr.length;

    // 大ループの設定: loopLenの取得、capacityの整形
    let loopLen, capacity = this.getProfile('capacity');
    const n = Math.floor(capacity / 16);
    if (capacity < 10) {
      loopLen = 1;
      if (capacity > 10) capacity = 10;
    } else if (capacity < 16) {
      loopLen = 2;
      if (capacity > 12) capacity = 12;
    } else if (capacity < 24) {
      loopLen = 3;
      if (capacity > 16) capacity = 16;
    } else if (n && capacity < (n + 1) * 16) {
      loopLen = n + 3;
      if (capacity > (n + 0.5) * 16) capacity = (n + 1) * 16;
    }
    let loopCount = 0;
    let loopCapacity = 10;
    let loopFlag = false;

    // 大ループ: 1回のループでloopCapacity++, loopCount++
    while (loopCount < loopLen) {
      // 中ループの設定: loopCapacityの取得
      let total = this.getParamTotal();
      if (!loopFlag) {
        for (let i = 0; i <= loopCount; i++) {
          if (i < 4) {
            loopCapacity += 2 * i;
          } else {
            loopCapacity += 16;
          }
        }
        if (capacity < loopCapacity) {
          loopCapacity = capacity;
        }
      }

      // 中ループ: totalがloopCapacityに等しくなるまで、skillsArrの要素を順次putParamする
      for (let i = 0; i < len; i++) {
        const skill = skillsArr[i];
        const name = skill.name;
        const priority = skill.priority;
        let len = 1;
        // 小ループの設定 :何回putParamするか
        if (!loopFlag) {
          const level = this.getParamValue(name);
          const cp = this.getParamCp(name);
          if (priority < 20 && (priority === 0 || level < 8)) len--;
          else if (level < 11) len++;
          else if (priority < 15 && (cp > 1 || level > 12)) len--;
          else if (priority < 20 && (cp > 2 || level > 13)) len--;
        }

        // 小ループ: 0～2回のputParam
        for (let i = 0; i < len; i++) total += this.putParam(name, true, loopCapacity);

        // 中ループの完了
        if (total === loopCapacity) break;
      }
      // 大ループの完了: もしcpが尽きなかったらloopFlagをtrueにし、loopCountを++しないで、もう一度だけ同じループ処理
      if (total === loopCapacity || loopFlag) {
        loopFlag = false;
        loopCount++;
      } else {
        loopFlag = true;
      }
    }
  }

  // 装備の決定
  _equip(g, a, b) {
    const equipsArr = this._makeEquipsArr(g, a, b);
    for (let i = 0; i < 7; i++) {
      // equipsArrの要素が'0'であっても、id:0(武器)にはitemId:0(装備無し)をセット
      if (i === 0 || equipsArr[i]) this.setEquip(i === 0 ? i : i + 1, equipsArr[i]);
    }
  }

  // 能力値の決定のための配列を作成
  _makeBirthArr(g, a1, a2) {
    const arr1 = fixArrs[0][g];
    const arr2 = fixArrs[1][a1][a2];
    return arr1.concat(arr2);
  }

  // 技能の決定のための配列を作成
  _makeGrowthArr(g, a, b) {
    const sorcery = sorceryArr[b];
    const talent = base[a].skills.length === 2 && Array.isArray(base[a].skills[0]) ?
      base[a].skills[g].slice() : base[a].skills.slice();
    talent.forEach((elem, i) => {
      if (elem === 's') talent[i] = sorcery;
    });

    // 優先度を修正
    const skillsArr = [];
    const start = 5 // 能力値総数
    const len = 33; // 技能総数
    for (let i = start; i < start + len; i++) {
      const param = this.setParam(i);
      let priority = param.get('learnPriority');
      if (param.get('name') === talent[0]) {
        priority += 10;
      } else if (talent.includes(param.get('name'))) {
        priority += 5;
      }
      if (priority > 0) {
        priority += this.getParamValue(param.get('baseId'));
        skillsArr.push({
          name: param.get('name'),
          priority: priority
        })
      }
    }
    return skillsArr.sort((a, b) => b.priority - a.priority);
  }

  _makeEquipsArr(g, a, b) {
    const mainWeapons = base[a].equips.length === 2 && Array.isArray(base[a].equips[0]) ?
      base[a].equips[g] : base[a].equips;
    const equipsArr = equipsArrs[mainWeapons[b % mainWeapons.length]].slice();

    // 射撃（投擲）武器をセット
    const missile = base[a].missile ?
      base[a].missile.length === 2 ?
        base[a].missile[g] : base[a].missile :
      false;
    if (missile) equipsArr[1] = missile;

    // 部分防具をセット
    for (let i = 0; i < 3; i++) {
      equipsArr.push(equipsArr[3]);
    }
    return equipsArr;
  }

  getMainSkill() {
    const arr = [5, 6, 10, 18];
    let max = 0;
    let skill = null;
    this.parameters.models.forEach((param) => {
      if (arr.includes(param.id) && param.get('cp') > 0 && param.get('value') > max) {
        max = param.get('value');
        skill = param;
      }
    });
    return skill;
  }

  getSorcery() {
    const arr = [11, 12, 13, 14, 15, 16];
    let sorcery = null;
    this.parameters.models.forEach((param) => {
      if (arr.includes(param.id) && param.get('cp') > 0) {
        sorcery = param;
      }
    });
    return sorcery;
  }

  getMainWeapon() {
    return this.equipments.at(0);
  }
}

class SampleUnits extends Units {
  initialize() {
    this._handleEvents();
  }

  _handleEvents() {
    const setFeatures = (model) => {
      const skill = model.getMainSkill();
      const sorcery = model.getSorcery();
      const weapon = model.getMainWeapon();
      if (skill) model.setProfile('mainSkill', skill);
      if (sorcery) model.setProfile('sorcery', sorcery);
      if (weapon) model.setProfile('mainWeapon', weapon);
    };
    this.on('add', setFeatures);
  }

  addUnit(attr = {}) {
    return this.add(new SampleUnit(attr));
  }
}

export { SampleUnit, SampleUnits };
