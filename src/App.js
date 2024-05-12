import './App.css';
import { BrowserRouter, useNavigate } from 'react-router-dom'; // Import useNavigate directly
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useState } from 'react';
import { Checker } from './http/UserAPI';
import { Context } from './index';

const App = observer(() => {
  const [loading, setLoading] = useState(true);
  const [userCheckSuccess, setUserCheckSuccess] = useState(false); // Flag to indicate user check success
  const { user } = useContext(Context);
  const [shouldNavigate, setShouldNavigate] = useState(false); // State variable to control navigation

  useEffect(() => {
    Checker()
      .then(() => {
        console.log("User access checked successfully");
        const id = localStorage.getItem("id");
        console.log(user.IsAuth)
        if (!user.IsAuth) {
          setUserCheckSuccess(true);
          console.log("Redirecting to prepare");} // Set the flag to true upon successful user check
        user.setIsAuth(true);
        user.setUser({ id: id });
      })
      .catch((error) => {
        console.error("Error checking user access:", error);
        setUserCheckSuccess(false); // Set the flag to false upon failed user check
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

  console.log(shouldNavigate); 

  return (
    <BrowserRouter>
      <NavBar />
      <AppRouter />
      {/* Navigation within the context of the BrowserRouter */}
      {shouldNavigate && <NavigateToPrepare />}
    </BrowserRouter>
  );
});

const NavigateToPrepare = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/prepare");
  }, [navigate]);
  return null; // This component doesn't render anything
};

const NavigateToRating = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/rating");
  }, [navigate]);
  return null; // This component doesn't render anything
};

export default App;
