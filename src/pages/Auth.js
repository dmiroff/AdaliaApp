import React, { useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlayerAuthCheck from "../http/PlayerAuthCheck"; // Import PlayerAuthCheck
import { Context } from "../index";
import { Spinner } from 'react-bootstrap';

const Auth = () => {
  const { id, token } = useParams(); // Get ID and token from URL params
  const navigate = useNavigate(); // For programmatic navigation
  const { user } = useContext(Context);

  useEffect(() => {
    if (!id || !token || user.isAuth) {
      // If ID or token is null or user is already authorized, do nothing
      return;
    }

    const authenticateUser = async () => {
      try {
        const isAuthorized = await PlayerAuthCheck(id, token); // Use PlayerAuthCheck to authenticate
        localStorage.setItem("id", id);
        localStorage.setItem("token", token);
        setTimeout(() => {
          if (isAuthorized) {
            user.setIsAuth(true);
            user.setUser({ id: id });
            navigate("/prepare"); // Navigate to inventory if authorized
          } else {
            navigate("/rating"); // Redirect to rating if not authorized
          }
        }, 2000);
      } catch (error) {
        console.error("Error during authentication:", error);
        navigate("/rating"); // Redirect to rating if there's an error
      }
    };

    if (id)
    {
      authenticateUser(); // Trigger authentication when the component is mounted
    }
  }, [id, token, user.isAuth, navigate]); // Ensure correct dependencies

  return <Spinner animation='grow'></Spinner>
};


export default Auth;
