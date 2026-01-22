import React, { useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Context } from '../index';
import { refreshAccessToken, verifyToken } from '../http/PlayerAuthCheck';

const AuthChecker = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
