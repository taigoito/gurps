/*
 * App
 */

import Sample from './sample/_init.js';
import Battle from './battle/_init.js';

export default class App {
  init(part) {
    if (part === 'sample') {
      const sample = new Sample();
      sample.init();      
    }
    if (part === 'battle') {
      const battle = new Battle();
      battle.init(); 
    }
  }
}
