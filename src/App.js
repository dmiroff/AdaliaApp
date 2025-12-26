import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
import Footer from './components/Footer'; // Импорт футера
import { observer } from 'mobx-react-lite';
import { Container } from 'react-bootstrap';
import backgroundImage from './assets/Images/background.webp';
import './App.css';

const App = observer(() => {
  const appStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div style={appStyle} className="app-container">
      <BrowserRouter>
        <NavBar />
        <Container className="main-content py-4">
          <AppRouter />
        </Container>
        <Footer />
      </BrowserRouter>
    </div>
  );
});

export default App;