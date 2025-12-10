import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Row, Col, Card, Button, Alert, Spinner, Modal } from 'react-bootstrap';
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
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
  const [chartUpdateKey, setChartUpdateKey] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const chartContainerRef = useRef(null);

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Функция для показа ошибки в модальном окне
  const showErrorInModal = (errorMessage) => {
    setModalError(errorMessage);
    setShowErrorModal(true);
  };

  const handleBuy = async () => {
    try {
      setTrading(true);
      setError("");
      const response = await buyDaleons();
      
      await loadAllData();
      setChartUpdateKey(prev => prev + 1);
      
      setSuccess(response.message);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error buying daleons:", error);
      const errorMessage = error.response?.data?.detail || "Ошибка при покупке далеонов";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    } finally {
      setTrading(false);
    }
  };

  const handleSell = async () => {
    try {
      setTrading(true);
      setError("");
      const response = await sellDaleons();
      
      await loadAllData();
      setChartUpdateKey(prev => prev + 1);
      
      setSuccess(response.message);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error selling daleons:", error);
      const errorMessage = error.response?.data?.detail || "Ошибка при продаже далеонов";
      showErrorInModal(errorMessage);
      setError(errorMessage);
    } finally {
      setTrading(false);
    }
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setModalError("");
  };

  // Подготовка данных для графика с учетом мобильных устройств
  const chartData = useMemo(() => ({
    labels: historyData.map(record => {
      const date = new Date(record.timestamp);
      // На мобильных показываем только время, на десктопе - полную дату
      return isMobile 
        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }),
    datasets: [
      {
        label: 'Курс далеона',
        data: historyData.map(record => record.rate),
        borderColor: '#8b4513',
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: isMobile ? 3 : 2,
        pointBackgroundColor: '#8b4513',
        pointBorderColor: '#fff',
        pointBorderWidth: isMobile ? 3 : 2,
        pointRadius: isMobile ? 5 : 4,
        pointHoverRadius: isMobile ? 7 : 6,
        pointHitRadius: isMobile ? 20 : 15
      }
    ]
  }), [historyData, isMobile]);

  // Опции графика с учетом мобильных устройств
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#3e2723',
          font: {
            size: isMobile ? 14 : 16,
            weight: 'bold',
            family: "'Cinzel', serif"
          },
          padding: isMobile ? 10 : 20,
          usePointStyle: true,
          pointStyle: 'circle'
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
        padding: isMobile ? 10 : 12,
        titleFont: {
          family: "'Cinzel', serif",
          size: isMobile ? 12 : 14
        },
        bodyFont: {
          family: "'Cinzel', serif",
          size: isMobile ? 12 : 14
        },
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
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: '#5d4037',
          font: {
            size: isMobile ? 11 : 12,
            weight: '500',
            family: "'Cinzel', serif"
          },
          padding: isMobile ? 5 : 8,
          callback: function(value) {
            return value + '🌕';
          }
        },
        title: {
          display: !isMobile, // На мобильных скрываем заголовок оси
          text: 'Курс (🌕)',
          color: '#3e2723',
          font: {
            size: 13,
            weight: '600',
            family: "'Cinzel', serif"
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
            size: isMobile ? 10 : 11,
            family: "'Cinzel', serif"
          },
          maxRotation: isMobile ? 45 : 45,
          minRotation: isMobile ? 45 : 45,
          // На мобильных показываем меньше меток
          maxTicksLimit: isMobile ? 8 : 12,
          autoSkip: true,
          autoSkipPadding: isMobile ? 20 : 30
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      }
    },
    animation: {
      duration: 750
    }
  }), [isMobile]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center fantasy-paper p-4 min-vh-50">
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

      {/* Модальное окно для ошибок */}
      <Modal 
        show={showErrorModal} 
        onHide={handleCloseErrorModal}
        centered
        className="fantasy-modal"
        size={isMobile ? "sm" : "md"}
      >
        <Modal.Header closeButton className="fantasy-card-header fantasy-card-header-danger">
          <Modal.Title className="fantasy-text-gold">
            <span className="me-2">❌</span>
            {isMobile ? 'Ошибка' : 'Ошибка операции'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="fantasy-modal-body p-4">
          <div className="text-center">
            <div className={`mb-3 ${isMobile ? 'fs-3' : 'fs-1'}`}>⚠️</div>
            <h5 className="fantasy-text-dark mb-3">
              {isMobile ? 'Ошибка' : 'Не удалось выполнить операцию'}
            </h5>
            <p className="fantasy-text-muted">{modalError}</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="fantasy-modal-footer">
          <Button 
            className={`fantasy-btn fantasy-btn-primary ${isMobile ? 'w-100' : ''}`}
            onClick={handleCloseErrorModal}
          >
            Понятно
          </Button>
        </Modal.Footer>
      </Modal>

      {/* График на всю ширину */}
      <Row className="mb-4">
        <Col xs={12}>
          <Card className="fantasy-card birzha-chart-card">
            <Card.Header className="birzha-card-header birzha-card-header-info">
              <Card.Title className="fantasy-text-gold mb-0 d-flex align-items-center">
                <span className="me-2">📈</span>
                <span className={isMobile ? 'fs-6' : 'fs-5'}>
                  {isMobile ? 'История курса' : 'История курса далеона'}
                </span>
              </Card.Title>
            </Card.Header>
            <Card.Body className="birzha-chart-body">
              <div ref={chartContainerRef} className="birzha-chart-container">
                {historyData.length > 0 ? (
                  <>
                    <div className="birzha-chart-wrapper" style={{ height: isMobile ? '250px' : '300px' }}>
                      <Line 
                        key={chartUpdateKey}
                        data={chartData} 
                        options={chartOptions}
                        redraw={true}
                      />
                    </div>
                    <div className="birzha-chart-stats mt-3">
                      <div className="fantasy-stat-row">
                        <span className={isMobile ? 'small' : ''}>Записей:</span>
                        <span className="fantasy-badge fantasy-badge-primary">
                          {historyData.length}
                        </span>
                      </div>
                      <div className="fantasy-stat-row">
                        <span className={isMobile ? 'small' : ''}>Последнее обновление:</span>
                        <span className="fantasy-badge fantasy-badge-secondary">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center fantasy-text-muted py-4">
                    <div className={`mb-3 ${isMobile ? 'fs-3' : 'fs-1'}`}>📊</div>
                    <h5 className={`fantasy-text-dark mb-2 ${isMobile ? 'fs-6' : ''}`}>
                      История курса пока недоступна
                    </h5>
                    <p className={`fantasy-text-muted ${isMobile ? 'small' : ''}`}>
                      Совершите первую сделку, чтобы начать отслеживать изменения курса
                    </p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Остальные карточки - адаптивные колонки */}
      <Row className="g-3">
        {/* Текущий курс и торговля */}
        <Col xs={12} md={6} lg={4}>
          <Card className="fantasy-card h-100">
            <Card.Header className="birzha-card-header birzha-card-header-primary">
              <Card.Title className="fantasy-text-gold d-flex align-items-center">
                <span className="me-2">💰</span>
                <span className={isMobile ? 'fs-6' : ''}>Текущий курс</span>
              </Card.Title>
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              {rateData && (
                <div className="mb-3">
                  <div className="fantasy-stat-row">
                    <span className={isMobile ? 'small' : ''}>Базовый курс:</span>
                    <span className="fantasy-badge fantasy-badge-primary">
                      {rateData.current_rate}🌕/100💎
                    </span>
                  </div>
                  <div className="fantasy-stat-row">
                    <span className={isMobile ? 'small' : ''}>Покупка:</span>
                    <span className="fantasy-badge fantasy-badge-success">
                      {rateData.buy_rate}🌕
                    </span>
                  </div>
                  <div className="fantasy-stat-row">
                    <span className={isMobile ? 'small' : ''}>Продажа:</span>
                    <span className="fantasy-badge fantasy-badge-warning">
                      {rateData.sell_rate}🌕
                    </span>
                  </div>
                </div>
              )}

              <div className="d-grid gap-2 mt-auto">
                <Button 
                  className={`fantasy-btn fantasy-btn-success ${isMobile ? 'py-2' : ''}`}
                  onClick={handleBuy}
                  disabled={trading || !playerData || playerData.money < (rateData?.buy_rate || 0)}
                >
                  {trading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      {isMobile ? '...' : 'Покупка...'}
                    </>
                  ) : (
                    `${isMobile ? 'Купить' : 'Купить 100💎'}`
                  )}
                </Button>
                <Button 
                  className={`fantasy-btn fantasy-btn-warning ${isMobile ? 'py-2' : ''}`}
                  onClick={handleSell}
                  disabled={trading || !playerData || playerData.daleons < 100}
                >
                  {trading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      {isMobile ? '...' : 'Продажа...'}
                    </>
                  ) : (
                    `${isMobile ? 'Продать' : 'Продать 100💎'}`
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Ваши ресурсы */}
        <Col xs={12} md={6} lg={4}>
          <Card className="fantasy-card h-100">
            <Card.Header className="birzha-card-header birzha-card-header-secondary">
              <Card.Title className="fantasy-text-gold d-flex align-items-center">
                <span className="me-2">📊</span>
                <span className={isMobile ? 'fs-6' : ''}>Ваши ресурсы</span>
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {playerData && (
                <div>
                  <div className="fantasy-stat-row">
                    <span className={isMobile ? 'small' : ''}>Монеты:</span>
                    <span className="fantasy-badge fantasy-badge-primary">
                      {playerData.money}🌕
                    </span>
                  </div>
                  <div className="fantasy-stat-row">
                    <span className={isMobile ? 'small' : ''}>Далеоны:</span>
                    <span className="fantasy-badge fantasy-badge-warning">
                      {playerData.daleons}💎
                    </span>
                  </div>
                  
                  {/* Индикаторы доступности */}
                  <div className="mt-3 p-2 birzha-balance-info">
                    <h6 className={`fantasy-text-dark mb-2 ${isMobile ? 'fs-6' : ''}`}>
                      Доступность:
                    </h6>
                    <div className="fantasy-stat-row">
                      <span className={isMobile ? 'small' : ''}>Можно купить:</span>
                      <span className={`birzha-balance-indicator ${
                        playerData.money >= (rateData?.buy_rate || 0) ? 'birzha-balance-positive' : 'birzha-balance-negative'
                      }`}>
                        {playerData.money >= (rateData?.buy_rate || 0) ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="fantasy-stat-row">
                      <span className={isMobile ? 'small' : ''}>Можно продать:</span>
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
        <Col xs={12} lg={4}>
          <Card className="birzha-card h-100">
            <Card.Header className="birzha-card-header">
              <Card.Title className="fantasy-text-gold d-flex align-items-center">
                <span className="me-2">ℹ️</span>
                <span className={isMobile ? 'fs-6' : ''}>О бирже</span>
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="birzha-info">
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className={`birzha-info-text ${isMobile ? 'small' : ''}`}>
                    Обмен блоками по 100 далеонов
                  </span>
                </div>
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className={`birzha-info-text ${isMobile ? 'small' : ''}`}>
                    Курс изменяется после каждой операции
                  </span>
                </div>
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className={`birzha-info-text ${isMobile ? 'small' : ''}`}>
                    Покупка: курс +1%
                  </span>
                </div>
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className={`birzha-info-text ${isMobile ? 'small' : ''}`}>
                    Продажа: курс -1%
                  </span>
                </div>
                <div className="birzha-info-item">
                  <span className="birzha-info-icon">•</span>
                  <span className={`birzha-info-text ${isMobile ? 'small' : ''}`}>
                    График в реальном времени
                  </span>
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