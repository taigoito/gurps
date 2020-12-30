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
    this._prefix = 'battle';
    this._list = document.getElementById(`${this._prefix}-list`);
    this._detail = document.getElementById(`${this._prefix}-unit`);
  }

  _handleEvents() {
    super._handleEvents();
    this.model.on('update', () => this.update());
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
    const condition = unit.getStatus('condition');
    const stun = unit.getStatus('stun');
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
        ST: Math.max(unit.getParamValue('ST') - unit.getStatus('injury'), -unit.getParamValue('ST')),
        maxST: unit.getParamValue('ST'),
        disadvantage: this._parseDisadvantage(unit),
        action: unit.getStatus('action')
      });
    });
    return result;
  }

  _parseDisadvantage(unit) {
    if (unit.getStatus('stun')) {
      return '気絶';
    } else {
      return '-';
    }
  }
}

class Command {
  constructor(model) {
    this.model = model;
    this._elem = document.getElementById('battle-command');

    // コマンド名とフォームIDの紐づけ
    this._form = {};
    const commands = ['main', 'ready', 'attack', 'feint', 'special', 'snipe', 'chant', 'spell', 'defense', 'move', 'changePosture', 'changeEquipment', 'autoCommand', 'target'];
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

    // コマンド・オプションのリセット
    this._command = null;
    this._options = {};

    // 全てのフォーム・ボタンの表示・非表示を切り替え
    const command = this._actor.command;
    this._form.main.classList.add('active');
    for (let prop in command.attributes) {
      if (prop !== 'actor' && command.get(prop)) {
        const id = `battle-command-${this._parseSnake(prop)}`;
        document.getElementById(id).classList.add('active');
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
        if (elem.dataset.moveOption) {
          this._options.move = this._parseCamel(elem.dataset.moveOption);
        }

        // メソッドを実行
        const role = `_${this._parseCamel(elem.dataset.role)}`;
        const option = elem.dataset.roleOption || false;
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

  _showOption() {
    this._form.main.classList.remove('active');
    this._form[this._command].classList.add('active');
  }

  _hideOption() {
    this._form.main.classList.add('active');
    this._form[this._command].classList.remove('active');
  }

  // targetGroup: 'all', 'player', 'enemy', 'forward'
  _showTarget(targetGroup) {
    this._form.main.classList.remove('active');
    this._activateTargets(targetGroup);
  }

  _hideTarget() {
    this._form.main.classList.add('active');
    this._inactivateTargets();
  }

  _showConfirm(target) {
    this._options.target = this.model.at(target - 0);
    this._form.target.classList.remove('active');
    this._form[this._command].classList.add('active');
  }

  _hideConfirm() {
    this._options.target = null;
    this._form.target.classList.add('active');
    this._form[this._command].classList.remove('active');
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
      } else if (targetGroup === 'enemy' || targetGroup === 'forward' || targetGroup === 'stun-enemy') {
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
    });
    return list;
  }

  _excute() {
    this._terminate();
    this._actor.command.excute(this._command, this._options);
  }

  _terminate() {
    const elemList = this._elem.querySelectorAll('.active');
    elemList.forEach((elem) => {
      elem.classList.remove('active');
    });
  }
}

export { BattleView };
