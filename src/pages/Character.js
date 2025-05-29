import GetDataById from "../http/GetData";
import React, { useState, useContext, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";
import { dict_translator } from "../utils/Helpers";

const Character = observer(() => {
  const { user } = useContext(Context);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delay, setDelay] = useState(false);
  const [visibleSection, setVisibleSection] = useState(null);
  const user_id = user.user.id;

  useEffect(() => {
    const fetchPlayer = async (user_id) => {
      const playerData = await GetDataById(user_id);
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

  const handleHeaderClick = (category) => {
    if (visibleSection === category) {
      setVisibleSection(null);
    } else {
      setVisibleSection(category);
    }
  };
 
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
    <div>
      <div>
        <strong>Уровень:</strong> {playerData.level} <span role="img" aria-label="level">🎖️</span>
        <br />
        <strong>Опыт:</strong> {playerData.experience}/{playerData.experience_next_level} <span role="img" aria-label="experience">📚</span>
        <br />
        <strong>Раса:</strong> {playerData.Race} <span role="img" aria-label="race">👨</span>
        <br />
        <strong>Класс:</strong> {playerData.Character_class} <span role="img" aria-label="class">🏆</span>
      </div>
      <div>
        {[
          "Атрибуты",
          "Навыки",
          "Магия",
          "Таланты",
          "Умения",
          "Временные эффекты",
        ].map((category) => (
          <div key={category}>
            <h3 onClick={() => handleHeaderClick(category)} style={{ cursor: "pointer" }}>
              {category}
            </h3>
            {visibleSection === category && (
              <div>
                {getSectionData(category) && (
                  <ul>
                    {Object.entries(getSectionData(category).data).map(([key, value]) => (
                      <li key={key} className="display-linebreak">
                        {key}: {value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default Character;
