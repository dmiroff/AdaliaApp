import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
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
    paddingTop: '56px' // Высота navbar
  };

  return (
    <div style={appStyle}>
      <Container className="main-container">
        <BrowserRouter>
          <NavBar />
          <AppRouter />
        </BrowserRouter>
      </Container>
    </div>
  );
});

export default App;