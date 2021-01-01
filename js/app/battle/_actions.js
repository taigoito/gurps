/*
 * Battle commands
 */

const translation = {
  command: {
    ready: '準備',
    attack: '攻撃',
    feint: '牽制',
    special: '特殊攻撃',
    defenseless: '全力攻撃',
    snipe: '狙い',
    chant: '集中',
    spell: '術法',
    defense: '全力防御',
    move: '移動',
    changePosture: '姿勢変更',
    changeEquipment: '装備変更',
    autoCommand: '自動'
  },
  ready: {
    resolve: '完了',
    pending: '中'
  },
  aim: {
    body: '体',
    head: '頭',
    ear: '耳',
    eye: '目',
    arm: '腕',
    hand: '手首',
    leg: '脚',
    foot: '足首',
    stomach: '肚',
    neck: '喉'
  },
  position: {
    left: '左翼',
    center: '中央',
    right: '右翼',
    back: '後衛'
  },
  posture: {
    standing: '直立',
    bow: '屈み',
    kneeStanding: '膝立',
    falling: '転倒'
  },
  result: {
    success: '成功',
    fail: '失敗'
  }
};

class Action {
  constructor(actor) {
    this._actor = actor;
    this._model = actor.model;
    this._messages = actor.model.log;
    this._promise = new Promise((resolve, reject) => {
      this._terminate = () => {
        this._write({ method: 'render', blank: this._subaction });
        this._done(() => resolve());
      }
    });
  }

  _write(attrs = {}) {
    this._actor.model.log.write(attrs);
  }

  _done(callback) {
    return this._actor.model.log.done(callback);
  }

  _roll(num = 3) {
    return this._actor.roll(num);
  }

  _hit(level, aim) {
    // 判定
    const roll = this._roll();
    const result = roll <= level ? true : false;

    // 準備を0に戻す
    const equip = this._actor.getCurrentWeapon();
    const required = equip.get('ready');
    this._actor.setAttr('ready', required);

    // ログ
    this._write({
      method: 'hit',
      actor: this._actor,
      aim: aim === 'body' ? false : translation.aim[aim]
    });
    this._write({
      method: 'roll',
      roll: roll,
      result: result
    });

    // 結果を返す
    return result;
  }

  _feint(level) {
    // 判定
    const roll = this._roll();
    const result = Math.max(level - roll, 0);

    // ログ
    this._write({
      method: 'judge',
      target: this._actor,
      type: 'feint'
    });
    this._write({
      method: 'roll',
      roll: roll,
      result: result > 0
    });

    // 結果を返す
    return result;
  }

  _resist(target, level) {
    // 判定
    const roll = this._roll();
    const result = Math.max(level - roll, 0);

    // ログ
    this._write({
      method: 'judge',
      target: target,
      type: 'feintresist'
    });
    this._write({
      method: 'roll',
      roll: roll,
      result: result > 0
    });

    // 結果を返す
    return result;
  }

  _evade(target, evade) {
    // 判定
    const roll = this._roll();
    const result = roll <= evade.level ? true : false;

    // 回避タイプを無効
    if (evade.type !== 'dodge' || evade.type !== 'stone') {
      let defense = evade.type;
      defense--;
      target.setAttr(evade.type, defense);
    }

    // 準備を0に戻す
    if (evade.type === 'parry') {
      target.setAttr('ready', 0);
    }

    // 集中を0に戻す
    if (evade.type === 'stone') {
      target.setAttr('chant', 0);
    }

    // 後退した場合
    if (evade.fallback) {
      target.position = 'back';
      target.setAttr('fallback', 0);
    }

    // ログ
    this._write({
      method: 'evade',
      target: target,
      evade: evade
    });
    this._write({
      method: 'roll',
      roll: roll,
      result: result
    });

    // 結果を返す
    return result;
  }

  _dmg(dmgObj, drObj) {
    // 判定
    let dmg = this._roll(dmgObj.dice) + dmgObj.add; // 衝撃
    dmg -= dmgObj.type.id === 1 ? drObj.tdr :
      dmgObj.type.id > 1 ? drObj.sdr : 0; // 抵抗
    if (dmgObj.aim === 'stomach' || dmgObj.aim === 'neck') {
      dmg *= (Math.floor(dmgObj.type.rate * 3)) / 2; // 肚・喉狙いの致傷
    } else {
      dmg *= dmgObj.type.rate; // 致傷
    }
    dmg = Math.max(Math.floor(dmg), 0);

    // 結果を返す
    return dmg;
  }

  _judge(target, type = 'dead', correction = 0, count = 0) {
    // 判定
    const roll = this._roll();
    const level = type === 'chant' ? target.getParamValue('WL') - correction :
      target.getParamValue('ST') - correction;
    const result = roll <= level ? true : false;

    // ログ
    this._write({
      method: 'judge',
      target: target,
      type: type,
      count: count
    });
    this._write({
      method: 'roll',
      roll: roll,
      result: result
    });

    // 結果を返す
    return result;
  }

  _judgeEffects(target, dmg, dmgType, aim) {
    const HP = target.getParamValue('ST');
    const breakPoint = target.getAttr('breakPoint');
    const currentHP = HP - target.getAttr('injury');
    const aimForLimb = aim === 'arm' || aim === 'leg' || aim === 'hand' || aim === 'foot';
    let injuryOnLimb = false;

    // 四肢を狙った攻撃のダメージ上限と損傷
    if (aim === 'hand' || aim === 'foot') {
      if (dmg >= currentHP / 3) {
        if (aim === 'hand') target.setAttr('injuryOnArm', true); // 手首の損傷
        if (aim === 'foot') target.setAttr('injuryOnLeg', true); // 足首の損傷
        injuryOnLimb = true;
      }
      dmg = Math.min(Math.floor(currentHP / 3), dmg); // ダメージ上限
    } else if (aim === 'arm' || aim === 'leg') {
      if (dmg >= currentHP / 3) {
        if (aim === 'arm') target.setAttr('injuryOnArm', true); // 腕の損傷
        if (aim === 'leg') target.setAttr('injuryOnLeg', true); // 脚の損傷
        injuryOnLimb = true;
      }
      dmg = Math.min(Math.floor(currentHP / 2), dmg); // ダメージ上限
    }

    // ダメージのログ
    this._write({
      method: 'dmg',
      dmg: dmg
    });

    // 四肢損傷のログ
    if (injuryOnLimb) {
      this._write({
        method: 'setattr',
        target: target,
        status: `injuryon${aim}`
      });
    }

    // ダメージが0ならログを表示して終了
    if (dmg < 1) return;

    // ダメージ効果
    //const damage = Math.max(target.getAttr('currentDamage'), dmg);
    //target.setAttr('currentDamage', damage); // 衝撃

    //const injury = target.getAttr('injury');
    //target.setAttr('injury', injury + dmg); // HP減少

    // 各判定
    //const HP = Math.max(currentHP - target.getAttr('injury'), -currentHP);
    //const breakPoint = target.getAttr('breakPoint');

    let result = this._judgeDeath(target, dmg, dmgType, aim, currentHP, HP); // 死亡判定
    if (!result) {
      result = this._judgeStunning(target, dmg, dmgType, aim, currentHP, HP, breakPoint); // 気絶判定
    }
    if (!aimForLimb && !result) {
      this._judgeStanding(target, dmg, aim, currentHP); // 朦朧・転倒判定
    }

    // 幻惑から復帰
    if (target.getAttr('daze')) {
      target.setAttr('daze', false);
      this._write({ method: 'setattr', target: target, status: 'recoverydaze' });
    }

    // 結果を返す
    return result;
  }

  _judgeDeath(target, dmg, dmgType, aim, currentHP, HP) {
    let result = false;

    // 喉狙い
    if (dmg >= currentHP / 2 && aim === 'neck') {
      // 攻撃型によって修正付きの致死判定
      let correction = 0;
      if (dmgType === 1 || dmgType === 2) correction++; // 刺突・切断
      const dead = this._judge(target, 'dead', correction);
      if (!dead) {
        // 死亡
        target.setAttr('dead', true);
        result = true;
        this._write({ method: 'setattr', target: target, status: 'dead' });
      }
    }

    // HPがマイナス最大値に到達
    if (dmg >= currentHP) {
      const dead = this._judge(target, 'dead', 0);
      if (!dead) {
        // 死亡
        target.setAttr('dead', true);
        result = true;
        this._write({ method: 'setattr', target: target, status: 'dead' });
      }
      else {
        // 気絶
        target.setAttr('stun', true);
        result = true;
        this._write({ method: 'setattr', target: target, status: 'stun' });
      };
    }
    return result;
  }

  _judgeStunning(target, dmg, dmgType, aim, currentHP, HP, breakPoint) {
    let result = false;

    // 頭狙い
    if (dmg >= currentHP / 2 && aim === 'head') {
      // 攻撃型によって修正付きの気絶判定
      let correction = 0;
      if (dmgType === 3) correction++; // 打撃
      const stun = this._judge(target, 'stun', correction);
      if (!stun) {
        // 気絶
        target.setAttr('stun', true);
        result = true;
        this._write({ method: 'setattr', target: target, status: 'stun' });
      }
    }

    //for (let i = 0; i < 1; i++) {
    //  let condition;
    //  switch (i) {
    //    case 0:
          // HPが0以下
    //      condition = HP <= 0 && breakPoint < 1;
    //      break;
    //    case 1:
    //      // HPがマイナス1/3以下
    //      condition = HP <= -(maxHP / 3) && breakPoint < 2;
    //      break;
    //    case 2:
          // HPがマイナス2/3以下
    //      condition = HP <= -(maxHP * 2 / 3) && breakPoint < 3;
    //      break;
    //  }
    //  if (condition) {
    //    const stun = this._judge(target, 'stun', 0, i + 1);
    //    if (!stun) {
          // 気絶
    //      target.setAttr('stun', true);
    //      result = true;
    //      this._write({ method: 'setattr', target: target, status: 'stun' });
    //      break;
    //    } else {
          // 同じ気絶判定を避けるため、breakPointを++
    //      breakPoint++;
    //      target.setAttr('breakPoint', breakPoint);
    //    }
    //  }
    //}
    return result;
  }

  _judgeStanding(target, dmg, aim, currentHP) {
    const painful = aim === 'head' || aim === 'neck'
    if (dmg >= currentHP / 3) {
      // 朦朧状態
      target.setAttr('penalty', 2); //軽度
      target.setAttr('painful', true);
    } else if (dmg >= currentHP / 2 || painful && dmg >= currentHP / 3) {
      // 朦朧状態
      target.setAttr('penalty', 4); //重度
      target.setAttr('painful', true);
      // 転倒判定
      const fall = this._judge(target, 'fall', 2);
      if (!fall) {
        target.setAttr('posture', 'falling');
        this._write({ method: 'setattr', target: target, status: 'fall' });
      } else {
        this._write({ method: 'setattr', target: target, status: 'stand' });
      }
    }
  }

  _judgeEvadeEffects(target) {
    // 準備が無効になる
    if (target.hasMissile() && target.getAttr('readyFlag')) {
      target.setAttr('readyFlag', false);
      this._write({ method: 'setattr', target: target, status: 'resetready' });
    }

    // 狙いが無効になる
    if (target.getAttr('snipe')) {
      target.setAttr('snipe', false);
      this._write({ method: 'setattr', target: target, status: 'resetsnipe' });
    }

    // 集中の維持判定
    if (target.getAttr('chantFlag')) {
      const chant = this._judge(target, 'chant', 2);
      if (!chant) {
        target.setAttr('chantFlag', false);
        this._write({ method: 'setattr', target: target, status: 'resetchant' });
      }
    }
  }

  ready() {
    const action = translation.command['ready'];

    // 準備フラグを立てる
    this._actor.setAttr('readyFlag', true);

    // サマリーの更新
    this._actor.setAttr('action', action);

    // ログ
    this._write({
      method: 'ready',
      actor: this._actor
    });
    // 終了
    this._terminate();
    return this._promise;
  }

  attack(options = {}) {
    const target = options.target;
    let action = translation.command[`${options.defenseless ? 'defenseless' : 'attack'}`];
    let result = translation.result['fail'];
    const prevAction = `${translation.command['defenseless']}:${translation.result['success']}`
    if (this._actor.getAttr('action') === prevAction) {
      result = translation.result['success'];
    }

    // 既に損傷している部位狙いは無視
    let aim = options.aim;
    if ((aim === 'arm' || aim === 'hand') && target.getAttr('injuryOnArm') ||
      (aim === 'leg' || aim === 'foot') && target.getAttr('injuryOnLeg')) {
      aim = 'body';
    }

    // 命中・回避判定のための目標値・オブジェクト
    const hitLevel = this._actor.getHit({
      hit: options.special === 'hit', // 全力攻撃オプション
      isMissile: options.isMissile, // 射撃
      aim: aim, // 部位狙いオプション
      target: target // ターゲット
    });
    let evadeObj = target.getEvade({
      isMissile: options.isMissile, // 射撃
      feint: this._actor.getAttr('feint') // フェイント
    });
    const defense = target.getAttr('defense') > 1; // 全力防御

    // ダメージ判定のためのオブジェクト
    const dmgObj = this._actor.getDmg({
      dmg: options.special === 'dmg', // 全力攻撃オプション
      aim: aim, // 部位狙いオプション
    });
    const drObj = target.getDR({
      aim: aim // 部位狙いオプション
    });

    // メイン
    // 命中判定
    const hit = this._hit(hitLevel, aim);
    if (hit) {
      // 回避判定
      let evade = this._evade(target, evadeObj);
      let stun = false;
      // 全力防御による2回目の回避判定
      if (!evade && defense) {
        evadeObj.isSecondEvade = true;
        evade = this._evade(target, evadeObj);
      }
      if (!evade) {
        // ダメージ判定
        const dmg = this._dmg(dmgObj, drObj);
        // ダメージがあれば、サマリーは「成功」を表示
        if (dmg) result = translation.result['success'];
        // ダメージのログと効果判定
        stun = this._judgeEffects(target, dmg, dmgObj.type.id, aim);
      }
      if (!stun) {
        this._judgeEvadeEffects(target);
      }
    }

    // 行動の更新
    this._actor.setAttr('action', `${action}:${result}`);
    this._model.trigger('update:summary');

    // 終了
    if (options.isMissile) {
      this._actor.setAttr('shoot', true); // 射撃を行ったフラグ
    }
    this._terminate();
    return this._promise;
  }

  feint(options = {}) {
    const target = options.target;
    const action = translation.command['feint'];
    let result = translation.result['fail'];

    // 目標値
    const actorLevel = this._actor.getHit({ target: target });
    const targetLevel = target.getHit({ target: this._actor });

    // メイン
    let correction = this._feint(actorLevel);
    if (correction > 0) {
      correction -= this._resist(target, targetLevel);
      if (correction > 0) result = `${translation.result['success']}(${correction})`;
    }

    // フェイント効果
    if (correction > 0) {
      const feint = {
        target: target,
        correction: correction
      };
      this._actor.setAttr('currentFeint', feint);
    }

    // ログ
    this._write({
      method: 'feint',
      result: correction
    });

    // 行動の更新
    this._actor.setAttr('action', `${action}:${result}`);
    this._model.trigger('update:summary');

    // 終了
    this._terminate();
    return this._promise;
  }

  snipe(options = {}) {
    const action = translation.command['snipe'];
    const target = options.target;
    this._actor.setAttr('snipe', target);

    // サマリーの更新
    this._actor.setAttr('action', action);

    // ログ
    this._write({
      method: 'snipe',
      target: target
    });

    // 終了
    this._terminate();
    return this._promise;
  }

  chant() {
    const action = translation.command['chant'];

    // 集中フラグを立てる
    this._actor.setAttr('chantFlag', true);

    // サマリーの更新
    let chant = this._actor.getAttr('chant');
    this._actor.setAttr('action', `${action}(${chant + 1})`);

    // ログ
    this._write({
      method: 'chant',
      actor: this._actor
    });

    // 終了
    this._terminate();
    return this._promise;
  }

  defense() {
    const action = translation.command['defense'];

    // 全力防御のフラグを立て、各防御を++
    this._actor.setAttr('defense', 2);
    let block = this._actor.getAttr('block');
    let parry = this._actor.getAttr('parry');
    block++;
    parry++
    this._actor.setAttr('block', block);
    this._actor.setAttr('parry', parry);

    // サマリーの更新
    this._actor.setAttr('action', action);

    // ログ
    this._write({
      method: 'setattr',
      target: this._actor,
      status: 'defense'
    });

    // 終了
    this._terminate();
    return this._promise;
  }

  move(options = {}) {
    const move = options.move;
    const action = translation.command['move'];
    const result = translation.position[move];

    // モデルの更新
    this._actor.position = move;
    // フォーメーションに反映させる
    this._model.trigger('update:formation');

    // サマリーの更新
    this._actor.setAttr('action', `${action}:${result}`);

    // ログ
    this._write({
      method: 'move',
      result: result
    });

    // 終了
    this._terminate();
    return this._promise;
  }

  changePosture() {
    this._subaction = true;
    const posture = this._actor.getAttr('posture');
    let result
    switch (posture) {
      case 'standing':
        result = 'bow';
        break;
      case 'falling':
        result = 'kneeStanding';
        break;
      default:
        result = 'standing';
        break;
    }
    this._actor.setAttr('posture', result);

    // ログ
    this._write({ method: 'changeposture', result: result });

    // 終了
    this._terminate();
    return this._promise;
  }

  changeEquipment() {
    this._subaction = true;
    let equip, equipId = this._actor.getCurrentWeapon().id;
    do {
      equipId = (equipId + 2) % 3;
      equip = this._actor.getEquip(equipId);
    } while (equip === undefined);
    this._actor.setAttr('currentWeapon', equip);

    // 準備を初期値に戻す
    const ready = this._actor.getAttr('ready');
    const required = equip.get('ready');
    this._actor.setAttr('ready', Math.max(ready, required));

    // ログ
    this._write({ method: 'changeequipment', result: equip });

    // 終了
    this._terminate();
    return this._promise;
  }

  autoCommand() {
    const action = translation.command['autoCommand'];

    // サマリーの更新
    this._actor.setAttr('action', action);

    // ログ
    this._write({ content: action });

    // 終了
    this._terminate();
    return this._promise;
  }
}

export { Action };
