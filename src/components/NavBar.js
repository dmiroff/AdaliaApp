import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Nav, Navbar, Button } from "react-bootstrap";
import { useState } from "react";
import SettingsModal from "./SettingsModal";

const NavBar = observer(() => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  return (
    <>
      <Navbar collapseOnSelect expand="lg" className="fantasy-navbar">
        <Navbar.Toggle 
          aria-controls="responsive-navbar-nav" 
          className="fantasy-btn fantasy-btn-lg w-100"
        />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="w-100">
            <Nav.Link 
              eventKey="inventory" 
              onClick={() => navigate("/inventory")}
              className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            >
              Инвентарь
            </Nav.Link>
            <Nav.Link 
              eventKey="character" 
              onClick={() => navigate("/character")}
              className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            >
              Персонаж
            </Nav.Link>
            <Nav.Link 
              eventKey="map" 
              onClick={() => navigate("/map")}
              className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            >
              Карта
            </Nav.Link>
            <Nav.Link 
              eventKey="rating" 
              onClick={() => navigate("/rating")}
              className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            >
              Рейтинг
            </Nav.Link>
            <Nav.Link 
              eventKey="trade" 
              onClick={() => navigate("/trade")}
              className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            >
              Торговля
            </Nav.Link>
            <Nav.Link 
              eventKey="donation" 
              onClick={() => navigate("/donation")}
              className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            >
              💎 Магазин
            </Nav.Link>
          </Nav>
          
          {/* Компактная кнопка настроек для десктопа */}
          <Button
            onClick={handleSettingsClick}
            className="navbar-settings-btn d-lg-block d-none"
            title="Настройки"
          >
            ⚙️
          </Button>

          {/* Полноразмерная кнопка настроек для мобильных */}
          <div className="d-flex justify-content-center mt-3 w-100 d-lg-none">
            <Button
              onClick={handleSettingsClick}
              className="fantasy-btn fantasy-btn-info w-100"
              style={{ maxWidth: '200px' }}
            >
              ⚙️ Настройки
            </Button>
          </div>
        </Navbar.Collapse>
      </Navbar>

      <SettingsModal 
        show={showSettings} 
        onHide={() => setShowSettings(false)} 
      />
    </>
  );
});

export default NavBar;