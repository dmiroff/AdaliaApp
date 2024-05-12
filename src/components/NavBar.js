import React, { useContext } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom"; // Import useNavigate for absolute navigation
import { Context } from "../index";
import { Button, Container, Nav, Navbar, NavDropdown } from "react-bootstrap";

const NavBar = observer(() => {
  const { user } = useContext(Context);
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  return (
    <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand onClick={() => navigate("/inventory")}> {/* Use onClick to navigate */}
          Инвентарь
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => navigate("/character")}> {/* Absolute navigation */}
              Персонаж
            </Nav.Link>
            <Nav.Link onClick={() => navigate("/rating")}> {/* Absolute navigation */}
              Рейтинг
            </Nav.Link>
            <NavDropdown title="Dropdown" id="collapsible-nav-dropdown">
              <NavDropdown.Item onClick={() => navigate("/action/3.1")}>Action</NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate("/action/3.2")}>Another action</NavDropdown.Item>
              <NavDropdown.Item onClick={() => navigate("/action/3.3")}>Something</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={() => navigate("/action/3.4")}>
                Separated link
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {user.IsAuth ? (
            <Nav className="ml-auto" style={{ color: "dark" }}>
              <Button
                variant={"outline-dark"}
                className="ml-2"
                onClick={() => navigate("/admin-panel")} // Navigate to a specific path
              >
                АдминПанель
              </Button>
              <Button
                variant={"outline-dark"}
                className="ml-2"
                onClick={() => {
                  user.setIsAuth(false);
                  navigate("/"); // Redirect to home or another path on logout
                }}
              >
                Выйти
              </Button>
            </Nav>
          ) : (
            <Nav className="ml-auto" style={{ color: "white" }}>
              <Button
                variant={"outline-dark"}
                onClick={() => {
                  //user.setIsAuth(true);
                  navigate("/auth"); // Navigate to an authentication page
                }}
              >
                Авторизация
              </Button>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
});

export default NavBar;
