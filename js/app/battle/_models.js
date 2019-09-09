/*
 * Battle models
 */

import { Model, Collection } from '../_framework.js';
import { SampleUnit, SampleUnits } from '../sample/_models.js';

// ステータス
class Status extends Model {
  initialize() {
    this._actor = this.get('actor');
    const defaults = {
      order: 0, // 行動順
      isPlayer: true, // プレイヤー側か否か
      position: 'back', // 戦闘配置('back'(後衛), 'left'(左翼), 'center'(中央), 'right'(右翼))
      posture: 'standing', // 姿勢('standing'(直立), 'bow'(屈み), 'kneeStanding'(膝立), 'falling'(転倒))
      condition: 'good', // HPの減少具合('good', 'bad', 'worse', 'worst')
      action: '', // 直前の行動
      dead: false, // 死亡
      stun: false, // 気絶
      stand: false, // 朦朧状態
      damage: 0, // 衝撃
      injury: 0, // HPの減少
    }
    this.attributes = Object.assign(defaults, this.attributes);

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
      this._actor.set('condition', condition);
    }
    this.on('change:injury', changeInjury);
  }
}

class Command extends Model {
  initialize() {
    this._actor = this.get('actor');
  }

  startTurn() {
    this.attributes = {
      actor: this._actor,
      mainReady: true,
      mainAttack: true,
      mainFeint: true,
      mainSpecial: true,
      mainSnipe: true,
      mainChant: true,
      mainSpell: true,
      mainDefense: true,
      mainMove: true,
      moveLeft: this._checkMovePosition('left'),
      moveCenter: this._checkMovePosition('center'),
      moveRight: this._checkMovePosition('right'),
      moveBack: this._checkMovePosition('back'),
      mainChangePosture: true,
      mainChangeEquipment: true,
      mainAutoCommand: true
    };
  }

  _checkMovePosition(position) {
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

  excute(command, options) {
    console.log({
      command: command,
      options: options
    });
    if (command === 'move') {
      this._actor.position = options.move;
    }
    this._actor.endTurn();
  }
}

class BattleUnit extends SampleUnit {
  initialize() {
    super.initialize();
    this.status = this.get('status') || new Status({ actor: this });
    this.command = this.get('command') || new Command({ actor: this });

    // コマンド実行中に任意に発火させ、モデルに伝える
    this.on('update', () => this.model.trigger('update'));
  }

  startTurn() {
    // コマンドを初期化し、コマンドから'endTurn'の実行を待つ
    this.command.startTurn();
    // ビューの更新
    this.trigger('update');
  }

  // コマンド終了時に実行し、ターン終了をモデルに伝える
  endTurn() {
    this.model.endTurn();
  }

  setStatus(attr, value) {
    return this.status.set(attr, value);
  }

  getStatus(attr) {
    return this.status.get(attr);
  }

  set model(value) {
    this.collection = value;
  }

  get model() {
    return this.collection;
  }

  set order(value) {
    this.setStatus('order', value);
  }

  get order() {
    return this.getStatus('order');
  }

  set isPlayer(value) {
    this.setStatus('isPlayer', value);
  }

  get isPlayer() {
    return this.getStatus('isPlayer');
  }

  set position(value) {
    this.setStatus('position', value);
  }

  get position() {
    return this.getStatus('position');
  }

  set posture(value) {
    this.setStatus('posture', value);
  }

  get posture() {
    return this.getStatus('posture');
  }
}

// 全ての戦況情報を管理
// turn: 全員の行動一巡り
// order: ターン内の行動順
// units: コレクション
// actor: コレクション内の行動者1名
class BattleModel extends SampleUnits {
  initialize() {
    this.turn = 0;
    this.order = 0;
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
    } while (this.actor.getStatus('stun'));

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

