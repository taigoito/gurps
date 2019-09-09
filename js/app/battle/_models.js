/*
 * Battle models
 */

import { Model, Collection } from '../_framework.js';
import { SampleUnit, SampleUnits } from '../sample/_models.js';
import { Action } from './_actions.js';
import { Spell } from './_spells.js';
import { Arts } from './_arts.js';

// サマリー
class Summary extends Model {
  initialize() {
    this._actor = this.get('actor');
    const defaults = {
      order: 0, // 行動順
      isPlayer: true, // プレイヤー側か否か
      position: 'back', // 戦闘配置('back'(後衛), 'left'(左翼), 'center'(中央), 'right'(右翼))
      posture: 'standing', // 姿勢('standing'(直立), 'bow'(屈み), 'kneeStanding'(膝立), 'falling'(転倒))
      condition: 'good', // HPの減少具合('good', 'bad', 'worse', 'worst')
      action: '', // 直前の行動
    }
    this.attributes = Object.assign(defaults, this.attributes);
  }
}

// ダメージ・負傷・身体損傷
class Health extends Model {
  initialize() {
    this._actor = this.get('actor');
    const defaults = {
      vanish: false, // 消滅
      gold: false, // 金塊
      dead: false, // 死亡
      stun: false, // 気絶
      stand: false, // 朦朧状態
      painful: false, // 身体的な朦朧状態
      panic: false, // 精神的な朦朧状態
      breakPoint: 0, // 気絶判定の回数
      damage: 0, // 衝撃(効果の大きい方)
      prevDamage: 0, // 前のターンに受けた衝撃
      currentDamage: 0, // このターンに受けた衝撃
      injury: 0, // HPの減少
      bright: false, // 眩しい
      blindness: false, // 失明
      injuryOnArm: false, // 腕・手首の故障
      injuryOnLeg: false // 脚・足首の故障
    }
    this.attributes = Object.assign(defaults, this.attributes);

    // 消滅 > 死亡
    const changeVanish = () => {
      if (this.get('vanish')) this.set('dead', true);
    }
    this.on('change:vanish', changeVanish);

    // 金塊 > 気絶
    const changeGold = () => {
      if (this.get('gold')) this.set('stun', true);
    }
    this.on('change:gold', changeGold);

    // 死亡 > 気絶
    const changeDead = () => {
      if (this.get('dead')) this.set('stun', true);
    }
    this.on('change:dead', changeDead);

    // 気絶したら、戦闘配置をリセット
    const changeStun = () => {
      this._actor.position = 'back';
      this._actor.posture = 'falling';
    }
    this.on('change:stun', changeStun);

    // 朦朧状態
    const changeStand = () => {
      if (this.get('painful')) this.set('stand', true);
      else if (this.get('panic')) this.set('stand', true);
      else this.set('stand', false);
    }
    this.on('change:painful', changeStand);
    this.on('change:panic', changeStand);

    // 最も大きな衝撃を適用
    const changeDamage = () => {
      const damage = Math.max(this.get('prevDamage'), this.get('currentDamage'));
      this.set('damage', damage);
    }
    this.on('change:currentDamage', changeDamage);

    // コンディション属性の更新
    const changeInjury = () => {
      const injury = this.get('injury');
      const maxHP = this._actor.getParamValue('HP');
      const HP = Math.max(maxHP - injury, -maxHP);
      let condition = 'worst';
      if (HP > maxHP) {
        condition = 'worse';
      } else if (HP > maxHP / 3) {
        condition = 'bad';
      } else if (HP > maxHP * 2 / 3) {
        condition = 'good';
      }
      this._actor.setAttr('condition', condition);
    }
    this.on('change:injury', changeInjury);
  }

  startTurn() {
    // 前のターンの衝撃をリセット
    this.set('prevDamage', this.get('currentDamage'));
    this.set('currentDamage', 0);
  }
}

// フェイント・準備・狙い・集中
class Offense extends Model {
  initialize() {
    this._actor = this.get('actor');
    const defaults = {
      currentWeapon: this._actor.getEquip(1) || this._actor.getEquip(0), // 武器
      feint: {}, // フェイント(効果の大きい方)
      prevFeint: {}, // 前のターンに行ったフェイント
      currentFeint: {}, // このターンに行ったフェイント
      readyFlag: false,
      ready: 0, // 準備
      snipe: false, // 狙い
      chantFlag: false,
      chant: 0, // 集中
      shoot: false // 同ターン中の射撃(true:行った/false:行っていない)
    }
    this.attributes = Object.assign(defaults, this.attributes);

    // 同じターゲットなら、prevFeintとcurrentFeintのうち効果の大きい方を適用
    const changeFeint = () => {
      const prev = this.get('prevFeint');
      const current = this.get('currentFeint');
      if (prev.target && prev.target === current.target) {
        this.set('feint', {
          target: prev.target,
          correction: Math.max(prev.correction, current.correction)
        });
      } else {
        this.set('feint', prev);
      }
    }
    this.on('change:currentFeint', changeFeint);
  }

  startTurn() {
    // 前のターンのフェイントをリセット
    this.set('prevFeint', this.get('currentFeint'));
    this.set('currentFeint', {});

    // 準備フラグが立っていたら、準備完了
    if (this.get('readyFlag')) {   
      this.set('ready', this.get('ready') - 1);
    }
    this.set('readyFlag', false);

    // 射撃の有無をリセット
    this.set('shoot', false);

    // 集中フラグが立っていたら、集中完了
    if (this.get('chantFlag')) {
      let chant = this.get('chant');
      chant++;
      chant = Math.min(chant, 3);
      this.set('chant', chant);
    } else {
      this.set('chant', 0);
    }
    this.set('chantFlag', false);
  }
}

// 防御
class Defense extends Model {
  initialize() {
    this._actor = this.get('actor');
    const defaults = {
      defense: 1, // 全力防御時に'2' / 全力攻撃時に'0'
      block: 1, // 「止め」可能回数 (全力防御時に'2')
      parry: 1,// 「受け」可能回数 (全力防御時に'2')
      acrobat: 1,　// 「軽業」可能回数
      fallback: 1, // 「後退」可能回数
    }
    this.attributes = Object.assign(defaults, this.attributes);
  }

  startTurn() {
    // 全ての防御を'1'に
    const attrs = this.attributes;
    for (let attr in attrs) {
      this.set(attr, 1);
    }
    // 配置が後衛なら、'fallback'は--
    if (this._actor.position === 'back') this.set('fallback', 0);
  }
}

// 効果
class Effect extends Model {
  initialize() {
    this._actor = this.get('actor');
    const defaults = {
      ST: 0, // ベルセルク(30)
      DX: 0,
      AG: 0, // ダンシングリーフ(30)
      IN: 0,
      VT: 0, // ベルセルク(30)
      WL: 0, // ムーングロウ(30)
      CM: 0, // 風と樹の唄(30)
      LV: 0, // ハードファイア(30)
      EV: 0,
      Dmg: 0,
      DR: 0,  // ウォーターポール(30)
      daze: 0, // 幻惑(10) 行動不能/回避は可 ダメージによって正気に返る
      berserk: 0, // 狂戦士(10) 全力攻撃のみ
      fear: 0, // 恐怖(10) 0になるまで精神的な朦朧状態が回復しない
      mad: 0, // 狂気(10) 自動行動
      dragon: 0, // 幻竜術(10)
      firewall: 0, // セルフバーニング(10), またファイアウォール(1)
      invisible: 0, // カムフラージュ(10)
      immovable: 0, // アースハンド(10)
      lightwall: 0, // 光の壁(1)
      avatar: 0, // 分身(10) 行動に影響
      windy: 0, // ミサイルガード
      fog: 0, // 濃霧
      squall: 0, // 豪雨
      quickTime: 0 // クイックタイム
    }
    this.attributes = Object.assign(defaults, this.attributes);

    // 恐怖なら精神的な朦朧状態
    const changeFear = () => {
      if (this.get('fear')) this._actor.setAttr('panic', true);
    }
    this.on('change:fear', changeFear);
  }

  startTurn() {
    // 全属性を--
    const attrs = this.attributes;
    for (let attr in attrs) {
      let value = this.get(attr);
      if (value > 20) value--;
      if (value > 10) value--;
      if (value > 0) value--;
      this.set(attr, value);
    }
  }
}

// パラメータ変化
class Changes extends Model {
  initialize() {
    this._actor = this.get('actor');
    const defaults = {
      ST: 0,
      DX: 0,
      AG: 0,
      VT: 0,
      IN: 0,
      WL: 0,
      CM: 0,
      LV: 0,
      EV: 0,
      Dmg: 0,
      DR: 0
    };
    this.attributes = Object.assign(defaults, this.attributes);
  }

  startTurn() {
    this.update();
  }

  update() {
    // 補助系の術法効果
    const arr = ['ST', 'DX', 'AG', 'IN', 'VT', 'WL', 'CM', 'LV', 'EV', 'Dmg', 'DR'];
    const effect = {};
    arr.forEach((param) => {
      effect[param] = this._actor.getAttr(param);
      const correction = Math.ceil(effect[param] / 10);
      this.set(param, correction);
    });

    // 'ST'(怪力)より'Dmg'再計算
    const Dmg = Math.floor(this._actor.getParamValue(9) % 1 + this.get('ST') / 2);
    this.set('Dmg', this.get('Dmg') + Dmg);

    // 'AG'(運動)より'EV'再計算
    const EV = Math.floor(this._actor.getParamValue(20) % 1 + this.get('AG') / 2);
    this.set('EV', this.get('EV') + EV);

    // 損傷
    const injuryOnArm = this._actor.getAttr('injuryOnArm');
    const bright = this._actor.getAttr('bright');
    const blindness = this._actor.getAttr('blindness');
    if (injuryOnArm) {
      this.set('LV', this.get('LV') - 4);
    }
    if (bright) {
      this.set('LV', this.get('LV') - 6);
    }
    if (blindness) {
      this.set('EV', this.get('EV') - 2);
    }

    // 光の壁
    const lightwall = this._actor.getAttr('lightwall');
    if (lightwall) {
      this.set('DR', this.get('DR') + 2);
    }
  }
}

class Command extends Model {
  initialize() {
    this._actor = this.get('actor');
  }

  startTurn() {
    if (this._actor.getAttr('berserk')) {
      this.attributes = {
        actor: this._actor,
        mainReady: this._checkReady(),
        mainAttack: false,
        mainFeint: false,
        mainSpecial: this._checkSpecial(),
        specialDmg: this._checkAttack(),
        specialHit: this._checkAttack(),
        specialFeint: this._checkAttack(),
        specialDouble: this._checkSpecialDouble(),
        specialReady: this._checkSpecialReady(),
        specialNone: false,
        aimBody: this._checkAim(),
        aimHead: this._checkAim(),
        aimEar: this._checkAim(),
        aimEye: this._checkAim(),
        aimArm: this._checkAim(),
        aimHand: this._checkAim(),
        aimLeg: this._checkAim(),
        aimFoot: this._checkAim(),
        aimStomach: this._checkAim(),
        aimNeck: this._checkAim(),
        mainSnipe: false,
        mainChant: false,
        mainSpell: false,
        spells: false,
        mainDefense: false,
        mainMove: this._checkMove(),
        moveLeft: this._checkMovePosition('left'),
        moveCenter: this._checkMovePosition('center'),
        moveRight: this._checkMovePosition('right'),
        moveBack: false,
        mainChangePosture: this._checkChangePosture(),
        mainChangeEquipment: this._checkChangeEquipment(),
        mainAutoCommand: true
      };
    } else {
      this.attributes = {
        actor: this._actor,
        mainReady: this._checkReady(),
        mainAttack: this._checkAttack(),
        mainFeint: this._checkFeint(),
        mainSpecial: this._checkSpecial(),
        specialDmg: this._checkFeint(),
        specialHit: this._checkFeint(),
        specialFeint: this._checkFeint(),
        specialDouble: this._checkSpecialDouble(),
        specialReady: this._checkSpecialReady(),
        specialNone: this._checkAttack(),
        aimBody: this._checkAim(),
        aimHead: this._checkAim(),
        aimEar: this._checkAim(),
        aimEye: this._checkAim(),
        aimArm: this._checkAim(),
        aimHand: this._checkAim(),
        aimLeg: this._checkAim(),
        aimFoot: this._checkAim(),
        aimStomach: this._checkAim(),
        aimNeck: this._checkAim(),
        mainSnipe: this._checkSnipe(),
        mainChant: this._checkChant(),
        mainSpell: this._checkSpell(),
        spells: this._checkSpells(),
        mainDefense: true,
        mainMove: this._checkMove(),
        moveLeft: this._checkMovePosition('left'),
        moveCenter: this._checkMovePosition('center'),
        moveRight: this._checkMovePosition('right'),
        moveBack: this._checkMovePosition('back'),
        mainChangePosture: this._checkChangePosture(),
        mainChangeEquipment: this._checkChangeEquipment(),
        mainAutoCommand: true
      };
    }
  }

  _checkReady() {
    // 武器を持っていて、準備ができていない
    return (this._actor.hasWeapon() || this._actor.hasMissile())
      && !this._actor.hasReady();
  }

  _checkAttack() {
    // 同ターン中に射撃を行っていない状態で、射撃武器で、準備ができている
    // または前衛で、準備できている
    return (!this._actor.getAttr('shoot') && this._actor.hasMissile() && this._actor.hasReady()) ||
      this._actor.position !== 'back' && this._actor.hasReady() ? true : false;
  }

  _checkFeint() {
    // 前衛で、武器を持っていて、準備できている
    return this._actor.position !== 'back' && this._actor.hasWeapon() && this._actor.hasReady();
  }

  _checkSpecial() {
    // 同ターン中に射撃を行っていない状態で、射撃武器で、準備ができている
    // または前衛で（準備の有無に関わらず）武器を持っているなら可
    return this._actor.position !== 'back' && this._actor.hasWeapon() ||
      !this._actor.getAttr('shoot') && this._actor.hasMissile() && this._actor.hasReady();
  }

  _checkSpecialDouble() {
    // 準備不要の武器
    return this._actor.getCurrentWeapon().get('ready') ? false : true;
  }

  _checkSpecialReady() {
    // 準備必要の武器で、あと1ターンで準備できる
    const ready = this._actor.getAttr('ready');
    return (this._actor.hasWeapon() || this._actor.hasMissile()) && ready === 1;
  }

  _checkAim() {
    return this._checkAttack() || this._checkSpecialReady();
  }

  _checkSnipe() {
    // 準備できている射撃武器を持っているなら可
    return this._actor.hasMissile() && this._actor.hasReady();
  }

  _checkChant() {
    // スキルを所有しているなら可
    const arr = [26, 27, 28, 29, 30, 31];
    let result = false;
    this._actor.parameters.models.forEach((param) => {
      if (arr.includes(param.id) && param.get('cp') > 0) {
        result = true;
      }
    });
    return result
  }

  _checkSpell() {
    // 集中時間が有効なら可
    const result = this._actor.getAttr('chant') > 0;
    return result;
  }

  // 個々の術に対し、技能値・CPが有効なら可
  _checkSpells() {
    const arr = ['E', 'S', 'W', 'N', 'H', 'L'];
    const spells = {};
    for (let i = 0; i < 6; i++) {
      const char = arr[i];
      const level = this._actor.getParamValue(i + 26);
      const cp = this._actor.getParam(i + 26).get('cp');
      for (let j = 0; j < 8; j++) {
        const result = level > j + 10 && cp > 0;
        spells[`${char}${j + 1}`] = result;
      }
    }
    return spells;
  }

  _checkMove() {
    // 脚・足首の損傷が無効で、「アースハンド」が無効なら可
    return !this._actor.getAttr('injuryOnLeg') && !this._actor.getAttr('immovable');
  }

  _checkMovePosition(position) {
    // 各配置に対し、先にユニットが配置されていなければ可
    let result = true;
    if (position === 'back') {
      result = this._actor.position === 'back' ? false : true;
    } else {
      const isPlayer = this._actor.isPlayer;
      const units = this._actor.model.units;
      const friends = units.filter((unit) => isPlayer === unit.isPlayer);
      friends.forEach((unit) => {
        if (position === unit.position) result = false;
      });
    }
    return result;
  }

  _checkChangePosture() {
    // 転倒中なら起き上がる
    if (this._actor.posture === 'falling') {
      this._actor.posture = 'kneeStanding';
      return false;
    } else {
      return true;
    }
  }

  _checkChangeEquipment() {
    // 持ち替える武器が他にあれば可
    if (this._actor.getEquip(1) || this._actor.getEquip(2)) {
      return true;
    } else {
      return false;
    }
  }

  attack(options = {}) {
    let action = new Action(this._actor);
    action = action.attack(options);
    if (options.isMissile) {
      action.then(() => {
        this.startTurn();
        this._actor.trigger('update');
      });
    } else {
      action.then(() => this._actor.endTurn());
    }
  }

  feint(options = {}) {
    let action = new Action(this._actor);
    action = action.feint(options);
    action.then(() => this._actor.endTurn());
  }

  special(options = {}) {
    let action = new Action(this._actor);
    if (options.special !== 'none') {
      this._actor.setAttr('defense', 0); // 全力攻撃
    }
    if (options.special === 'feint') {
      action = action.feint(options);
      action.then(() => {
        let action = new Action(this._actor);
        return action.attack(options);
      }).then(() => {
        this._actor.endTurn();
      });
    } else if (options.special === 'double') {
      action = action.attack(options);
      action.then(() => {
        if (options.target.getAttr('stun')) { // ターゲットが倒れたら攻撃は中止
          return new Promise((resolve, reject) => resolve());
        } else {
          let action = new Action(this._actor);
          return action.attack(options);
        }
      }).then(() => {
        this._actor.endTurn();
      });
    } else {
      action = action.attack(options);
      action.then(() => this._actor.endTurn());
    }
  }

  ready() {
    let action = new Action(this._actor);
    action = action.ready();
    action.then(() => this._actor.endTurn());
  }

  snipe(options = {}) {
    let action = new Action(this._actor);
    action = action.snipe(options);
    action.then(() => this._actor.endTurn());
  }

  chant() {
    let action = new Action(this._actor);
    action = action.chant();
    action.then(() => this._actor.endTurn());
  }

  spell(options = {}) {
    let action = new Spell(this._actor);
    action = action.init(options);
    action.then(() => {
      this.startTurn();
      this._actor.trigger('update');
    });
  }

  defense() {
    let action = new Action(this._actor);
    action = action.defense();
    action.then(() => this._actor.endTurn());
  }

  move(options = {}) {
    let action = new Action(this._actor);
    action = action.move(options)
    action.then(() => this._actor.endTurn());
  }

  changePosture() {
    let action = new Action(this._actor);
    action = action.changePosture();
    action.then(() => {
      this.startTurn();
      this._actor.trigger('update');
    });
  }

  changeEquipment() {
    let action = new Action(this._actor);
    action = action.changeEquipment();
    action.then(() => {
      this.startTurn();
      this._actor.trigger('update');
    });
  }

  autoCommand() {
    let action = new Action(this._actor);
    action = action.autoCommand();
    action.then(() => this._actor.endTurn());
  }
}

class BattleUnit extends SampleUnit {
  initialize() {
    super.initialize();
    this.summary = this.get('summary') || new Summary({ actor: this });
    this.health = this.get('health') || new Health({ actor: this });
    this.offense = this.get('offense') || new Offense({ actor: this });
    this.defense = this.get('defense') || new Defense({ actor: this });
    this.effect = this.get('effect') || new Effect({ actor: this });
    this.changes = this.get('changes') || new Changes({ actor: this });
    this.command = this.get('command') || new Command({ actor: this });
    this.arts = new Arts(this);

    // コマンド実行中に任意に発火させ、モデルに伝える
    this.on('update', () => this.model.trigger('update'));
  }

  roll(num = 3) {
    let result = 0;
    for (let i = 0; i < num; i++) {
      result += Math.ceil(Math.random() * 6);
    }
    return result;
  }

  _write(attrs = {}) {
    this.model.log.write(attrs);
  }

  _done(callback) {
    return this.model.log.done(callback);
  }

  startTurn() {
    // 各ステータス初期化
    this.health.startTurn();
    this.offense.startTurn();
    this.defense.startTurn();
    this.effect.startTurn();
    this.changes.startTurn();

    // 行動開始のログ
    this._write({ method: 'init', actor: this });

    // 身体的な朦朧状態の立ち直り判定
    const painful = this.getAttr('painful');
    if (painful) {
      const recovery = this._judgeRecovery();
      if (recovery) this.setAttr('painful', false);
    }

    // 精神的な朦朧状態の立ち直り判定（恐怖から回復しているなら）
    const panic = this.getAttr('panic') && !this.getAttr('fear');
    if (panic) {
      const recovery = this._judgeRecovery('WL');
      if (recovery) this.setAttr('panic', false);
    }

    // 幻惑
    const daze = this.getAttr('daze');
    if (daze) this._write({ method: 'setattr', target: this, status: 'indaze' });

    // 狂戦士
    const berserk = this.getAttr('berserk');
    if (berserk) this._write({ method: 'setattr', target: this, status: 'inberserk' });

    // 恐怖
    const fear = this.getAttr('fear');
    if (fear) this._write({ method: 'setattr', target: this, status: 'infear' });

    // 狂気
    const mad = this.getAttr('mad');
    if (mad) this._write({ method: 'setattr', target: this, status: 'inmad' });

    // 行動不能
    const stand = this.getAttr('stand');
    const isInactive = stand || daze || fear || mad;

    // ログを表示
    // 行動可能ならコマンドを初期化し、コマンドから'endTurn'の実行を待つ
    // 行動不能なら、そのまま'endTurn'の発火
    this._write({ method: 'render', blank: !isInactive });
    this._done(() => {
      if (isInactive) {
        this.endTurn();
      } else {
        // コマンド初期化
        this.command.startTurn();
        // ビューの更新
        this.trigger('update');
      }
    });
  }

  // コマンド終了時に実行し、ターン終了をモデルに伝える
  endTurn() {
    this.model.endTurn();
  }

  setAttr(attr, value) {
    const categories = ['summary', 'health', 'offense', 'defense', 'effect'];
    categories.forEach((category) => {
      for (let prop in this[category].attributes) {
        if (prop === attr) {
          return this[category].set(prop, value);
        }
      }
    });
  }

  getAttr(attr) {
    const categories = ['summary', 'health', 'offense', 'defense', 'effect'];
    let result;
    categories.forEach((category) => {
      for (let prop in this[category].attributes) {
        if (prop === attr) {
          result = this[category].get(prop);
        }
      }
    });
    return result;
  }

  setChange(attr, value) {
    return this.changes.set(attr, value);
  }

  getChange(attr) {
    return this.changes.get(attr);
  }

  getCurrentWeapon() {
    return this.getAttr('currentWeapon') || false;
  }

  getWeapon() {
    return this.getEquip(1) || this.getEquip(0) || false;
  }

  getSubWeapon() {
    return this.getEquip(0) || false;
  }

  getMissile() {
    return this.getEquip(2) || false;
  }

  getShield() {
    return this.getEquip(3) || false;
  }

  getHeadArmor() {
    return this.getEquip(4) || false;
  }

  getBodyArmor() {
    return this.getEquip(5) || false;
  }

  getArmArmor() {
    return this.getEquip(6) || false;
  }

  getLegArmor() {
    return this.getEquip(7) || false;
  }

  // 射撃武器を持っている場合はfalseを返す
  hasWeapon() {
    return this.getCurrentWeapon().get('ev') ? true : false;
  }

  hasMissile() {
    return this.getCurrentWeapon().get('equipmentType') === 6;
  }

  hasShield() {
    return this.getShield() ? true : false;
  }

  // 武器・射撃武器を持っていることが条件に含まれる
  hasReady() {
    const ready = this.getAttr('ready');
    return (this.hasWeapon() || this.hasMissile()) && ready === 0;
  }

  // 集中時間が有効で白虎術スキルレベルが15以上でなければ0を返す
  getStoneSkin() {
    const chant = this.getAttr('chant');
    const level = this.getParamValue(28);
    return chant && level > 14 ? level : 0;
  }

  // 「止め」が不能か、盾を持っていなければ0を返す
  getBlock(isMissile = false, isSecondEvade = false) {
    const dev = this.getBodyArmor().get('ev') || 0;
    const bev = this.hasShield() ? this.getShield().get('ev') : 0;
    const correction = !isMissile ? 0 : -2;
    return bev && (this.getAttr('block') > 1 && isSecondEvade || this.getAttr('block'))
      ? dev + bev + correction : 0;
  }

  // 「受け」が不能か、武器を持っていなければ0を返す
  getParry(isMissile = false, isSecondEvade = false) {
    const dev = this.getBodyArmor().get('ev') || 0;
    const pev = this.getCurrentWeapon().get('ev') || 0;
    return !isMissile && pev && (this.getAttr('parry') > 1 && isSecondEvade || this.getAttr('parry'))
      ? dev + pev : 0;
  }

  // 「軽業」が不能か、軽業スキルがD-EVより低ければ0を返す
  getAcrobat() {
    const acrobat = this.getParamValue(22) || 0;
    const dev = this.getBodyArmor().get('ev') || 0;
    const wt = this.getCurrentWeapon().get('wt') || 0;
    return acrobat > dev && this.getAttr('acrobat')
      ? acrobat - wt : 0;
  }

  getDodge() {
    const dev = this.getBodyArmor().get('ev') || 0;
    const wt = this.getCurrentWeapon().get('wt') || 0;
    return dev - wt;
  }

  // 命中判定の目標値を算出
  // options.weapon: 武器/呪文
  // options.hit: 全力攻撃オプション
  // options.isMissile: 射撃
  // options.aim: 部位狙いオプション
  // options.target: ターゲット
  getHit(options = {}) {
    // 技能値
    const weapon = options.weapon || this.getCurrentWeapon();
    const level = weapon.get('level') || 0;

    // 全力攻撃オプション
    const hitOpt = options.hit ? 4 : 0;

    // 攻撃者の姿勢
    const posture = this.posture === 'bow' ? 1 :
      this.posture === 'kneeStanding' ? 2 :
        this.posture === 'falling' ? 4 : 0;

    // 衝撃
    const damage = this.getAttr('damage');

    // LV修正
    const change = this.getChange('LV');

    // 小計
    const hit = level + hitOpt - posture - damage + change;

    // 射撃
    const isMissile = options.isMissile || this.hasMissile();
    let correction = 0, range = 0, small = 0;
    if (isMissile) {
      // 狙い
      const snipe = this.getAttr('snipe');
      correction = this.hasMissile() && snipe !== options.target ? 4 : 0;

      // 距離
      const targetPosition = options.target.position || '';
      range = !isMissile ? 0 :
        (this.position === 'back' ? 1 : 0) + (targetPosition === 'back' ? 1 : 0);

      // 防御者の姿勢
      const targetPosture = options.target.posture || '';
      small = !isMissile ? 0 :
        targetPosture === 'bow' ? 2 :
          targetPosture === 'kneeStanding' ? 4 :
            targetPosture === 'falling' ? 8 : 0;
    }

    // 部位狙い
    const aimOpt = options.aim || 'body';
    const aim = aimOpt === 'arm' ? 2 :
      aimOpt === 'head' || aimOpt === 'leg' || aimOpt === 'stomach' ? 3 :
        aimOpt === 'hand' ? 4 :
          aimOpt === 'ear' || aimOpt === 'foot' || aimOpt === 'neck' ? 5 :
            aimOpt === 'eye' ? 7 : 0;

    return hit - correction - range - small - aim;
  }

  // 回避オブジェクトを算出
  // level: 回避判定の目標値
  // type: 回避タイプ
  // fallback: 後退の有無
  // options.isMissile: 射撃
  // options.isSecondEvade: 全力防御による2回目の回避
  // options.feint: 攻撃側のフェイント
  getEvade(options = {}) {
    // 回避タイプ
    const isMissile = options.isMissile || false;
    const isSecondEvade = options.isSecondEvade || false;
    const stone = this.getStoneSkin(); // ストーンスキン
    const block = this.getBlock(isMissile, isSecondEvade); // 止め
    const parry = this.getParry(isMissile, isSecondEvade); // 受け
    const acrobat = this.getAcrobat(); // 軽業
    const dodge = this.getDodge(); // よけ
    const result = {};
    if (stone) {
      result.level = stone;
      result.type = 'stone';
    } else if (block) {
      result.level = block;
      result.type = 'block';
    } else if (block) {
      result.level = block;
      result.type = 'block';
    } else if (parry) {
      result.level = parry;
      result.type = 'parry';
    } else if (acrobat) {
      result.level = acrobat;
      result.type = 'acrobat';
    } else {
      result.level = dodge;
      result.type = 'dodge';
    }

    // EV修正
    const EV = this.getChange('EV');
    result.level += EV;

    // 姿勢
    const posture = this.posture || 'standing';
    if (posture === 'kneeStanding') result.level--;
    if (posture === 'falling') result.level -= 2;

    // 衝撃・朦朧状態
    const stand = this.getAttr('stand');
    const damage = this.getAttr('damage');
    result.level -= Math.max(Math.floor(damage / 2), stand ? 4 : 0);

    // 防御(全力攻撃によって放棄される)
    const defense = this.getAttr('defense');
    if (!defense) result.level -= 4;

    // フェイント
    const feint = options.feint || false;
    if (feint.target === this) {
      result.level -= feint.correction;
    }

    // 最小値は4
    result.level = Math.max(result.level, 4);

    // 防御が有効で、後退が有効で、目標値が11未満で、
    // 回避タイプは「ストーンスキン」以外なら、「後退」
    const fallback = this.getAttr('fallback');
    if (result.level < 11 && result.type !== 'stone' &&
      defense && fallback) {
      result.level += 3;
      result.fallback = true;
    }
    return result;
  }

  // ダメージオブジェクトを算出
  // name: 表記
  // dice: rollの引数
  // add: rollの修正
  // type: 攻撃型オブジェクト
  // options.weapon: 武器/呪文
  // options.dmg: 全力攻撃オプション
  // options.aim: 部位狙いオプション
  getDmg(options = {}) {
    const weapon = options.weapon || this.getCurrentWeapon();
    const dmg = weapon.get('dmg');
    const dmgType = weapon.get('dmgType');
    const dmgOpt = options.dmg ? 2 : 0; // 全力攻撃オプション
    const damage = this.getAttr('damage');// 衝撃
    const change = this.getChange('Dmg'); // Dmg修正
    const correction = dmgOpt - Math.floor(damage / 2) + change;
    const aim = options.aim || 'body';
    return {
      name: dmg.name,
      dice: dmg.dice,
      add: dmg.add + correction,
      type: dmgType,
      aim: aim
    }
  }

  // ダメージ抵抗オブジェクトを算出
  // name: 表記
  // dice: rollの引数
  // add: rollの修正
  // type: 攻撃型オブジェクト
  // options.aim: 部位狙いオプション
  getDR(options = {}) {
    const aimOpt = options.aim;
    const armor = aimOpt === 'head' || aimOpt === 'ear' || aimOpt === 'eye' ? this.getHeadArmor() :
      aimOpt === 'hand' ? this.getArmArmor() :
        aimOpt === 'foot' ? this.getLegArmor() :
          this.getBodyArmor();
    const name = armor.get('dr') || '0';
    const sdr = armor.get('sdr') || 0;
    const tdr = armor.get('tdr') || 0;
    const change = this.getChange('DR');
    const maxHP = this.getParamValue('HP');
    return {
      name: name,
      sdr: sdr + change,
      tdr: tdr + change,
      maxHP: maxHP
    }
  }

  // 行動者のダメージオブジェクトと、ターゲットのダメージ抵抗オブジェクトより、
  // ダメージの期待値を算出
  getExpectedDmg(dmgObj, drObj) {
    let dmg = dmgObj.dice * 3.5 + dmgObj.add; // 衝撃
    dmg -= dmgObj.type.id === 1 ? drObj.tdr :
      dmgObj.type.id > 1 ? drObj.sdr : 0; // 抵抗
    if (dmgObj.aim === 'stomach' || dmgObj.aim === 'neck') {
      dmg *= (Math.floor(dmgObj.type.rate * 3)) / 2; // 肚・喉狙いの致傷
    } else {
      dmg *= dmgObj.type.rate; // 致傷
    }
    if (dmgObj.aim === 'hand' || dmgObj.aim === 'foot') {
      dmg = Math.min(Math.floor(drObj.maxHP / 3), dmg); // 手首・足首狙いのダメージ上限
    } else if (dmgObj.aim === 'arm' || dmgObj.aim === 'leg') {
      dmg = Math.min(Math.floor(drObj.maxHP / 2), dmg); // 腕・脚狙いのダメージ上限
    }
    dmg = Math.max(Math.ceil(dmg), 0);
    return dmg
  }

  _judgeRecovery(param = 'VT', correction = 0) {
    // 判定
    const roll = this.roll();
    const level = this.getParamValue(param) + this.getChange(param) - correction;
    const result = roll <= level ? true : false;

    // ログ
    this._write({
      method: 'judge',
      target: this,
      type: 'recovery'
    });
    this._write({
      method: 'roll',
      roll: roll,
      result: result
    });
    this._write({
      method: 'recovery',
      actor: this,
      result: result
    });

    // 結果を返す
    return result;
  }

  set model(value) {
    this.collection = value;
  }

  get model() {
    return this.collection;
  }

  set order(value) {
    this.setAttr('order', value);
  }

  get order() {
    return this.getAttr('order');
  }

  set isPlayer(value) {
    this.setAttr('isPlayer', value);
  }

  get isPlayer() {
    return this.getAttr('isPlayer');
  }

  set position(value) {
    this.setAttr('position', value);
  }

  get position() {
    return this.getAttr('position');
  }

  set posture(value) {
    this.setAttr('posture', value);
  }

  get posture() {
    return this.getAttr('posture');
  }
}

// ログに出力される1行の内容
// ビューによって内容をテキストに変換
class Message extends Model {
  initialize() {
    const defaults = {
      method: 'default',
      blank: false // true: 空白行の挿入
    }
    this.attributes = Object.assign(defaults, this.attributes);
  }
}

// メッセージのまとまり
class Log extends Collection {
  write(attrs = {}) {
    super.add(new Message(attrs));
  }
}

// 全ての戦況情報を管理
// turn: 全員の行動一巡り
// order: ターン内の行動順
// log: ログ
// units: コレクション
// actor: コレクション内の行動者1名
class BattleModel extends SampleUnits {
  initialize() {
    this.turn = 0;
    this.order = 0;
    this.log = new Log();
    super.initialize();
  }

  _handleEvents() {
    super._handleEvents();
    const setAttributes = (unit) => {
      unit.order = unit.id;
      unit.isPlayer = unit.id < 4 ? true : false;
    };
    this.on('add', setAttributes);
  }

  addUnit(attr = {}) {
    return this.add(new BattleUnit(attr));
  }

  // ゲーム開始時と'endTurn'後に実行し、ユニットを操作するコマンドを表示
  startTurn() {
    this.actor.startTurn();
  }

  // ユニットのコマンドが終了したら、ターンを更新して次のユニットの行動へ移る
  endTurn() {
    do {
      this.order = (this.order + 1) % this.length;
      if (this.order === 0) this.turn++;

      // 行動者の消滅、死亡、気絶を判定
    } while (this.actor.getAttr('stun'));

    // 行動開始
    this.startTurn();
  }

  set units(value) {
    this.models = value;
  }

  get units() {
    return this.models;
  }

  set actor(value) {
    this.at(this.order) = value;
  }

  get actor() {
    return this.at(this.order);
  }
}

export { BattleModel };
