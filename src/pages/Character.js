import GetDataById from "../http/GetData";
import { useState, useContext, useEffect, useMemo } from "react";
import { Container, Spinner, Tabs, Tab, Card, Row, Col, Badge, ProgressBar, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { dict_translator } from "../utils/Helpers";

// Импортируем словари с описаниями
import { attributesDescDict, skillsDescDict, talentsDescDict, abilitiesDescDict, keyMappingDict } from "../utils/descriptions";

const Character = observer(() => {
  const { user } = useContext(Context);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const user_id = user.user.id;
  const [useBlueTheme, setUseBlueTheme] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      const playerData = await GetDataById();
      setPlayerData(playerData.data);
      user.setPlayer(playerData.data);
      setLoading(false);
    };

    fetchPlayer(user_id);
  }, [user_id, user]);

  useEffect(() => {
    if (playerData) {
      setTimeout(() => {
        setDelay(true);
      }, 2000);
    }
  }, [playerData]);
 
  const arrToCountedDict = (arr) => {
    const countedDict = {}
    for (let i = 0; i < arr.length; i++) {
      if (!countedDict[arr[i]]) {
        countedDict[arr[i]] = 1
      } else {
        countedDict[arr[i]]++
      }
    }
    return countedDict
  }

  const getTranslation = (value) => {
    const translatedValue = dict_translator[value] ? dict_translator[value] : value;
    return translatedValue
  }

  // Функция для перевода массива с английского на русский
  const translateArray = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => dict_translator[item] || item);
  }

  const prepareDataValues = (value, key = null) => {
    if (value.constructor === Array) {
      // Если это массив "influencing", переводим элементы
      if (key === 'influencing' || key === 'влияющие') {
        const translatedArray = translateArray(value);
        return translatedArray.join(', ');
      }
      
      let valueString = ""
      let valueDict = arrToCountedDict(value)
      for (const [key, value] of Object.entries(valueDict)) {
        let _key = getTranslation(key)
        if (valueString !== "") {
          valueString = valueString + ", "
        }
        valueString = valueString + _key 
        if (value > 1) {
          valueString = valueString + "(" + value + ")"
        }
      }
      return valueString
    }

    if (value.constructor === Object) {
      let valueString = ""
      for (const [k, v] of Object.entries(value)) {
        if (valueString !== "") {
          valueString = valueString + ", "
        }
        // Для массива influencing внутри объекта
        if (k === 'influencing' || k === 'влияющие') {
          if (Array.isArray(v)) {
            const translated = translateArray(v);
            valueString = valueString + getTranslation(k) + ": " + translated.join(', ')
            continue;
          }
        }
        valueString = valueString + getTranslation(k) + ": " + prepareDataValues(v, k)
      }
      return valueString
    }

    if (typeof(value) == "number") {
      if (Number.isInteger(value)) {
        return value
      }
      return value.toFixed(1)
    } 
    if (typeof(value) == "string") {
      return getTranslation(value)
    }
    if (typeof(value) == "boolean") {
      return value ? "Да" : "Нет"
    }
    return value
  }

  const characterDataToShow = (data) => {
    const dataDict = {}
    for (const [data_key, data_values] of Object.entries(data)) {
      let data_value = ""
      for (const [key, value] of Object.entries(data_values)) {
        if (key === "name") {
          continue
        }
        if (key in dict_translator) {
          if (data_value !== "") {
            data_value = data_value + ", "
          }
          data_value = data_value + dict_translator[key] + ": " + prepareDataValues(value, key)
        }
      }
      dataDict[data_key] = data_value
    };
    return dataDict
  }

  const getModByAtt = (att, agi = false) => {
    let current = 10;
    let step = 1;
    if (agi) {
      step = 2
    }
    let mod = 0;

    if (att < 10) {
      while (current - step >= att) {
        current -= step
        step += 1
        mod--
      }
      if (current - att !== 0) {
        mod--
      }
    } else {
        while (current + step <= att) {
          current += step;
          step += 1;
          mod++;
        }
    }

    return mod < 0 ? `${mod}` : `+${mod}`
  }

  const prepareAttString = (att, att_inc, agi = false) => {
    return (
      `${att + att_inc} (${getModByAtt(att + att_inc, agi)}), ${att} + ${att_inc}`
    )
  }

  // Мемоизируем данные для оптимизации
  const sectionData = useMemo(() => {
    if (!playerData) return {};

    const data = {
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
        data: arrToCountedDict(playerData.talents || []),
      },
      "Умения": {
        type: "Умения",
        displayType: "abilityCards",
        data: playerData.abilities || {}
      },
      "Временные эффекты": {
        type: "Временные эффекты",
        displayType: "cards",
        data: playerData.temporary_effects || {}
      }
    };

    return data;
  }, [playerData]);

  // Функция для получения описания по категории и ключу
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
      searchKey.replace(/[^\w\s]/g, '').trim()
    ];
    
    const uniqueKeys = [...new Set(possibleKeys.filter(Boolean))];
    
    for (const testKey of uniqueKeys) {
      if (dict[testKey]) {
        return dict[testKey];
      }
    }
    
    return "Описание для этого элемента пока не добавлено";
  };

  const calculateLevelProgress = () => {
    if (!playerData) return 0;
    const current = playerData.experience;
    const next = playerData.experience_next_level;
    return next > 0 ? (current / next) * 100 : 0;
  };

  const calculateHealthProgress = () => {
    if (!playerData) return 0;
    const current = playerData.current_health || 0;
    const max = playerData.max_health || 1;
    return max > 0 ? (current / max) * 100 : 0;
  };

  const renderTooltip = (description) => (
    <Tooltip className="fantasy-tooltip">
      {description}
    </Tooltip>
  );

  if (!delay) {
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="text-center">
          <Spinner animation="border" variant="secondary" />
          <p className="mt-2 text-muted">Загрузка...</p>
        </div>
      </div>
    );
  }

  const renderStatCard = (title, icon, data, color = "warning") => (
    <Col md={6} lg={4} className="mb-3">
      <Card className="h-100 fantasy-card">
        <Card.Header className={`fantasy-card-header fantasy-card-header-${color}`}>
          <h6 className="mb-0">{icon} {title}</h6>
        </Card.Header>
        <Card.Body>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="fantasy-stat-row">
              <span>{key}:</span>
              <Badge className={`fantasy-badge fantasy-badge-muted`}>
                {value}
              </Badge>
            </div>
          ))}
          {title === "Основная информация" && (
              <div className="progress-section">
                <div className="progress-label">
                  <div className="progress-label-left">
                    <span className="health-icon">❤️</span>
                    <span>Здоровье</span>
                  </div>
                  <div className="progress-label-right">
                    {Math.round(calculateHealthProgress())}%
                  </div>
                </div>
                <div className="health-progress">
                  <div 
                    className={`health-fill ${calculateHealthProgress() < 30 ? 'low-health' : ''}`}
                    style={{ width: `${calculateHealthProgress()}%` }}
                  />
                  <div className="progress-text">
                    {playerData.current_health} / {playerData.max_health}
                  </div>
                </div>
              </div>
          )}

          {title === "Основная информация" && (
          <div className="progress-section">
          <div className="progress-label">
            <div className="progress-label-left">
              <span className={`experience-icon ${useBlueTheme ? 'blue' : ''}`}>
                {useBlueTheme ? '🔷' : '📈'}
              </span>
              <span>Опыт</span>
            </div>
            <div className="progress-label-right">
              {Math.round(calculateLevelProgress())}%
            </div>
          </div>
          <div className="experience-progress">
            <div 
              className={`experience-fill ${useBlueTheme ? 'blue-theme' : ''}`}
              style={{ width: `${calculateLevelProgress()}%` }}
            />
            <div className="progress-text">
              {playerData.experience} / {playerData.experience_next_level}
            </div>
          </div>
        </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );

  const getBadgeType = (key, value) => {
    if (typeof value === 'number') {
      if (key.includes('атака') || key.includes('урон') || key.includes('критическ')) return 'combat';
      if (key.includes('защита') || key.includes('сопротивление')) return 'primary';
      if (key.includes('шанс') || key.includes('процент')) return 'crit';
    }
    
    const combatKeys = ['атака', 'урон', 'критическ', 'бой', 'оружие'];
    const magicKeys = ['маги', 'регенерац', 'воскрешен', 'элемент'];
    const physicalKeys = ['защита', 'сопротивлен', 'броня', 'щит'];
    
    if (combatKeys.some(k => key.toLowerCase().includes(k))) return 'combat';
    if (magicKeys.some(k => key.toLowerCase().includes(k))) return 'magic';
    if (physicalKeys.some(k => key.toLowerCase().includes(k))) return 'physical';
    
    return 'primary';
  };

  // Компонент для отображения элемента с тултипом (атрибуты и навыки)
  const AttributeWithTooltip = ({ category, itemKey, value }) => {
    const description = getDescription(category, itemKey);
    
    return (
      <OverlayTrigger
        placement="top"
        delay={{ show: 250, hide: 400 }}
        overlay={renderTooltip(description)}
      >
        <div className="fantasy-attribute-item">
          <div className="attribute-content">
            <span className="fantasy-attribute-key">{itemKey}</span>
            <span className="fantasy-attribute-value">{value}</span>
          </div>
        </div>
      </OverlayTrigger>
    );
  };

  // Компонент для отображения карточек магии
  const MagicCard = ({ spellKey, spellData }) => {
    const description = getDescription("Магия", spellKey);
    
    return (
      <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={renderTooltip(description)}
        >
          <Card className="h-100 fantasy-card">
            <Card.Header className="fantasy-card-header fantasy-card-header-magic">
              <h6 className="mb-0">{spellData.name || getTranslation(spellKey)}</h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(spellData).map(([key, value]) => {
                if (key === 'name') return null;
                
                return (
                  <div key={key} className="fantasy-stat-row">
                    <span className="fantasy-text-muted">{getTranslation(key)}:</span>
                    <span className="fantasy-text-bold">
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

  // Компонент для отображения карточек умений
  const AbilityCard = ({ abilityKey, abilityData }) => {
    const description = getDescription("Умения", abilityKey);
    
    return (
      <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={renderTooltip(description)}
        >
          <Card className="h-100 fantasy-card">
            <Card.Header className="fantasy-card-header fantasy-card-header-info">
              <h6 className="mb-0">{abilityData.name || getTranslation(abilityKey)}</h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(abilityData).map(([key, value]) => {
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

  // Компонент для отображения карточек талантов и эффектов
  const CardItem = ({ title, content, category, count = null }) => {
    const description = getDescription(category, title);
    
    return (
      <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={renderTooltip(description)}
        >
          <Card className="h-100 fantasy-card">
            <Card.Header className={`fantasy-card-header fantasy-card-header-${getCategoryColor(category)}`}>
              <h6 className="mb-0">
                {title}
                {count !== null && <Badge className="ms-2">x{count}</Badge>}
              </h6>
            </Card.Header>
            <Card.Body>
              {typeof content === 'object' && content !== null ? (
                Object.entries(content).map(([key, value]) => (
                  key !== 'name' && (
                    <div key={key} className="fantasy-stat-row">
                      <span className="fantasy-text-muted">{getTranslation(key)}:</span>
                      <span className="fantasy-text-bold">
                        {Array.isArray(value) && (key === 'influencing' || key === 'влияющие')
                          ? translateArray(value).join(', ')
                          : prepareDataValues(value, key)}
                      </span>
                    </div>
                  )
                ))
              ) : (
                <div className="text-center fantasy-text-muted">
                  {prepareDataValues(content)}
                </div>
              )}
            </Card.Body>
          </Card>
        </OverlayTrigger>
      </Col>
    );
  };

  // Функция для рендера разных типов данных
  const renderSectionData = (category) => {
    const categoryData = sectionData[category];
    if (!categoryData) return null;

    switch (categoryData.displayType) {
      case 'keyValue':
        return (
          <div className="fantasy-attributes-grid">
            {Object.entries(categoryData.data).map(([key, value]) => (
              <AttributeWithTooltip
                key={key}
                category={category}
                itemKey={key}
                value={value}
              />
            ))}
          </div>
        );
      
      case 'magicCards':
        return (
          <Row>
            {Object.entries(categoryData.data).map(([key, value]) => (
              <MagicCard
                key={key}
                spellKey={key}
                spellData={value}
              />
            ))}
          </Row>
        );
      
      case 'abilityCards':
        return (
          <Row>
            {Object.entries(categoryData.data).map(([key, value]) => (
              <AbilityCard
                key={key}
                abilityKey={key}
                abilityData={value}
              />
            ))}
          </Row>
        );
      
      case 'cards':
        return (
          <Row>
            {Object.entries(categoryData.data).map(([key, value]) => {
              // Для талантов значение - это количество
              if (category === "Таланты") {
                return (
                  <CardItem
                    key={key}
                    title={getTranslation(key)}
                    content={value}
                    category={category}
                    count={value}
                  />
                );
              }
              
              // Для остальных - объект с данными
              return (
                <CardItem
                  key={key}
                  title={getTranslation(key)}
                  content={value}
                  category={category}
                />
              );
            })}
          </Row>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="character-container">
      <Tabs
        defaultActiveKey="Параметры"
        transition={false}
        id="playerInfo"
        className="fantasy-tabs mb-3"
        justify
      >
        <Tab eventKey="Параметры" title="📊 Параметры">
          <Container fluid>
            <Row className="g-3">
              {renderStatCard("Основная информация", "👤", {
                "Имя": playerData.name,
                "Раса": playerData.Race,
                "Класс": playerData.Character_class,
                "Очки навыков": playerData.points_per_level,
                "Скидка": `${playerData.discount}%`,
                "Уровень": playerData.level || 1
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
                "Инициатива ⏳": playerData.initiative
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
                "Шанс критического удара": `${playerData.crit_chance}%`
              }, "warning")}

              {renderStatCard("Физическая защита", "🛡️", {
                "Класс защиты": playerData.current_defence,
                "От колющего": playerData.piercing_deduction,
                "От дробящего": playerData.bludge_deduction,
                "От рубящего": playerData.slashing_deduction
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
                "Смерть": playerData.death_deduction
              }, "magic")}
            </Row>
          </Container>
        </Tab>

        {/* Вкладки с компактным отображением */}
        {[
          "Атрибуты",
          "Навыки", 
          "Магия",
          "Таланты",
          "Умения",
          "Временные эффекты",
        ].map((category) => (
          <Tab key={category} eventKey={category} title={getTabTitle(category)}>
            <Container fluid>
              <Row>
                <Col>
                  <Card className="fantasy-card">
                    <Card.Header className={`fantasy-card-header fantasy-card-header-${getCategoryColor(category)}`}>
                      <h5 className="mb-0">{category}</h5>
                    </Card.Header>
                    <Card.Body>
                      {renderSectionData(category)}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Container>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
});

// Вспомогательные функции
const getTabTitle = (category) => {
  const icons = {
    "Параметры": "📊",
    "Атрибуты": "⭐",
    "Навыки": "🎯", 
    "Магия": "🔮",
    "Таланты": "💫",
    "Умения": "⚡",
    "Временные эффекты": "🕒"
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
    "Временные эффекты": "secondary"
  };
  return colors[category] || "primary";
};

export default Character;