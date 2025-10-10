import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Nav, Navbar } from "react-bootstrap";

const NavBar = observer(() => {
  const navigate = useNavigate();
  const navLinkStyle = {
    background: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)',
    border: '2px solid #000000',
    color: '#ffd700'
  };

  return (
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
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-0 my-1 w-100"
            style={navLinkStyle}
          >
            Инвентарь
          </Nav.Link>
          <Nav.Link 
            eventKey="character" 
            onClick={() => navigate("/character")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-0 my-1 w-100"
            style={navLinkStyle}
          >
            Персонаж
          </Nav.Link>
          <Nav.Link 
            eventKey="rating" 
            onClick={() => navigate("/rating")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-0 my-1 w-100"
            style={navLinkStyle}
          >
            Рейтинг
          </Nav.Link>
          <Nav.Link 
            eventKey="trade" 
            onClick={() => navigate("/trade")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-0 my-1 w-100"
            style={navLinkStyle}
          >
            Торговля
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
});

export default NavBar;