import { useState, useContext, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Container, Row, Col, Card, Button, Modal, Form, InputGroup, Alert, ListGroup } from "react-bootstrap";
import { Context } from "../index";
import {
  CommitUpgrades,
  TestAttack,
  TestSpell,
} from "../http/apiClient";
import { fetchBirzhaRate } from "../http/birzha";
import { talents_dict } from "../utils/Helpers";

// Константы для выбора знака (можно вынести в отдельный файл)
const MAGIC_ELEMENTS = [
  { key: "sign_fire", label: "Огонь 🔥" },
  { key: "sign_ice", label: "Лёд ❄️" },
  { key: "sign_electric", label: "Молния ⚡" },
  { key: "sign_wind", label: "Ветер 💨" },
  { key: "sign_stone", label: "Камень 🪨" },
  { key: "sign_power", label: "Власть 👑" },
  { key: "sign_sound", label: "Звук 🔊" },
  { key: "sign_light", label: "Свет ☀️" },
  { key: "sign_dark", label: "Тьма 🌑" },
  { key: "sign_life", label: "Жизнь 🌿" },
  { key: "sign_death", label: "Смерть 💀" },
];

const MAGIC_TYPES = [
  { key: "sign_touch", label: "Длань" },
  { key: "sign_distant", label: "Сгусток" },
  { key: "sign_ray", label: "Поток" },
  { key: "sign_weapon_enchant", label: "Улучшение оружия" },
  { key: "sign_armor_enchant", label: "Сфера" },
  { key: "sign_dash", label: "Рывок" },
  { key: "sign_magic_effect", label: "Аугментация Мощи" },
  { key: "sign_magic_accuracy", label: "Аугментация Точности" },
  { key: "sign_magic_range", label: "Аугментация Дальности" },
];

// Словарь доступных знаков для классов
const learnable_signs_dict = {
    "Плут": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound", "sign_weapon_enchant",
             "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Бард": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound", "sign_weapon_enchant",
             "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Маг": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_power", "sign_sound",
            "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
            "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Жрец": ["sign_life", "sign_dark", "sign_light", "sign_touch", "sign_distant", "sign_ray",
             "sign_weapon_enchant", "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy",
             "sign_magic_range"],
    "Воин": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound", "sign_weapon_enchant",
             "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Монах": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound", "sign_weapon_enchant",
              "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Мастер битвы": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound",
                     "sign_weapon_enchant",
                     "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Убийца": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound", "sign_weapon_enchant",
               "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Расхититель": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound",
                    "sign_weapon_enchant",
                    "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Алхимик": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound",
                "sign_weapon_enchant",
                "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Адепт Огня": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_power", "sign_sound",
                   "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
                   "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Адепт Льда": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_power", "sign_sound",
                   "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
                   "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Адепт Молнии": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_power", "sign_sound",
                     "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
                     "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Адепт Камня": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_power", "sign_sound",
                    "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
                    "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Адепт Ветра": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_power", "sign_sound",
                    "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
                    "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Адепт Звука": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_power", "sign_sound",
                    "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
                    "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Адепт Власти": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_power", "sign_sound",
                     "sign_touch", "sign_distant", "sign_ray", "sign_weapon_enchant", "sign_armor_enchant", "sign_dash",
                     "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Жрец Света": ["sign_life", "sign_dark", "sign_light", "sign_touch", "sign_distant", "sign_ray",
                   "sign_weapon_enchant", "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy",
                   "sign_magic_range"],
    "Жрец Тьмы": ["sign_life", "sign_dark", "sign_light", "sign_touch", "sign_distant", "sign_ray",
                  "sign_weapon_enchant", "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy",
                  "sign_magic_range"],
    "Жрец Смерти": ["sign_life", "sign_dark", "sign_light", "sign_touch", "sign_distant", "sign_ray",
                    "sign_weapon_enchant", "sign_armor_enchant", "sign_dash", "sign_magic_effect",
                    "sign_magic_accuracy",
                    "sign_magic_range"],
    "Жрец Жизни": ["sign_life", "sign_dark", "sign_light", "sign_touch", "sign_distant", "sign_ray",
                   "sign_weapon_enchant", "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy",
                   "sign_magic_range"],
    "Варвар": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound", "sign_weapon_enchant",
               "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Страж": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound", "sign_weapon_enchant",
              "sign_armor_enchant", "sign_dash", "sign_magic_effect", "sign_magic_accuracy", "sign_magic_range"],
    "Паладин": ["sign_fire", "sign_ice", "sign_electric", "sign_wind", "sign_stone", "sign_sound",
                "sign_weapon_enchant", "sign_touch", "sign_armor_enchant", "sign_dash", "sign_magic_effect",
                "sign_magic_accuracy", "sign_magic_range"],
};

// Объединяем все знаки в один словарь для отображения
const signLabelMap = {
  ...Object.fromEntries(MAGIC_ELEMENTS.map(e => [e.key, e.label])),
  ...Object.fromEntries(MAGIC_TYPES.map(t => [t.key, t.label]))
};

// Формула стоимости навыка (калька с бэкенда)
const computeSkillCost = (skillValue) => {
  if (skillValue <= 0) return 100;
  let cost;
  if (skillValue <= 50) {
    cost = 100 * Math.pow(1.09, skillValue - 1);
  } else if (skillValue <= 100) {
    const levelDiff = skillValue - 50;
    cost = 6821 * Math.pow(1.024, levelDiff);
  } else {
    const levelDiff = skillValue - 100;
    cost = 22327 * Math.pow(1.001, levelDiff);
  }
  return Math.min(Math.floor(cost), 100000);
};

const calculateTotalSkillCost = (currentLevel, levelsToAdd) => {
  let total = 0;
  for (let i = 0; i < levelsToAdd; i++) {
    total += computeSkillCost(currentLevel + i);
  }
  return total;
};

const calculateDaleonsForSkill = (currentLevel, levelsToAdd, startRate) => {
  let rate = startRate;
  let totalDaleons = 0;
  for (let i = 0; i < levelsToAdd; i++) {
    const goldCost = computeSkillCost(currentLevel + i);
    const daleonsNeeded = Math.ceil((goldCost * 100) / rate);
    totalDaleons += daleonsNeeded;
    const hundreds = Math.floor(daleonsNeeded / 100);
    if (hundreds > 0) {
      rate = rate * Math.pow(0.99, hundreds);
      rate = Math.floor(rate);
    }
  }
  return { totalDaleons, finalRate: rate };
};

const calculateTotalDaleonsNeeded = (playerData, changesSkills, initialRate) => {
  let currentRate = initialRate;
  let total = 0;
  for (const item of changesSkills) {
    const currentLevel = playerData[item.skill] || 0;
    const { totalDaleons, finalRate } = calculateDaleonsForSkill(currentLevel, item.amount, currentRate);
    total += totalDaleons;
    currentRate = finalRate;
  }
  return total;
};

const ATTRIBUTES = [
  { key: "perception", label: "Восприятие 👁" },
  { key: "strength", label: "Сила 🏋️" },
  { key: "agility", label: "Ловкость 🤸" },
  { key: "constitution", label: "Телосложение 🫀" },
  { key: "intelligence", label: "Интеллект 🎓" },
  { key: "charisma", label: "Харизма 🤝" },
  { key: "wisdom", label: "Мудрость 🧙" },
  { key: "luck", label: "Удача 🍀" },
];

const SKILLS = [
  { key: "barter", label: "Торговля 💰" },
  { key: "intimidation", label: "Устрашение 👺" },
  { key: "persuasion", label: "Воодушевление 🌟" },
  { key: "sneak", label: "Скрытность 🥷" },
  { key: "observation", label: "Наблюдательность 👀" },
  { key: "identification", label: "Обнажение сути 🔍" },
  { key: "knowledge", label: "Знание магии 📖" },
  { key: "lockpicking", label: "Ловушки и замки 🗝️" },
  { key: "animal_training", label: "Знание природы 🌿" },
  { key: "athletics", label: "Атлетика 🏃" },
  { key: "calligraphy", label: "Каллиграфия ✍️" },
  { key: "fortitude", label: "Стойкость 🧱" },
  { key: "medicine", label: "Медицина 🩺" },
  { key: "swords", label: "Мечи ⚔️" },
  { key: "knifes", label: "Кинжалы 🗡️" },
  { key: "axes", label: "Топоры 🪓" },
  { key: "hammers", label: "Молоты 🔨" },
  { key: "bows", label: "Луки 🏹" },
  { key: "staffs", label: "Посохи 🪄" },
  { key: "spears", label: "Копья 🔱" },
  { key: "crossbows", label: "Арбалеты 🎯" },
  { key: "throwing_weapon", label: "Метательное оружие 🔪" },
  { key: "shield", label: "Щиты 🛡️" },
];

const UpgradeTab = observer(({ playerData, setPlayerData, canUpgrade }) => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [birzhaRate, setBirzhaRate] = useState(null);
  
  const [originalPlayerData, setOriginalPlayerData] = useState(null);
  const [tempPlayerData, setTempPlayerData] = useState(null);
  
  const [changes, setChanges] = useState({
    attributes: {},
    skills: [],
    talents: []
  });
  
  const [selectedType, setSelectedType] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [amount, setAmount] = useState(1);
  const [talentAmount, setTalentAmount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('points');
  
  const [showSpellSelector, setShowSpellSelector] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [showSignSelector, setShowSignSelector] = useState(false);
  const [availableSignsForSelection, setAvailableSignsForSelection] = useState([]);
  const [selectedSigns, setSelectedSigns] = useState([]);
  const [maxSelectableSigns, setMaxSelectableSigns] = useState(1);
  
  useEffect(() => {
    loadBirzhaRate();
  }, []);
  
  useEffect(() => {
    if (playerData) {
      setOriginalPlayerData(playerData);
      setTempPlayerData(JSON.parse(JSON.stringify(playerData)));
      resetChanges();
    }
  }, [playerData]);
  
  const loadBirzhaRate = async () => {
    try {
      const rateResponse = await fetchBirzhaRate();
      if (rateResponse && rateResponse.data) {
        setBirzhaRate(rateResponse.data);
      }
    } catch (err) {
      console.error("Ошибка загрузки курса биржи:", err);
    }
  };
  
  const resetChanges = () => {
    setChanges({ attributes: {}, skills: [], talents: [] });
    setSelectedType(null);
    setSelectedKey(null);
    setAmount(1);
    setTalentAmount(1);
    setPaymentMethod('points');
  };
 
  const exactDaleonsNeeded = useMemo(() => {
    if (!birzhaRate || !selectedKey) return Infinity;
    const daleonSkillsCopy = changes.skills
      .filter(s => s.currency === 'daleons')
      .map(s => ({ ...s }));
    const existing = daleonSkillsCopy.find(s => s.skill === selectedKey);
    if (existing) {
      existing.amount += amount;
    } else {
      daleonSkillsCopy.push({ skill: selectedKey, amount, currency: 'daleons' });
    }
    return calculateTotalDaleonsNeeded(tempPlayerData, daleonSkillsCopy, birzhaRate.sell_rate);
  }, [selectedKey, amount, changes.skills, birzhaRate, tempPlayerData]);
    
  const totalCost = useMemo(() => {
    if (!tempPlayerData) return { money: 0, points: 0, daleons: 0 };
    
    let totalMoney = 0;
    let totalPoints = 0;
    let totalDaleons = 0;
    
    for (const item of changes.skills) {
      const currentLevel = tempPlayerData[item.skill] || 0;
      const goldCost = calculateTotalSkillCost(currentLevel, item.amount);
      if (item.currency === "money") {
        totalMoney += goldCost;
      } else if (item.currency === "points") {
        totalPoints += item.amount;
      }
    }
    
    if (birzhaRate) {
      const daleonSkills = changes.skills.filter(s => s.currency === 'daleons');
      totalDaleons = calculateTotalDaleonsNeeded(tempPlayerData, daleonSkills, birzhaRate.sell_rate);
    }
    
    return { money: totalMoney, points: totalPoints, daleons: totalDaleons };
  }, [changes, tempPlayerData, birzhaRate]);
  
  // ========== НОВАЯ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ==========
  const getEffectiveAttribute = (playerData, attrName) => {
    const base = playerData[attrName] || 0;
    const increase = playerData[`${attrName}_increase`] || 0;
    return base + increase;
  };
  
  // ========== ИСПРАВЛЕННАЯ ФУНКЦИЯ ПРОВЕРКИ ДОСТУПНОСТИ ТАЛАНТА ==========
  const isTalentAvailable = (talentName, talentData) => {
    if (!tempPlayerData) return false;
  
    // Активные и неактивные таланты
    const activeTalents = tempPlayerData.talents || [];
    const inactiveTalents = tempPlayerData.inactive_talents || [];
    const currentCount = activeTalents.filter(t => t === talentName).length +
                         inactiveTalents.filter(t => t === talentName).length;
    const addedCount = changes.talents.filter(t => t.talent === talentName).length;
  
    if (currentCount + addedCount >= talentData.take_times) return false;
  
    // Особый эффект "Первый раз - открывает возможность изучения"
    if (talentData.effects && talentData.effects.startsWith("Первый раз - открывает возможность изучения")) {
      if (talentName === "Изучение магии") {
        const availableSigns = getAvailableSignsForMagicStudy();
        if (availableSigns.length === 0) return false;
      } else {
        const playerClass = tempPlayerData.Character_class;
        const classSigns = learnable_signs_dict[playerClass] || [];
        const alreadyOpened = tempPlayerData.available_signs || [];
        const pendingSigns = changes.talents
          .filter(t => t.talent === talentName && t.chosenSigns)
          .flatMap(t => t.chosenSigns);
        const remainingSigns = classSigns.filter(sign => !alreadyOpened.includes(sign) && !pendingSigns.includes(sign));
        if (remainingSigns.length === 0) return false;
      }
    }
  
    // Проверка требований (класс, атрибуты)
    const requirements = talentData.requirements;
    for (const [reqKey, reqValue] of Object.entries(requirements)) {
      if (reqKey === "Character_class") {
        if (Array.isArray(reqValue) && !reqValue.includes(tempPlayerData.Character_class)) return false;
        if (typeof reqValue === "string" && tempPlayerData.Character_class !== reqValue) return false;
      } else {
        let required = reqValue;
        if (Array.isArray(reqValue)) {
          // Для следующей копии используем текущее количество (без учёта addedCount)
          const nextLevel = currentCount;
          if (nextLevel >= reqValue.length) return false;
          required = reqValue[nextLevel];
        }
        const currentAttrValue = getEffectiveAttribute(tempPlayerData, reqKey);
        if (currentAttrValue < required) return false;
      }
    }
  
    return true;
  };
  
  // ========== ИСПРАВЛЕННАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ СПИСКА ДОСТУПНЫХ ТАЛАНТОВ ==========
  const getAvailableTalents = () => {
    const available = [];
    for (const [name, data] of Object.entries(talents_dict)) {
      if (isTalentAvailable(name, data)) {
        available.push({ name, data });
      }
    }
    return available;
  };
  
  // ========== НОВАЯ ФУНКЦИЯ: ПРОВЕРКА ВОЗМОЖНОСТИ ДОБАВИТЬ N КОПИЙ ТАЛАНТА ==========
  const canAddTalentCopies = (talentName, talentData, copiesToAdd) => {
    if (!tempPlayerData) return false;
  
    const activeTalents = tempPlayerData.talents || [];
    const inactiveTalents = tempPlayerData.inactive_talents || [];
    const currentCount = activeTalents.filter(t => t === talentName).length +
                         inactiveTalents.filter(t => t === talentName).length;
    const addedCount = changes.talents.filter(t => t.talent === talentName).length;
    const totalAfter = currentCount + addedCount + copiesToAdd;
  
    if (totalAfter > talentData.take_times) return false;
  
    // Проверяем требования для каждой добавляемой копии (начиная с currentCount+addedCount)
    for (let copyIndex = 0; copyIndex < copiesToAdd; copyIndex++) {
      const level = currentCount + addedCount + copyIndex; // уровень копии (0-базовая)
      const requirements = talentData.requirements;
      for (const [reqKey, reqValue] of Object.entries(requirements)) {
        if (reqKey === "Character_class") {
          if (Array.isArray(reqValue) && !reqValue.includes(tempPlayerData.Character_class)) return false;
          if (typeof reqValue === "string" && tempPlayerData.Character_class !== reqValue) return false;
        } else {
          let required = reqValue;
          if (Array.isArray(reqValue)) {
            if (level >= reqValue.length) return false;
            required = reqValue[level];
          }
          const currentAttrValue = getEffectiveAttribute(tempPlayerData, reqKey);
          if (currentAttrValue < required) return false;
        }
      }
    }
  
    // Особый эффект для "Изучение магии"
    if (talentName === "Изучение магии") {
      const availableSigns = getAvailableSignsForMagicStudy();
      if (availableSigns.length === 0) return false;
    }
  
    return true;
  };
  
  // Функция для получения доступных знаков для таланта "Изучение магии"
  const getAvailableSignsForMagicStudy = () => {
    if (!tempPlayerData) return [];
    const playerClass = tempPlayerData.Character_class;
    const classSigns = learnable_signs_dict[playerClass] || [];
    const alreadyOpened = tempPlayerData.available_signs || [];
    const pendingSigns = changes.talents
      .filter(t => t.talent === "Изучение магии" && t.chosenSigns)
      .flatMap(t => t.chosenSigns);
    return classSigns.filter(sign => !alreadyOpened.includes(sign) && !pendingSigns.includes(sign));
  };
  
  // Проверка возможности добавления изменения (общая)
  const canAddChange = () => {
    if (!selectedKey || !tempPlayerData) return false;
    if (!canUpgrade) return false;
    
    if (selectedType === "attribute") {
      const currentPoints = tempPlayerData.free_attribute_points || 0;
      const alreadyAdded = changes.attributes[selectedKey] || 0;
      return currentPoints - alreadyAdded >= amount;
    } else if (selectedType === "skill") {
      const currentLevel = tempPlayerData[selectedKey] || 0;
      const addedLevels = changes.skills.find(s => s.skill === selectedKey)?.amount || 0;
      const newLevel = currentLevel + addedLevels;
      const goldCost = calculateTotalSkillCost(newLevel, amount);
      const pointsNeeded = amount;
      
      if (paymentMethod === "points") {
        const availablePoints = tempPlayerData.free_skill_points || 0;
        return totalCost.points + pointsNeeded <= availablePoints;
      } else if (paymentMethod === "money") {
        const availableMoney = tempPlayerData.money || 0;
        return totalCost.money + goldCost <= availableMoney;
      } else if (paymentMethod === "daleons") {
        if (!birzhaRate) return false;
        const daleonSkillsCopy = changes.skills
          .filter(s => s.currency === 'daleons')
          .map(s => ({ ...s }));
        const existingIndex = daleonSkillsCopy.findIndex(s => s.skill === selectedKey);
        if (existingIndex !== -1) {
          daleonSkillsCopy[existingIndex].amount += amount;
        } else {
          daleonSkillsCopy.push({ skill: selectedKey, amount, currency: 'daleons' });
        }
        const totalDaleonsNeeded = calculateTotalDaleonsNeeded(tempPlayerData, daleonSkillsCopy, birzhaRate.sell_rate);
        const currentDaleons = tempPlayerData.daleons || 0;
        return currentDaleons >= totalDaleonsNeeded;
      }
    } else if (selectedType === "talent") {
      const talentData = talents_dict[selectedKey];
      if (!talentData) return false;
      
      // Проверка возможности добавить talentAmount копий с учётом требований
      if (!canAddTalentCopies(selectedKey, talentData, talentAmount)) return false;
      
      const currentPoints = tempPlayerData.free_talent_points || 0;
      const addedTotal = changes.talents.length;
      if (currentPoints - addedTotal < talentAmount) return false;
      
      if (selectedKey === "Изучение магии") {
        const availableSigns = getAvailableSignsForMagicStudy();
        if (availableSigns.length === 0) return false;
      }
      return true;
    }
    return false;
  };
  
  // Добавление изменения (атрибут, навык)
  const addChange = () => {
    if (!canAddChange()) return;
    
    const newChanges = JSON.parse(JSON.stringify(changes));
    
    if (selectedType === "attribute") {
      const current = newChanges.attributes[selectedKey] || 0;
      newChanges.attributes[selectedKey] = current + amount;
    } else if (selectedType === "skill") {
      const existingIndex = newChanges.skills.findIndex(s => s.skill === selectedKey);
      if (existingIndex !== -1) {
        const existing = newChanges.skills[existingIndex];
        if (existing.currency !== paymentMethod) {
          setError("Нельзя смешивать способы оплаты для одного навыка");
          return;
        }
        existing.amount += amount;
      } else {
        newChanges.skills.push({ skill: selectedKey, amount, currency: paymentMethod });
      }
    }
    
    setChanges(newChanges);
    setSelectedKey(null);
    setAmount(1);
    setError("");
  };
  
  // Добавление таланта
  const addTalentChange = (talentName, chosenSigns = null, count = 1) => {
    const newChanges = JSON.parse(JSON.stringify(changes));
    const talentData = talents_dict[talentName];
    if (!talentData) return;
    
    // Дополнительная проверка (дублируем canAddTalentCopies для безопасности)
    if (!canAddTalentCopies(talentName, talentData, count)) {
      setError("Не выполнены требования для добавления таланта");
      return;
    }
    
    for (let i = 0; i < count; i++) {
      newChanges.talents.push({ talent: talentName, chosenSigns });
    }
    setChanges(newChanges);
    setSelectedKey(null);
    setTalentAmount(1);
    setError("");
  };
  
  const addTalentWithAmount = () => {
    if (selectedKey === "Изучение магии") {
      const availableSigns = getAvailableSignsForMagicStudy();
      if (availableSigns.length === 0) {
        setError("Нет доступных знаков для изучения");
        return;
      }
      const openCount = tempPlayerData.available_signs?.length || 0;
      const maxNew = openCount > 3 ? 1 : 2;
      const maxSelectable = Math.min(maxNew, availableSigns.length);
      if (maxSelectable === 0) {
        setError("Нет доступных знаков для изучения");
        return;
      }
      setAvailableSignsForSelection(availableSigns);
      setMaxSelectableSigns(maxSelectable);
      setSelectedSigns([]);
      setShowSignSelector(true);
    } else {
      addTalentChange(selectedKey, null, talentAmount);
    }
  };
  
  const handleSignConfirm = () => {
    if (selectedSigns.length === 0) {
      setError("Выберите хотя бы один знак");
      return;
    }
    if (selectedSigns.length > maxSelectableSigns) {
      setError(`Можно выбрать не более ${maxSelectableSigns} знаков`);
      return;
    }
    addTalentChange("Изучение магии", selectedSigns, 1);
    setShowSignSelector(false);
    setSelectedSigns([]);
  };
  
  const removeChange = (type, key, talentIndex = -1) => {
    const newChanges = JSON.parse(JSON.stringify(changes));
    if (type === "attribute") {
      delete newChanges.attributes[key];
    } else if (type === "skill") {
      const index = newChanges.skills.findIndex(s => s.skill === key);
      if (index !== -1) {
        newChanges.skills.splice(index, 1);
      }
    } else if (type === "talent") {
      if (talentIndex >= 0) {
        newChanges.talents.splice(talentIndex, 1);
      } else {
        newChanges.talents = newChanges.talents.filter(t => t.talent !== key);
      }
    }
    setChanges(newChanges);
  };
  
  const canCommit = () => {
    if (!tempPlayerData) return false;
    const currentMoney = tempPlayerData.money || 0;
    const currentPoints = tempPlayerData.free_skill_points || 0;
    const currentAttrPoints = tempPlayerData.free_attribute_points || 0;
    const currentTalentPoints = tempPlayerData.free_talent_points || 0;
    const currentDaleons = tempPlayerData.daleons || 0;
    
    const attrUsed = Object.values(changes.attributes).reduce((a, b) => a + b, 0);
    if (attrUsed > currentAttrPoints) return false;
    if (changes.talents.length > currentTalentPoints) return false;
    if (totalCost.money > currentMoney) return false;
    if (totalCost.points > currentPoints) return false;
    if (totalCost.daleons > currentDaleons) return false;
    return true;
  };
  
  const handleCommit = async () => {
    if (!canCommit()) {
      setError("Недостаточно ресурсов для применения изменений");
      return;
    }
    
    setLoading(true);
    setError("");
    
    const payload = {
      attributes: Object.entries(changes.attributes).map(([attr, amount]) => ({ attribute: attr, amount })),
      skills: changes.skills.map(item => ({ skill: item.skill, amount: item.amount, currency: item.currency })),
      talents: changes.talents.map(t => {
        if (t.talent === "Изучение магии" && t.chosenSigns && t.chosenSigns.length > 0) {
          return { talent: t.talent, chosen_signs: t.chosenSigns };
        }
        return { talent: t.talent };
      })
    };
    
    try {
      const result = await CommitUpgrades(payload);
      if (result.status === 200) {
        const newPlayerData = JSON.parse(JSON.stringify(tempPlayerData));
        newPlayerData.money -= totalCost.money;
        newPlayerData.free_skill_points -= totalCost.points;
        newPlayerData.free_attribute_points -= Object.values(changes.attributes).reduce((a, b) => a + b, 0);
        newPlayerData.free_talent_points -= changes.talents.length;
        newPlayerData.daleons -= totalCost.daleons;
        for (const [attr, amount] of Object.entries(changes.attributes)) {
          newPlayerData[attr] = (newPlayerData[attr] || 0) + amount;
        }
        for (const item of changes.skills) {
          newPlayerData[item.skill] = (newPlayerData[item.skill] || 0) + item.amount;
        }
        for (const t of changes.talents) {
          if (!newPlayerData.talents.includes(t.talent)) {
            newPlayerData.talents.push(t.talent);
          }
          if (t.talent === "Изучение магии" && t.chosenSigns && t.chosenSigns.length > 0) {
            const currentSigns = newPlayerData.available_signs || [];
            const newSigns = t.chosenSigns.filter(sign => !currentSigns.includes(sign));
            newPlayerData.available_signs = [...currentSigns, ...newSigns];
          }
        }
        
        setTempPlayerData(newPlayerData);
        setOriginalPlayerData(newPlayerData);
        setPlayerData(newPlayerData);
        resetChanges();
        setSuccess("Улучшения успешно применены!");
        setTimeout(() => setSuccess(""), 3000);
        setShowConfirmModal(false);
      } else {
        setError(result.message || "Ошибка применения улучшений");
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestAttack = async () => {
    if (!tempPlayerData) return;
    setLoading(true);
    try {
      const result = await TestAttack(tempPlayerData);
      if (result.status === 200) {
        setTestResult({ type: "attack", data: result.data });
      } else {
        setError(result.message || "Ошибка тестирования");
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestSpell = async () => {
    if (!selectedSpell) {
      setError("Выберите заклинание");
      return;
    }
    if (!tempPlayerData) return;
    setLoading(true);
    try {
      const result = await TestSpell(selectedSpell, tempPlayerData);
      if (result.status === 200) {
        setTestResult({ type: "spell", data: result.data });
      } else {
        setError(result.message || "Ошибка тестирования");
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };
  
  const getSpellsList = () => {
    const spells = [];
    if (tempPlayerData?.prepared_magic) {
      Object.keys(tempPlayerData.prepared_magic).forEach(key => {
        spells.push({ id: key, name: tempPlayerData.prepared_magic[key]?.name || key });
      });
    }
    return spells;
  };
  
  // Вспомогательные рендеры
  const renderAttributeControls = () => (
    <div className="mt-3">
      <Form.Group className="mb-2">
        <Form.Label>Количество уровней:</Form.Label>
        <InputGroup>
          <Form.Control
            type="number"
            min={1}
            max={tempPlayerData?.free_attribute_points - (changes.attributes[selectedKey] || 0)}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <InputGroup.Text>уровней</InputGroup.Text>
        </InputGroup>
      </Form.Group>
      <div className="d-flex justify-content-end">
        <Button variant="primary" onClick={addChange} disabled={!canAddChange()} className="fantasy-btn">
          Добавить
        </Button>
      </div>
    </div>
  );
  
  const renderSkillControls = () => {
    const currentLevel = tempPlayerData?.[selectedKey] || 0;
    const addedLevels = changes.skills.find(s => s.skill === selectedKey)?.amount || 0;
    const newLevel = currentLevel + addedLevels;
    const goldCost = calculateTotalSkillCost(newLevel, amount);
    const pointsNeeded = amount;
    const approxDaleonsNeeded = birzhaRate ? Math.ceil(goldCost * 100 / birzhaRate.sell_rate) : Infinity;
    
    return (
      <div className="mt-3">
        <div className="mb-2">
          <Form.Check
            type="radio"
            label={`За очки навыков (доступно: ${tempPlayerData?.free_skill_points - totalCost.points})`}
            checked={paymentMethod === 'points'}
            onChange={() => setPaymentMethod('points')}
            disabled={pointsNeeded > (tempPlayerData?.free_skill_points - totalCost.points)}
          />
          <Form.Check
            type="radio"
            label={`За золото (стоимость: ${goldCost} 🌕, доступно: ${tempPlayerData?.money - totalCost.money})`}
            checked={paymentMethod === 'money'}
            onChange={() => setPaymentMethod('money')}
            disabled={goldCost > (tempPlayerData?.money - totalCost.money)}
          />
          {birzhaRate && (
            <Form.Check
              type="radio"
              label={`За далеоны (≈${exactDaleonsNeeded} 💎, доступно: ${tempPlayerData?.daleons - totalCost.daleons})`}
              checked={paymentMethod === 'daleons'}
              onChange={() => setPaymentMethod('daleons')}
              disabled={exactDaleonsNeeded > (tempPlayerData?.daleons - totalCost.daleons)}
            />
          )}
        </div>
        <Form.Group className="mb-2">
          <Form.Label>Количество уровней:</Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              min={1}
              max={
                paymentMethod === 'points' ? tempPlayerData?.free_skill_points - totalCost.points :
                paymentMethod === 'money' ? Math.floor((tempPlayerData?.money - totalCost.money) / computeSkillCost(newLevel)) :
                paymentMethod === 'daleons' ? Math.floor((tempPlayerData?.daleons - totalCost.daleons) / approxDaleonsNeeded) :
                0
              }
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <InputGroup.Text>уровней</InputGroup.Text>
          </InputGroup>
        </Form.Group>
        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={addChange} disabled={!canAddChange()} className="fantasy-btn">
            Добавить
          </Button>
        </div>
      </div>
    );
  };
  
  const renderTalentControls = () => {
    const isMagicStudy = selectedKey === "Изучение магии";
    const talentData = talents_dict[selectedKey];
    if (!talentData) return null;
    
    // Вычисляем максимальное количество копий, которое можно добавить с учётом требований
    let maxByRequirements = 0;
    for (let copies = 1; copies <= 10; copies++) {
      if (canAddTalentCopies(selectedKey, talentData, copies)) {
        maxByRequirements = copies;
      } else {
        break;
      }
    }
    
    const activeTalents = tempPlayerData?.talents || [];
    const inactiveTalents = tempPlayerData?.inactive_talents || [];
    const currentCount = activeTalents.filter(t => t === selectedKey).length +
                         inactiveTalents.filter(t => t === selectedKey).length;
    const addedCount = changes.talents.filter(t => t.talent === selectedKey).length;
    const remainingByLimit = talentData.take_times - (currentCount + addedCount);
    const maxByPoints = (tempPlayerData?.free_talent_points || 0) - changes.talents.length;
    const maxAmount = Math.min(maxByRequirements, remainingByLimit, maxByPoints);
    
    return (
      <div className="mt-3">
        {!isMagicStudy && (
          <>
            <Form.Group className="mb-2">
              <Form.Label>Количество копий таланта (доступно: {maxAmount})</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  min={1}
                  max={maxAmount}
                  value={talentAmount}
                  onChange={(e) => setTalentAmount(Math.max(1, Math.min(maxAmount, parseInt(e.target.value) || 1)))}
                />
                <InputGroup.Text>шт.</InputGroup.Text>
              </InputGroup>
            </Form.Group>
            <div className="mb-3 text-muted small">
              Останется очков талантов: {(tempPlayerData?.free_talent_points || 0) - changes.talents.length - talentAmount}
            </div>
          </>
        )}
        {isMagicStudy && (
          <div className="mb-3 text-muted small">
            Талант "Изучение магии" добавляется по одному разу с выбором знаков.
          </div>
        )}
        <div className="d-flex justify-content-end">
          <Button 
            variant="primary" 
            onClick={addTalentWithAmount} 
            disabled={!canAddChange() || (isMagicStudy ? false : talentAmount < 1)}
            className="fantasy-btn"
          >
            Добавить {isMagicStudy ? "" : `${talentAmount} копий`}
          </Button>
        </div>
      </div>
    );
  };
  
  const renderPendingChanges = () => {
    const talentCounts = changes.talents.reduce((acc, t) => {
      const key = t.talent + (t.chosenSigns ? `|${t.chosenSigns.join(',')}` : '');
      acc[key] = acc[key] || { talent: t.talent, chosenSigns: t.chosenSigns, count: 0 };
      acc[key].count++;
      return acc;
    }, {});
    
    return (
      <Card className="fantasy-card mb-3">
        <Card.Header className="fantasy-card-header">
          <h6 className="mb-0">Накопленные изменения</h6>
        </Card.Header>
        <Card.Body>
          {Object.keys(changes.attributes).length === 0 &&
           changes.skills.length === 0 &&
           changes.talents.length === 0 ? (
            <p className="text-muted">Нет изменений</p>
          ) : (
            <>
              <ListGroup variant="flush" className="mb-3">
                {Object.entries(changes.attributes).map(([attr, amount]) => (
                  <ListGroup.Item key={attr} className="d-flex justify-content-between align-items-center">
                    <span>{ATTRIBUTES.find(a => a.key === attr)?.label} +{amount}</span>
                    <Button variant="outline-danger" size="sm" onClick={() => removeChange("attribute", attr)} className="fantasy-btn">
                      Удалить
                    </Button>
                  </ListGroup.Item>
                ))}
                {changes.skills.map((item, idx) => {
                  const currencyLabel = item.currency === "money" ? "золото" : (item.currency === "daleons" ? "далеоны" : "очки");
                  return (
                    <ListGroup.Item key={`${item.skill}-${idx}`} className="d-flex justify-content-between align-items-center">
                      <span>{SKILLS.find(s => s.key === item.skill)?.label} +{item.amount} ({currencyLabel})</span>
                      <Button variant="outline-danger" size="sm" onClick={() => removeChange("skill", item.skill)} className="fantasy-btn">
                        Удалить
                      </Button>
                    </ListGroup.Item>
                  );
                })}
                {Object.values(talentCounts).map((group, idx) => {
                  let displayName = group.talent;
                  if (group.talent === "Изучение магии" && group.chosenSigns && group.chosenSigns.length > 0) {
                    const signsStr = group.chosenSigns.map(s => signLabelMap[s] || s).join(", ");
                    displayName = `${group.talent} (${signsStr})`;
                  }
                  const firstIndex = changes.talents.findIndex(t => 
                    t.talent === group.talent && 
                    (t.chosenSigns ? t.chosenSigns.join(',') === group.chosenSigns?.join(',') : !group.chosenSigns)
                  );
                  return (
                    <ListGroup.Item key={`${group.talent}-${idx}`} className="d-flex justify-content-between align-items-center">
                      <span>{displayName} x{group.count}</span>
                      <Button variant="outline-danger" size="sm" onClick={() => removeChange("talent", group.talent, firstIndex)} className="fantasy-btn">
                        Удалить 1
                      </Button>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
              <div className="mt-2">
                <div>💰 Золота потребуется: {totalCost.money}</div>
                <div>💎 Далеонов потребуется: {totalCost.daleons}</div>
                <div>📚 Очков навыков потребуется: {totalCost.points}</div>
                <div>⭐ Очков атрибутов: {Object.values(changes.attributes).reduce((a, b) => a + b, 0)}</div>
                <div>✨ Очков талантов: {changes.talents.length}</div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    );
  };
  
  if (!tempPlayerData) return <div>Загрузка...</div>;
  
  const availableTalents = getAvailableTalents();
  
  return (
    <Container fluid className="px-2 px-md-3">
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}
      
      <Row>
        <Col xs={12} md={8} className="order-2 order-md-1 mb-4 mb-md-0">
          <Card className="fantasy-card h-100">
            <Card.Header className="fantasy-card-header">
              <h6 className="mb-0">Выберите категорию для прокачки</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Button
                  variant={selectedType === "attribute" ? "primary" : "outline-secondary"}
                  onClick={() => { setSelectedType("attribute"); setSelectedKey(null); setError(""); }}
                  className="fantasy-btn"
                >
                  Атрибуты
                </Button>
                <Button
                  variant={selectedType === "skill" ? "primary" : "outline-secondary"}
                  onClick={() => { setSelectedType("skill"); setSelectedKey(null); setError(""); }}
                  className="fantasy-btn"
                >
                  Навыки
                </Button>
                <Button
                  variant={selectedType === "talent" ? "primary" : "outline-secondary"}
                  onClick={() => { setSelectedType("talent"); setSelectedKey(null); setError(""); }}
                  className="fantasy-btn"
                >
                  Таланты
                </Button>
              </div>
              
              {selectedType === "attribute" && (
                <>
                  <h6>Выберите атрибут:</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {ATTRIBUTES.map(attr => (
                      <Button
                        key={attr.key}
                        variant={selectedKey === attr.key ? "success" : "light"}
                        onClick={() => setSelectedKey(attr.key)}
                        className="fantasy-btn"
                      >
                        {attr.label}
                      </Button>
                    ))}
                  </div>
                  {selectedKey && renderAttributeControls()}
                </>
              )}
              
              {selectedType === "skill" && (
                <>
                  <h6>Выберите навык:</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {SKILLS.map(skill => (
                      <Button
                        key={skill.key}
                        variant={selectedKey === skill.key ? "success" : "light"}
                        onClick={() => setSelectedKey(skill.key)}
                        className="fantasy-btn"
                      >
                        {skill.label}
                      </Button>
                    ))}
                  </div>
                  {selectedKey && renderSkillControls()}
                </>
              )}
              
              {selectedType === "talent" && (
                <>
                  <h6>Выберите талант:</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {availableTalents.map(talent => (
                      <Button
                        key={talent.name}
                        variant={selectedKey === talent.name ? "success" : "light"}
                        onClick={() => setSelectedKey(talent.name)}
                        className="fantasy-btn"
                      >
                        {talent.name}
                      </Button>
                    ))}
                  </div>
                  {selectedKey && renderTalentControls()}
                </>
              )}
              
              <hr />
              <div className="d-flex flex-column flex-md-row justify-content-between mt-3 gap-2">
                <Button variant="outline-secondary" onClick={resetChanges} disabled={loading} className="fantasy-btn w-100 w-md-auto">
                  Сбросить всё
                </Button>
                <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
                  <Button
                    variant="outline-info"
                    onClick={handleTestAttack}
                    disabled={loading}
                    className="fantasy-btn w-100 w-md-auto"
                  >
                    Тест атаки
                  </Button>
                  <Button
                    variant="outline-info"
                    onClick={() => setShowSpellSelector(true)}
                    disabled={loading}
                    className="fantasy-btn w-100 w-md-auto"
                  >
                    Тест заклинания
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!canUpgrade || loading || (Object.keys(changes.attributes).length === 0 && changes.skills.length === 0 && changes.talents.length === 0)}
                    className="fantasy-btn w-100 w-md-auto"
                  >
                    Применить
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xs={12} md={4} className="order-1 order-md-2">
          <Card className="fantasy-card mb-3">
            <Card.Header className="fantasy-card-header">
              <h6 className="mb-0">Ваши ресурсы</h6>
            </Card.Header>
            <Card.Body>
              <div>🌕 Золото: {tempPlayerData.money || 0}</div>
              <div>💎 Далеоны: {tempPlayerData.daleons || 0}</div>
              <div>📚 Очки навыков: {tempPlayerData.free_skill_points || 0}</div>
              <div>⭐ Очки атрибутов: {tempPlayerData.free_attribute_points || 0}</div>
              <div>✨ Очки талантов: {tempPlayerData.free_talent_points || 0}</div>
              {birzhaRate && (
                <div className="mt-2 small text-muted">
                  Курс продажи далеонов: {birzhaRate.sell_rate} 🌕 за 100 💎
                </div>
              )}
            </Card.Body>
          </Card>
          
          {renderPendingChanges()}
        </Col>
      </Row>
      
      {/* Модалка подтверждения */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered dialogClassName="fantasy-modal">
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение улучшений</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Вы уверены, что хотите применить все накопленные изменения?</p>
          <p>Изменения нельзя будет отменить без специального предмета.</p>
          <div className="mt-2">
            <strong>Сводка:</strong>
            <ul>
              {Object.keys(changes.attributes).length > 0 && (
                <li>
                  Атрибуты: {Object.entries(changes.attributes).map(([attr, amount]) => {
                    const attrLabel = ATTRIBUTES.find(a => a.key === attr)?.label || attr;
                    return `${attrLabel} +${amount}`;
                  }).join(", ")}
                </li>
              )}
              {changes.skills.length > 0 && <li>Навыки: {changes.skills.map(item => `${SKILLS.find(s => s.key === item.skill)?.label}+${item.amount} (${item.currency === 'money' ? 'золото' : (item.currency === 'daleons' ? 'далеоны' : 'очки')})`).join(", ")}</li>}
              {changes.talents.length > 0 && (
                <li>Таланты: {
                  Object.values(changes.talents.reduce((acc, t) => {
                    const key = t.talent + (t.chosenSigns ? `|${t.chosenSigns.join(',')}` : '');
                    acc[key] = acc[key] || { name: t.talent, signs: t.chosenSigns, count: 0 };
                    acc[key].count++;
                    return acc;
                  }, {})).map(g => {
                    let name = g.name;
                    if (g.name === "Изучение магии" && g.signs && g.signs.length > 0) {
                      const signsStr = g.signs.map(s => signLabelMap[s] || s).join(", ");
                      name = `${g.name} (${signsStr})`;
                    }
                    return `${name} x${g.count}`;
                  }).join(", ")
                }</li>
              )}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="fantasy-btn">
            Отмена
          </Button>
          <Button variant="primary" onClick={handleCommit} disabled={loading} className="fantasy-btn">
            {loading ? "Применяю..." : "Применить"}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Модалка выбора заклинания */}
      <Modal show={showSpellSelector} onHide={() => setShowSpellSelector(false)} centered dialogClassName="fantasy-modal">
        <Modal.Header closeButton>
          <Modal.Title>Выберите заклинание</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Select
            value={selectedSpell || ""}
            onChange={(e) => setSelectedSpell(e.target.value)}
          >
            <option value="">-- Выберите заклинание --</option>
            {getSpellsList().map(spell => (
              <option key={spell.id} value={spell.id}>{spell.name}</option>
            ))}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSpellSelector(false)} className="fantasy-btn">
            Отмена
          </Button>
          <Button variant="primary" onClick={() => { setShowSpellSelector(false); handleTestSpell(); }} className="fantasy-btn">
            Тестировать
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Модалка выбора знаков для таланта "Изучение магии" */}
      <Modal show={showSignSelector} onHide={() => setShowSignSelector(false)} centered dialogClassName="fantasy-modal">
        <Modal.Header closeButton>
          <Modal.Title>Выбор знаков для таланта "Изучение магии"</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Можно выбрать <strong>{maxSelectableSigns}</strong> знак(а/ов).</p>
          <Form.Group className="mb-3">
            <Form.Label>Доступные знаки:</Form.Label>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {availableSignsForSelection.map(sign => (
                <Form.Check
                  key={sign}
                  type="checkbox"
                  label={signLabelMap[sign] || sign}
                  checked={selectedSigns.includes(sign)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (selectedSigns.length < maxSelectableSigns) {
                        setSelectedSigns([...selectedSigns, sign]);
                      } else {
                        setError(`Можно выбрать не более ${maxSelectableSigns} знаков`);
                      }
                    } else {
                      setSelectedSigns(selectedSigns.filter(s => s !== sign));
                    }
                  }}
                  disabled={selectedSigns.length >= maxSelectableSigns && !selectedSigns.includes(sign)}
                />
              ))}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSignSelector(false)} className="fantasy-btn">
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSignConfirm} disabled={selectedSigns.length === 0} className="fantasy-btn">
            Подтвердить
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Модалка отображения результата теста */}
      {testResult && (
        <Modal show={!!testResult} onHide={() => setTestResult(null)} centered dialogClassName="fantasy-modal">
          <Modal.Header closeButton>
            <Modal.Title>Результат тестирования</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {typeof testResult.data === "string" ? (
              <pre>{testResult.data}</pre>
            ) : (
              <pre>{JSON.stringify(testResult.data.message, null, 2)}</pre>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setTestResult(null)} className="fantasy-btn">
              Закрыть
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
});

export default UpgradeTab;