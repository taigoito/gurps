/*
 * Battle arts
 */

import { Model } from '../_framework.js';

const translation = {
  spellE1: '',
  spellE2: '幻惑',
  spellE3: '運動技能値',
  spellE4: '',
  spellE5: '敵味方構わず弓矢無効',
  spellE6: '敵対心を退け、安らぎを与える唄',
  spellS1: '',
  spellS2: '戦闘技能値',
  spellS3: '炎の膜',
  spellS4: '精神攻撃',
  spellS5: '味方全員の戦闘技能値',
  spellS6: '',
  spellW1: '',
  spellW2: '狂戦士',
  spellW3: '透明',
  spellW4: '足止',
  spellW5: '',
  spellW6: '死亡',
  spellN1: '身体浄化',
  spellN2: '精神浄化',
  spellN3: 'ダメージ抵抗',
  spellN4: '行動阻害',
  spellN5: '敵味方構わず命中率低下',
  spellN6: '',
  spellH1: '失明',
  spellH2: '',
  spellH3: '',
  spellH4: '消滅',
  spellH5: '',
  spellH6: '光の剣',
  spellL1: '精神浄化',
  spellL2: '意志抵抗値',
  spellL3: '恐怖',
  spellL4: '',
  spellL5: '狂気',
  spellL6: '転生',
}

class Arts {
  constructor(actor) {
    this._actor = actor;
    this._sorcery = actor.getSorcery();

    if (this._sorcery) {
      // 集中時間が変更されたら、射撃呪文をリセット
      actor.offense.on('change:chant', () => this._setArts());
    }
  }

  _setArts() {
    const level = this._sorcery.get('value');
    const chant = this._actor.getAttr('chant');

    this.spellE1 = new Model({
      name: 'ウインドダート',
      type: 'missile',
      level: level,
      dmg: {
        name: `${chant}d-${chant}`,
        dice: chant,
        add: chant * (-1),
      },
      dmgType: {
        'id': 1,
        'rate': 2
      }
    });

    this.spellE2 = new Model({
      name: 'ナップ',
      type: 'resist',
      level: level,
      resist: 2,
      effect: translation['spellE2']
    });

    this.spellE3 = new Model({
      name: 'ダンシングリーフ',
      type: 'assist',
      level: level,
      effect: `${translation['spellE3']}+${chant}`
    });

    this.spellE4 = new Model({
      name: 'ソーンバインド',
      type: 'missile',
      level: level,
      aim: 'foot',
      dmg: {
        name: `2d-2`,
        dice: 2,
        add: -2,
      },
      dmgType: {
        'id': 1,
        'rate': 2
      }
    });

    this.spellE5 = new Model({
      name: 'ミサイルガード',
      type: 'general',
      level: level,
      effect: translation['spellE5']
    });

    this.spellE6 = new Model({
      name: '風と樹の唄',
      type: 'general',
      level: level,
      effect: translation['spellE6']
    });

    this.spellS1 = new Model({
      name: 'エアスラッシュ',
      type: 'missile',
      level: level,
      dmg: {
        name: `${chant}d`,
        dice: chant,
        add: 0,
      },
      dmgType: {
        'id': 2,
        'rate': 1.5
      }
    });

    this.spellS2 = new Model({
      name: 'ハードファイア',
      type: 'assist',
      level: level,
      effect: `${translation['spellS2']}+${chant}`
    });

    this.spellS3 = new Model({
      name: 'セルフバーニング',
      type: 'assist',
      level: level,
      dmg: {
        name: `2d-2`,
        dice: 2,
        add: 0,
      },
      dmgType: {
        'id': 4, // 攻撃型:炎
        'rate': 1
      },
      effect: translation['spellS3']
    });

    this.spellS4 = new Model({
      name: '黒点波',
      type: 'resist',
      level: level,
      resist: 2,
      effect: translation['spellS4']
    });

    this.spellS5 = new Model({
      name: '魂の歌',
      type: 'general',
      level: level,
      effect: `${translation['spellS5']}+${chant}`
    });

    this.spellS6 = new Model({
      name: '火の鳥',
      type: 'resist',
      level: level,
      dmg: {
        name: `4d`,
        dice: 4,
        add: 0,
      },
      dmgType: {
        'id': 0,
        'rate': 1
      }
    });

    this.spellW1 = new Model({
      name: 'ストーンバレット',
      type: 'missile',
      level: level,
      dmg: {
        name: `${chant}d+${chant}`,
        dice: chant,
        add: chant,
      },
      dmgType: {
        'id': 3,
        'rate': 1
      }
    });

    this.spellW2 = new Model({
      name: 'ベルセルク',
      type: 'resist',
      level: level,
      resist: 2,
      effect: translation['spellW2']
    });

    this.spellW3 = new Model({
      name: 'カムフラージュ',
      type: 'assist',
      level: level,
      effect: translation['spellW3']
    });

    this.spellW4 = new Model({
      name: 'アースハンド',
      type: 'resist',
      aim: 'leg',
      level: level,
      resist: 2,
      effect: translation['spellW4']
    });

    this.spellW6 = new Model({
      name: 'ジェントルゴールド',
      type: 'resist',
      level: level,
      resist: 4,
      effect: translation['spellW6']
    });
    
    this.spellN1 = new Model({
      name: '生命の水',
      type: 'assist',
      level: level,
      effect: translation['spellN1']
    });

    this.spellN2 = new Model({
      name: '神秘の水',
      type: 'assist',
      level: level,
      effect: translation['spellN2']
    });

    this.spellN3 = new Model({
      name: 'ウォーターポール',
      type: 'assist',
      level: level,
      effect: `${translation['spellN3']}+${chant}`
    });

    this.spellN4 = new Model({
      name: 'タイムリープ',
      type: 'assist',
      level: level,
      effect: translation['spellN4']
    });

    this.spellN5 = new Model({
      name: 'スパークリングミスト',
      type: 'general',
      level: level,
      effect: translation['spellN4']
    });

    this.spellN6 = new Model({
      name: '召雷',
      type: 'missile',
      level: level,
      dmg: {
        name: `4d`,
        dice: 4,
        add: 0,
      },
      dmgType: {
        'id': 4, // 攻撃型:雷
        'rate': 1
      }
    });

    this.spellH1 = new Model({
      name: 'サンシャイン',
      type: 'missile',
      level: level,
      effect: translation['spellH1']
    });

    this.spellH2 = new Model({
      name: 'ヒートウェイブ',
      type: 'missile',
      level: level,
      dmg: {
        name: `2d-2`,
        dice: 2,
        add: -2,
      },
      dmgType: {
        'id': 4, // 攻撃型:炎
        'rate': 1
      }
    });

    this.spellH3 = new Model({
      name: 'スターフィクサー',
      type: 'resist',
      aim: 'arm',
      level: level,
      dmg: {
        name: `2d-2`,
        dice: 2,
        add: -2,
      },
      dmgType: {
        'id': 0,
        'rate': 1
      },
      resist: 2
    });

    this.spellH4 = new Model({
      name: 'デイブレイク',
      type: 'resist',
      level: level,
      resist: 0,
      effect: translation['spellH4']
    });

    this.spellH5 = new Model({
      name: '太陽風',
      type: 'missile',
      level: level,
      dmg: {
        name: `3d-3`,
        dice: 3,
        add: -3,
      },
      dmgType: {
        'id': 4, // 攻撃型:炎
        'rate': 1
      }
    });

    this.spellH6 = new Model({
      name: '光の剣',
      type: 'general',
      level: level,
      effect: translation['spellH6']
    });

    this.spellL1 = new Model({
      name: 'ムーンシャイン',
      type: 'assist',
      level: level,
      effect: translation['spellL1']
    });

    this.spellL2 = new Model({
      name: 'ムーングロウ',
      type: 'assist',
      level: level,
      effect: `${translation['spellL2']}+${chant}`
    });

    this.spellL3 = new Model({
      name: 'ソウルフリーズ',
      type: 'resist',
      level: level,
      resist: 2,
      effect: translation['spellL3']
    });

    this.spellL4 = new Model({
      name: 'サクション',
      type: 'resist',
      level: level,
      resist: 2,
      effect: translation['spellL4']
    });

    this.spellL5 = new Model({
      name: '月読の鐘',
      type: 'resist',
      level: level,
      resist: 4,
      effect: translation['spellL5']
    });

    this.spellL6 = new Model({
      name: 'リインカネーション',
      type: 'general',
      level: level,
      effect: translation['spellL6']
    });
  }
}

export { Arts };
