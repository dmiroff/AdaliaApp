import React, { useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PlayerAuthCheck from "../http/PlayerAuthCheck"; // Import PlayerAuthCheck
import { Context } from "../index";

const Auth = () => {
  const { id, token } = useParams(); // Get ID and token from URL params
  const navigate = useNavigate(); // For programmatic navigation
  const { user } = useContext(Context);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const isAuthorized = await PlayerAuthCheck(id, token); // Use PlayerAuthCheck to authenticate
        localStorage.setItem("id", id)
        localStorage.setItem("token", token)

        if (isAuthorized) {
            user.setIsAuth(true);
            user.setUser({ id: id });
          navigate("/prepare"); // Navigate to inventory if authorized
        } else {
          navigate("/rating"); // Redirect to rating if not authorized
        }
      } catch (error) {
        console.error("Error during authentication:", error);
        navigate("/rating"); // Redirect to rating if there's an error
      }
    };

    authenticateUser(); // Trigger authentication when the component is mounted
  },); // Ensure correct dependencies

  return (
    <div>
      Auth Page - Authenticating...
    </div>
  );
};

export default Auth;
