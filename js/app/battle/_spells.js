/*
 * Battle spells
 */

import { Action } from './_actions.js';

const translation = {
  spellE1: 'ウインドカッター',
  spellE2: 'ナップ',
  spellE3: 'ダンシングリーフ',
  spellE4: 'ソーンバインド',
  spellE5: 'ミサイルガード',
  spellE6: '風と樹の唄',
  spellE7: '竜巻',
  spellE8: '幻竜術',
  spellS1: 'ファイアボール',
  spellS2: 'ハードファイア',
  spellS3: 'セルフバーニング',
  spellS4: '生命の息吹',
  spellS5: 'ファイアウォール',
  spellS6: '魂の歌',
  spellS7: 'イニシレイション',
  spellS8: 'リヴァイヴァ',
  spellW1: 'ストーンバレット',
  spellW2: 'ベルセルク',
  spellW3: 'カムフラージュ',
  spellW4: 'アースハンド',
  spellW5: 'ストーンスキン',
  spellW6: 'タッチゴールド',
  spellW7: 'クラック',
  spellW8: '光の壁',
  spellN1: '生命の水',
  spellN2: '神秘の水',
  spellN3: 'ウォーターポール',
  spellN4: 'スパークリングミスト',
  spellN5: 'スコール',
  spellN6: '召雷',
  spellN7: '時間遡行',
  spellN8: 'クイックタイム',
  spellH1: 'サンシャイン',
  spellH2: 'ヒートウェイブ',
  spellH3: 'スターフィクサー',
  spellH4: 'デイブレイク',
  spellH5: '光の剣',
  spellH6: '太陽風',
  spellH7: '再生光',
  spellH8: '幻日',
  spellL1: 'ムーンシャイン',
  spellL2: 'ムーングロウ',
  spellL3: 'ソウルフリーズ',
  spellL4: 'サクション',
  spellL5: '月読の鐘',
  spellL6: '幻惑光',
  spellL7: 'アンティマジック',
  spellL8: 'シャドウサーバント'
};

class Spell extends Action {
  init(options = {}) {
    this._spell = options.spell;
    const action = translation[this._spell];
    const methodName = `_${this._spell}`;
    this._art = this._actor.arts[this._spell];
    this._target = options.target;

    // 目標値
    const level = this._getLevel();

    // 詠唱判定
    if (this._art.get('type') !== 'missile') {
      const chant = this._chant(action, level);
      if (chant) {
        this[methodName](this._actor, this._target);
      }
    } else {
      this[methodName](this._actor, this._target);
    }

    // 集中を0に戻す
    this._actor.setAttr('chant', 0);

    // サマリーの更新
    this._actor.setAttr('action', action);

    // 終了
    this._terminate();
    return this._promise;
  }

  _getLevel() {
    const type = this._art.get('type');
    if (type === 'missile') {
      return this._actor.getHit({
        weapon: this._art,
        isMissile: true,
        target: this._target
      });
    } else {
      return this._actor.getSorcery().get('value');
    }
  }

  _chant(spell, level) {
    // 判定
    const roll = this._roll();
    const result = roll <= level ? true : false;

    // ログ
    this._write({
      method: 'spell',
      actor: this._actor,
      spell: spell
    });
    this._write({
      method: 'roll',
      roll: roll,
      result: result
    });

    // 結果を返す
    return result;
  }

  _resist(correction) {
    // 判定
    const roll = this._roll();
    const level = this._target.getParamValue('WL') + this._target.getChange('WL') - correction;
    const result = Math.max(roll - level, 0)

    // ログ
    this._write({
      method: 'judge',
      target: this._target,
      type: 'spellresist'
    });
    this._write({
      method: 'roll',
      roll: roll,
      result: result <= 0
    });

    // 結果を返す
    return result;
  }

  _shoot(art, action, level) {
    const chant = this._chant(action, level);
    if (!chant) return;

    // 回避判定のためのオブジェクト
    let evadeObj = this._target.getEvade({
      isMissile: true
    });
    const defense = this._target.getAttr('defense') > 1; // 全力防御

    // ダメージ判定のためのオブジェクト
    const aim = art.get('aim') || 'body'
    const dmgObj = this._actor.getDmg({ aim: aim });
    const drObj = this._target.getDR({ aim: aim });

    // メイン
    let evade = this._evade(this._target, evadeObj);
    let stun = false;
    // 全力防御による2回目の回避判定
    if (!evade && defense) {
      evadeObj.isSecondEvade = true;
      evade = this._evade(this._target, evadeObj);
    }
    if (!evade) {
      // ダメージ判定
      const dmg = this._dmg(dmgObj, drObj);
      // ダメージのログと効果判定
      stun = this._judgeEffects(this._target, dmg, dmgObj.type.id, aim);
    }
    if (!stun) {
      this._judgeEvadeEffects(this._target);
    }
  }

  _spellE1() {
    const action = translation[this._spell];
    const level = this._getLevel();
    this._shoot(this._art, action, level);
  }

  _spellE2() {
    // 意志抵抗
    const resist = this._resist(2);
    if (!resist) return;

    // 'daze'
    this._target.setAttr('daze', resist + 1);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'daze'
    });
  }

  _spellE3() {
    // 'spellE3'
    let AG = this._target.getAttr('AG');
    AG += 10;
    AG = Math.min(AG, 30);
    this._target.setAttr('AG', AG);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'spellE3'
    });
  }

  _spellE4() {

  }

  _spellE5() {

  }

  _spellE6() {

  }

  _spellE7() {

  }

  _spellE8() {

  }

  _spellS1() {
    const action = translation[this._spell];
    const level = this._getLevel();
    this._shoot(this._art, action, level);
  }

  _spellS2() {
    // 'spellS2'
    const chant = this._actor.getAttr('chant');
    let LV = this._target.getAttr('LV');
    LV += chant * 10;
    LV = Math.min(LV, 30);
    this._target.setAttr('LV', LV);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'spellS2'
    });
  }

  _spellS3() {
    // 'spellS4'
    this._target.setAttr('spellS4', 10);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'spellS4'
    });
  }

  _spellS4() {

  }

  _spellS5() {
    // 'spellS4'
    const isPlayer = this._actor.getIsPlayer();
    const units = this._actor.model.units;
    for (let i = isPlayer ? 0 : 4; i < 4; i++) {
      const unit = units.at(i);
      if (!unit.getAttr('stun')) {
        unit.setAttr('spellS4', 1);
      }
    }

    // ログ
    this._write({
      method: 'setattr',
      target: this._actor,
      status: 'spellS5'
    });
  }

  _spellS6() {
    // 'spellS2'
    const chant = this._actor.getAttr('chant');
    const isPlayer = this._actor.getIsPlayer();
    const units = this._actor.model.units;
    for (let i = isPlayer ? 0 : 4; i < 4; i++) {
      const unit = units.at(i);
      if (!unit.getAttr('stun')) {
        let LV = unit.getAttr('LV');
        LV += chant * 10;
        LV = Math.min(LV, 30);
        unit.setAttr('LV', LV);
      }
    }

    // ログ
    this._write({
      method: 'setattr',
      target: this._actor,
      status: 'spellS6'
    });
  }

  _spellS7() {

  }

  _spellS8() {

  }

  _spellW1() {
    const action = translation[this._spell];
    const level = this._getLevel();
    const len = this._actor.getAttr('chant');
    for (let i = 0; i < len; i++) {
      const spell = len > 1 ? `${i + 1}回目の${action}` : action;
      this._shoot(this._art, spell, level);
    };
  }

  _spellW2() {
    // 'spellW2'
    const chant = this._actor.getAttr('chant');
    let ST = this._target.getAttr('ST');
    ST += chant * 10;
    ST = Math.min(ST, 30);
    this._target.setAttr('ST', ST);

    let VT = this._target.getAttr('VT');
    VT += 10;
    VT = Math.min(VT, 30);
    this._target.setAttr('VT', VT);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'spellW2'
    });

    // 意志抵抗
    const resist = this._resist(2);
    if (!resist) return;

    // 'immovable'
    this._target.setAttr('berserk', resist + 1);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'berserk'
    });
  }

  _spellW3() {
    // 'invisible'
    this._target.setAttr('invisible', 10);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'invisible'
    });
  }

  _spellW4() {
    // 意志抵抗
    const resist = this._resist(2);
    if (!resist) return;

    // 'immovable'
    this._target.setAttr('immovable', resist + 1);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'immovable'
    });
  }

  _spellW5() {
    return;
  }

  _spellW6() {
    // 意志抵抗
    const resist = this._resist(4);
    if (!resist) return;

    // 'gold'
    this._target.setAttr('gold', true);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'gold'
    });
  }

  _spellW7() {

  }

  _spellW8() {
    // 'spellW8'
    const isPlayer = this._actor.getIsPlayer();
    const units = this._actor.model.units;
    for (let i = isPlayer ? 0 : 4; i < 4; i++) {
      const unit = units.at(i);
      if (!unit.getAttr('stun')) {
        unit.setAttr('spellW8', 1);
      }
    }

    // ログ
    this._write({
      method: 'setattr',
      target: this._actor,
      status: 'spellW8'
    });
  }

  _spellN1() {

  }

  _spellN2() {

  }

  _spellN3() {
    // 'spellN3'
    const chant = this._actor.getAttr('chant');
    let DR = this._target.getAttr('DR');
    DR += chant * 10;
    DR = Math.min(DR, 30);
    this._target.setAttr('DR', DR);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'spellN3'
    });
  }

  _spellN4() {

  }

  _spellN5() {

  }

  _spellN6() {

  }

  _spellN7() {

  }

  _spellN8() {

  }

  _spellH1() {

  }

  _spellH2() {

  }

  _spellH3() {
    // 意志抵抗
    const resist = this._resist(2);

  }

  _spellH4() {
    // 意志抵抗
    const resist = this._resist(0);
    if (!resist) return;

    // 'vanish'
    this._target.setAttr('vanish', true);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'vanish'
    });
  }

  _spellH5() {

  }

  _spellH6() {

  }

  _spellH7() {

  }

  _spellH8() {
    // 'avatar'
    this._actor.setAttr('avatar', 10);

    // ログ
    this._write({
      method: 'setattr',
      target: this._actor,
      status: 'avatar'
    });
  }

  _spellL1() {

  }

  _spellL2() {
    // 'spellL2'
    const chant = this._actor.getAttr('chant');
    let WL = this._target.getAttr('WL');
    WL += chant * 10;
    WL = Math.min(WL, 30);
    this._target.setAttr('WL', WL);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'spellL2'
    });
  }

  _spellL3() {
    // 意志抵抗
    const resist = this._resist(2);
    if (!resist) return;

    // 'fear'
    this._target.setAttr('fear', 1);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'fear'
    });
  }

  _spellL4() {
    // 意志抵抗
    const resist = this._resist(2);

  }

  _spellL5() {

  }

  _spellL6() {
    // 意志抵抗
    const resist = this._resist(4);
    if (!resist) return;

    // ランダムで 'daze', 'berserk', 'fear', 'mad'
    // 'berserk'なら、それまでの効果が打ち消し
    const roll = this._roll(1);
    let status = 'mad';
    if (roll === 1) status = 'daze';
    if (roll === 2) status = 'berserk';
    if (roll === 3) status = 'fear';
    this._target.setAttr(status, resist + 1);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'status'
    });
  }

  _spellL7() {

  }

  _spellL8() {
    // 'avatar'
    this._target.setAttr('avatar', 10);

    // ログ
    this._write({
      method: 'setattr',
      target: this._target,
      status: 'avatar'
    });
  }
}

export { Spell };
