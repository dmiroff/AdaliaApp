const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../src/assets/Images');
const target = path.resolve(__dirname, '../build/assets/Images');
fs.cpSync(source, target, {recursive: true});
console.log('Copied runtime item images to build/assets/Images');
