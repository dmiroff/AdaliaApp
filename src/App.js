import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { GAME_DRAFT_ROUTE, isGameDraftEnabled } from './utils/gameDraftProtocol';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { Container } from 'react-bootstrap';
import backgroundImage from './assets/Images/background.webp';
import mobileBackgroundImage from './assets/Images/background-mobile.webp';
import './App.css';

const GameDraft = React.lazy(() => import('./pages/GameDraft'));

const AppContent = () => {
  const { pathname } = useLocation();
  return isGameDraftEnabled() && pathname === GAME_DRAFT_ROUTE
    ? <Suspense fallback={<p className="fantasy-text-gold p-4">Загружаем игровой чат…</p>}><GameDraft /></Suspense>
    : <AppRouter />;
};

const App = () => {
  return (
    <div
      className="app-container"
      style={{
        '--app-background-image': `url(${backgroundImage})`,
        '--app-background-mobile-image': `url(${mobileBackgroundImage})`,
      }}
    >
      <BrowserRouter>
        <NavBar />
        <Container fluid="xxl" className="main-content">
          <AppContent />
        </Container>
        <Footer />
      </BrowserRouter>
    </div>
  );
};

export default App;
