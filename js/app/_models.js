/*
 * Models
 */

import { data } from './_data.js';
import { Model, Collection } from './_framework.js';

class Parameter extends Model {
  initialize() {
    // デフォルト値を代入
    const defaults = {
      cp: 0,
      baseValue: 10
    };
    this.attributes = Object.assign(defaults, this.attributes);
    // データより転記
    this.attributes = Object.assign(this.attributes, data.parameter[this.id]);

    // 初期化
    this._math();
    this._handleEvents();
  }

  validate(attrs) {
    // IDがデータに無い値の場合はエラー
    if (this.id >= data.parameter.length) {
      return 'Id is not correct !!';
    }
    // CPが特定範囲外の値の場合はエラー
    if (attrs.cp && ![-4, -2, -1, -0.5, 0, 0.5, 1, 2, 4, 8, 16, 24, 32].includes(attrs.cp)) {
      return 'Cp is not correct !!';
    }
  }

  // 初期化(cp, baseValueからvalueを再計算)
  _math() {
    const min = this.get('min');
    let cp = this.get('cp');
    let value = this.get('baseValue');
    value += this.get('baseFix');
    if (cp < 0) {
      cp = Math.abs(cp);
      while (cp >= min) {
        if (cp < 16) { cp /= 2; } else { cp -= 8; }
        value--;
      }
    } else {
      while (cp >= min) {
        if (cp < 16) { cp /= 2; } else { cp -= 8; }
        value++;
      }
    }
    this.set('value', value);
    return value;
  }

  // cp, baseValueの変更を監視し、math()を呼び出す
  _handleEvents() {
    const math = (model) => model._math();
    this.on('change:cp', math);
    this.on('change:baseValue', math);
  }

  // bool値より、cpを++または--
  // totalは現CPの合計、capacityは上限
  put(bool = true, total = 0, capacity = 10) {
    if (bool) {
      return this._increase(total, capacity);
    } else {
      return this._decrease();
    }
  }

  _decrease() {
    const min = this.get('min');
    let cp = this.get('cp');
    let put = 0;
    if (cp < -min) {
      put = 0;
    } else if (cp <= min) {
      put = -min;
    } else if (cp < 16) {
      put = -cp / 2;
    } else {
      put = -8;
    }
    this.set('cp', cp + put);
    return put;
  }

  _increase(total = 0, capacity = 10) {
    const min = this.get('min');
    let cp = this.get('cp');
    let put = 0;
    if (cp < min) {
      put = min;
    } else if (cp < 16) {
      put = cp;
    } else {
      put = 8;
    }
    // 現CP合計が上限を超えるか、単体で値が上限の半分を超える場合は無効
    if (total && capacity && (total + put > capacity || (capacity > 10 && cp + put > capacity / 2))) {
      put = 0;
    }
    this.set('cp', cp + put);
    return put;
  }
}

class Parameters extends Collection {
  initialize() {
    this._handleEvents();
  }

  // Model(Parameter)の変更・追加・削除を監視
  _handleEvents() {
    // valueの変更を受け取り、各パラメータのbaseValueを更新
    const replaceBaseValue = (param) => {
      this.models.forEach((elem) => {
        if (elem.get('baseId') !== false && elem.get('baseId') == param.id) {
          elem.set('baseValue', this.getValue(param.id));
        }
      });
    };
    this.on('change:value', replaceBaseValue);
    this.on('add', replaceBaseValue);
    this.on('remove', replaceBaseValue);

  }

  // idまたはnameとcpを指定し、Parameter(Model)を追加
  set(id, cp = 0, options = {}) {
    id = this._parseId(id);
    let baseId = data.parameter[id].baseId, baseValue;
    if (baseId === false) {
      baseValue = 10;
    } else {
      baseValue = this.getValue(data.parameter[id].baseId);
    }
    const param = new Parameter({ id: id, cp: cp, baseValue: baseValue });
    this.add(param, options);
    return param;
  }

  // idまたはnameとbool値(true:++/false:--)を指定し、value属性を変更
  // 見つからない場合には新しいParameterを生成
  put(id, bool, capacity = 10) {
    return this.get(id).put(bool, this.getTotal(), capacity);
  }

  // idまたはnameとcpを指定し、Parameter(Model)を削除
  unset(id) {
    const param = this.at(id);
    this.remove(param);
    return param;
  }

  // idからでもnameからでも、Model(Parameter)を取得
  // 見つからない場合には新しいParameterを生成
  get(id) {
    return this.at(this._parseId(id)) || this.set(id);
  }

  // idからでもnameからでも、Parameterのvalue属性を取得
  getValue(id) {
    return this.get(id).get('value');
  }

  // idからでもnameからでも、Parameterのcp属性を取得
  getCp(id) {
    return this.get(id).get('cp');
  }

  // 現CPの合計を取得
  getTotal() {
    let total = 0
    this.models.forEach((elem) => total += elem.get('cp'));
    return total;
  }

  // idをnameに変換 引数がnameならそのまま返す
  _parseName(id) {
    let name;
    if (this._isInteger(id)) {
      name = data.parameter[id];
    } else {
      name = id + '';
    }
    return name;
  }

  // nameをidに変換 引数がidならそのまま返す
  _parseId(name) {
    let id;
    if (this._isInteger(name)) {
      id = name - 0;
    } else {
      data.parameter.forEach((param) => {
        if (name === param.name) id = param.id;
      });
    }
    return id;
  }

  _isInteger(val) {
    const regexp = /^\d*$/;
    return regexp.test(val);
  }
}

// IDは装備箇所を示す
// 0:武器(主用途), 1:武器(副用途), 2:射撃武器, 3:盾, 4-7:防具
class Equipment extends Model {
  initialize() {
    // デフォルト値を代入
    const defaults = {
      itemId: 0
    };
    this.attributes = Object.assign(defaults, this.attributes);
    // parametersが見つからない場合には新しく生成
    if (!this.attributes.parameters) this.parameters = new Parameters();
    // データより転記
    this.attributes = Object.assign(this.attributes, data.equipment[this.get('itemId')]);

    // 初期化
    this._math();
  }

  validate(attrs) {
    // IDが7より大きい場合はエラー
    if (this.id > 7) {
      return 'Id is not correct !!';
    }
    // ItemIDがデータに無い値の場合はエラー
    if (attrs.itemId >= data.equipment.length) {
      return 'Item-Id is not correct !!';
    }
  }

  // 初期化
  _math() {
    // 武器(id < 4)
    if (this.id < 4) {
      return this._mathWeapon();
    }
    // 防具(id >= 4)
    if (this.id >= 4) {
      // 名前が配列の場合、配列から装備箇所別の名前を取得
      if (Array.isArray(this.get('name'))) {
        this.set('name', this.get('name')[this.id - 4]);
      }
      // 配列の要素が空の場合、itemIdを-1し、データを修正
      if (this.get('name') === false) {
        this.set('itemId', this.get('itemId') - 1);
        this.attributes = Object.assign(this.attributes, data.equipment[this.get('itemId')]);
        this.set('name', this.get('name')[this.id - 4]);
      }
      return this._mathArmor();
    }
  }

  // parametersより、'dmg', 'level'を計算
  _mathWeapon() {
    // 'dmg'
    const params = this.get('parameters');
    const baseDmg = this.get('baseDmg');
    const muscle = params.getValue('17'); // 怪力
    const dmgId = baseDmg + Math.floor((muscle - 10) / 2);
    const dmg = data.dmg[dmgId];
    const dmgType = data.dmgType[this.get('dmgType')];
    this.set('dmg', dmg);
    this.set('dmgType', dmgType);
    // 'level'
    const skill = this.id === 1 ? 5 : this.get('skill'); // 武術(副用途)
    this.set('skill', skill);
    const level = params.getValue(skill);
    this.set('level', level);
    // モデル自身を返す
    return this;
  }

  // parametersより、'ev'を計算
  _mathArmor() {
    // 'ev'
    const params = this.get('parameters');
    const athletics = params.getValue(25); // 運動
    const ev = Math.floor((athletics + 10) / 2);
    this.set('ev', ev);
    // モデル自身を返す
    return this;
  }
}

class Equipments extends Collection {
  initialize() {
    this._handleEvents();
  }

  // Model(Equipment)の追加・削除を監視
  _handleEvents() {
    // Modelの追加を受け取り、副用途の武器を追加
    const addUsualUsage = (model) => {
      if (model.id === 0 && model.get('itemId') !== model.get('usualUsage')) {
        this.add(new Equipment({
          id: 1,
          itemId: model.get('usualUsage'),
          parameters: model.get('parameters')
        }), { merge: true });
        this.at(1).set('name', model.get('name'));
      }
    };
    this.on('add', addUsualUsage);

    // Modelの削除を受け取り、副用途の武器を削除
    const removeUsualUsage = (model) => {
      if (model.id === 0 && this.at(1)) {
        this.remove(1);
      }
    };
    this.on('remove', removeUsualUsage);
  }

  set(id, itemId, params, options = { merge: true }) {
    const equip = new Equipment({
      id: id,
      itemId: itemId,
      parameters: params
    });
    this.add(equip, options);
    return equip;
  }

  unset(id) {
    const equip = this.at(id);
    this.remove(equip);
    return equip;
  }
}

class Profile extends Model {
  initialize() {
    // SIDまたはIDがセットされていれば、デフォルト値を代入
    this.sid = this.get('sid') || this.id;
    if (this.sid !== undefined) {
      const g = this.get('gender') === undefined ? Math.floor(this.sid / 54) % 2
        : this._parseId(this.get('gender'));
      const n = this.sid % 54 + g * 54;
      this.set('name', data.name[n]);
      this.setGender(g);
    }
  }

  // idまたはnameから性別をセット
  setGender(id) {
    const name = data.gender[this._parseId(id)];
    this.set('gender', name);
    return name;
  }

  // 属性名を指定してidをnameに変換 引数がnameならそのまま返す
  _parseName(id) {
    let name;
    if (this._isInteger(id)) {
      name = data.gender[id];
    } else {
      name = id + '';
    }
    return name;
  }

  // nameをidに変換 引数がidならそのまま返す
  _parseId(name) {
    let id;
    if (this._isInteger(name)) {
      id = name - 0;
    } else {
      data.gender.forEach((elem, i) => {
        if (name === elem) id = i;
      });
    }
    return id;
  }

  _isInteger(val) {
    const pattern = /^\d*$/;
    return pattern.test(val);
  }
}

class Unit extends Model {
  initialize() {
    // デフォルト値を代入
    const defaults = {
      name: 'no name',
      capacity: 10
    }
    this.attributes = Object.assign(defaults, this.attributes);
    this.parameters = this.get('parameters') || new Parameters();
    this.equipments = this.get('equipments') || new Equipments();
    this.profile = this.get('profile') || new Profile(this.attributes);
  }

  setParam(id, cp = 0, options = {}) {
    return this.parameters.set(id, cp, options);
  }

  putParam(id, bool, capacity = 10) {
    return this.parameters.put(id, bool, capacity);
  }

  getParam(id) {
    return this.parameters.get(id);
  }

  getParamValue(id) {
    return this.parameters.getValue(id);
  }

  getParamCp(id) {
    return this.parameters.getCp(id);
  }

  getParamTotal() {
    return this.parameters.getTotal();
  }

  unsetParam(id) {
    return this.parameters.unset(id);
  }

  setEquip(id, itemId, options = { merge: true }) {
    return this.equipments.set(id, itemId, this.parameters, options);
  }

  getEquip(id) {
    return this.equipments.at(id);
  }

  unsetEquip(id) {
    return this.equipments.unset(id);
  }

  setProfile(attr, value) {
    return this.profile.set(attr, value);
  }

  getProfile(attr) {
    return this.profile.get(attr);
  }

  unsetProfile(attr) {
    return this.profile.unset(attr);
  }

  set name(value) {
    this.profile.set('name', value);
  }

  get name() {
    return this.profile.get('name');
  }
}

class Units extends Collection {
  addUnit(attr = {}) {
    return this.add(new Unit(attr));
  }

  setParam(at, id, cp = 0, options = {}) {
    const unit = this.at(at);
    return unit.setParam(id, cp, options);
  }

  putParam(at, id, bool, capacity = 10) {
    const unit = this.at(at);
    return unit.putParam(id, bool, capacity);
  }

  getParam(at, id) {
    const unit = this.at(at);
    return unit.getParam(id);
  }

  getParamValue(at, id) {
    const unit = this.at(at);
    return unit.getParamValue(id);
  }

  getParamCp(at, id) {
    const unit = this.at(at);
    return unit.getParamCp(id);
  }

  getParamTotal(at) {
    const unit = this.at(at);
    return unit.getParamTotal();
  }

  unsetParam(at, id) {
    const unit = this.at(at);
    return unit.unsetParam(id);
  }

  setEquip(at, id, itemId, options = { merge: true }) {
    const unit = this.at(at);
    return unit.setEquip(id, itemId, options);
  }

  getEquip(at, id) {
    const unit = this.at(at);
    return unit.getEquip(id);
  }

  unsetEquip(at, id) {
    const unit = this.at(at);
    return unit.unsetEquip(id);
  }

  setProfile(at, attr, value) {
    const unit = this.at(at);
    return unit.setProfile(attr, value);
  }

  getProfile(at, attr) {
    const unit = this.at(at);
    return unit.getProfile(attr);
  }

  unsetProfile(at, attr) {
    const unit = this.at(at);
    return unit.unsetProfile(attr);
  }
}

export { Unit, Units };
