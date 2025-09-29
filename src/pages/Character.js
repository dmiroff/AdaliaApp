import GetDataById from "../http/GetData";
import { useState, useContext, useEffect } from "react";
import { Container, Spinner, Tabs, Tab } from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { dict_translator } from "../utils/Helpers";

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
      }, 2000); // Delay time of 2 seconds
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
      let valueString = "\n"
      for (const [k, v] of Object.entries(value)) {
        if (valueString !== "\n") {
          valueString = valueString + "\n"
        }
        valueString = valueString + getTranslation(k) + ": " + v 
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
      let data_value = "\n"
      for (const [key, value] of Object.entries(data_values)) {
        if (key === "name") {
          continue
        }
        if (key in dict_translator) {
          data_value = data_value + dict_translator[key] + ": " + prepareDataValues(value) + '\n'
        }
      }
      data_value = data_value + "\n"
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

  if (!delay) {
    return (
      <div className="d-flex justify-content-center align-items-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="content-overlay"> {/* Добавлен класс content-overlay */}
      <Tabs
        defaultActiveKey="Параметры"
        transition={false}
        id="playerInfo"
        className="mb-3"
      >
        <Tab eventKey="Параметры" title="Параметры">
          <Container>
            <span>Имя: {playerData.name}<br /></span>
            <span>Раса: {playerData.Race}<br /></span>
            <span>Класс: {playerData.Character_class}<br /></span>
            <span>Уровень: {playerData.experience}/{playerData.experience_next_level}<br /></span>
            <span>Очки навыков за уровень: {playerData.points_per_level}<br /></span>
            <span>Скидка: {playerData.discount}<br /><br /></span>

            {playerData.bloodlust !== 0 && (<span>Кровожадность: {playerData.bloodlust}<br /></span>)}
            {playerData.rage !== 0 && (<span>Ярость: {playerData.rage}<br /></span>)}
            {playerData.regeneration !== 0 && (<span>Регенерация: {playerData.regeneration}<br /></span>)}
            {playerData.ressurect !== 0 && (<span>Воскрешение: {playerData.ressurect}<br /></span>)}
            <span>Дополнительные очки передвижения: {playerData.move_OP}<br /></span>
            <span>Зелья за бой: {playerData.consumable_items}<br /></span>
            <span>Модификатор проверок скрытности: {playerData.sneak_check}<br /></span>
            <span>Очки действия🏃: {playerData.action_points}<br /></span>
            <span>Инициатива⏳: {playerData.initiative}<br /><br /></span>

            <span><strong>Атака</strong> 🗡<br /></span>
            <span>Атака в ближнем бою: {playerData.melee_attack}<br /></span>
            <span>Атака в дальнем бою: {playerData.range_attack}<br /></span>
            <span>Урон в ближнем бою: {playerData.melee_damage}<br /></span>
            <span>Урон в дальнем бою: {playerData.range_damage}<br /></span>
            <span>Шанс критического удара: {playerData.crit_chance}<br /><br /></span>

            <span><strong>Физическая ащита</strong> 🛡<br /></span>
            <span>Класс защиты: {playerData.current_defence}<br /></span>
            <span>Сопротивление к колющему урону: {playerData.piercing_deduction}<br /></span>
            <span>Сопротивление к дробящему урону: {playerData.bludge_deduction}<br /></span>
            <span>Сопротивление к рубящему урону: {playerData.slashing_deduction}<br /><br /></span>

            <span><strong>Магическая защита</strong> 🪄<br /></span>
            <span>Магическое сопротивление: {playerData.magic_resist}<br /></span>
            <span>Сопротивление к огненному урону: {playerData.fire_deduction}<br /></span>
            <span>Сопротивление к ледяному урону: {playerData.ice_deduction}<br /></span>
            <span>Сопротивление к урону молнией: {playerData.electric_deduction}<br /></span>
            <span>Сопротивление к урону тьмой: {playerData.dark_deduction}<br /></span>
            <span>Сопротивление к урону светом: {playerData.light_deduction}<br /></span>
            <span>Сопротивление к урону жизнью: {playerData.life_deduction}<br /></span>
            <span>Сопротивление к звуковому урону: {playerData.sound_deduction}<br /></span>
            <span>Сопротивление к воздушному урону: {playerData.wind_deduction}<br /></span>
            <span>Сопротивление к урону смертью: {playerData.death_deduction}<br /></span>
            <span>Сопротивление к Власти: {playerData.power_deduction}<br /></span>
          </Container>
        </Tab>
        {[
          "Атрибуты",
          "Навыки",
          "Магия",
          "Таланты",
          "Умения",
          "Временные эффекты",
        ].map((category) => (
          <Tab key={category} eventKey={category} title={category}>
            {getSectionData(category) && (
              <Container>
                <ul>
                  {Object.entries(getSectionData(category).data).map(([key, value]) => (
                    <li key={key} className="display-linebreak">
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </Container>
            )}
          </Tab>
        ))}
      </Tabs>
    </div>
  );
});

export default Character;