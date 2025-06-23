import './App.css';
import { BrowserRouter, useNavigate } from 'react-router-dom'; // Import useNavigate directly
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useState } from 'react';
import { Checker } from './http/UserAPI';
import { Context } from './index';
import { Container, Spinner } from 'react-bootstrap';

const App = observer(() => {
  const [loading, setLoading] = useState(true);
  const { user } = useContext(Context);

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
