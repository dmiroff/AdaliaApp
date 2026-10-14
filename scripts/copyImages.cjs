const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = path.resolve(__dirname, '../src/assets/Images');
const build = process.env.BUILD_PATH ? path.resolve(process.env.BUILD_PATH) : path.resolve(__dirname, '../build');
const target = path.join(build, 'assets/Images');
const media = path.join(build, 'static/media');
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const bundled = new Map();
for (const entry of fs.readdirSync(media, {withFileTypes:true})) {
  if (entry.isFile()) {
    const file = path.join(media, entry.name);
    bundled.set(digest(file), file);
  }
}
// Runtime inventory paths and webpack paths often refer to identical images.
// Relative aliases stay inside the release and avoid a second 480 MB copy.
fs.rmSync(target, {recursive:true, force:true});
let aliases = 0, copies = 0;
function copy(directory, destination) {
  fs.mkdirSync(destination, {recursive:true});
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const input = path.join(directory, entry.name);
    const output = path.join(destination, entry.name);
    if (entry.isDirectory()) copy(input, output);
    else if (entry.isFile()) {
      const existing = bundled.get(digest(input));
      if (existing) {
        fs.symlinkSync(path.relative(path.dirname(output), existing), output);
        aliases++;
      } else {
        fs.copyFileSync(input, output);
        copies++;
      }
    }
  }
}
copy(source, target);
console.log(`Prepared runtime item images: ${aliases} bundled aliases, ${copies} additional files`);
