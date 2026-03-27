import GetDataById from "../http/GetData";
import { useState, useContext, useEffect, useMemo } from "react";
import { Container, Spinner, Tabs, Tab, Card, Row, Col, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { dict_translator } from "../utils/Helpers";

import { attributesDescDict, skillsDescDict, talentsDescDict, abilitiesDescDict, keyMappingDict } from "../utils/descriptions";
import UpgradeTab from "../components/UpgradeTab"; // Import the separate component

const Character = observer(() => {
  const { user } = useContext(Context);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [delay, setDelay] = useState(false);
  const user_id = user?.user?.id;
  const [useBlueTheme, setUseBlueTheme] = useState(true);
  const [canUpgrade, setCanUpgrade] = useState(false); // Whether player has the special upgrade item

  // Fetch player data
  useEffect(() => {
    const fetchPlayer = async () => {
      if (!user_id) return; // Wait for user_id to be available

      try {
        setLoading(true);
        setError(null);
        const response = await GetDataById(user_id); // ✅ Pass the ID
        const data = response?.data; // Safely access data

        if (data) {
          setPlayerData(data);
          user.setPlayer(data);
          // Check if player has the special upgrade item
          setCanUpgrade(hasSpecialItem(data));
        } else {
          throw new Error("No data received");
        }
      } catch (err) {
        console.error("Failed to fetch character data:", err);
        setError(err.message || "Failed to load character data");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [user_id, user]);

  // Simulate a slight delay for a smoother UI (optional)
  useEffect(() => {
    if (playerData) {
      const timer = setTimeout(() => setDelay(true), 500);
      return () => clearTimeout(timer);
    }
  }, [playerData]);

  // Helper to check if player has the special item that enables upgrading
  const hasSpecialItem = (data) => {
    // TODO: implement actual check, e.g., data.inventory.includes("upgrade_token")
    // For now, always true for demonstration
    return true;
  };

  // Helper functions (unchanged)
  const arrToCountedDict = (arr) => {
    const countedDict = {};
    if (!Array.isArray(arr)) return countedDict;
    for (let i = 0; i < arr.length; i++) {
      countedDict[arr[i]] = (countedDict[arr[i]] || 0) + 1;
    }
    return countedDict;
  };

  const getTranslation = (value) => dict_translator[value] || value;

  const translateArray = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => dict_translator[item] || item);
  };

  const prepareDataValues = (value, key = null) => {
    if (value === null || value === undefined) return "";

    if (Array.isArray(value)) {
      if (key === 'influencing' || key === 'влияющие') {
        return translateArray(value).join(', ');
      }

      let valueString = "";
      const valueDict = arrToCountedDict(value);
      for (const [k, v] of Object.entries(valueDict)) {
        const translatedKey = getTranslation(k);
        valueString += (valueString ? ", " : "") + translatedKey + (v > 1 ? `(${v})` : "");
      }
      return valueString;
    }

    if (value && typeof value === 'object') {
      let valueString = "";
      for (const [k, v] of Object.entries(value)) {
        if (valueString) valueString += ", ";
        if (k === 'influencing' || k === 'влияющие') {
          const translated = Array.isArray(v) ? translateArray(v).join(', ') : v;
          valueString += `${getTranslation(k)}: ${translated}`;
        } else {
          valueString += `${getTranslation(k)}: ${prepareDataValues(v, k)}`;
        }
      }
      return valueString;
    }

    if (typeof value === "number") {
      return Number.isInteger(value) ? value : value.toFixed(1);
    }
    if (typeof value === "string") {
      return getTranslation(value);
    }
    if (typeof value === "boolean") {
      return value ? "Да" : "Нет";
    }
    return value;
  };

  const getModByAtt = (att, agi = false) => {
    let current = 10;
    let step = 1;
    if (agi) step = 2;
    let mod = 0;

    if (att < 10) {
      while (current - step >= att) {
        current -= step;
        step += 1;
        mod--;
      }
      if (current - att !== 0) mod--;
    } else {
      while (current + step <= att) {
        current += step;
        step += 1;
        mod++;
      }
    }
    return mod < 0 ? `${mod}` : `+${mod}`;
  };

  const prepareAttString = (att, att_inc, agi = false) => {
    const total = (att || 0) + (att_inc || 0);
    return `${total} (${getModByAtt(total, agi)}), ${att || 0} + ${att_inc || 0}`;
  };

  const calculateLevelProgress = () => {
    if (!playerData) return 0;
    const current = playerData.experience || 0;
    const next = playerData.experience_next_level || 1;
    return next > 0 ? (current / next) * 100 : 0;
  };

  const calculateHealthProgress = () => {
    if (!playerData) return 0;
    const current = playerData.current_health || 0;
    const max = playerData.max_health || 1;
    return max > 0 ? (current / max) * 100 : 0;
  };

  // Memoized section data with fallbacks
  const sectionData = useMemo(() => {
    if (!playerData) return {};

    return {
      "Атрибуты": {
        type: "Атрибуты",
        displayType: "keyValue",
        data: {
          "Восприятие 👁": prepareAttString(playerData.perception, playerData.perception_increase),
          "Сила 🏋️": prepareAttString(playerData.strength, playerData.strength_increase),
          "Ловкость 🤸": prepareAttString(playerData.agility, playerData.agility_increase, true),
          "Телосложение 🫀": prepareAttString(playerData.constitution, playerData.constitution_increase),
          "Интеллект 🎓": prepareAttString(playerData.intelligence, playerData.intelligence_increase),
          "Харизма 🤝": prepareAttString(playerData.charisma, playerData.charisma_increase),
          "Мудрость 🧙": prepareAttString(playerData.wisdom, playerData.wisdom_increase),
          "Удача 🍀": prepareAttString(playerData.luck, playerData.luck_increase),
        },
      },
      "Навыки": {
        type: "Навыки",
        displayType: "keyValue",
        data: {
          "Торговля 💰": playerData.barter,
          "Устрашение 👺": playerData.intimidation,
          "Воодушевление 🌟": playerData.persuasion,
          "Скрытность 🥷": playerData.sneak,
          "Наблюдательность 👀": playerData.observation,
          "Обнажение сути 🔍": playerData.identification,
          "Знание магии 📖": playerData.knowledge,
          "Ловушки и замки 🗝️": playerData.lockpicking,
          "Знание природы 🌿": playerData.animal_training,
          "Атлетика 🏃": playerData.athletics,
          "Каллиграфия ✍️": playerData.calligraphy,
          "Стойкость 🧱": playerData.fortitude,
          "Медицина 🩺": playerData.medicine,
          "Мечи ⚔️": playerData.swords,
          "Кинжалы 🗡️": playerData.knifes,
          "Топоры 🪓": playerData.axes,
          "Молоты 🔨": playerData.hammers,
          "Луки 🏹": playerData.bows,
          "Посохи 🪄": playerData.staffs,
          "Копья 🔱": playerData.spears,
          "Арбалеты 🎯": playerData.crossbows,
          "Метательное оружие 🔪": playerData.throwing_weapon,
          "Щиты 🛡️": playerData.shield,
        },
      },
      "Магия": {
        type: "Магия",
        displayType: "magicCards",
        data: playerData.prepared_magic || {},
      },
      "Таланты": {
        type: "Таланты",
        displayType: "cards",
        data: arrToCountedDict(playerData.talents),
      },
      "Умения": {
        type: "Умения",
        displayType: "abilityCards",
        data: playerData.abilities || {},
      },
      "Эффекты": {
        type: "Эффекты",
        displayType: "cards",
        data: playerData.temporary_effects || {},
      },
    };
  }, [playerData]);

  // Tooltip & description helpers (unchanged)
  const getDescription = (category, key) => {
    const mappedKey = keyMappingDict[key];
    const searchKey = mappedKey || key;

    let dict;
    switch (category) {
      case "Атрибуты":
        dict = attributesDescDict;
        break;
      case "Навыки":
        dict = skillsDescDict;
        break;
      case "Таланты":
        dict = talentsDescDict;
        break;
      case "Умения":
        dict = abilitiesDescDict;
        break;
      default:
        dict = {};
    }

    const reverseMapping = {};
    Object.keys(keyMappingDict).forEach(keyWithEmoji => {
      const cleanKey = keyMappingDict[keyWithEmoji];
      reverseMapping[cleanKey] = keyWithEmoji;
    });

    const possibleKeys = [
      searchKey,
      keyMappingDict[searchKey],
      reverseMapping[searchKey],
      searchKey?.replace(/[^\w\s]/g, '').trim(),
    ].filter(Boolean);

    for (const testKey of possibleKeys) {
      if (dict[testKey]) return dict[testKey];
    }
    return "Описание для этого элемента пока не добавлено";
  };

  const renderTooltip = (description) => (
    <Tooltip className="fantasy-tooltip">{description}</Tooltip>
  );

  // Render components for different sections
  const AttributeWithTooltip = ({ category, itemKey, value }) => {
    const description = getDescription(category, itemKey);
    return (
      <OverlayTrigger placement="top" delay={{ show: 250, hide: 400 }} overlay={renderTooltip(description)}>
        <div className="fantasy-attribute-item">
          <div className="attribute-content">
            <span className="fantasy-attribute-key">{itemKey}</span>
            <span className="fantasy-attribute-value">{value}</span>
          </div>
        </div>
      </OverlayTrigger>
    );
  };

  const MagicCard = ({ spellKey, spellData }) => {
    const description = getDescription("Магия", spellKey);
    return (
      <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
        <OverlayTrigger placement="top" delay={{ show: 250, hide: 400 }} overlay={renderTooltip(description)}>
          <Card className="h-100 fantasy-card">
            <Card.Header className="fantasy-card-header fantasy-card-header-magic">
              <h6 className="mb-0">{spellData?.name || getTranslation(spellKey)}</h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(spellData || {}).map(([key, value]) => {
                if (key === 'name') return null;
                return (
                  <div key={key} className="fantasy-stat-row">
                    <span className="fantasy-text-muted">{getTranslation(key)}:</span>
                    <span className="fantasy-text-bold text-muted">
                      {Array.isArray(value) && (key === 'influencing' || key === 'влияющие')
                        ? translateArray(value).join(', ')
                        : prepareDataValues(value, key)}
                    </span>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </OverlayTrigger>
      </Col>
    );
  };

  const AbilityCard = ({ abilityKey, abilityData }) => {
    const description = getDescription("Умения", abilityKey);
    return (
      <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
        <OverlayTrigger placement="top" delay={{ show: 250, hide: 400 }} overlay={renderTooltip(description)}>
          <Card className="h-100 fantasy-card">
            <Card.Header className="fantasy-card-header fantasy-card-header-info">
              <h6 className="mb-0">{abilityData?.name || getTranslation(abilityKey)}</h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(abilityData || {}).map(([key, value]) => {
                if (key === 'name') return null;
                return (
                  <div key={key} className="fantasy-stat-row">
                    <span className="fantasy-text-muted">{getTranslation(key)}:</span>
                    <span className="fantasy-text-bold text-muted">
                      {Array.isArray(value) && (key === 'influencing' || key === 'влияющие')
                        ? translateArray(value).join(', ')
                        : prepareDataValues(value, key)}
                    </span>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        </OverlayTrigger>
      </Col>
    );
  };

  const CardItem = ({ title, content, category, count = null }) => {
    const description = getDescription(category, title);
    return (
      <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
        <OverlayTrigger placement="top" delay={{ show: 250, hide: 400 }} overlay={renderTooltip(description)}>
          <Card className="h-100 fantasy-card">
            <Card.Header className={`fantasy-card-header fantasy-card-header-${getCategoryColor(category)}`}>
              <h6 className="mb-0">
                {title}
                {count !== null && <Badge className="ms-2">x{count}</Badge>}
              </h6>
            </Card.Header>
            <Card.Body>
              {typeof content === 'object' && content !== null ? (
                Object.entries(content).map(([key, value]) =>
                  key !== 'name' && (
                    <div key={key} className="fantasy-stat-row">
                      <span className="fantasy-text-muted">{getTranslation(key)}:</span>
                      <span className="fantasy-text-bold text-muted">
                        {Array.isArray(value) && (key === 'influencing' || key === 'влияющие')
                          ? translateArray(value).join(', ')
                          : prepareDataValues(value, key)}
                      </span>
                    </div>
                  )
                )
              ) : (
                <div className="text-center fantasy-text-muted">{prepareDataValues(content)}</div>
              )}
            </Card.Body>
          </Card>
        </OverlayTrigger>
      </Col>
    );
  };

  const renderSectionData = (category) => {
    const categoryData = sectionData[category];
    if (!categoryData) return null;

    switch (categoryData.displayType) {
      case 'keyValue':
        return (
          <div className="fantasy-attributes-grid">
            {Object.entries(categoryData.data).map(([key, value]) => (
              <AttributeWithTooltip key={key} category={category} itemKey={key} value={value} />
            ))}
          </div>
        );
      case 'magicCards':
        return (
          <Row>
            {Object.entries(categoryData.data).map(([key, value]) => (
              <MagicCard key={key} spellKey={key} spellData={value} />
            ))}
          </Row>
        );
      case 'abilityCards':
        return (
          <Row>
            {Object.entries(categoryData.data).map(([key, value]) => (
              <AbilityCard key={key} abilityKey={key} abilityData={value} />
            ))}
          </Row>
        );
      case 'cards':
        return (
          <Row>
            {Object.entries(categoryData.data).map(([key, value]) => (
              <CardItem
                key={key}
                title={getTranslation(key)}
                content={value}
                category={category}
                count={category === "Таланты" ? value : null}
              />
            ))}
          </Row>
        );
      default:
        return null;
    }
  };

  const renderStatCard = (title, icon, data, color = "warning") => (
    <Col md={6} lg={4} className="mb-3">
      <Card className="h-100 fantasy-card">
        <Card.Header className={`fantasy-card-header fantasy-card-header-${color}`}>
          <h6 className="fantasy-text-gold">{icon} {title}</h6>
        </Card.Header>
        <Card.Body>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="fantasy-stat-row">
              <span>{key}:</span>
              <Badge className={`fantasy-badge fantasy-badge-muted`}>{value ?? "—"}</Badge>
            </div>
          ))}
          {title === "Основная информация" && (
            <>
              <div className="progress-section">
                <div className="progress-label">
                  <div className="progress-label-left">
                    <span className="health-icon">❤️</span>
                    <span>Здоровье</span>
                  </div>
                  <div className="progress-label-right">{Math.round(calculateHealthProgress())}%</div>
                </div>
                <div className="health-progress">
                  <div
                    className={`health-fill ${calculateHealthProgress() < 30 ? 'low-health' : ''}`}
                    style={{ width: `${calculateHealthProgress()}%` }}
                  />
                  <div className="progress-text">
                    {playerData?.current_health ?? 0} / {playerData?.max_health ?? 1}
                  </div>
                </div>
              </div>
              <div className="progress-section">
                <div className="progress-label">
                  <div className="progress-label-left">
                    <span className={`experience-icon ${useBlueTheme ? 'blue' : ''}`}>
                      {useBlueTheme ? '🔷' : '📈'}
                    </span>
                    <span>Опыт</span>
                  </div>
                  <div className="progress-label-right">{Math.round(calculateLevelProgress())}%</div>
                </div>
                <div className="experience-progress">
                  <div
                    className={`experience-fill ${useBlueTheme ? 'blue-theme' : ''}`}
                    style={{ width: `${calculateLevelProgress()}%` }}
                  />
                  <div className="progress-text">
                    {playerData?.experience ?? 0} / {playerData?.experience_next_level ?? 1}
                  </div>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Col>
  );

  // Loading and error states
  if (loading || !delay) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="secondary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="fantasy-text-gold">Загрузка данных персонажа...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <p className="text-danger">Ошибка загрузки данных: {error}</p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <p className="fantasy-text-gold">Данные персонажа не найдены</p>
        </div>
      </div>
    );
  }

  // Main render – now playerData is guaranteed to exist
  return (
    <div className="character-container">
      <Tabs defaultActiveKey="Параметры" transition={false} id="playerInfo" className="fantasy-tabs mb-3" justify>
        <Tab eventKey="Параметры" title="📊 Параметры">
          <Container fluid>
            <Row className="g-3">
              {renderStatCard("Основная информация", "👤", {
                "Имя": playerData.name,
                "Раса": playerData.Race,
                "Класс": playerData.Character_class,
                "Очки навыков": playerData.points_per_level,
                "Скидка": `${playerData.discount}%`,
                "Уровень": playerData.level || 1,
              }, "primary")}

              {renderStatCard("Особенности", "⚡", {
                "Кровожадность": playerData.bloodlust || 0,
                "Ярость": playerData.rage || 0,
                "Регенерация": playerData.regeneration || 0,
                "Воскрешение": playerData.ressurect || 0,
                "Доп. очки передвижения": playerData.move_OP,
                "Зелья за бой": playerData.consumable_items,
                "Модификатор скрытности": playerData.sneak_check,
                "Очки действия 🏃": playerData.action_points,
                "Инициатива ⏳": playerData.initiative,
              }, "success")}

              {renderStatCard("Атака", "🗡️", {
                "Ближняя атака": playerData.melee_attack,
                "Ближний урон": playerData.melee_damage,
                "Дальняя атака": playerData.range_attack,
                "Дальний урон": playerData.range_damage,
                "Магическая атака": playerData.magic_attack || 0,
                "Магический урон": playerData.magic_damage || 0,
                "Атака духа": playerData.pray_attack || 0,
                "Урон духа": playerData.pray_damage || 0,
                "Шанс критического удара": `${playerData.crit_chance}%`,
              }, "warning")}

              {renderStatCard("Физическая защита", "🛡️", {
                "Класс защиты": playerData.current_defence,
                "От колющего": playerData.piercing_deduction,
                "От дробящего": playerData.bludge_deduction,
                "От рубящего": playerData.slashing_deduction,
              }, "info")}

              {renderStatCard("Магическая защита", "🪄", {
                "Магическое сопротивление": playerData.magic_resist,
                "Огонь": playerData.fire_deduction,
                "Лёд": playerData.ice_deduction,
                "Молния": playerData.electric_deduction,
                "Тьма": playerData.dark_deduction,
                "Свет": playerData.light_deduction,
                "Жизнь": playerData.life_deduction,
                "Звук": playerData.sound_deduction,
                "Воздух": playerData.wind_deduction,
                "Смерть": playerData.death_deduction,
              }, "magic")}
            </Row>
          </Container>
        </Tab>

        {["Атрибуты", "Навыки", "Магия", "Таланты", "Умения", "Эффекты"].map((category) => (
          <Tab key={category} eventKey={category} title={getTabTitle(category)}>
            <Container fluid>
              <Row>
                <Col>
                  <Card className="fantasy-card">
                    <Card.Header className="fantasy-card-header">
                      <h5 className="fantasy-text-gold">{category}</h5>
                    </Card.Header>
                    <Card.Body>{renderSectionData(category)}</Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </Tab>
        ))}

        {/* New Upgrade Tab */}
        <Tab eventKey="Прокачка" title="📈 Прокачка">
          <UpgradeTab
            playerData={playerData}
            setPlayerData={setPlayerData}
            canUpgrade={canUpgrade}
          />
        </Tab>
      </Tabs>
    </div>
  );
});

// Helper functions
const getTabTitle = (category) => {
  const icons = {
    "Параметры": "📊",
    "Атрибуты": "⭐",
    "Навыки": "🎯",
    "Магия": "🔮",
    "Таланты": "💫",
    "Умения": "⚡",
    "Эффекты": "🕒",
    "Прокачка": "📈", // Added for the new tab
  };
  return `${icons[category]} ${category}`;
};

const getCategoryColor = (category) => {
  const colors = {
    "Параметры": "primary",
    "Атрибуты": "primary",
    "Навыки": "success",
    "Магия": "magic",
    "Таланты": "warning",
    "Умения": "info",
    "Эффекты": "secondary",
  };
  return colors[category] || "primary";
};

export default Character;