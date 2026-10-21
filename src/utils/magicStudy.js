const ELEMENTS = new Set([
  "sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone",
  "sign_power", "sign_sound", "sign_light", "sign_dark", "sign_life", "sign_death",
]);
const FORMS = new Set([
  "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
]);

export function magicStudyLimit(player, pendingSigns = []) {
  const racialFire = /^Драконид(?:-|$)/.test(player?.Race || "");
  const opened = (player?.available_signs || []).filter(s => !(racialFire && s === "sign_fire"));
  return [...opened, ...pendingSigns].some(s => ELEMENTS.has(s) || FORMS.has(s)) ? 1 : 2;
}

export function validStudySelection(signs, limit) {
  if (new Set(signs).size !== signs.length) return false;
  if (limit === 2) {
    return signs.length === 2 && signs.filter(s => ELEMENTS.has(s)).length === 1
      && signs.filter(s => FORMS.has(s)).length === 1;
  }
  return signs.length === 1;
}
