import GetDataById from "../http/GetData";
import { useState, useContext, useEffect, forwardRef } from "react";
import { Container, Spinner, Tabs, Tab, Card, Row, Col, Badge, ProgressBar, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { dict_translator } from "../utils/Helpers";
import "./Character.css";

// Импортируем словари с описаниями
import { attributesDescDict, skillsDescDict, talentsDescDict, abilitiesDescDict, keyMappingDict } from "../utils/descriptions";

// Кастомный тултип с отложенным появлением
const CustomTooltip = forwardRef(({ children, ...props }, ref) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Tooltip 
      ref={ref} 
      {...props} 
      className={`fantasy-tooltip ${show ? 'fantasy-tooltip-visible' : ''}`}
    >
      {children}
    </Tooltip>
  );
});

const Character = observer(() => {
  const { user } = useContext(Context);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const user_id = user.user.id;

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

  const prepareDataValues = (value) => {
    if (value.constructor === Array) {
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
        valueString = valueString + getTranslation(k) + " " + v 
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
          data_value = data_value + dict_translator[key] + " " + prepareDataValues(value)
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

  const getSectionData = (category) => {
    switch (category) {
      case "Атрибуты":
        return {
          type: "Атрибуты",
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
        };
      case "Навыки":
        return {
          type: "Навыки",
          data: {
            "Торговля 💰": playerData.barter,
            "Устрашение 😤": playerData.intimidation,
            "Воодушевление 🌟": playerData.persuasion,
            "Скрытность 🕵️": playerData.sneak,
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
        };
      case "Магия":
        return {
          type: "Магия",
          data: characterDataToShow(playerData.prepared_magic),
        }
      case "Таланты":
        return {
          type: "Таланты",
          data: arrToCountedDict(playerData.talents),
        }
      case "Умения":
        return {
          type: "Умения",
          data: characterDataToShow(playerData.abilities)
        }
      case "Временные эффекты":
        return {
          type: "Временные эффекты",
          data: characterDataToShow(playerData.temporary_effects)
        }
      default:
        return null;
    }
  };

  // Функция для получения описания по категории и ключу
  const getDescription = (category, key) => {
    // Сначала пробуем найти в mapping словаре
    const mappedKey = keyMappingDict[key];
    const searchKey = mappedKey || key;
    
    // Получаем соответствующий словарь
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
    
    // Создаем обратный mapping для поиска
    const reverseMapping = {};
    Object.keys(keyMappingDict).forEach(keyWithEmoji => {
      const cleanKey = keyMappingDict[keyWithEmoji];
      reverseMapping[cleanKey] = keyWithEmoji;
    });
    
    // Пробуем разные варианты ключей по порядку:
    const possibleKeys = [
      searchKey, // оригинальный ключ
      keyMappingDict[searchKey], // если searchKey уже был с эмодзи
      reverseMapping[searchKey], // обратный поиск
      searchKey.replace(/[^\w\s]/g, '').trim() // чистый ключ
    ];
    
    // Убираем undefined и дубликаты
    const uniqueKeys = [...new Set(possibleKeys.filter(Boolean))];
    
    // Ищем первое совпадение
    for (const testKey of uniqueKeys) {
      if (dict[testKey]) {
        return dict[testKey];
      }
    }
    
    // Если ничего не нашли
    return "Описание для этого элемента пока не добавлено";
  };

  const calculateLevelProgress = () => {
    if (!playerData) return 0;
    const current = playerData.experience;
    const next = playerData.experience_next_level;
    return (current / next) * 100;
  };

  const renderTooltip = (props, category, key) => (
    <CustomTooltip {...props}>
      {getDescription(category, key)}
    </CustomTooltip>
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

  return (
    <div className="character-container">
      <Tabs
        defaultActiveKey="Параметры"
        transition={false}
        id="playerInfo"
        className="fantasy-tabs mb-4"
      >
        <Tab eventKey="Параметры" title="📊 Параметры">
          <Container fluid>
            <Row className="g-3 mb-4">
              <Col md={4}>
                <Card className="h-100 fantasy-card">
                  <Card.Header className="fantasy-card-header fantasy-card-header-primary">
                    <h6 className="mb-0">👤 Основная информация</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="fantasy-stat-row">
                      <span>Имя:</span>
                      <Badge className="fantasy-badge fantasy-badge-primary">{playerData.name}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Раса:</span>
                      <Badge className="fantasy-badge fantasy-badge-secondary">{playerData.Race}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Класс:</span>
                      <Badge className="fantasy-badge fantasy-badge-info">{playerData.Character_class}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Очки навыков:</span>
                      <Badge className="fantasy-badge fantasy-badge-warning">{playerData.points_per_level}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Скидка:</span>
                      <Badge className="fantasy-badge fantasy-badge-dark">{playerData.discount}%</Badge>
                    </div>
                    
                    <div className="level-progress-container">
                      <div className="fantasy-stat-row">
                        <div className="d-flex justify-content-between mb-1">
                          <span>Уровень:</span>
                          <Badge className="fantasy-badge fantasy-badge-success">
                            {playerData.experience}/{playerData.experience_next_level}
                          </Badge>
                        </div>
                      </div>
                      <ProgressBar 
                        now={calculateLevelProgress()} 
                        className="experience-progress-bar"
                        label={`${Math.round(calculateLevelProgress())}%`}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="h-100 fantasy-card">
                  <Card.Header className="fantasy-card-header fantasy-card-header-success">
                    <h6 className="mb-0">⚡ Особенности</h6>
                  </Card.Header>
                  <Card.Body>
                    {playerData.bloodlust !== 0 && (
                      <div className="fantasy-stat-row">
                        <span>Кровожадность:</span>
                        <Badge className="fantasy-badge fantasy-badge-blood">{playerData.bloodlust}</Badge>
                      </div>
                    )}
                    {playerData.rage !== 0 && (
                      <div className="fantasy-stat-row">
                        <span>Ярость:</span>
                        <Badge className="fantasy-badge fantasy-badge-rage">{playerData.rage}</Badge>
                      </div>
                    )}
                    {playerData.regeneration !== 0 && (
                      <div className="fantasy-stat-row">
                        <span>Регенерация:</span>
                        <Badge className="fantasy-badge fantasy-badge-regeneration">{playerData.regeneration}</Badge>
                      </div>
                    )}
                    {playerData.ressurect !== 0 && (
                      <div className="fantasy-stat-row">
                        <span>Воскрешение:</span>
                        <Badge className="fantasy-badge fantasy-badge-magic">{playerData.ressurect}</Badge>
                      </div>
                    )}
                    <div className="fantasy-stat-row">
                      <span>Доп. очки передвижения:</span>
                      <Badge className="fantasy-badge fantasy-badge-secondary">{playerData.move_OP}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Зелья за бой:</span>
                      <Badge className="fantasy-badge fantasy-badge-primary">{playerData.consumable_items}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Модификатор скрытности:</span>
                      <Badge className="fantasy-badge fantasy-badge-dark">{playerData.sneak_check}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Очки действия 🏃:</span>
                      <Badge className="fantasy-badge fantasy-badge-success">{playerData.action_points}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Инициатива ⏳:</span>
                      <Badge className="fantasy-badge fantasy-badge-info">{playerData.initiative}</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="h-100 fantasy-card">
                  <Card.Header className="fantasy-card-header fantasy-card-header-warning">
                    <h6 className="mb-0">🗡️ Атака</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="fantasy-stat-row">
                      <span>Ближняя атака:</span>
                      <Badge className="fantasy-badge fantasy-badge-combat">{playerData.melee_attack}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Дальняя атака:</span>
                      <Badge className="fantasy-badge fantasy-badge-combat">{playerData.range_attack}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Ближний урон:</span>
                      <Badge className="fantasy-badge fantasy-badge-combat">{playerData.melee_damage}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Дальний урон:</span>
                      <Badge className="fantasy-badge fantasy-badge-combat">{playerData.range_damage}</Badge>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Шанс критического удара:</span>
                      <Badge className="fantasy-badge fantasy-badge-crit">{playerData.crit_chance}%</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Защита */}
            <Row className="g-3">
              <Col md={6}>
                <Card className="fantasy-card">
                  <Card.Header className="fantasy-card-header fantasy-card-header-info">
                    <h6 className="mb-0">🛡️ Физическая защита</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col sm={6}>
                        <div className="fantasy-stat-row">
                          <span>Класс защиты:</span>
                          <Badge className="fantasy-badge fantasy-badge-primary">{playerData.current_defence}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Колющий урон:</span>
                          <Badge className="fantasy-badge fantasy-badge-physical">{playerData.piercing_deduction}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Дробящий урон:</span>
                          <Badge className="fantasy-badge fantasy-badge-physical">{playerData.bludge_deduction}</Badge>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="fantasy-stat-row">
                          <span>Рубящий урон:</span>
                          <Badge className="fantasy-badge fantasy-badge-physical">{playerData.slashing_deduction}</Badge>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="fantasy-card">
                  <Card.Header className="fantasy-card-header fantasy-card-header-magic">
                    <h6 className="mb-0">🪄 Магическая защита</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col sm={6}>
                        <div className="fantasy-stat-row">
                          <span>Магическое сопротивление:</span>
                          <Badge className="fantasy-badge fantasy-badge-magic">{playerData.magic_resist}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Огонь:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-fire">{playerData.fire_deduction}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Лёд:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-ice">{playerData.ice_deduction}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Молния:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-lightning">{playerData.electric_deduction}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Тьма:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-dark">{playerData.dark_deduction}</Badge>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="fantasy-stat-row">
                          <span>Свет:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-light">{playerData.light_deduction}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Жизнь:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-life">{playerData.life_deduction}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Звук:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-sound">{playerData.sound_deduction}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Воздух:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-air">{playerData.wind_deduction}</Badge>
                        </div>
                        <div className="fantasy-stat-row">
                          <span>Смерть:</span>
                          <Badge className="fantasy-badge fantasy-badge-element-death">{playerData.death_deduction}</Badge>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
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
              <Card className="fantasy-card">
                <Card.Header className={`fantasy-card-header fantasy-card-header-${getCategoryColor(category)}`}>
                  <h5 className="mb-0">{category}</h5>
                </Card.Header>
                <Card.Body>
                  {getSectionData(category) && (
                    <div className="fantasy-attributes-grid">
                      {Object.entries(getSectionData(category).data).map(([key, value]) => (
                        <OverlayTrigger
                          key={key}
                          placement="top"
                          delay={{ show: 250, hide: 400 }}
                          overlay={(props) => renderTooltip(props, category, key)}
                          popperConfig={{
                            modifiers: [
                              {
                                name: 'preventOverflow',
                                options: {
                                  boundary: 'viewport'
                                }
                              }
                            ]
                          }}
                        >
                          <div className="fantasy-attribute-item">
                            <div className="attribute-content">
                              <span className="fantasy-attribute-key">{key}</span>
                              <span className="fantasy-attribute-value">{value}</span>
                            </div>
                          </div>
                        </OverlayTrigger>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Container>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
});

// Вспомогательные функции остаются без изменений
const getTabTitle = (category) => {
  const icons = {
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