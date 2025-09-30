import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Nav, Navbar } from "react-bootstrap";

const NavBar = observer(() => {
  const navigate = useNavigate();

  return (
    <Navbar collapseOnSelect expand="lg" className="fantasy-navbar">
      {/* Убираем Container чтобы на мобильных не было ограничений */}
      <Navbar.Toggle 
        aria-controls="responsive-navbar-nav" 
        className="fantasy-btn fantasy-btn-lg w-100" // Добавляем w-100 для полной ширины
      />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="w-100"> {/* Полная ширина для навигации */}
          <Nav.Link 
            eventKey="inventory" 
            onClick={() => navigate("/inventory")}
            className="fantasy-btn fantasy-btn-primary fantasy-btn-lg mx-0 my-1 w-100" // Полная ширина для кнопок
          >
            Инвентарь
          </Nav.Link>
          <Nav.Link 
            eventKey="character" 
            onClick={() => navigate("/character")}
            className="fantasy-btn fantasy-btn-success fantasy-btn-lg mx-0 my-1 w-100"
          >
            Персонаж
          </Nav.Link>
          <Nav.Link 
            eventKey="rating" 
            onClick={() => navigate("/rating")}
            className="fantasy-btn fantasy-btn-info fantasy-btn-lg mx-0 my-1 w-100"
          >
            Рейтинг
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
});

export default NavBar;