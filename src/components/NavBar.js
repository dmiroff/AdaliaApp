import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";

const NavBar = observer(() => {
  const navigate = useNavigate();

  return (
    <Navbar collapseOnSelect expand="lg" className="fantasy-navbar">
      <Container>
        <Navbar.Toggle 
          aria-controls="responsive-navbar-nav" 
          className="fantasy-btn fantasy-btn-sm"
        />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              eventKey="inventory" 
              onClick={() => navigate("/inventory")}
              className="fantasy-btn fantasy-btn-primary fantasy-btn-sm mx-1"
            >
              Инвентарь
            </Nav.Link>
            <Nav.Link 
              eventKey="character" 
              onClick={() => navigate("/character")}
              className="fantasy-btn fantasy-btn-success fantasy-btn-sm mx-1"
            >
              Персонаж
            </Nav.Link>
            <Nav.Link 
              eventKey="rating" 
              onClick={() => navigate("/rating")}
              className="fantasy-btn fantasy-btn-info fantasy-btn-sm mx-1"
            >
              Рейтинг
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
});

export default NavBar;