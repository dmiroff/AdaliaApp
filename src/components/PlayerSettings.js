// src/components/PlayerSettings.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col, Accordion } from "react-bootstrap";
import { getPlayerSettings, updatePlayerSettings } from "../http/playerSettingsApi";

const PlayerSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getPlayerSettings();
      setSettings(response.data);
    } catch (err) {
      console.error("Ошибка загрузки настроек:", err);
      // Создаем дефолтные настройки для отображения
      setSettings({
        log_type: "compact",
        show_dice_images: true,
        show_item_images: true,
        language: "ru",
        theme: "fantasy",
        notifications_enabled: true,
        sound_enabled: true,
        auto_collect_loot: false,
        available_images: [],
        current_image: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const formData = new FormData(e.target);
      const settingsData = {
        log_type: formData.get("log_type"),
        show_dice_images: formData.get("show_dice_images") === "on",
        show_item_images: formData.get("show_item_images") === "on",
        language: formData.get("language"),
        theme: formData.get("theme"),
        notifications_enabled: formData.get("notifications_enabled") === "on",
        sound_enabled: formData.get("sound_enabled") === "on",
        auto_collect_loot: formData.get("auto_collect_loot") === "on"
      };

      const response = await updatePlayerSettings(settingsData);
      setSettings(response.data);
      setSuccess("Настройки успешно сохранены!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Ошибка при сохранении настроек");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="info" />
        <p className="mt-2">Загрузка настроек...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {success && <Alert variant="success" className="mb-3">{success}</Alert>}
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Accordion defaultActiveKey="0" className="mb-3">
          {/* Настройки отображения */}
          <Accordion.Item eventKey="0" className="fantasy-card">
            <Accordion.Header className="fantasy-card-header">
              <h5 className="mb-0">📊 Настройки отображения</h5>
            </Accordion.Header>
            <Accordion.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Тип лога:</Form.Label>
                    <Form.Select name="log_type" defaultValue={settings.log_type || "compact"}>
                      <option value="compact">Компактный (рекомендуется)</option>
                      <option value="detailed">Подробный</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Компактный лог показывает только основные события, подробный — все детали
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Тема оформления:</Form.Label>
                    <Form.Select name="theme" defaultValue={settings.theme || "fantasy"}>
                      <option value="fantasy">Фэнтези (стандартная)</option>
                      <option value="dark">Тёмная</option>
                      <option value="light">Светлая</option>
                      <option value="winter">Зимняя</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      name="show_dice_images"
                      label="Показывать изображения кубиков"
                      defaultChecked={settings.show_dice_images !== false}
                      className="mb-3"
                    />
                    <Form.Text className="text-muted">
                      Отображать графические изображения кубиков при бросках
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      name="show_item_images"
                      label="Показывать изображения предметов"
                      defaultChecked={settings.show_item_images !== false}
                    />
                    <Form.Text className="text-muted">
                      Отображать изображения предметов в инвентаре и торговле
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          {/* Настройки уведомлений */}
          <Accordion.Item eventKey="1" className="fantasy-card mt-3">
            <Accordion.Header className="fantasy-card-header">
              <h5 className="mb-0">🔔 Уведомления и звуки</h5>
            </Accordion.Header>
            <Accordion.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      name="notifications_enabled"
                      label="Включить уведомления"
                      defaultChecked={settings.notifications_enabled !== false}
                      className="mb-3"
                    />
                    <Form.Text className="text-muted">
                      Показывать всплывающие уведомления о событиях в игре
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="switch"
                      name="sound_enabled"
                      label="Включить звуковые эффекты"
                      defaultChecked={settings.sound_enabled !== false}
                    />
                    <Form.Text className="text-muted">
                      Воспроизводить звуки при событиях и действиях
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Язык интерфейса:</Form.Label>
                    <Form.Select name="language" defaultValue={settings.language || "ru"}>
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Выбор языка для интерфейса и сообщений
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          {/* Игровые настройки */}
          <Accordion.Item eventKey="2" className="fantasy-card mt-3">
            <Accordion.Header className="fantasy-card-header">
              <h5 className="mb-0">🎮 Игровые настройки</h5>
            </Accordion.Header>
            <Accordion.Body>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  name="auto_collect_loot"
                  label="Автоматически собирать лут после боя"
                  defaultChecked={settings.auto_collect_loot || false}
                />
                <Form.Text className="text-muted">
                  При включении этой опции весь лут будет автоматически добавляться в инвентарь
                </Form.Text>
              </Form.Group>

              <div className="fantasy-alert fantasy-alert-info mt-3">
                <small>
                  <strong>ℹ️ Важно:</strong> Некоторые настройки требуют перезагрузки страницы для полного применения
                </small>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="text-center mt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="px-5 fantasy-btn fantasy-btn-primary"
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Сохранение...
              </>
            ) : (
              'Сохранить настройки'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PlayerSettings;