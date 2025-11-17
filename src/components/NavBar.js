import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Nav, Navbar } from "react-bootstrap";

const NavBar = observer(() => {
  const navigate = useNavigate();
  const navLinkStyle = {
  background: 'linear-gradient(180deg, #dd9a35ff 0%, #795725ff 100%)',
  border: '1px solid #000000',
  color: '#000000ff',
  fontFamily: "georgia, serif",
  fontWeight: 'bold',
  fontStyle: 'normal',  
  textTransform: 'uppercase',
};

  return (
    <Navbar collapseOnSelect expand="lg" className="fantasy-navbar">
      <Navbar.Toggle 
        aria-controls="responsive-navbar-nav" 
        className="fantasy-btn fantasy-btn-lg w-100"
        style={{
              ...navLinkStyle,
              fontWeight: 'bold'
            }}

      />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="w-100">
          <Nav.Link 
            eventKey="inventory" 
            onClick={() => navigate("/inventory")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            style={{
              ...navLinkStyle,
              fontWeight: 'bold'
            }}
          >
            Инвентарь
          </Nav.Link>
          <Nav.Link 
            eventKey="character" 
            onClick={() => navigate("/character")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            style={{
              ...navLinkStyle,
              fontWeight: 'bold'
            }}
          >
            Персонаж
          </Nav.Link>
          <Nav.Link 
            eventKey="map" 
            onClick={() => navigate("/map")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            style={{
              ...navLinkStyle,
              fontWeight: 'bold'
            }}
          >
            Карта
          </Nav.Link>
          <Nav.Link 
            eventKey="rating" 
            onClick={() => navigate("/rating")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            style={{
              ...navLinkStyle,
              fontWeight: 'bold'
            }}
          >
            Рейтинг
          </Nav.Link>
          <Nav.Link 
            eventKey="trade" 
            onClick={() => navigate("/trade")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            style={{
              ...navLinkStyle,
              fontWeight: 'bold'
            }}
          >
            Торговля
          </Nav.Link>
          <Nav.Link 
            eventKey="donation" 
            onClick={() => navigate("/donation")}
            className="fantasy-btn fantasy-btn-warning fantasy-btn-lg mx-1 my-1 w-100"
            style={{
              ...navLinkStyle,
              fontWeight: 'bold'
            }}
          >
            💎 Премиум
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
});

export default NavBar;