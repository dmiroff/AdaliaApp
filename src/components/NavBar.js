import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Nav, Navbar, Button, Offcanvas } from "react-bootstrap";
import SettingsModal from "./SettingsModal";
import { Context } from "../index";

const navigationItems = [
  ["/inventory", "Инвентарь"],
  ["/character", "Персонаж"],
  ["/guild", "Гильдия"],
  ["/map", "Карта"],
  ["/rating", "Рейтинг"],
  ["/trade", "Торговля"],
  ["/donation", "💎 Магазин"],
];

const mobilePrimaryItems = [
  ["/inventory", "🎒", "Инвентарь"],
  ["/character", "🛡️", "Персонаж"],
  ["/guild", "🏰", "Гильдия"],
];

const mobileMoreItems = [
  ["/map", "🗺️", "Карта"],
  ["/rating", "🏆", "Рейтинг"],
  ["/trade", "⚖️", "Торговля"],
  ["/donation", "💎", "Магазин"],
];

const NavBar = observer(() => {
  const { user } = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("has-mobile-bottom-nav", user.IsAuth);
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, [user.IsAuth]);

  const handleSettingsClick = () => {
    setShowMobileMore(false);
    setShowSettings(true);
  };

  const handleNavLinkClick = (path) => {
    setShowMobileMore(false);
    navigate(path);
  };

  const moreSectionIsActive = mobileMoreItems.some(([path]) => location.pathname.startsWith(path));

  return (
    <>
      <Navbar 
        className="fantasy-navbar"
        variant="dark"
      >
        <div className="fantasy-navbar__inner">
          <Navbar.Brand onClick={() => user.IsAuth && handleNavLinkClick('/inventory')}>
            <span className="fantasy-navbar__crest" aria-hidden="true">A</span>
            <span className="fantasy-navbar__title">Адалия</span>
          </Navbar.Brand>

          {user.IsAuth && (
            <div className="fantasy-navbar__desktop d-none d-lg-flex">
              <Nav className="fantasy-navbar__links">
                {navigationItems.map(([path, label]) => (
                  <Nav.Link
                    key={path}
                    active={location.pathname.startsWith(path)}
                    onClick={() => handleNavLinkClick(path)}
                    className="fantasy-navbar__link"
                  >
                    {label}
                  </Nav.Link>
                ))}
              </Nav>

              <Button
                onClick={handleSettingsClick}
                className="fantasy-navbar__settings"
                title="Настройки"
                aria-label="Настройки"
              >
                <span aria-hidden="true">⚙️</span>
              </Button>
            </div>
          )}
        </div>
      </Navbar>

      {user.IsAuth && (
        <nav className="mobile-bottom-nav d-lg-none" aria-label="Основная навигация">
          {mobilePrimaryItems.map(([path, icon, label]) => (
            <button
              key={path}
              type="button"
              className={`mobile-bottom-nav__item ${location.pathname.startsWith(path) ? "is-active" : ""}`}
              onClick={() => handleNavLinkClick(path)}
              aria-current={location.pathname.startsWith(path) ? "page" : undefined}
            >
              <span className="mobile-bottom-nav__icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            className={`mobile-bottom-nav__item ${moreSectionIsActive ? "is-active" : ""}`}
            onClick={() => setShowMobileMore(true)}
            aria-expanded={showMobileMore}
            aria-controls="mobile-more-navigation"
          >
            <span className="mobile-bottom-nav__icon" aria-hidden="true">☰</span>
            <span>Ещё</span>
          </button>
        </nav>
      )}

      <Offcanvas
        id="mobile-more-navigation"
        show={showMobileMore}
        onHide={() => setShowMobileMore(false)}
        placement="bottom"
        className="mobile-more-sheet d-lg-none"
        aria-labelledby="mobile-more-title"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title id="mobile-more-title">Разделы Адалии</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="mobile-more-sheet__grid">
            {mobileMoreItems.map(([path, icon, label]) => (
              <button
                key={path}
                type="button"
                className={location.pathname.startsWith(path) ? "is-active" : ""}
                onClick={() => handleNavLinkClick(path)}
              >
                <span aria-hidden="true">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <Button className="mobile-more-sheet__settings" onClick={handleSettingsClick}>
            <span aria-hidden="true">⚙️</span>
            Настройки
          </Button>
        </Offcanvas.Body>
      </Offcanvas>

      {user.IsAuth && (
        <SettingsModal
          show={showSettings}
          onHide={() => setShowSettings(false)}
        />
      )}
    </>
  );
});

export default NavBar;
