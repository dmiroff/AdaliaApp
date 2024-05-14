import './App.css';
import { BrowserRouter, useNavigate } from 'react-router-dom'; // Import useNavigate directly
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useState } from 'react';
import { Checker } from './http/UserAPI';
import { Context } from './index';
import { Spinner } from 'react-bootstrap';

const App = observer(() => {
  const [loading, setLoading] = useState(true);
  const [userCheckSuccess, setUserCheckSuccess] = useState(false); // Flag to indicate user check success
  const [shouldNavigate, setShouldNavigate] = useState(false); // State variable to control navigation
  const { user } = useContext(Context);

  useEffect(() => {
    Checker()
      .then(() => {
        console.log("User access checked successfully");
        const id = localStorage.getItem("id");
        if (!user.IsAuth){
          setUserCheckSuccess(true); // Set userCheckSuccess based on user.IsAuth
        }
        user.setIsAuth(true);
        user.setUser({ id: id });
      })
      .catch((error) => {
        console.error("Error checking user access:", error);
      })
      .finally(() => setLoading(false));
  }, []); // Ensure correct dependencies

  useEffect(() => {
    // Perform navigation after the component has mounted
    if (userCheckSuccess) {
      setShouldNavigate(true);
    } else {
      setShouldNavigate(false);
    }
  }, [userCheckSuccess]);

  if (loading) {
    return <Spinner animation='grow'></Spinner>
  } else {
    return (
      <BrowserRouter>
        <NavBar />
        <AppRouter />
        {shouldNavigate && <NavigateToPrepare setShouldNavigate={setShouldNavigate} />}
      </BrowserRouter>
    );
  }
});

const NavigateToPrepare = ({ setShouldNavigate }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/prepare");
    // Reset shouldNavigate to false when the component unmounts
    return () => {
      setShouldNavigate(false);
    };
  }, [navigate, setShouldNavigate]);
  return null; // This component doesn't render anything
};

export default App;
