/*
 * Battle views
 */

import { SampleView } from '../sample/_views.js';

class BattleView extends SampleView {
  constructor(model) {
    super(model);
    this.model = model;
    this.formation = new Formation(model);
    this.summary = new Summary(model);
    this.command = new Command(model);
    this.log = new Log(model);
    this._prefix = 'battle';
    this._list = document.getElementById(`${this._prefix}-list`);
    this._detail = document.getElementById(`${this._prefix}-unit`);
  }

  _handleEvents() {
    super._handleEvents();
    this.model.on('update', () => this.update());
    this.model.on('update:formation', () => this.updateFormation());
    this.model.on('update:summary', () => this.updateSummary());
    this.model.on('update:command', () => this.updateCommand());
  }

  update() {
    this.updateFormation();
    this.updateSummary();
    this.updateCommand();
  }

  updateFormation() {
    this.formation.init();
  }

  updateSummary() {
    this.summary.init();
  }

  updateCommand() {
    this.command.init(this.model.actor);
  }

}

class Formation {
  constructor(model) {
    this.model = model;
  }

  init() {
    const compiled = this._createFormation();
    document.getElementById('battle-formation-pc-back-1').innerHTML = compiled.pcBack1;
    document.getElementById('battle-formation-pc-back-2').innerHTML = compiled.pcBack2;
    document.getElementById('battle-formation-pc-back-3').innerHTML = compiled.pcBack3;
    document.getElementById('battle-formation-pc-back-4').innerHTML = compiled.pcBack4;
    document.getElementById('battle-formation-pc-left').innerHTML = compiled.pcLeft;
    document.getElementById('battle-formation-pc-center').innerHTML = compiled.pcCenter;
    document.getElementById('battle-formation-pc-right').innerHTML = compiled.pcRight;
    document.getElementById('battle-formation-enemy-back-1').innerHTML = compiled.enemyBack1;
    document.getElementById('battle-formation-enemy-back-2').innerHTML = compiled.enemyBack2;
    document.getElementById('battle-formation-enemy-back-3').innerHTML = compiled.enemyBack3;
    document.getElementById('battle-formation-enemy-back-4').innerHTML = compiled.enemyBack4;
    document.getElementById('battle-formation-enemy-left').innerHTML = compiled.enemyLeft;
    document.getElementById('battle-formation-enemy-center').innerHTML = compiled.enemyCenter;
    document.getElementById('battle-formation-enemy-right').innerHTML = compiled.enemyRight;

    // 行動者のセルをマーク
    if (this._activeCell) this._activeCell.style.background = '';
    this._activeCell = this._getActiveCellByOrder(this.model.order);
    this._activeCell.style.background = 'rgba(153, 204, 153, .5)';

  }

  _parseFormationHTML(unit) {
    const name = unit.name;
    const posture = unit.posture;
    const condition = unit.getAttr('condition');
    const stun = unit.getAttr('stun');
    let html;

    if (posture === 'falling') html = '<i class="ra ra-falling"></i>';
    else if (posture === 'kneeStanding') html = '<i class="ra ra-player-pain"></i>';
    else html = '<i class="ra ra-player"></i>';

    if (condition === 'bad') html = `<span class="c-bad">${html}</span>`;
    else if (condition === 'worse') html = `<span class="c-worse">${html}</span>`;
    else if (condition === 'worst') html = `<span class="c-worst">${html}</span>`;

    if (!stun) html += `<small>${name}</small>`;
    else html += `<small class="dead">${name}</small>`;

    return html;
  }

  _createFormation() {
    const result = {
      pcBack1: '',
      pcBack2: '',
      pcBack3: '',
      pcBack4: '',
      pcLeft: '',
      pcCenter: '',
      pcRight: '',
      enemyBack1: '',
      enemyBack2: '',
      enemyBack3: '',
      enemyBack4: '',
      enemyLeft: '',
      enemyCenter: '',
      enemyRight: ''
    };
    this.model.units.forEach((unit) => {
      const isPlayer = unit.isPlayer;
      const position = unit.position;
      const html = this._parseFormationHTML(unit);

      switch (position) {
        case 'left':
          if (isPlayer) result.pcLeft = html;
          else result.enemyLeft = html;
          break;
        case 'center':
          if (isPlayer) result.pcCenter = html;
          else result.enemyCenter = html;
          break;
        case 'right':
          if (isPlayer) result.pcRight = html;
          else result.enemyRight = html;
          break;
        default:
          switch (unit.id) {
            case 0:
              result.pcBack1 = html;
              break;
            case 1:
              result.pcBack2 = html;
              break;
            case 2:
              result.pcBack3 = html;
              break;
            case 3:
              result.pcBack4 = html;
              break;
            case 4:
              result.enemyBack1 = html;
              break;
            case 5:
              result.enemyBack2 = html;
              break;
            case 6:
              result.enemyBack3 = html;
              break;
            default:
              result.enemyBack4 = html;
              break;
          }
          break;
      }
    });
    return result;
  }

  _getActiveCellById(id) {
    let name;
    this.model.units.forEach((unit) => {
      if (unit.id === id) {
        const isPlayer = unit.isPlayer ? 'pc' : 'enemy';
        if (unit.position === 'back') {
          name = `battle-formation-${isPlayer}-back-${unit.id + (isPlayer ? 1 : -3)}`;
        } else {
          name = `battle-formation-${isPlayer}-${unit.position}`;
        }
      }
    });
    return document.getElementById(name);
  }

  _getActiveCellByOrder(order) {
    let name;
    this.model.units.forEach((unit) => {
      if (unit.order === order) {
        const isPlayer = unit.isPlayer ? 'pc' : 'enemy';
        if (unit.position === 'back') {
          name = `battle-formation-${isPlayer}-back-${unit.id + (unit.isPlayer ? 1 : -3)}`;
        } else {
          name = `battle-formation-${isPlayer}-${unit.position}`;
        }
      }
    });
    return document.getElementById(name);
  }
}

class Summary {
  constructor(model) {
    this.model = model;
  }

  init() {
    const turn = this.model.turn;
    document.getElementById('battle-summary-turn').textContent = turn;

    const actor = this.model.actor.name;
    document.getElementById('battle-summary-actor').textContent = actor;

    const data = this._createSummary();
    const len = data.length;
    const section = document.getElementById('battle-summary');
    const template = document.getElementById('summary-template');
    const tbody = section.querySelector('tbody');
    tbody.innerHTML = '';

    for (let i = 0; i < len; i++) {
      const dt = data[i];
      const tr = document.importNode(template.content, true);
      const order = this.model.order;
      const actorId = this.model.at(order).id;
      if (actorId === i) tr.querySelector('tr').style.background = 'rgba(153, 204, 153, .5)'; // 行動者のセルをマーク
      tr.querySelector('.battle-summary-name').textContent = dt.name;
      tr.querySelector('.battle-summary-hp').textContent = `${dt.ST} / ${dt.maxST}`;
      tr.querySelector('.battle-summary-disadvantage').textContent = dt.disadvantage;
      tr.querySelector('.battle-summary-action').textContent = dt.action;
      tbody.appendChild(tr);
    }
  }

  _createSummary() {
    const result = [];
    this.model.units.forEach((unit) => {
      result.push({
        name: unit.name,
        ST: unit.getParamValue('ST'),
        maxST: unit.getParamValue('ST'),
        disadvantage: this._parseDisadvantage(unit),
        action: unit.getAttr('action')
      });
    });
    return result;
  }

  _parseDisadvantage(unit) {
    if (unit.getAttr('vanish')) {
      return '消滅';
    } else if (unit.getAttr('stone')) {
      return '金塊';
    } else if (unit.getAttr('dead')) {
      return '死亡';
    } else if (unit.getAttr('stun')) {
      return '気絶';
    } else {
      let arr = [];
      const posture = unit.posture;
      const damage = unit.getAttr('damage');
      if (unit.getAttr('blindness')) arr.push('失明');
      if (unit.getAttr('injuryOnArm')) arr.push('片手');
      if (unit.getAttr('injuryOnLeg')) arr.push('片足');
      if (unit.getAttr('daze')) arr.push('幻惑');
      if (unit.getAttr('berserk')) arr.push('狂戦士');
      if (unit.getAttr('fear')) arr.push('恐怖');
      if (unit.getAttr('mad')) arr.push('狂気');
      if (unit.getAttr('dragon')) arr.push('幻竜');
      if (unit.getAttr('invisible')) arr.push('透明');
      if (unit.getAttr('immovable')) arr.push('足止');
      if (unit.getAttr('avatar')) arr.push('分身');
      if (unit.getAttr('stand')) arr.push('朦朧');
      if (damage) arr.push(`衝撃(${damage})`);
      if (posture === 'falling') arr.push('転倒');
      if (posture === 'kneeStanding') arr.push('膝立');
      if (arr.length > 2) arr = arr.slice(0, 2);
      if (arr.length === 0) {
        return '-';
      } else {
        return arr.join(' ');
      }
    }
  }
}

class Command {
  constructor(model) {
    this.model = model;
    this._elem = document.getElementById('battle-command');

    // コマンド名とフォームIDの紐づけ
    this._form = {};
    const commands = [
      'main', 'ready', 'attack', 'feint', 'special',
      'aim', 'snipe', 'chant', 'spell', 'resist', 'general',
      'defense', 'move', 'changePosture', 'changeEquipment',
      'autoCommand', 'target', 'confirm'
    ];
    commands.forEach((command) => {
      const id = `battle-command-${this._parseSnake(command)}`;
      this._form[command] = document.getElementById(id);
    });

    // ターゲット決定フォームに各ユニットの名前を割り当てる
    this._fillTargetSelector();

    // コマンド入力を待機
    this._handleEvents();
  }

  // ユニットごとのターン開始時の処理
  init(actor) {
    this._actor = actor;

    // 現在フォーム
    this._form.current = this._form.main;
    // コマンド・オプションのリセット
    this._command = null;
    this._options = {};

    // 全てのフォーム・ボタンの表示・非表示を切り替え
    const command = this._actor.command;
    this._form.main.classList.add('active');
    for (let prop in command.attributes) {
      if (prop !== 'actor' && prop !== 'spells' && command.get(prop)) {
        const id = `battle-command-${this._parseSnake(prop)}`;
        document.getElementById(id).classList.add('active');
      }
    }

    // 術法フォームのボタンの表示・非表示を切り替え
    const spells = this._actor.command.get('spells');
    if (spells) {
      for (let prop in spells) {
        if (spells[prop]) {
          const id = `battle-command-spell${this._parseSnake(prop)}`;
          const elem = document.getElementById(id);
          elem.classList.add('active');
          // 集中時間に応じて非アクティブにする
          const chant = this._actor.getAttr('chant');
          const required = elem.dataset.chant;
          if (!required || chant < required) elem.classList.add('inactive');
          else elem.classList.remove('inactive');
        }
      }
    }
  }

  _handleEvents() {
    const myTouch = 'ontouchend' in document && window.innerWidth < 1024 ? 'touchend' : 'click';
    this._elem.addEventListener(myTouch, (event) => {
      const elem = event.srcElement;
      if (elem.dataset.role) {
        event.preventDefault();

        // コマンドとオプションの取得
        if (elem.dataset.command) {
          this._command = this._parseCamel(elem.dataset.command);
        }
        if (elem.dataset.specialOption) {
          this._options.special = this._parseCamel(elem.dataset.specialOption);
        }
        if (elem.dataset.aimOption) {
          this._options.aim = this._parseCamel(elem.dataset.aimOption);
        }
        if (elem.dataset.spellOption) {
          this._options.spell = this._parseCamel(elem.dataset.spellOption);
        }
        if (elem.dataset.spellType) {
          this._options.spellType = this._parseCamel(elem.dataset.spellType);
        }
        if (elem.dataset.moveOption) {
          this._options.move = this._parseCamel(elem.dataset.moveOption);
        }

        // メソッドを実行
        const role = `_${this._parseCamel(elem.dataset.role)}`;
        const option = this._parseCamel(elem.dataset.roleOption);
        this[role](option);
      }
    });
  }

  _parseCamel(txt = '') {
    return txt.replace(/-./g, (t) => {
      return t.charAt(1).toUpperCase();
    });
  }

  _parseSnake(txt = '') {
    return txt.replace(/([A-Z])/g, (t) => {
      return `-${t.charAt(0).toLowerCase()}`;
    });
  }

  _showOption(option) {
    if (option) {
      // オプションが2つ以上(特殊攻撃)
      this._form[this._command].classList.remove('active');
      this._form.current = this._form[option]; // 現在フォームの情報を保持
      this._form.current.classList.add('active');
    } else {
      // 通常
      this._form.main.classList.remove('active');
      this._form.current = this._form[this._command]; // 現在フォームの情報を保持
      this._form.current.classList.add('active');
    }
  }

  _hideOption(option) {
    if (option) {
      // オプションが2つ以上(特殊攻撃)
      this._options[option] = null; // オプションをリセット
      this._form.current = this._form[this._command]; // 現在フォームの情報を戻す
      this._form.current.classList.add('active');
      this._form[option].classList.remove('active');
    } else {
      // 通常
      this._options = {}; // オプションをリセット
      this._form.current = this._form.main; // 現在フォームの情報を戻す
      this._form.current.classList.add('active');
      this._form[this._command].classList.remove('active');
    }
  }

  // targetGroup: 'all', 'player', 'enemy', 'forward', 'stun-all', 'stun-player'
  _showTarget(targetGroup) {
    // 前のフォームを非表示
    this._form.current.classList.remove('active');

    // ターゲットグループが未指定（術法以外）なら
    if (!targetGroup) {
      const weapon = this._actor.getCurrentWeapon();
      if (weapon.get('equipmentType') === 6) targetGroup = 'enemy';
      else targetGroup = 'forward';
    }

    // ターゲットフォームを表示
    this._activateTargets(targetGroup);
  }

  _hideTarget() {
    // 前のフォームを表示
    this._form.current.classList.add('active');

    // ターゲットフォームを非表示
    this._inactivateTargets();
  }

  _showConfirm(target) {
    if (target) {
      // ターゲットをセット
      this._options.target = this.model.at(target - 0);
      // ターゲットフォームを非表示
      this._form.target.classList.remove('active');
    } else {
      // 前のフォームを非表示
      this._form.current.classList.remove('active');
    }

    // コマンドに合わせた確認フォームを表示
    const isAttack = this._command === 'attack' || this._command === 'special' ||
      this._options.spellType === 'missile';
    if (isAttack) {
      this._form.attack.classList.add('active');
    } else if (this._command === 'spell') {
      if (this._options.spellType === 'general') {
        this._form.general.classList.add('active');
      } else {
        this._form.resist.classList.add('active');
      }
    } else {
      this._form[this._command].classList.add('active');
    }

    // 確率・期待値等の概要を表示
    if (isAttack) this._confirmAttack();
    else if (this._command === 'feint') this._confirmFeint();
    else if (this._command === 'spell' && this._options.spellType === 'general') this._confirmGeneral();
    else if (this._command === 'spell') this._confirmSpell();
  }

  _hideConfirm() {
    if (this._options.target) {
      // ターゲットをリセット
      this._options.target = null;
      // ターゲットフォームを表示
      this._form.target.classList.add('active');
    } else {
      // 前のフォームを表示
      this._form.current.classList.add('active');
    }

    // コマンドに合わせた確認フォームを非表示
    const isAttack = this._command === 'attack' || this._command === 'special' ||
      this._options.spellType === 'missile';
    if (isAttack) {
      this._form.attack.classList.remove('active');
    } else if (this._command === 'spell') {
      if (this._options.spellType === 'general') {
        this._form.general.classList.remove('active');
      } else {
        this._form.resist.classList.remove('active');
      }
    } else {
      this._form[this._command].classList.remove('active');
    }
  }

  _fillTargetSelector() {
    this.model.units.forEach((unit, i) => {
      const id = `battle-command-target-${i}`;
      document.getElementById(id).textContent = unit.name;
    });
  }

  _activateTargets(targetGroup) {
    this._form.target.classList.add('active');
    const list = this._createTargetList(targetGroup);
    for (let i = 0; i < 8; i++) {
      if (list[i]) {
        const id = `battle-command-target-${i}`;
        document.getElementById(id).classList.add('active');
      }
    }
  }

  _inactivateTargets() {
    this._form.target.classList.remove('active');
    for (let i = 0; i < 8; i++) {
      const id = `battle-command-target-${i}`;
      document.getElementById(id).classList.remove('active');
    }
  }

  _createTargetList(targetGroup) {
    const list = [];
    const isPlayer = this._actor.isPlayer;
    this.model.units.forEach((unit, i) => {
      // 'all', 'player', 'enemy'によって大きく振り分け
      if (targetGroup === 'all') {
        list.push(true);
      } else if (targetGroup === 'player' || targetGroup === 'stun-player') {
        if (isPlayer && unit.isPlayer) {
          list.push(true);
        } else if (!isPlayer && !unit.isPlayer) {
          list.push(true);
        } else {
          list.push(false);
        }
      } else if (targetGroup === 'enemy' || targetGroup === 'forward') {
        if (isPlayer && !unit.isPlayer) {
          list.push(true);
        } else if (!isPlayer && unit.isPlayer) {
          list.push(true);
        } else {
          list.push(false);
        }
      }
      // 'forword'の判定
      if (targetGroup === 'forward') {
        if (unit.position === 'back') {
          this.model.units.forEach((unit) => {
            if ((this._actor.position === 'left' && isPlayer !== unit.isPlayer &&
              (unit.position === 'center' || unit.position === 'right')) ||
              (this._actor.position === 'center' && isPlayer !== unit.isPlayer &&
                (unit.position === 'left' || unit.position === 'center' || unit.position === 'right')) ||
              (this._actor.position === 'right' && isPlayer !== unit.isPlayer &&
                (unit.position === 'center' || unit.position === 'left')))
              list[i] = false;
          });
        }
        if (this._actor.position === 'left' && unit.position === 'left' ||
          this._actor.position === 'right' && unit.position === 'right') list[i] = false;
      }
      // 'vanish'と'inivisible'の判定
      const inivisible = unit.getAttr('vanish') || unit.getAttr('invisible');
      if (inivisible) list[i] = false;
      // 'stun'の判定
      const stun = unit.getAttr('stun');
      if (targetGroup === 'stunPlayer' || targetGroup === 'stunAll') {
        if (!stun) list[i] = false;
      } else {
        if (stun) list[i] = false;
      }
    });
    return list;
  }

  _confirmAttack() {
    const actor = this._actor;
    const target = this._options.target || this._actor;
    const actorName = actor.name;
    const targetName = this._options.target ? target.name : '';

    // 武器/呪文
    const isArt = this._command === 'spell';
    let actorWeapon, actorWeaponName, art, artName;
    if (isArt) {
      art = actor.arts[this._options.spell];
      artName = art.get('name');
    } else {
      actorWeapon = actor.getCurrentWeapon();
      actorWeaponName = actorWeapon.get('name');
    }

    // 防具
    const targetArmorName = target.getBodyArmor().get('name');

    // 射撃
    const isMissile = this._options.spellType === 'missile' || actor.hasMissile();
    if (isMissile) this._options.isMissile = true;

    // 命中判定の目標値
    const hit = actor.getHit({
      weapon: actorWeapon || art,
      hit: this._options.special === 'hit', // 全力攻撃オプション
      isMissile: isMissile, // 射撃
      aim: this._options.aim, // 部位狙いオプション
      target: target // ターゲット
    });

    // 回避判定の目標値
    const evadeObj = target.getEvade({
      isMissile: isMissile, // 射撃
      feint: actor.getAttr('feint') // フェイント
    });
    const evade = evadeObj.level;

    // ダメージ
    let dmg;
    if (!isArt || !art.get('effect')) {
      const dmgObj = actor.getDmg({
        weapon: actorWeapon || art,
        dmg: this._options.special === 'dmg', // 全力攻撃オプション
        aim: this._options.aim // 部位狙いオプション
      });
      const drObj = target.getDR({
        aim: this._options.aim // 部位狙いオプション
      });
      dmg = `ダメージ ${actor.getExpectedDmg(dmgObj, drObj)} 点`;
    } else {
      dmg = art.get('effect');
    }

    // レンダリング
    document.getElementById('battle-command-attack-actor').textContent = actorName;
    document.getElementById('battle-command-attack-target').textContent = targetName;
    document.getElementById('battle-command-attack-actor-weapon').textContent = isArt ? artName : actorWeaponName;
    document.getElementById('battle-command-attack-target-armor').textContent = targetArmorName;
    document.getElementById('battle-command-attack-hit').textContent = hit;
    document.getElementById('battle-command-attack-evade').textContent = evade;
    document.getElementById('battle-command-attack-dmg').textContent = dmg;
  }

  _confirmFeint() {
    const actor = this._actor;
    const target = this._options.target;
    const actorName = actor.name;
    const targetName = target.name;
    const actorWeapon = actor.getCurrentWeapon().get('name');
    const targetWeapon = target.getCurrentWeapon().get('name');

    // 技能値
    const actorLevel = actor.getHit({ target: target });
    const targetLevel = target.getHit({ target: actor });

    // レンダリング
    document.getElementById('battle-command-feint-actor').textContent = actorName;
    document.getElementById('battle-command-feint-target').textContent = targetName;
    document.getElementById('battle-command-feint-actor-weapon').textContent = actorWeapon;
    document.getElementById('battle-command-feint-target-weapon').textContent = targetWeapon;
    document.getElementById('battle-command-feint-actor-level').textContent = actorLevel;
    document.getElementById('battle-command-feint-target-level').textContent = targetLevel;
  }

  _confirmSpell() {
    const actor = this._actor;
    const target = this._options.target || this._actor;
    const actorName = actor.name;
    const targetName = this._options.target ? target.name : '';
    const art = actor.arts[this._options.spell];
    const artName = art.get('name');
    const artType = art.get('type');

    // 目標値
    const level = actor.getSorcery().get('value');
    const resist = artType === 'assist' ? '-' :
      target.getParamValue('WL') + target.getChange('WL') - art.get('resist');

    // 効果
    let effect = '';
    if (!art.get('effect')) {
      const dmgObj = actor.getDmg({ weapon: art });
      const drObj = target.getDR();
      effect = `ダメージ ${actor.getExpectedDmg(dmgObj, drObj)} 点`;
    } else {
      effect = art.get('effect');
    }

    // レンダリング
    document.getElementById('battle-command-resist-actor').textContent = actorName;
    document.getElementById('battle-command-resist-target').textContent = targetName;
    document.getElementById('battle-command-resist-name').textContent = artName;
    document.getElementById('battle-command-resist-level').textContent = level;
    document.getElementById('battle-command-resist-resist').textContent = resist;
    document.getElementById('battle-command-resist-effect').textContent = effect;
  }

  _confirmGeneral() {
    const actor = this._actor;
    const actorName = actor.name;
    const art = actor.arts[this._options.spell];
    const artName = art.get('name');

    // 目標値
    const level = actor.getSorcery().get('value');

    // 効果
    let effect = art.get('effect');

    // レンダリング
    document.getElementById('battle-command-general-actor').textContent = actorName;
    document.getElementById('battle-command-general-name').textContent = artName;
    document.getElementById('battle-command-general-level').textContent = level;
    document.getElementById('battle-command-general-effect').textContent = effect;
  }

  _excute() {
    this._terminate();
    this._actor.command[this._command](this._options);
  }

  _terminate() {
    const elemList = this._elem.querySelectorAll('.active');
    elemList.forEach((elem) => {
      elem.classList.remove('active');
    });
  }
}

class Log {
  constructor(model) {
    this.log = model.log;
    this._section = document.getElementById('battle-log-content');
    this._row = 0; // 行数

    // method:'render'のメッセージが追加されたらレンダリング開始
    this.log.on('add', (message) => {
      if (message.get('method') === 'render') {
        // doneにコールバックを代入してプロミスを返す
        const promise = this._render();
        this.log.done = (callback) => {
          return promise.then(callback);
        }
      }
    });
  }

  _render() {
    // プロミスを準備
    const promise = [];
    const len = this.log.length;

    // コレクションからメッセージを順次取り出して表示
    this.log.models.forEach((message, i) => {
      promise[i] = new Promise((resolve, reject) => {
        if (i === 0) {
          // 最初はすぐに処理を実行
          this._append(message);
          setTimeout(() => {
            resolve();
          }, 400);
        } else {
          // 前のプロミスが完了したら、400ミリ秒の間隔を置き処理を実行
          promise[i - 1].then(() => {
            this._append(message);
            setTimeout(() => {
              resolve();
            }, 400);
          });
        }
      });
    });

    // ログを空にする
    this.log.reset();

    // 次の処理に繋げる
    return promise[len - 1];
  }

  // メッセージ・モデルの中身はメッセージ・オブジェクトの配列
  // 各種メソッドによってテキストに変換される
  _append(message) {
    if (!message.get('blank')) {
      // メッセージの要素を作成
      const method = message.get('method');
      let elem;
      const methodName = `_makeMessage${method.charAt(0).toUpperCase()}${method.slice(1)}`;
      elem = this[methodName](message);

      // メッセージを挿入し、必要ならトランジションさせる
      this._section.appendChild(elem);
      this._row++;
      if (this._row > 12) {
        const style = window.getComputedStyle(this._section);
        let m = parseInt(style.marginTop);
        m -= 24;
        this._section.style.marginTop = `${m}px`;
      }
    }
  }

  _makeMessageDefault(message) {
    const elem = document.createElement('p');
    elem.innerHTML = message.get('content');
    return elem;
  }

  _makeMessageRender() {
    const elem = document.createElement('p');
    elem.innerHTML = '&nbsp;';
    return elem;
  }

  _makeMessageInit(message) {
    const elem = document.createElement('h6');
    const actor = message.get('actor');
    const content = `${actor.getProfile('name')}の行動順`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageRoll(message) {
    const elem = document.createElement('p');
    const roll = message.get('roll');
    const result = message.get('result');
    const content = `出目は ${roll} 、${result ? '成功!!' : '失敗!'}`
    elem.textContent = content;
    return elem;
  }

  _makeMessageJudge(message) {
    const elem = document.createElement('p');
    const type = message.get('type');
    const count = message.get('count');
    const text = type === 'feint' ? 'フェイント' :
      type === 'feintresist' ? '抵抗' :
        type === 'spellresist' ? '意志抵抗' :
          type === 'chant' ? '集中維持判定' :
            type === 'recovery' ? '回復判定' :
              type === 'dead' ? '致死判定!!' :
                type === 'stun' && count ? `第${count}次 気絶判定!` :
                  type === 'stun' ? '気絶判定!' :
                    type === 'fall' ? '転倒判定' :
                      '判定';
    const target = message.get('target');
    const content = `${target.name}の${text}!`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageHit(message) {
    const elem = document.createElement('p');
    const actor = message.get('actor');
    const aim = message.get('aim');
    const defenseless = actor.getAttr('defenseless');
    const attack = defenseless ? '全力攻撃!!' : '攻撃!';
    const content = aim ? `${actor.name}の${actor.getCurrentWeapon().get('name')}による${aim}を狙った${attack}` :
      `${actor.name}の${actor.getCurrentWeapon().get('name')}による${attack}`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageFeint(message) {
    const elem = document.createElement('p');
    const result = message.get('result');
    const content = result > 0 ? `フェイントは ${result} 成功!!` : 'フェイントは失敗!';
    elem.textContent = content;
    return elem;
  }

  _makeMessageEvade(message) {
    const elem = document.createElement('p');
    const target = message.get('target');
    const evade = message.get('evade');
    let evadeType = evade.fallback ? '後退しつつ' : '';
    switch (evade.type) {
      case 'stone':
        evadeType = 'ストーンスキンの術';
        break;
      case 'block':
        evadeType += '盾によって止め';
        break;
      case 'parry':
        evadeType += '武器によって受け';
        break;
      case 'acrobat':
        evadeType += '軽業によって避け';
        break;
      default:
        evadeType += '身を振って避け';
        break;
    }
    const content = `${target.name}は${evadeType}を試みた!`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageDmg(message) {
    const elem = document.createElement('p');
    const dmg = message.get('dmg');
    const content = dmg ? `${dmg}点のダメージ!!` : 'ダメージは0点!';
    elem.textContent = content;
    return elem;
  }

  _makeMessageReady(message) {
    const elem = document.createElement('p');
    const actor = message.get('actor');
    const content = `${actor.getCurrentWeapon().get('name')}を構えた`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageSnipe(message) {
    const elem = document.createElement('p');
    const target = message.get('target');
    const content = `${target.name}へ狙いを定めた`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageChant(message) {
    const elem = document.createElement('p');
    const actor = message.get('actor');
    const content = `${actor.getSorcery().get('name')}の呪文に集中している`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageSpell(message) {
    const elem = document.createElement('p');
    const actor = message.get('actor');
    const spell = message.get('spell');
    const content = `${actor.name}の${spell}!`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageSetattr(message) {
    const elem = document.createElement('p');
    const target = message.get('target');
    const status = message.get('status');
    let changes;
    switch (status) {
      case 'vanish':
        changes = 'は彼方へと消え去った!';
        break;
      case 'gold':
        changes = 'は金塊になった!!';
        break;
      case 'dead':
        changes = 'は死亡した…';
        break;
      case 'stun':
        changes = 'は気絶した!!';
        break;
      case 'fall':
        changes = 'は朦朧状態に陥って転倒した!';
        break;
      case 'stand':
        changes = 'は朦朧状態に陥った';
        break;
      case 'injuryonarm':
        changes = 'は腕を損傷!';
        break;
      case 'injuryonleg':
        changes = 'は脚を損傷!';
        break;
      case 'injuryonhand':
        changes = 'は手首を損傷!';
        break;
      case 'injuryonfoot':
        changes = 'は足首を損傷!';
        break;
      case 'resetready':
        changes = 'の準備は無効になった'
        break;
      case 'resetsnipe':
        changes = 'の狙いの照準は乱された'
        break;
      case 'resetchant':
        changes = 'の呪文の集中は乱された'
        break;
      case 'daze':
        changes = 'は放心状態に陥った';
        break;
      case 'indaze':
        changes = 'はボーッとしている';
        break;
      case 'recoverydaze':
        changes = 'は放心状態から復帰した';
        break;
      case 'berserk':
        changes = 'は狂戦士と化した';
        break;
      case 'inberserk':
        changes = 'は怒りに我を忘れている!';
        break;
      case 'fear':
        changes = 'は恐怖に襲われて朦朧状態に陥った!';
        break;
      case 'infear':
        changes = 'は恐怖で身動きできない';
        break;
      case 'mad':
        changes = Math.random() * 2 < 1 ? 'は突然笑い出した' : 'は突然泣き出した';
        break;
      case 'inmad':
        changes = Math.random() * 2 < 1 ? 'は笑っている' : 'は泣いている';
        break;
      case 'invisible':
        changes = 'は見えなくなった';
        break;
      case 'immovable':
        changes = 'は足が動かない!';
        break;
      case 'avatar':
        changes = 'の分身が現れた!';
        break;
      case 'spellE3':
        changes = 'は身体が軽くなり、回避値アップ';
        break;
      case 'spellS2':
        changes = 'は士気が高まり、技能値アップ';
        break;
      case 'spellS6':
        changes = 'たちは士気が高まり、技能値アップ';
        break;
      case 'spellS4':
        changes = 'は炎の膜で身を包まれた';
        break;
      case 'spellS5':
        changes = 'たちの前に炎の壁が現れた';
        break;
      case 'spellW2':
        changes = 'は鼓舞され、ダメージと活力アップ';
        break;
      case 'spellW8':
        changes = 'たちの前に光の壁が現れた';
        break;
      case 'spellN3':
        changes = 'は水の膜で身を包まれ、ダメージ抵抗アップ';
        break;
      case 'spellL2':
        changes = 'は意識が高揚し、抵抗値アップ';
        break;
      default:
        changes = 'は防御に専念';
        break;
    }
    const content = `${target.name}${changes}!`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageRecovery(message) {
    const elem = document.createElement('p');
    const actor = message.get('actor');
    const result = message.get('result');
    const content = result ? `${actor.getProfile('name')}は朦朧状態から立ち直った!` :
      `${actor.getProfile('name')}は朦朧状態から立ち直れない!`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageMove(message) {
    const elem = document.createElement('p');
    const result = message.get('result');
    const content = `${result}へ移動した`;
    elem.textContent = content;
    return elem;
  }

  _makeMessageChangeposture(message) {
    const elem = document.createElement('p');
    const result = message.get('result');
    let content;
    switch (result) {
      case 'bow':
        content = `屈んだ`;
        break;
      case 'kneeStanding':
        content = `起き上がった`;
        break;
      default:
        content = `立ち上がった`;
        break;
    }
    elem.textContent = content;
    return elem;
  }

  _makeMessageChangeequipment(message) {
    const elem = document.createElement('p');
    const weapon = message.get('result');
    const isSecond = weapon.id === 0 && weapon.get('itemId') !== weapon.get('usualUsage') || weapon.id === 1;
    const name = isSecond ? weapon.get('secondName') : weapon.get('name');
    const content = `${name}に持ち替えた`;
    elem.textContent = content;
    return elem;
  }
}

export { BattleView };
