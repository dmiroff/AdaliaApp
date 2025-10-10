import { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Context } from "../index";
import { fetchBirzhaRate, buyDaleons, sellDaleons, fetchBirzhaHistory } from "../http/birzha";
import GetDataById from "../http/GetData";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './Birzha.css';
import "../pages/Character.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const BirzhaTab = () => {
  const { user } = useContext(Context);
  const [rateData, setRateData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [playerData, setPlayerData] = useState(null);
  const [chartUpdateKey, setChartUpdateKey] = useState(0); // Ключ для принудительного обновления графика

  const loadAllData = async () => {
    try {
      const [rateResponse, historyResponse, playerResponse] = await Promise.all([
        fetchBirzhaRate(),
        fetchBirzhaHistory(),
        GetDataById()
      ]);

      setRateData(rateResponse.data);
      setHistoryData(historyResponse.data);
      if (playerResponse && playerResponse.data) {
        setPlayerData(playerResponse.data);
        user.setPlayer(playerResponse.data);
      }
    } catch (error) {
      console.error("Error loading birzha data:", error);
      setError("Ошибка загрузки данных биржи");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await loadAllData();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleBuy = async () => {
    try {
      setTrading(true);
      setError("");
      const response = await buyDaleons();
      
      // Обновляем все данные после операции
      await loadAllData();
      
      // Принудительно обновляем график
      setChartUpdateKey(prev => prev + 1);
      
      setSuccess(response.message);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error buying daleons:", error);
      setError(error.response?.data?.detail || "Ошибка при покупке далеонов");
    } finally {
      setTrading(false);
    }
  };

  const handleSell = async () => {
    try {
      setTrading(true);
      setError("");
      const response = await sellDaleons();
      
      // Обновляем все данные после операции
      await loadAllData();
      
      // Принудительно обновляем график
      setChartUpdateKey(prev => prev + 1);
      
      setSuccess(response.message);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error selling daleons:", error);
      setError(error.response?.data?.detail || "Ошибка при продаже далеонов");
    } finally {
      setTrading(false);
    }
  };

  // Подготовка данных для графика
  const chartData = {
    labels: historyData.map(record => {
      const date = new Date(record.timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: 'Курс далеона',
        data: historyData.map(record => record.rate),
        borderColor: '#8b4513',
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        tension: 0.1,
        borderWidth: 2,
        pointBackgroundColor: '#8b4513',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#3e2723',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(244, 228, 188, 0.95)',
        titleColor: '#3e2723',
        bodyColor: '#5d4037',
        borderColor: '#8b4513',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `Курс: ${context.parsed.y}🌕`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(139, 115, 85, 0.3)',
          drawBorder: false
        },
        ticks: {
          color: '#5d4037',
          font: {
            size: 12,
            weight: '500'
          },
          padding: 8
        },
        title: {
          display: true,
          text: 'Курс (🌕)',
          color: '#3e2723',
          font: {
            size: 13,
            weight: '600'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(139, 115, 85, 0.2)',
          drawBorder: false
        },
        ticks: {
          color: '#5d4037',
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      line: {
        fill: true
      }
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
    <div className="fantasy-paper content-overlay birzha-container">
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      {/* График на всю ширину */}
      <Row className="mb-4">
        <Col xs={12}>
          <Card className="fantasy-card birzha-chart-card">
            <Card.Header className="birzha-card-header birzha-card-header-info">
              <Card.Title className="fantasy-text-gold mb-0">
                📈 История курса далеона
              </Card.Title>
            </Card.Header>
            <Card.Body className="birzha-chart-body">
              {historyData.length > 0 ? (
                <div className="birzha-chart-wrapper">
                  <Line 
                    key={chartUpdateKey} // Принудительное обновление графика при изменении ключа
                    data={chartData} 
                    options={chartOptions} 
                  />
                  <div className="birzha-chart-stats mt-3">
                    <div className="fantasy-stat-row">
                      <span>Всего записей:</span>
                      <span className="fantasy-badge fantasy-badge-primary">{historyData.length}</span>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Последнее обновление:</span>
                      <span className="fantasy-badge fantasy-badge-secondary">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center fantasy-text-muted py-5">
                  <div className="fs-1 mb-3">📊</div>
                  <h5 className="fantasy-text-dark">История курса пока недоступна</h5>
                  <p className="fantasy-text-muted">Совершите первую сделку, чтобы начать отслеживать изменения курса</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Остальные карточки в 3 колонки */}
      <Row className="g-4">
        {/* Текущий курс и торговля */}
        <Col lg={4} md={6}>
          <Card className="fantasy-card h-100">
            <Card.Header className="birzha-card-header birzha-card-header-primary">
              <Card.Title className="fantasy-text-gold">💰 Текущий курс</Card.Title>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              {rateData && (
                <div className="mb-4">
                  <div className="fantasy-stat-row">
                    <span>Базовый курс:</span>
                    <span className="fantasy-badge fantasy-badge-primary">
                      {rateData.current_rate}🌕/100💎
                    </span>
                  </div>
                  <div className="fantasy-stat-row">
                    <span>Покупка:</span>
                    <span className="fantasy-badge fantasy-badge-success">
                      {rateData.buy_rate}🌕
                    </span>
                  </div>
                  <div className="fantasy-stat-row">
                    <span>Продажа:</span>
                    <span className="fantasy-badge fantasy-badge-warning">
                      {rateData.sell_rate}🌕
                    </span>
                  </div>
                </div>
              )}

              <div className="d-grid gap-3 mt-auto">
                <Button 
                  className="fantasy-btn fantasy-btn-success w-100"
                  onClick={handleBuy}
                  disabled={trading || !playerData || playerData.money < (rateData?.buy_rate || 0)}
                >
                  {trading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Покупка...
                    </>
                  ) : (
                    `Купить 100💎`
                  )}
                </Button>
                <Button 
                  className="fantasy-btn fantasy-btn-warning w-100"
                  onClick={handleSell}
                  disabled={trading || !playerData || playerData.daleons < 100}
                >
                  {trading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Продажа...
                    </>
                  ) : (
                    `Продать 100💎`
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Ваши ресурсы */}
        <Col lg={4} md={6}>
          <Card className="fantasy-card h-100">
            <Card.Header className="birzha-card-header birzha-card-header-secondary">
              <Card.Title className="fantasy-text-gold">📊 Ваши ресурсы</Card.Title>
            </Card.Header>
            <Card.Body>
              {playerData && (
                <div>
                  <div className="fantasy-stat-row">
                    <span>Монеты:</span>
                    <span className="fantasy-badge fantasy-badge-primary">
                      {playerData.money}🌕
                    </span>
                  </div>
                  <div className="fantasy-stat-row">
                    <span>Далеоны:</span>
                    <span className="fantasy-badge fantasy-badge-warning">
                      {playerData.daleons}💎
                    </span>
                  </div>
                  
                  {/* Индикаторы доступности */}
                  <div className="mt-4 p-3 birzha-balance-info">
                    <h6 className="fantasy-text-dark mb-3">Доступность операций:</h6>
                    <div className="fantasy-stat-row">
                      <span>Можно купить:</span>
                      <span className={`birzha-balance-indicator ${
                        playerData.money >= (rateData?.buy_rate || 0) ? 'birzha-balance-positive' : 'birzha-balance-negative'
                      }`}>
                        {playerData.money >= (rateData?.buy_rate || 0) ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="fantasy-stat-row">
                      <span>Можно продать:</span>
                      <span className={`birzha-balance-indicator ${
                        playerData.daleons >= 100 ? 'birzha-balance-positive' : 'birzha-balance-negative'
                      }`}>
                        {playerData.daleons >= 100 ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Информация о бирже */}
        <Col lg={4} md={12}>
          <Card className="birzha-card h-100">
            <Card.Header className="birzha-card-header">
              <Card.Title className="fantasy-text-gold">ℹ️ О бирже</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="birzha-info">
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className="birzha-info-text">Обмен производится только блоками по 100 далеонов</span>
                </div>
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className="birzha-info-text">Курс изменяется после каждой операции</span>
                </div>
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className="birzha-info-text">При покупке курс растет на 1%</span>
                </div>
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className="birzha-info-text">При продаже курс падает на 1%</span>
                </div>
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className="birzha-info-text">График обновляется в реальном времени</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BirzhaTab;