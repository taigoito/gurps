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
  spellE7: '',
  spellE8: '幻竜術',
  spellS1: '',
  spellS2: '戦闘技能値',
  spellS3: '炎の膜',
  spellS4: '覚醒',
  spellS5: '味方全員に炎の膜',
  spellS6: '味方全員の戦闘技能値',
  spellS7: '',
  spellS8: '復活',
  spellW1: '',
  spellW2: '狂戦士',
  spellW3: '透明',
  spellW4: '足止',
  spellW5: '',
  spellW6: '金塊',
  spellW7: '消滅',
  spellW8: '味方全員のダメージ抵抗',
  spellN1: 'HP回復, 身体浄化',
  spellN2: '浄化',
  spellN3: 'ダメージ抵抗',
  spellN4: '敵味方構わず命中率低下',
  spellN5: '敵味方構わず火炎ダメージ半減',
  spellN6: '',
  spellN7: '時間遡行',
  spellN8: '味方全員が1ターン分行動',
  spellH1: '失明',
  spellH2: '',
  spellH3: '',
  spellH4: '消滅',
  spellH5: '光の剣',
  spellH6: '',
  spellH7: 'HP回復, 身体再生',
  spellH8: '分身',
  spellL1: 'HP回復, 精神浄化',
  spellL2: '意志抵抗値',
  spellL3: '恐怖',
  spellL4: '',
  spellL5: 'アニメイト',
  spellL6: '狂気',
  spellL7: '解除',
  spellL8: '分身',
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
      name: 'ウインドカッター',
      type: 'missile',
      level: level,
      dmg: {
        name: `${chant}d-${chant}`,
        dice: chant,
        add: chant * (-1),
      },
      dmgType: {
        'id': 2,
        'rate': 1.5
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

    this.spellE7 = new Model({
      name: '竜巻',
      type: 'missile',
      level: level,
      dmg: {
        name: `2d-2`,
        dice: 2,
        add: -2,
      },
      dmgType: {
        'id': 2,
        'rate': 1.5
      }
    });
    this.spellE8 = new Model({
      name: '幻竜術',
      type: 'assist',
      level: level,
      dmg: {
        name: `2d-2`,
        dice: 2,
        add: -2,
      },
      dmgType: {
        'id': 2,
        'rate': 1.5
      },
      effect: translation['spellE8']
    });

    this.spellS1 = new Model({
      name: 'ファイアボール',
      type: 'missile',
      level: level,
      dmg: {
        name: `${chant}d`,
        dice: chant,
        add: 0,
      },
      dmgType: {
        'id': 4, // 攻撃型:炎
        'rate': 1
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
      name: '生命の息吹',
      type: 'assist',
      level: level,
      effect: translation['spellS4']
    });

    this.spellS5 = new Model({
      name: 'ファイアウォール',
      type: 'general',
      level: level,
      effect: translation['spellS5']
    });

    this.spellS6 = new Model({
      name: '魂の歌',
      type: 'general',
      level: level,
      effect: `${translation['spellS6']}+${chant}`
    });

    this.spellS7 = new Model({
      name: 'イニシレイション',
      type: 'missile',
      level: level,
      dmg: {
        name: `4d`,
        dice: 4,
        add: 0,
      },
      dmgType: {
        'id': 4, // 攻撃型:炎
        'rate': 1
      }
    });

    this.spellS8 = new Model({
      name: 'リヴァイヴァ',
      type: 'assist',
      level: level,
      effect: translation['spellS8']
    });

    this.spellW1 = new Model({
      name: 'ストーンバレット',
      type: 'missile',
      level: level,
      dmg: {
        name: `1d+1`,
        dice: 1,
        add: 1,
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
      name: 'タッチゴールド',
      type: 'resist',
      level: level,
      resist: 4,
      effect: translation['spellW6']
    });

    this.spellW7 = new Model({
      name: 'クラック',
      type: 'missile',
      aim: 'foot',
      level: level,
      effect: translation['spellW7']
    });

    this.spellW8 = new Model({
      name: '光の壁',
      type: 'general',
      level: level,
      effect: translation['spellW8']
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
      name: 'スパークリングミスト',
      type: 'general',
      level: level,
      effect: translation['spellN4']
    });

    this.spellN5 = new Model({
      name: 'スコール',
      type: 'general',
      level: level,
      effect: translation['spellN5']
    });

    this.spellN6 = new Model({
      name: '召雷',
      type: 'missile',
      level: level,
      dmg: {
        name: `3d-3`,
        dice: 3,
        add: -3,
      },
      dmgType: {
        'id': 5, // 攻撃型:雷
        'rate': 1
      }
    });

    this.spellN7 = new Model({
      name: '時間遡行',
      type: 'assist',
      level: level,
      effect: translation['spellN7']
    });

    this.spellN8 = new Model({
      name: 'クイックタイム',
      type: 'general',
      level: level,
      effect: translation['spellN8']
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
      name: '光の剣',
      type: 'assist',
      level: level,
      effect: translation['spellH5']
    });

    this.spellH6 = new Model({
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

    this.spellH7 = new Model({
      name: '再生光',
      type: 'assist',
      level: level,
      effect: translation['spellH7']
    });

    this.spellH8 = new Model({
      name: '幻日',
      type: 'assist',
      level: level,
      effect: translation['spellH8']
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
      aim: 'body',
      level: level,
      dmg: {
        name: `${chant}d-${chant}`,
        dice: chant,
        add: chant * (-1),
      },
      dmgType: {
        'id': 0,
        'rate': 1
      },
      resist: 2
    });

    this.spellL5 = new Model({
      name: '月読の鐘',
      type: 'assist',
      level: level,
      effect: translation['spellL5']
    });

    this.spellL6 = new Model({
      name: '幻惑光',
      type: 'resist',
      level: level,
      resist: 4,
      effect: translation['spellL6']
    });

    this.spellL7 = new Model({
      name: 'アンティマジック',
      type: 'assist',
      level: level,
      effect: translation['spellL7']
    });
    this.spellL8 = new Model({
      name: 'シャドウサーバント',
      type: 'assist',
      level: level,
      effect: translation['spellL8']
    });
  }
}

export { Arts };
