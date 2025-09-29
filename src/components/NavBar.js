import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom"; // Import useNavigate for absolute navigation
import { Container, Nav, Navbar} from "react-bootstrap";

const NavBar = observer(() => {
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  return (
    <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link eventKey="inventory" onClick={() => navigate("/inventory")}> {/* Absolute navigation */}
              Инвентарь
            </Nav.Link>
            <Nav.Link eventKey="character" onClick={() => navigate("/character")}> {/* Absolute navigation */}
              Персонаж
            </Nav.Link>
            <Nav.Link eventKey="rating" onClick={() => navigate("/rating")}> {/* Absolute navigation */}
              Рейтинг
            </Nav.Link>
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
});

export default NavBar;
