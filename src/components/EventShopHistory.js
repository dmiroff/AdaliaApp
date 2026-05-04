// src/components/EventShopHistory.js
import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Spinner, Button } from "react-bootstrap";
import { getEventShopHistory, getEventShopStatistics } from "../http/eventShopApi";

const translateProductType = (type) => {
  const translations = {
    "consumable": "Расходуемый",
    "cosmetic": "Косметика (случайный)",
    "cosmetic_selectable": "Косметика (заказ)",
    "talent_point": "Очко талантов"
  };
  return translations[type] || type;
};

// Также для отображения в истории покупок
const translateProductTypeForDisplay = (type) => {
  const translations = {
    "consumable": "Расходуемый",
    "cosmetic": "Косметика",
    "cosmetic_selectable": "Заказ образа",
    "talent_point": "Талант"
  };
  return translations[type] || type;
};

const EventShopHistory = () => {
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getEventShopHistory();
      if (response.status === 200) {
        setHistory(response.data.purchases || []);
        setStatistics(response.data.statistics);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" variant="info" />
        <p>Загрузка истории покупок...</p>
      </div>
    );
  }

  return (
    <Card className="fantasy-card">
      <Card.Header className="fantasy-card-header-info">
        <h5 className="fantasy-text-gold">📜 История покупок в событийном магазине</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {statistics && (
          <div className="mb-4">
            <h6>Статистика:</h6>
            <p>Всего потрачено: {statistics.total_spent}</p>
            <p>Всего покупок: {statistics.total_items}</p>
            <p>Средний чек: {Math.round(statistics.average_spent)}</p>
          </div>
        )}

        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Товар</th>
              <th>Тип</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Образ</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((purchase) => (
                <tr key={purchase.id}>
                    <td>{new Date(purchase.created_at).toLocaleDateString()}</td>
                    <td>{purchase.product_name}</td>
                    <td>{translateProductType(purchase.product_type)}</td>
                    <td>{purchase.quantity}</td>
                    <td>{purchase.price} ❄️</td>
                    <td>{purchase.selected_image_name || "-"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">Пока нет покупок</td>
              </tr>
            )}
          </tbody>
        </Table>

        <Button variant="outline-info" onClick={loadHistory}>
          Обновить историю
        </Button>
      </Card.Body>
    </Card>
  );
};

export default EventShopHistory;