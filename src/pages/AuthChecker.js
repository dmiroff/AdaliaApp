import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import PlayerAuthCheck from "../http/PlayerAuthCheck"; // Import PlayerAuthCheck
import { Context } from '../index';

const AuthChecker = () => {
  const navigate = useNavigate();
  const { user } = useContext(Context);

  useEffect(() => {
    const id = localStorage.getItem('id');
    const token = localStorage.getItem('token');

    const check = async () => {
      if (id && token) {
        const isAuthorized = await PlayerAuthCheck(id, token);
        if (isAuthorized) {
          user.setIsAuth(true);
          navigate('/inventory');
        } else {
          navigate('/notauth');
        }
      } else {
        navigate('/notauth');
      }
    };

    check();
  }, [navigate]);

  return <div>Проверка авторизации...</div>;
};

export default AuthChecker
