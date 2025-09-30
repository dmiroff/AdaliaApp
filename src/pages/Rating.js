import { useState, useEffect } from "react";
import { GetRating, GetGrandGame, GetTournament } from "../http/GetData";
import Tab from "react-bootstrap/Tab"
import Tabs from "react-bootstrap/Tabs"
import Spinner from "react-bootstrap/Spinner"
import Container from "react-bootstrap/Container"
import ListGroup from "react-bootstrap/ListGroup"

const Rating = () => {
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState([]);
  const [grandGame, setGrandGame] = useState([]);
  const [tournament, setTournament] = useState([]);

  useEffect(() => {
    const fetchRatingData = async () => {
      try {
        const rating = await GetRating();
        const grandGame = await GetGrandGame();
        const tournament = await GetTournament();
        setRating(rating.data || []);
        setGrandGame(grandGame.data || []);
        setTournament(tournament.data || []);
      } finally {
        setLoading(false)
      }
    };
    fetchRatingData()
  }, []);

  const ratings = {
    "Рейтинг": rating,
    "Большая игра": grandGame,
    "Турнир": tournament,
  }

  // Функция для получения заголовка вкладки с иконкой
  const getTabTitle = (category) => {
    const icons = {
      "Рейтинг": "⭐",
      "Большая игра": "🏆",
      "Турнир": "⚔️"
    };
    return `${icons[category]} ${category}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center fantasy-paper p-4">
        <Spinner animation="border" role="status" className="fantasy-text-primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    )
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
              {ratings[key] && ratings[key].length !== 0 ? (
                <ListGroup className="fantasy-list-group">
                  {ratings[key].map((item, index) => (
                    <ListGroup.Item 
                      key={item.id} 
                      className={`fantasy-list-item ${index % 2 === 0 ? 'fantasy-item-even' : 'fantasy-item-odd'}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fantasy-text-dark fw-bold">
                          {item?.player_position && (`${item.player_position}.`)} {item.name}
                        </span>
                        <span className="fantasy-text-primary fw-bold">
                          {item.score}{item?.stage && (`/${item.stage}`)}
                        </span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center fantasy-text-muted p-4">
                  <i>Нет активных событий</i>
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