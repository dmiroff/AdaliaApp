import { useState, useContext, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Container, Row, Col, Card, Button, Modal, Form, InputGroup, Alert, ListGroup } from "react-bootstrap";
import { Context } from "../index";
import {
  CommitUpgrades,
  TestAttack,
  TestSpell,
} from "../http/apiClient";
import { fetchBirzhaRate } from "../http/birzha";

// Формула стоимости навыка (калька с бэкенда)
const computeSkillCost = (skillValue) => {
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

// Суммарная стоимость повышения навыка на несколько уровней
const calculateTotalSkillCost = (currentLevel, levelsToAdd) => {
  let total = 0;
  for (let i = 0; i < levelsToAdd; i++) {
    total += computeSkillCost(currentLevel + i);
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

const TALENTS = [
  { key: "MasterOfBlades", label: "Мастер клинка" },
  { key: "IronWill", label: "Железная воля" },
  { key: "QuickReflexes", label: "Быстрые рефлексы" },
  { key: "SpellCraft", label: "Изучение магии" },
  { key: "AnimalFriend", label: "Друг животных" },
  { key: "Merchant", label: "Торговец" },
];

const UpgradeTab = observer(({ playerData, setPlayerData, canUpgrade }) => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [birzhaRate, setBirzhaRate] = useState(null);
  
  // Текущие данные игрока (оригинал и временная копия для ресурсов)
  const [originalPlayerData, setOriginalPlayerData] = useState(null);
  const [tempPlayerData, setTempPlayerData] = useState(null);
  
  // Накопленные изменения
  const [changes, setChanges] = useState({
    attributes: {},    // { agility: 2, strength: 1 }
    skills: {},        // { swords: { amount: 3, currency: "money" } }
    talents: []        // ["MasterOfBlades"]
  });
  
  // Состояние выбора для добавления изменения
  const [selectedType, setSelectedType] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [amount, setAmount] = useState(1);
  // Валюта оплаты навыка: 'points' | 'money' | 'daleons'
  const [paymentMethod, setPaymentMethod] = useState('points');
  
  // Модалки
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertAmount, setConvertAmount] = useState(1);
  const [showSpellSelector, setShowSpellSelector] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Загрузка курса биржи
  useEffect(() => {
    loadBirzhaRate();
  }, []);
  
  // Инициализация данных игрока
  useEffect(() => {
    if (playerData) {
      setOriginalPlayerData(playerData);
      setTempPlayerData(JSON.parse(JSON.stringify(playerData)));
      // Сбрасываем накопленные изменения при смене игрока
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
  
  // Сброс накопленных изменений
  const resetChanges = () => {
    setChanges({ attributes: {}, skills: {}, talents: [] });
    setSelectedType(null);
    setSelectedKey(null);
    setAmount(1);
    setPaymentMethod('points');
  };
  
  // Вспомогательная функция для расчёта стоимости в далеонах
  const calculateDaleonsNeeded = (goldCost) => {
    if (!birzhaRate) return Infinity;
    const sellRate = birzhaRate.sell_rate; // золота за 100 далеонов
    return Math.ceil(goldCost * 100 / sellRate);
  };
  
  // Подсчёт общей стоимости изменений (золото, очки, далеоны)
  const getTotalCost = () => {
    let totalMoney = 0;
    let totalPoints = 0;
    let totalDaleons = 0;
    
    // Атрибуты требуют очки атрибутов
    totalPoints += Object.values(changes.attributes).reduce((a, b) => a + b, 0);
    
    // Навыки
    for (const [skill, data] of Object.entries(changes.skills)) {
      const currentLevel = (tempPlayerData?.[skill] || 0);
      const addedLevels = data.amount;
      const goldCost = calculateTotalSkillCost(currentLevel, addedLevels);
      if (data.currency === "money") {
        totalMoney += goldCost;
      } else if (data.currency === "points") {
        totalPoints += addedLevels;
      } else if (data.currency === "daleons") {
        totalDaleons += calculateDaleonsNeeded(goldCost);
      }
    }
    
    // Таланты (каждый талант стоит 1 очко таланта)
    totalPoints += changes.talents.length;
    
    return { money: totalMoney, points: totalPoints, daleons: totalDaleons };
  };
  
  // Проверка возможности добавления изменения (на основе текущих ресурсов в tempPlayerData)
  const canAddChange = () => {
    if (!selectedKey || !tempPlayerData) return false;
    if (!canUpgrade) return false;
    
    if (selectedType === "attribute") {
      const currentPoints = tempPlayerData.free_attribute_points || 0;
      const alreadyAdded = changes.attributes[selectedKey] || 0;
      return currentPoints - alreadyAdded >= amount;
    } else if (selectedType === "skill") {
      const currentLevel = tempPlayerData[selectedKey] || 0;
      const addedLevels = (changes.skills[selectedKey]?.amount || 0);
      const newLevel = currentLevel + addedLevels;
      const goldCost = calculateTotalSkillCost(newLevel, amount);
      const remainingPoints = (tempPlayerData.free_skill_points || 0) - (changes.skills[selectedKey]?.amount || 0);
      
      if (paymentMethod === "points") {
        return remainingPoints >= amount;
      } else if (paymentMethod === "money") {
        const currentMoney = tempPlayerData.money || 0;
        const total = getTotalCost();
        // Проверяем, хватит ли золота с учётом уже добавленных изменений
        return currentMoney >= total.money + goldCost;
      } else if (paymentMethod === "daleons") {
        if (!birzhaRate) return false;
        const daleonsNeeded = calculateDaleonsNeeded(goldCost);
        const currentDaleons = tempPlayerData.daleons || 0;
        const total = getTotalCost();
        // Проверяем, хватит ли далеонов с учётом уже добавленных изменений
        return currentDaleons >= total.daleons + daleonsNeeded;
      }
    } else if (selectedType === "talent") {
      const alreadyHas = (tempPlayerData.talents || []).includes(selectedKey);
      const alreadyAdded = changes.talents.includes(selectedKey);
      if (alreadyHas || alreadyAdded) return false;
      const currentPoints = tempPlayerData.free_talent_points || 0;
      const addedCount = changes.talents.length;
      return currentPoints - addedCount >= 1;
    }
    return false;
  };
  
  // Добавление изменения в список
  const addChange = () => {
    if (!canAddChange()) return;
    
    const newChanges = JSON.parse(JSON.stringify(changes));
    
    if (selectedType === "attribute") {
      const current = newChanges.attributes[selectedKey] || 0;
      newChanges.attributes[selectedKey] = current + amount;
    } else if (selectedType === "skill") {
      const current = newChanges.skills[selectedKey] || { amount: 0, currency: paymentMethod };
      // Если способ оплаты не совпадает с предыдущим для этого навыка, запрещаем
      if (current.amount > 0 && current.currency !== paymentMethod) {
        setError("Нельзя смешивать способы оплаты для одного навыка");
        return;
      }
      newChanges.skills[selectedKey] = {
        amount: (current.amount || 0) + amount,
        currency: paymentMethod
      };
    } else if (selectedType === "talent") {
      if (!newChanges.talents.includes(selectedKey)) {
        newChanges.talents.push(selectedKey);
      }
    }
    
    setChanges(newChanges);
    // Сбрасываем выбор, чтобы можно было добавить следующее
    setSelectedKey(null);
    setAmount(1);
    setError("");
  };
  
  // Удаление изменения
  const removeChange = (type, key) => {
    const newChanges = JSON.parse(JSON.stringify(changes));
    if (type === "attribute") {
      delete newChanges.attributes[key];
    } else if (type === "skill") {
      delete newChanges.skills[key];
    } else if (type === "talent") {
      newChanges.talents = newChanges.talents.filter(t => t !== key);
    }
    setChanges(newChanges);
  };
  
  // Проверка, хватает ли ресурсов с учётом накопленных изменений
  const canCommit = () => {
    if (!tempPlayerData) return false;
    const total = getTotalCost();
    const currentMoney = tempPlayerData.money || 0;
    const currentPoints = tempPlayerData.free_skill_points || 0;
    const currentAttrPoints = tempPlayerData.free_attribute_points || 0;
    const currentTalentPoints = tempPlayerData.free_talent_points || 0;
    const currentDaleons = tempPlayerData.daleons || 0;
    
    // Атрибуты используют отдельные очки
    const attrUsed = Object.values(changes.attributes).reduce((a, b) => a + b, 0);
    if (attrUsed > currentAttrPoints) return false;
    
    // Таланты используют очки талантов
    if (changes.talents.length > currentTalentPoints) return false;
    
    // Навыки используют очки навыков, золото или далеоны
    if (total.money > currentMoney) return false;
    if (total.points > currentPoints) return false;
    if (total.daleons > currentDaleons) return false;
    
    return true;
  };
  
  // Отправка изменений на сервер
  const handleCommit = async () => {
    if (!canCommit()) {
      setError("Недостаточно ресурсов для применения изменений");
      return;
    }
    
    setLoading(true);
    setError("");
    
    // Формируем объект в формате, ожидаемом бэкендом
    const payload = {
      attributes: Object.entries(changes.attributes).map(([attr, amount]) => ({ attribute: attr, amount })),
      skills: Object.entries(changes.skills).map(([skill, data]) => ({ skill, amount: data.amount, currency: data.currency })),
      talents: changes.talents.map(talent => ({ talent }))
    };
    
    try {
      const result = await CommitUpgrades(payload);
      if (result.status === 200) {
        // Обновляем данные игрока локально
        const newPlayerData = JSON.parse(JSON.stringify(tempPlayerData));
        const total = getTotalCost();
        newPlayerData.money -= total.money;
        newPlayerData.free_skill_points -= total.points;
        newPlayerData.free_attribute_points -= Object.values(changes.attributes).reduce((a, b) => a + b, 0);
        newPlayerData.free_talent_points -= changes.talents.length;
        newPlayerData.daleons -= total.daleons;
        // Увеличиваем атрибуты и навыки
        for (const [attr, amount] of Object.entries(changes.attributes)) {
          newPlayerData[attr] = (newPlayerData[attr] || 0) + amount;
        }
        for (const [skill, data] of Object.entries(changes.skills)) {
          newPlayerData[skill] = (newPlayerData[skill] || 0) + data.amount;
        }
        newPlayerData.talents = [...(newPlayerData.talents || []), ...changes.talents];
        
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
  
  // Конвертация далеонов в золото (отдельная операция – не используется в прокачке, но оставлена)
  const handleConvert = async () => {
    if (convertAmount <= 0) return;
    if (!birzhaRate) {
      setError("Курс биржи не загружен");
      return;
    }
    const goldPerDaleon = birzhaRate.sell_rate / 100;
    const goldToReceive = Math.floor(convertAmount * goldPerDaleon);
    if ((tempPlayerData.daleons || 0) < convertAmount) {
      setError("Недостаточно далеонов");
      return;
    }
    
    setLoading(true);
    try {
      const result = await convertDaleonsToGold(convertAmount);
      if (result.status === 200) {
        const newData = JSON.parse(JSON.stringify(tempPlayerData));
        newData.daleons -= convertAmount;
        newData.money += goldToReceive;
        setTempPlayerData(newData);
        setShowConvertModal(false);
        setConvertAmount(1);
        setSuccess(`Получено ${goldToReceive} золота`);
        setTimeout(() => setSuccess(""), 3000);
        await loadBirzhaRate(); // обновить курс после операции
      } else {
        setError(result.message || "Ошибка конвертации");
      }
    } catch (err) {
      console.error(err);
      setError("Ошибка сети при конвертации");
    } finally {
      setLoading(false);
    }
  };
  
  // Тест атаки
  const handleTestAttack = async () => {
    if (!tempPlayerData) return;
    setLoading(true);
    try {
      const result = await TestAttack(tempPlayerData);
      if (result.status === 200) {
        setTestResult({
          type: "attack",
          data: result.data
        });
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
  
  // Тест заклинания
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
        setTestResult({
          type: "spell",
          data: result.data
        });
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
  
  // Получение списка заклинаний (из prepared_magic или abilities)
  const getSpellsList = () => {
    const spells = [];
    if (tempPlayerData?.prepared_magic) {
      Object.keys(tempPlayerData.prepared_magic).forEach(key => {
        spells.push({ id: key, name: tempPlayerData.prepared_magic[key]?.name || key });
      });
    }
    if (tempPlayerData?.abilities) {
      Object.keys(tempPlayerData.abilities).forEach(key => {
        spells.push({ id: key, name: tempPlayerData.abilities[key]?.name || key });
      });
    }
    return spells;
  };
  
  // Вспомогательные рендеры для выбора изменения
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
        <Button variant="primary" onClick={addChange} disabled={!canAddChange()}>
          Добавить
        </Button>
      </div>
    </div>
  );
  
  const renderSkillControls = () => {
    const currentLevel = tempPlayerData?.[selectedKey] || 0;
    const addedLevels = changes.skills[selectedKey]?.amount || 0;
    const newLevel = currentLevel + addedLevels;
    const goldCost = calculateTotalSkillCost(newLevel, amount);
    const pointsNeeded = amount;
    const remainingPoints = (tempPlayerData?.free_skill_points || 0) - (changes.skills[selectedKey]?.amount || 0);
    const daleonsNeeded = birzhaRate ? calculateDaleonsNeeded(goldCost) : Infinity;
    const total = getTotalCost(); // для проверки доступности ресурсов с учётом уже добавленных изменений
    
    return (
      <div className="mt-3">
        <div className="mb-2">
          <Form.Check
            type="radio"
            label={`За очки навыков (доступно: ${remainingPoints})`}
            checked={paymentMethod === 'points'}
            onChange={() => setPaymentMethod('points')}
            disabled={pointsNeeded > remainingPoints}
          />
          <Form.Check
            type="radio"
            label={`За золото (стоимость: ${goldCost} 🌕, доступно: ${tempPlayerData?.money - total.money})`}
            checked={paymentMethod === 'money'}
            onChange={() => setPaymentMethod('money')}
            disabled={goldCost > (tempPlayerData?.money - total.money)}
          />
          {birzhaRate && (
            <Form.Check
              type="radio"
              label={`За далеоны (стоимость: ${daleonsNeeded} 💎, доступно: ${tempPlayerData?.daleons - total.daleons})`}
              checked={paymentMethod === 'daleons'}
              onChange={() => setPaymentMethod('daleons')}
              disabled={daleonsNeeded > (tempPlayerData?.daleons - total.daleons)}
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
                paymentMethod === 'points' ? remainingPoints :
                paymentMethod === 'money' ? Math.floor((tempPlayerData?.money - total.money) / computeSkillCost(newLevel)) :
                paymentMethod === 'daleons' ? Math.floor((tempPlayerData?.daleons - total.daleons) / (daleonsNeeded / amount)) :
                0
              }
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <InputGroup.Text>уровней</InputGroup.Text>
          </InputGroup>
        </Form.Group>
        <div className="d-flex justify-content-end">
          <Button variant="primary" onClick={addChange} disabled={!canAddChange()}>
            Добавить
          </Button>
        </div>
      </div>
    );
  };
  
  const renderTalentControls = () => (
    <div className="mt-3">
      <div className="d-flex justify-content-end">
        <Button variant="primary" onClick={addChange} disabled={!canAddChange()}>
          Изучить талант
        </Button>
      </div>
    </div>
  );
  
  // Отображение накопленных изменений
  const renderPendingChanges = () => {
    const total = getTotalCost();
    return (
      <Card className="fantasy-card mb-3">
        <Card.Header className="fantasy-card-header">
          <h6 className="mb-0">Накопленные изменения</h6>
        </Card.Header>
        <Card.Body>
          {Object.keys(changes.attributes).length === 0 &&
           Object.keys(changes.skills).length === 0 &&
           changes.talents.length === 0 ? (
            <p className="text-muted">Нет изменений</p>
          ) : (
            <>
              <ListGroup variant="flush" className="mb-3">
                {Object.entries(changes.attributes).map(([attr, amount]) => (
                  <ListGroup.Item key={attr} className="d-flex justify-content-between align-items-center">
                    <span>{ATTRIBUTES.find(a => a.key === attr)?.label} +{amount}</span>
                    <Button variant="outline-danger" size="sm" onClick={() => removeChange("attribute", attr)}>
                      Удалить
                    </Button>
                  </ListGroup.Item>
                ))}
                {Object.entries(changes.skills).map(([skill, data]) => {
                  const currencyLabel = data.currency === "money" ? "золото" : (data.currency === "daleons" ? "далеоны" : "очки");
                  return (
                    <ListGroup.Item key={skill} className="d-flex justify-content-between align-items-center">
                      <span>{SKILLS.find(s => s.key === skill)?.label} +{data.amount} ({currencyLabel})</span>
                      <Button variant="outline-danger" size="sm" onClick={() => removeChange("skill", skill)}>
                        Удалить
                      </Button>
                    </ListGroup.Item>
                  );
                })}
                {changes.talents.map(talent => (
                  <ListGroup.Item key={talent} className="d-flex justify-content-between align-items-center">
                    <span>{TALENTS.find(t => t.key === talent)?.label}</span>
                    <Button variant="outline-danger" size="sm" onClick={() => removeChange("talent", talent)}>
                      Удалить
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <div className="mt-2">
                <div>💰 Золота потребуется: {total.money}</div>
                <div>💎 Далеонов потребуется: {total.daleons}</div>
                <div>📚 Очков навыков потребуется: {total.points}</div>
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
  
  return (
    <Container fluid>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}
      
      <Row>
        <Col md={4}>
          {/* Блок ресурсов */}
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
              <Button
                variant="outline-info"
                size="sm"
                className="mt-3"
                onClick={() => setShowConvertModal(true)}
                disabled={loading}
              >
                Конвертировать далеоны в золото
              </Button>
            </Card.Body>
          </Card>
          
          {/* Список накопленных изменений */}
          {renderPendingChanges()}
        </Col>
        
        <Col md={8}>
          <Card className="fantasy-card">
            <Card.Header className="fantasy-card-header">
              <h6 className="mb-0">Выберите категорию для прокачки</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-2 mb-3">
                <Button
                  variant={selectedType === "attribute" ? "primary" : "outline-secondary"}
                  onClick={() => { setSelectedType("attribute"); setSelectedKey(null); setError(""); }}
                >
                  Атрибуты
                </Button>
                <Button
                  variant={selectedType === "skill" ? "primary" : "outline-secondary"}
                  onClick={() => { setSelectedType("skill"); setSelectedKey(null); setError(""); }}
                >
                  Навыки
                </Button>
                <Button
                  variant={selectedType === "talent" ? "primary" : "outline-secondary"}
                  onClick={() => { setSelectedType("talent"); setSelectedKey(null); setError(""); }}
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
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {TALENTS.map(talent => (
                      <Button
                        key={talent.key}
                        variant={selectedKey === talent.key ? "success" : "light"}
                        onClick={() => setSelectedKey(talent.key)}
                      >
                        {talent.label}
                      </Button>
                    ))}
                  </div>
                  {selectedKey && renderTalentControls()}
                </>
              )}
              
              <hr />
              <div className="d-flex justify-content-between mt-3">
                <Button variant="outline-secondary" onClick={resetChanges} disabled={loading}>
                  Сбросить всё
                </Button>
                <div>
                  <Button
                    variant="outline-info"
                    onClick={handleTestAttack}
                    disabled={loading}
                    className="me-2"
                  >
                    Тест атаки
                  </Button>
                  <Button
                    variant="outline-info"
                    onClick={() => setShowSpellSelector(true)}
                    disabled={loading}
                    className="me-2"
                  >
                    Тест заклинания
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!canUpgrade || loading || (Object.keys(changes.attributes).length === 0 && Object.keys(changes.skills).length === 0 && changes.talents.length === 0)}
                  >
                    Применить
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Модалка подтверждения */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение улучшений</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Вы уверены, что хотите применить все накопленные изменения?</p>
          <p>Изменения нельзя будет отменить без специального предмета.</p>
          <div className="mt-2">
            <strong>Сводка:</strong>
            <ul>
              {Object.keys(changes.attributes).length > 0 && <li>Атрибуты: +{Object.values(changes.attributes).join(", ")}</li>}
              {Object.keys(changes.skills).length > 0 && <li>Навыки: {Object.entries(changes.skills).map(([k, v]) => `${SKILLS.find(s => s.key === k)?.label}+${v.amount} (${v.currency === 'money' ? 'золото' : (v.currency === 'daleons' ? 'далеоны' : 'очки')})`).join(", ")}</li>}
              {changes.talents.length > 0 && <li>Таланты: {changes.talents.map(t => TALENTS.find(tl => tl.key === t)?.label).join(", ")}</li>}
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Отмена</Button>
          <Button variant="primary" onClick={handleCommit} disabled={loading}>
            {loading ? "Применяю..." : "Применить"}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Модалка конвертации далеонов */}
      <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Конвертация далеонов в золото</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {birzhaRate ? (
            <>
              <p>Текущий курс продажи: <strong>{birzhaRate.sell_rate} 🌕</strong> за 100 💎</p>
              <Form.Group>
                <Form.Label>Количество далеонов:</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    min={1}
                    max={tempPlayerData.daleons || 0}
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <InputGroup.Text>💎</InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <p className="mt-2">
                Вы получите: <strong>{Math.floor(convertAmount * (birzhaRate.sell_rate / 100))} 🌕</strong>
              </p>
              <p className="text-muted">Доступно далеонов: {tempPlayerData.daleons || 0}</p>
            </>
          ) : (
            <p>Загрузка курса...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConvertModal(false)}>Отмена</Button>
          <Button
            variant="primary"
            onClick={handleConvert}
            disabled={loading || !birzhaRate || convertAmount <= 0 || convertAmount > (tempPlayerData.daleons || 0)}
          >
            {loading ? "Конвертирую..." : "Конвертировать"}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Модалка выбора заклинания */}
      <Modal show={showSpellSelector} onHide={() => setShowSpellSelector(false)} centered>
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
          <Button variant="secondary" onClick={() => setShowSpellSelector(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={() => { setShowSpellSelector(false); handleTestSpell(); }}>
            Тестировать
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Модалка отображения результата теста */}
      {testResult && (
        <Modal show={!!testResult} onHide={() => setTestResult(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Результат тестирования</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setTestResult(null)}>
              Закрыть
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
});

export default UpgradeTab;