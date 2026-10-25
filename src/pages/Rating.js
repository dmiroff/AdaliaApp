import EventRatingPanel from '../components/EventRatingPanel';
import { useState, useEffect } from "react";
import { GetRating, GetGrandGame, GetTournament, GetEventRating } from "../http/GetData";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import Spinner from "react-bootstrap/Spinner";
import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";
import { dict_translator } from "../utils/Helpers";

const Rating = () => {
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState([]);
  const [eventRating, setEventRating] = useState(null);
  const [eventRatingError, setEventRatingError] = useState(false);
  const [grandGame, setGrandGame] = useState([]);
  const [tournament, setTournament] = useState([]);
  const [currentUserData, setCurrentUserData] = useState({
    ratingType: "",
    grandGamePositions: {}
  });

  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        const [normal, grand, tourney, event] = await Promise.allSettled([
          GetRating(), GetGrandGame(), GetTournament(), GetEventRating()
        ]);
        const ratingResponse = normal.status === 'fulfilled' ? normal.value || {} : {};
        const grandGameResponse = grand.status === 'fulfilled' ? grand.value || {} : {};
        const tournamentResponse = tourney.status === 'fulfilled' ? tourney.value || {} : {};
        if (event.status === 'fulfilled' && event.value?.status === 200) setEventRating(event.value);
        else setEventRatingError(true);

        const ratingData = ratingResponse.data || [];
        const grandGameData = grandGameResponse.data || [];
        const tournamentData = tournamentResponse.data || [];
        
        setRating(ratingData);
        setGrandGame(grandGameData);
        setTournament(tournamentData);
        
        // Извлекаем тип рейтинга из ответа
        if (ratingResponse.rating_type) {
          setCurrentUserData(prev => ({
            ...prev,
            ratingType: ratingResponse.rating_type
          }));
        } else if (ratingData.length > 0 && ratingData[0].rating_type) {
          // Или из первого элемента, если в корне ответа нет
          setCurrentUserData(prev => ({
            ...prev,
            ratingType: ratingData[0].rating_type
          }));
        }
        
        // Для Большой игры формируем позиции игрока у каждого эона
        const grandGamePositions = {};
        grandGameData.forEach(god => {
          if (god.player_position !== undefined) {
            grandGamePositions[god.id] = god.player_position;
          }
        });
        
        setCurrentUserData(prev => ({
          ...prev,
          grandGamePositions
        }));
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRatingData();
  }, []);

  const ratings = {
    "Рейтинг": rating,
    "Большая игра": grandGame,
    "Турнир": tournament,
  };

  // Функция для получения заголовка вкладки с иконкой
  const getTabTitle = (category) => {
    const icons = {
      "Рейтинг": "⭐",
      "Большая игра": "🏆",
      "Турнир": "⚔️"
    };
    return `${icons[category]} ${category}`;
  };

  // Функция для форматирования данных в зависимости от типа
  const formatItemData = (item, tabKey, index) => {
    switch(tabKey) {
      case "Рейтинг":
        return {
          name: item.name,
          score: item.score,
          position: item.player_position,
          stage: item.stage,
        };
      case "Большая игра":
        return {
          name: item.name,
          score: item.score,
          position: index + 1, // Позиция в топе богов
          playerPosition: item.player_position || currentUserData.grandGamePositions[item.id],
          stage: item.stage
        };
      case "Турнир":
        return {
          name: item.name,
          score: item.score,
          position: item.player_position,
          stage: item.stage
        };
      default:
        return {
          name: item.name,
          score: item.score,
          position: item.player_position,
          stage: item.stage
        };
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center fantasy-paper p-4">
        <Spinner animation="border" role="status" className="fantasy-text-primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="fantasy-paper content-overlay">
      <Tabs 
        defaultActiveKey="Рейтинг"
        className="fantasy-tabs mb-3"
        justify
      >
        {Object.keys(ratings).map((key) => (
          <Tab key={key} eventKey={key} title={getTabTitle(key)} className="fantasy-tab-content">
            <Container className="fantasy-paper p-3 mt-3">
              {/* Заголовок с типом рейтинга ТОЛЬКО для вкладки Рейтинг */}
              {key === "Рейтинг" && currentUserData.ratingType && (
                <div className="fantasy-rating-type mb-3 p-2 text-center">
                  <h5 className="fantasy-text-gold mb-0">
                    📊 Обычный недельный рейтинг: <strong>{dict_translator[currentUserData.ratingType] ? dict_translator[currentUserData.ratingType] : currentUserData.ratingType}</strong>
                  </h5>
                </div>
              )}
              
              {ratings[key] && ratings[key].length !== 0 ? (
                <ListGroup className="fantasy-list-group">
                  {ratings[key].map((item, index) => {
                    const formattedData = formatItemData(item, key, index);
                    
                    return (
                      <ListGroup.Item 
                        key={item.id} 
                        className={`fantasy-list-item ${index % 2 === 0 ? 'fantasy-item-even' : 'fantasy-item-odd'}`}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex flex-column">
                            <span className="fantasy-text-dark fw-bold">
                              {formattedData.position && (`${formattedData.position}.`)} {formattedData.name}
                              {/* УБРАНО: отображение типа рейтинга рядом с ником */}
                            </span>
                            
                            {/* Показываем позицию игрока у эона для Большой игры */}
                            {key === "Большая игра" && formattedData.playerPosition && (
                              <small className="fantasy-text-success mt-1">
                                👤 Ваша позиция у этого эона: {formattedData.playerPosition}
                              </small>
                            )}
                          </div>
                          
                          <span className="fantasy-text-primary fw-bold">
                            {formattedData.score}
                            {formattedData.stage && `/${formattedData.stage}`}
                          </span>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              ) : (
                <div className="text-center fantasy-text-muted p-4">
                  <i>Нет активных событий</i>
                </div>
              )}
              
              {key === "Рейтинг" && <EventRatingPanel rating={eventRating} error={eventRatingError} />}

              {/* Дополнительная информация для текущего пользователя, если он не в топе */}
              {key === "Рейтинг" && rating.length > 10 && (
                <div className="fantasy-user-position mt-3 p-2 text-center">
                  <small className="fantasy-text-info">
                    * Отображаются топ-10 и ваша позиция
                  </small>
                </div>
              )}
            </Container>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};

export default Rating;