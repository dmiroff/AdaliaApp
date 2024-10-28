import GetDataById from "../http/GetData";
import React, { useState, useContext, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import { Context } from "../index";
import { observer } from "mobx-react-lite";

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
    console.log("player", playerData);
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

  const getSectionData = (category) => {
    switch (category) {
      case "Атрибуты":
        return {
          type: "Атрибуты",
          data: {
            "Восприятие 👁": playerData.perception,
            "Сила 🏋️": playerData.strength,
            "Ловкость 🤸": playerData.agility,
            "Телосложение 🫀": playerData.constitution,
            "Интеллект 🎓": playerData.intelligence,
            "Харизма 🤝": playerData.charisma,
            "Мудрость 🧙": playerData.wisdom,
            "Удача 🍀": playerData.luck,
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
        // Handle magic data
        return null;
      case "Таланты":
        // Handle talents data
        return null;
      case "Умения":
        // Handle abilities data
        return null;
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
        <strong>Опыт:</strong> {playerData.experience} <span role="img" aria-label="experience">📚</span>
      </div>
      <div>
        {[
          "Атрибуты",
          "Навыки",
          "Магия",
          "Таланты",
          "Умения",
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
                      <li key={key}>
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