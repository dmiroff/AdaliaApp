import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Alert, Badge, Button, Form, Spinner, Tab, Tabs} from 'react-bootstrap';
import api from '../http/apiClient';
import {Context} from '../index';
import {GAME_DRAFT_ROUTE} from '../utils/gameDraftProtocol';
import {canAddTalent, countedTalents, itemFitsSlot, talentRequirements} from '../utils/t3Builder';
import './T3Builder.css';

export default function T3Builder() {
  const {user} = useContext(Context);
  const [data, setData] = useState(null), [draft, setDraft] = useState([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [talentQuery, setTalentQuery] = useState(''), [itemQuery, setItemQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(''), [prefix, setPrefix] = useState(''), [suffix, setSuffix] = useState('');
  const [category, setCategory] = useState('all');
  const sending = useRef(false);
  const update = useCallback(value => {
    setData(value);
    setDraft(value.player?.talents || []);
    if (value.active) user.setPolygonOnly?.(true);
  }, [user]);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/game/t3', {signal: controller.signal}).then(response => {
      if (!controller.signal.aborted) update(response.data);
    }).catch(e => {if (!controller.signal.aborted) setError(e.response?.data?.detail || 'Не удалось загрузить полигон. Попробуйте обновить страницу.');});
    return () => controller.abort();
  }, [update]); // A draft must not be replaced by background refreshes.

  const mutate = async (method, path, body, message) => {
    if (sending.current) return;
    sending.current = true;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await api[method](`/game/t3/${path}`, body);
      update(response.data); setNotice(message);
    } catch (e) {setError(e.response?.data?.detail || 'Изменение не сохранено. Попробуйте ещё раз.');}
    finally {sending.current = false; setBusy(false);}
  };
  const counts = useMemo(() => countedTalents(draft), [draft]);
  const savedCounts = useMemo(() => countedTalents(data?.player?.talents || []), [data]);
  const talentRows = useMemo(() => (data?.talents || []).filter(row => `${row.name} ${row.description}`.toLocaleLowerCase('ru').includes(talentQuery.toLocaleLowerCase('ru'))), [data, talentQuery]);
  const catalogRows = useMemo(() => (data?.catalogue || []).filter(row =>
    row.name.toLocaleLowerCase('ru').includes(itemQuery.toLocaleLowerCase('ru')) &&
    (category === 'all' || (category === 'weapons' ? row.type === 'right_hand' : row.type !== 'right_hand'))), [data, itemQuery, category]);
  const selected = (data?.catalogue || []).find(row => row.name === selectedItem);
  const blocked = busy || data?.player?.in_fight || data?.player?.waiting_for_duel || data?.player?.preparing_duel;
  const dirty = JSON.stringify([...draft].sort()) !== JSON.stringify([...(data?.player?.talents || [])].sort());
  const add = row => {
    if (!blocked && draft.length < data.talent_budget && canAddTalent(row, counts[row.name] || 0, savedCounts[row.name] || 0))
      setDraft([...draft, row.name]);
  };
  const remove = name => {const next = [...draft]; next.splice(next.indexOf(name), 1); setDraft(next);};

  return <main className="t3-builder fantasy-paper p-3 p-md-4">
    <div className="t3-builder__heading"><div><p className="t3-builder__eyebrow">ЗАКРЫТЫЙ ПОЛИГОН ЗЕРКАЛА</p><h1>Сборка Т3</h1></div><Link className="fantasy-btn" to={GAME_DRAFT_ROUTE}>В игровой чат</Link></div>
    {error && <Alert variant="danger" role="alert">{typeof error === 'string' ? error : 'Проверьте выбранные параметры сборки.'}</Alert>}
    {notice && <Alert variant="success" role="status">{notice}</Alert>}
    {!data && !error && <p role="status"><Spinner size="sm"/> Загружаем сборку…</p>}
    {data && !data.active && <div><h2>Начните с test_t3</h2><p>Введите <strong>test_t3</strong> в личном диалоге с зеркалом или в игровом чате, затем нажмите «Выбрать класс».</p><p>Исходный персонаж сохраняется. После входа здесь появятся таланты и снаряжение тестового персонажа.</p></div>}
    {data?.active && <>
      <div className="t3-builder__stats"><strong>{data.player.Character_class} · {data.player.level} ур.</strong><span>❤ {data.player.max_health}</span><span>⏳ {data.player.action_points} ОД</span><span>✦ {data.player.magic_slots} ОЗ</span><Badge bg="secondary">{data.magic_label || 'Власть · все воздействия'}</Badge></div>
      {data.player.in_fight && <Alert variant="warning">Идёт бой. Изменить сборку можно после завершения или прерывания тренировки.</Alert>}
      {!data.player.in_fight && (data.player.waiting_for_duel || data.player.preparing_duel) && <Alert variant="warning">Вы ожидаете дуэль. Перед изменением сборки выйдите из очереди в игровом чате.</Alert>}
      <Tabs defaultActiveKey="talents" className="mb-3">
        <Tab eventKey="talents" title="Таланты">
          <div className="t3-builder__talent-actions"><strong>Выбрано {draft.length} из {data.talent_budget}</strong><span>Осталось: {Math.max(0, data.talent_budget - draft.length)}</span><Button variant="outline-secondary" disabled={blocked || !draft.length} onClick={() => setDraft([])}>Сбросить выбор</Button><Button className="fantasy-btn" disabled={blocked || !dirty} onClick={() => mutate('put','talents',{talents: draft},'Таланты сохранены. Параметры пересчитаны.')}>Сохранить таланты</Button></div>
          <Form.Control aria-label="Найти талант" placeholder="Поиск по названию и описанию" value={talentQuery} onChange={e => setTalentQuery(e.target.value)}/>
          {dirty && <p className="t3-builder__hint">Выбор ещё не сохранён. Перед боем нажмите «Сохранить таланты».</p>}
          <div className="t3-builder__talents">{talentRows.map(row => <article key={row.name} className={`t3-builder__talent ${counts[row.name] ? 'is-selected' : ''}`}>
            <div className="t3-builder__row"><h3>{row.name}</h3><div className="t3-builder__counter"><Button size="sm" aria-label={`Убрать ${row.name}`} disabled={blocked || !counts[row.name]} onClick={() => remove(row.name)}>−</Button><output aria-label={`Количество: ${row.name}`}>{counts[row.name] || 0}</output><Button size="sm" aria-label={`Добавить ${row.name}`} disabled={blocked || draft.length >= data.talent_budget || !canAddTalent(row, counts[row.name] || 0, savedCounts[row.name] || 0)} onClick={() => add(row)}>+</Button></div></div>
            <p>{row.description}</p><small>{talentRequirements(row.requirements) || 'Без дополнительных требований'} · максимум {row.max_count}</small>
          </article>)}</div>
          {!talentRows.length && <p>Подходящих талантов не найдено.</p>}
        </Tab>
        <Tab eventKey="equipment" title="Снаряжение">
          <h2>Надетые предметы</h2><div className="t3-builder__equipment">{Object.entries(data.slots).map(([slot, label]) => <Form.Group key={slot}><Form.Label htmlFor={`t3-slot-${slot}`}>{label}</Form.Label><Form.Select id={`t3-slot-${slot}`} disabled={blocked || dirty} value={String(data.equipment[slot]?.id || '')} onChange={e => mutate('put','equipment',{slot,item_id:e.target.value ? Number(e.target.value) : null},'Снаряжение сохранено. Параметры пересчитаны.')}><option value="">Пусто</option>{data.inventory.filter(item => itemFitsSlot(item, slot)).map(item => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</Form.Select></Form.Group>)}</div>
          {dirty && <p>Сначала сохраните выбор талантов.</p>}
          <h2 className="mt-4">Получить снаряжение +20р</h2><p>Четыре экземпляра любого обычного оружия — для обеих рук и запасных комплектов. Броня, щиты и украшения доступны здесь же. Предметы существуют только внутри теста.</p>
          <div className="t3-builder__armory-filters"><Form.Control aria-label="Найти снаряжение" placeholder="Название оружия или брони" value={itemQuery} onChange={e => setItemQuery(e.target.value)}/><Form.Select aria-label="Тип снаряжения" value={category} onChange={e => setCategory(e.target.value)}><option value="all">Всё снаряжение</option><option value="weapons">Оружие</option><option value="armor">Броня и прочее</option></Form.Select></div>
          <div className="t3-builder__catalog" role="listbox" aria-label="Каталог снаряжения">{catalogRows.map(row => <button type="button" role="option" aria-selected={selectedItem === row.name} className={selectedItem === row.name ? 'is-selected' : ''} key={row.name} disabled={blocked || dirty} onClick={() => {setSelectedItem(row.name);setPrefix('');}}>{row.name}{row.twohanded && <small> · двуручное</small>}</button>)}</div>
          {selected && <div className="t3-builder__grant"><strong>{selected.name} +20р</strong><Form.Select aria-label="Префикс" value={prefix} disabled={blocked || dirty} onChange={e => setPrefix(e.target.value)}><option value="">Без префикса</option>{Object.entries(data.prefixes[selected.type === 'right_hand' ? 'weapon' : 'armor']).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</Form.Select><Form.Select aria-label="Суффикс" value={suffix} disabled={blocked || dirty} onChange={e => setSuffix(e.target.value)}><option value="">Без суффикса</option>{Object.entries(data.suffixes).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</Form.Select><Button className="fantasy-btn" disabled={blocked || dirty} onClick={() => mutate('post','items',{name:selected.name,prefix,suffix},'Предметы получены. Теперь выберите их в слотах снаряжения.')}>Получить +20р</Button></div>}
          <p className="t3-builder__hint">Двуручное оружие допускает в левой руке только подходящие боеприпасы. Снятые предметы остаются в тестовом наборе.</p>
        </Tab>
      </Tabs>
    </>}
  </main>;
}
