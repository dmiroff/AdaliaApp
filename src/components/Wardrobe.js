import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { observer } from "mobx-react-lite";

import { Context } from "../index";
import {
  clearWardrobeLoadout,
  equipWardrobeLoadout,
  getWardrobe,
  purchaseWardrobe,
  purchaseWardrobeSlot,
  saveWardrobeLoadout,
} from "../http/wardrobeApi";
import "./Wardrobe.css";


const EQUIPMENT_SLOT_NAMES = {
  head: "Голова",
  cloak: "Плащ",
  breast_armor: "Корпус",
  arm_armor: "Руки",
  gloves: "Перчатки",
  belt: "Пояс",
  leg_armor: "Ноги",
  boots: "Обувь",
  necklace: "Ожерелье",
  ring_1: "Кольцо 1",
  ring_2: "Кольцо 2",
  ring_3: "Кольцо 3",
  ring_4: "Кольцо 4",
  ring_5: "Кольцо 5",
  right_hand: "Правая рука",
  left_hand: "Левая рука",
  secondary_weapon: "Запасное оружие",
};


const getErrorMessage = (error) => (
  error?.response?.data?.detail
  || error?.response?.data?.message
  || error?.message
  || "Не удалось выполнить действие"
);


const loadoutNames = (wardrobe) => Object.fromEntries(
  (wardrobe?.loadouts || []).map((loadout) => [
    loadout.slot,
    loadout.name || `Комплект ${loadout.slot}`,
  ])
);


const Wardrobe = ({ onEquipmentChanged }) => {
  const { user } = useContext(Context);
  const [wardrobe, setWardrobe] = useState(null);
  const [draftNames, setDraftNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const applyWardrobeState = useCallback((result) => {
    const nextWardrobe = result?.data;
    if (!nextWardrobe || typeof nextWardrobe !== "object") {
      throw new Error("Сервер вернул некорректные данные гардероба");
    }
    setWardrobe(nextWardrobe);
    setDraftNames(loadoutNames(nextWardrobe));
    if (Number.isFinite(nextWardrobe.daleons)) {
      user.setPlayer({
        ...(user.player_data || {}),
        daleons: nextWardrobe.daleons,
      });
    }
    setNotice(result.message || "Гардероб обновлён");
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getWardrobe();
      const nextWardrobe = result?.data;
      if (!nextWardrobe || typeof nextWardrobe !== "object") {
        throw new Error("Сервер вернул некорректные данные гардероба");
      }
      setWardrobe(nextWardrobe);
      setDraftNames(loadoutNames(nextWardrobe));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mutateWardrobe = async (actionKey, request) => {
    setBusyAction(actionKey);
    setError("");
    setNotice("");
    try {
      const result = await request();
      applyWardrobeState(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyAction(null);
    }
  };

  const equipLoadout = async (slotNumber) => {
    setBusyAction(`equip-${slotNumber}`);
    setError("");
    setNotice("");
    try {
      const result = await equipWardrobeLoadout(slotNumber);
      const player = result?.data?.player;
      if (!player || typeof player !== "object") {
        throw new Error("Сервер не вернул обновлённое снаряжение персонажа");
      }
      user.setPlayer(player);
      user.setPlayerInventory(player.inventory_new || {});
      setNotice(result.message || "Комплект надет");
      onEquipmentChanged?.(player);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyAction(null);
    }
  };

  const saveLoadout = (slotNumber) => mutateWardrobe(
    `save-${slotNumber}`,
    () => saveWardrobeLoadout(slotNumber, draftNames[slotNumber]),
  );

  const clearLoadout = (slotNumber) => mutateWardrobe(
    `clear-${slotNumber}`,
    () => clearWardrobeLoadout(slotNumber),
  );

  const confirmationContent = useMemo(() => {
    if (!confirmation) return null;
    if (confirmation.type === "build") {
      return {
        title: "Построить Зал облачений?",
        body: `Будет списано ${wardrobe?.building_cost || 500} далеонов. Откроется одна ячейка для комплекта.`,
        label: "Построить",
        variant: "warning",
      };
    }
    if (confirmation.type === "slot") {
      return {
        title: "Купить новую ячейку?",
        body: `Будет списано ${wardrobe?.next_slot_cost || 300} далеонов.`,
        label: "Купить",
        variant: "warning",
      };
    }
    if (confirmation.type === "overwrite") {
      return {
        title: `Перезаписать ячейку ${confirmation.slot}?`,
        body: "Сохранённый комплект будет заменён текущим снаряжением персонажа.",
        label: "Перезаписать",
        variant: "warning",
      };
    }
    return {
      title: `Очистить ячейку ${confirmation.slot}?`,
      body: "Сохранённый комплект будет удалён. Предметы останутся у персонажа.",
      label: "Очистить",
      variant: "danger",
    };
  }, [confirmation, wardrobe]);

  const executeConfirmedAction = () => {
    const action = confirmation;
    setConfirmation(null);
    if (!action) return;
    if (action.type === "build") {
      mutateWardrobe("build", purchaseWardrobe);
    } else if (action.type === "slot") {
      mutateWardrobe("slot", purchaseWardrobeSlot);
    } else if (action.type === "overwrite") {
      saveLoadout(action.slot);
    } else if (action.type === "clear") {
      clearLoadout(action.slot);
    }
  };

  const displayDaleons = Number.isFinite(wardrobe?.daleons)
    ? wardrobe.daleons
    : Number(user.player_data?.daleons || 0);
  const isBusy = busyAction !== null;

  if (loading) {
    return (
      <Card className="wardrobe-panel mt-3">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          Загружаем Зал облачений…
        </Card.Body>
      </Card>
    );
  }

  if (!wardrobe) {
    return (
      <Card className="wardrobe-panel mt-3">
        <Card.Header>🏛️ Зал облачений</Card.Header>
        <Card.Body>
          <Alert variant="danger" className="mb-3">{error}</Alert>
          <Button variant="outline-light" onClick={loadData}>Повторить загрузку</Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="wardrobe-panel mt-3">
      <Card.Header className="wardrobe-header d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <span className="wardrobe-title">🏛️ {wardrobe.building_name || "Зал облачений"}</span>
          <small className="d-block wardrobe-subtitle">Сохраняйте снаряжение и надевайте комплект одним действием</small>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="warning" text="dark">💎 {displayDaleons}</Badge>
          <Button
            size="sm"
            variant="outline-light"
            className="wardrobe-refresh-btn"
            onClick={loadData}
            disabled={isBusy}
            aria-label="Обновить гардероб"
          >
            ↻
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        {!wardrobe.is_built ? (
          <div className="wardrobe-build-offer text-center py-3">
            <div className="wardrobe-build-icon">🗝️</div>
            <h5>Зал ещё не построен</h5>
            <p className="mb-3">
              Постройте зал за <strong>{wardrobe.building_cost} 💎</strong>, чтобы открыть первую ячейку.
            </p>
              <Button
                className="wardrobe-action wardrobe-action--primary"
              disabled={isBusy}
              onClick={() => setConfirmation({ type: "build" })}
            >
              {busyAction === "build" ? "Строим…" : "Построить Зал облачений"}
            </Button>
          </div>
        ) : (
          <>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <span>Открыто ячеек: <strong>{wardrobe.slots}</strong></span>
              <Button
                size="sm"
                variant="outline-warning"
                className="wardrobe-action wardrobe-action--warning"
                disabled={isBusy}
                onClick={() => setConfirmation({ type: "slot" })}
              >
                + Ячейка за {wardrobe.next_slot_cost} 💎
              </Button>
            </div>

            <Row className="g-3">
              {(wardrobe.loadouts || []).map((loadout) => {
                const equipment = Object.entries(loadout.equipment || {})
                  .filter(([, item]) => item && item.id !== undefined && item.id !== null);
                const isSaved = Boolean(loadout.equipment);
                return (
                  <Col xs={12} lg={6} key={loadout.slot}>
                    <Card className={`wardrobe-slot-card h-100 ${isSaved ? "is-saved" : "is-empty"}`}>
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong>Ячейка {loadout.slot}</strong>
                          <Badge bg={isSaved ? "success" : "secondary"}>
                            {isSaved ? `${equipment.length} предметов` : "Пусто"}
                          </Badge>
                        </div>

                        <Form.Group className="mb-3">
                          <Form.Label>Название комплекта</Form.Label>
                          <Form.Control
                            value={draftNames[loadout.slot] || ""}
                            maxLength={40}
                            disabled={isBusy}
                            placeholder={`Комплект ${loadout.slot}`}
                            onChange={(event) => setDraftNames((current) => ({
                              ...current,
                              [loadout.slot]: event.target.value,
                            }))}
                          />
                          {isSaved && draftNames[loadout.slot] !== loadout.name && (
                            <Form.Text>
                              Новое название применится при перезаписи текущим снаряжением.
                            </Form.Text>
                          )}
                        </Form.Group>

                        {isSaved ? (
                          <div className="wardrobe-equipment-list mb-3">
                            {equipment.map(([slot, item]) => (
                              <div className="wardrobe-equipment-item" key={slot}>
                                <span>{EQUIPMENT_SLOT_NAMES[slot] || slot}</span>
                                <strong>{item.name || `Предмет ${item.id}`}</strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="wardrobe-empty-copy flex-grow-1">
                            Сохраните сюда предметы, которые сейчас надеты на персонажа.
                          </p>
                        )}

                        <div className="d-flex flex-wrap gap-2 mt-auto">
                          {isSaved && (
                            <Button
                              variant="success"
                              className="wardrobe-action wardrobe-action--success"
                              disabled={isBusy}
                              onClick={() => equipLoadout(loadout.slot)}
                            >
                              {busyAction === `equip-${loadout.slot}` ? "Надеваем…" : "Облачиться"}
                            </Button>
                          )}
                          <Button
                            variant={isSaved ? "outline-warning" : "warning"}
                            className="wardrobe-action wardrobe-action--warning"
                            disabled={isBusy}
                            onClick={() => (
                              isSaved
                                ? setConfirmation({ type: "overwrite", slot: loadout.slot })
                                : saveLoadout(loadout.slot)
                            )}
                          >
                            {busyAction === `save-${loadout.slot}`
                              ? "Сохраняем…"
                              : isSaved ? "Перезаписать текущим" : "Сохранить текущее"}
                          </Button>
                          {isSaved && (
                            <Button
                              variant="outline-danger"
                              className="wardrobe-action wardrobe-action--danger"
                              disabled={isBusy}
                              onClick={() => setConfirmation({ type: "clear", slot: loadout.slot })}
                            >
                              Очистить
                            </Button>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </>
        )}
      </Card.Body>

      <Modal
        show={Boolean(confirmation)}
        onHide={() => setConfirmation(null)}
        dialogClassName="wardrobe-modal"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{confirmationContent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmationContent?.body}</Modal.Body>
        <Modal.Footer>
          <Button className="wardrobe-action wardrobe-action--secondary" variant="secondary" onClick={() => setConfirmation(null)}>Отмена</Button>
          <Button className={`wardrobe-action wardrobe-action--${confirmationContent?.variant}`} variant={confirmationContent?.variant} onClick={executeConfirmedAction}>
            {confirmationContent?.label}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};


export default observer(Wardrobe);
