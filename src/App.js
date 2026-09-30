import { BrowserRouter } from 'react-router-dom';
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import { Container } from 'react-bootstrap';
import backgroundImage from './assets/Images/background.webp';
import mobileBackgroundImage from './assets/Images/background-mobile.webp';
import './App.css';

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
          <AppRouter />
        </Container>
        <Footer />
      </BrowserRouter>
    </div>
  );
};

export default App;
