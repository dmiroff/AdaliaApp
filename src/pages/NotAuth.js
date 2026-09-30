import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Collapse, Form, Spinner } from "react-bootstrap";
import { Context } from "../index";
import PlayerLoginWithCredentials from "../http/PlayerLoginWithCredentials";

const NotAuth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showManualLogin, setShowManualLogin] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(Context);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await PlayerLoginWithCredentials(username, password);

      if (result.success) {
        user.setIsAuth(true);
        user.setUser({ id: result.playerId, username: result.username });
        navigate("/inventory", { replace: true });
      } else {
        setError(result.message || "Неверный логин или пароль");
      }
    } catch (loginError) {
      console.error("Ошибка авторизации:", loginError);
      setError("Не удалось войти. Проверьте соединение и попробуйте ещё раз.");
      setShowManualLogin(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-screen" aria-labelledby="login-title">
      <Card className="login-card">
        <Card.Body>
          <div className="login-card__emblem" aria-hidden="true">A</div>
          <h1 id="login-title" className="login-card__title">Вход в Адалию</h1>
          <p className="login-card__lead">
            Основной способ входа — персональная ссылка из игрового бота.
          </p>
          <Alert variant="info" className="login-card__hint" role="note">
            <strong>Как войти с телефона</strong>
            <span>Откройте персональную ссылку в последнем сообщении игрового бота.</span>
            <small>Если ссылка устарела, запросите у бота новую — логин и пароль вводить не потребуется.</small>
          </Alert>

          <Button
            type="button"
            className="login-card__manual-toggle"
            aria-expanded={showManualLogin}
            aria-controls="manual-login-form"
            onClick={() => setShowManualLogin((isShown) => !isShown)}
          >
            <span>Войти вручную</span>
            <span aria-hidden="true">{showManualLogin ? "−" : "+"}</span>
          </Button>

          <Collapse in={showManualLogin}>
            <div id="manual-login-form" className="login-card__manual-form">
              <div className="login-card__divider"><span>логин и пароль</span></div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="login-username">
                  <Form.Label>Имя пользователя</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Введите имя пользователя"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                    disabled={loading}
                    className="fantasy-input"
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="login-password">
                  <Form.Label>Пароль</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="fantasy-input"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="fantasy-btn login-card__submit"
                >
                  {loading && <Spinner animation="border" size="sm" className="me-2" />}
                  {loading ? "Входим…" : "Войти"}
                </Button>
              </Form>
            </div>
          </Collapse>
        </Card.Body>
      </Card>
    </section>
  );
};

export default NotAuth;
