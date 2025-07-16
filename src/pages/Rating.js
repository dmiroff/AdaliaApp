import React, { useState, useEffect, useContext } from "react";
import { GetRating, GetGrandGame, GetTournament } from "../http/GetData";
import { Context } from "../index";
import Tab from "react-bootstrap/Tab"
import Tabs from "react-bootstrap/Tabs"
import Spinner from "react-bootstrap/Spinner"
import Container from "react-bootstrap/Container"
import ListGroup from "react-bootstrap/ListGroup"

const Rating = () => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(null);
  const [grandGame, setGrandGame] = useState(null);
  const [tournament, setTournament] = useState(null);
  const playerId = user.user.id;

  useEffect(() => {
    const fetchRatingData = async () => {
            try {
                const rating = await GetRating();
                const grandGame = await GetGrandGame();
                const tournament = await GetTournament();
                setRating(rating.data);
                setGrandGame(grandGame.data);
                setTournament(tournament.data);
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


    const getRatingData = (ratingData) => {
        const ratingDict = {}
        const rate = Object.values(ratingData).map(item => (
                ratingDict[item.name] = item.score
        ))
        return ratingDict
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        )
    }

    return (
        <Tabs>
            {Object.values(ratings) && Object.keys(ratings).map((key, value) => (
                <Tab key={key} eventKey={key} title={key}>
                    <Container>
                        {Object.values(ratings[key]).length !== 0 && (
                        <ListGroup>
                            {ratings[key].map((item) => (
                                <ListGroup.Item key={item.id} style={{marginTop: 5, paddingTop: 5}} >
                                    {item?.player_position && (`${item.player_position}.`)} {item.name}: {item.score}{item?.stage && (`/${item.stage}`)}
                                </ListGroup.Item>
                            )
                            )}
                        </ListGroup>

                        ) || (
                                <div style={{margin: 10}}>Нет активных событий</div>
                            )

                        }
                    </Container>
                </Tab>
            ))}
        </Tabs>
    );
};

export default Rating;
