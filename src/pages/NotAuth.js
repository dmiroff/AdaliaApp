import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../index";
import { Spinner, Form, Button, Alert, Card } from 'react-bootstrap';
import PlayerLoginWithCredentials from "../http/PlayerLoginWithCredentials";

const NotAuth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  
  const navigate = useNavigate();
  const { user } = useContext(Context);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await PlayerLoginWithCredentials(username, password);
      
      if (result.success) {
        // Устанавливаем авторизацию в контексте
        user.setIsAuth(true);
        user.setUser({ 
          id: result.playerId, 
          username: result.username 
        });
        
        navigate("/inventory"); // Перенаправляем на инвентарь
      } else {
        setError(result.message || "Неверный логин или пароль");
      }
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      setError("Произошла ошибка при авторизации");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Пароли не совпадают");
      return;
    }
    
    if (registerPassword.length < 6) {
      setRegisterError("Пароль должен содержать минимум 6 символов");
      return;
    }
    
    setRegisterLoading(true);
    setRegisterError("");
    setRegisterSuccess("");
    
    try {
      // Используйте вашу функцию регистрации, если она есть
      const response = await fetch(`${process.env.REACT_APP_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerUsername,
          password: registerPassword
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 200) {
        setRegisterSuccess(`Регистрация успешна! Ваш ID: ${data.player_id}, токен: ${data.token}`);
        setRegisterUsername("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
        
        // Можно автоматически войти после регистрации
        setTimeout(() => {
          setShowRegister(false);
        }, 3000);
      } else {
        setRegisterError(data.detail || "Ошибка регистрации");
      }
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      setRegisterError("Ошибка при регистрации. Попробуйте позже.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="fantasy-attributes-grid">
      {!showRegister ? (
        <Card className="login-container" style={{
          maxWidth: '400px',
          margin: '0 auto',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(244, 228, 188, 0.95) 0%, rgba(230, 210, 169, 0.98) 100%)',
          border: '2px solid var(--color-accent-bronze)',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(139, 69, 19, 0.4)'
        }}>
          <Card.Body>
            <h3 className="fantasy-text-gold mb-3 text-center" style={{
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
              color: 'var(--color-accent-gold)'
            }}>
              Вход в систему
            </h3>
            
            <p className="fantasy-text-muted text-center mb-4" style={{
              color: 'var(--color-text-light)'
            }}>
              Доступ только для авторизованных пользователей
            </p>
            
            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}
            
            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Label className="fantasy-text-bold">
                  Имя пользователя
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Введите имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  className="fantasy-input"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fantasy-text-bold">
                  Пароль
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="fantasy-input"
                />
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || !username || !password}
                className="w-100 fantasy-btn"
                style={{
                  padding: '0.75rem',
                  fontSize: '1.1rem'
                }}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Вход...
                  </>
                ) : (
                  "Войти"
                )}
              </Button>
            </Form>
            
            <div className="mt-4 text-center">
              <p className="fantasy-text-muted mb-2">
                Нет аккаунта?
              </p>
              <Button 
                variant="outline-secondary" 
                className="fantasy-btn"
                onClick={() => setShowRegister(true)}
              >
                Зарегистрироваться
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="register-container" style={{
          maxWidth: '400px',
          margin: '0 auto',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(244, 228, 188, 0.95) 0%, rgba(230, 210, 169, 0.98) 100%)',
          border: '2px solid var(--color-accent-bronze)',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(139, 69, 19, 0.4)'
        }}>
          <Card.Body>
            <h3 className="fantasy-text-gold mb-3 text-center">
              Регистрация
            </h3>
            
            {registerError && (
              <Alert variant="danger" className="mb-3">
                {registerError}
              </Alert>
            )}
            
            {registerSuccess && (
              <Alert variant="success" className="mb-3">
                {registerSuccess}
              </Alert>
            )}
            
            <Form onSubmit={handleRegister}>
              <Form.Group className="mb-3">
                <Form.Label className="fantasy-text-bold">
                  Имя пользователя
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Придумайте имя пользователя"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  required
                  disabled={registerLoading}
                  className="fantasy-input"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fantasy-text-bold">
                  Пароль
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Придумайте пароль (мин. 6 символов)"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  disabled={registerLoading}
                  className="fantasy-input"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fantasy-text-bold">
                  Подтверждение пароля
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Повторите пароль"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                  disabled={registerLoading}
                  className="fantasy-input"
                />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button 
                  variant="secondary" 
                  type="button"
                  className="fantasy-btn"
                  onClick={() => setShowRegister(false)}
                  disabled={registerLoading}
                >
                  Назад
                </Button>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={registerLoading || !registerUsername || !registerPassword || !registerConfirmPassword}
                  className="flex-grow-1 fantasy-btn"
                >
                  {registerLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Регистрация...
                    </>
                  ) : (
                    "Зарегистрироваться"
                  )}
                </Button>
              </div>
            </Form>
            
            <div className="mt-4">
              <Alert variant="info" className="fantasy-text-muted small">
                После регистрации вы получите ID и токен для авторизации по ссылке.
                Сохраните их в надежном месте!
              </Alert>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default NotAuth;