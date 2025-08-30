import './App.css';
import { BrowserRouter } from 'react-router-dom'; // Import useNavigate directly
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
import { observer } from 'mobx-react-lite';
import { Container } from 'react-bootstrap';

const App = observer(() => {

    return (
      <Container className="main-container">
        <BrowserRouter>
          <NavBar />
          <AppRouter />
        </BrowserRouter>
      </Container>
    );
});


export default App;
