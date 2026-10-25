import React from 'react';
import {Alert, ListGroup} from 'react-bootstrap';

const date = value => new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long', timeZone: 'Europe/Moscow'}).format(new Date(value));
const time = value => new Intl.DateTimeFormat('ru-RU', {hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow'}).format(new Date(value));

export default function EventRatingPanel({rating, error}) {
  return <section aria-labelledby="event-rating-title" className="mt-4 pt-3 border-top">
    <h3 id="event-rating-title" className="fantasy-text-dark">🍂 Ивентовый рейтинг Некрополя</h3>
    {error ? <Alert variant="warning">Ивентовый рейтинг временно недоступен. Обычный рейтинг показан выше.</Alert> : !rating ? null : <>
      <p className="mb-1">Неделя {rating.week} из {rating.total_weeks}: {date(rating.starts_at)} — {date(new Date(new Date(rating.ends_at).getTime() - 1).toISOString())}.</p>
      <p>Итоги: {date(rating.ends_at)}, {time(rating.ends_at)} МСК.</p>
      {rating.event_status === 'not_started' ? <p>Ивентовый рейтинг ещё не запущен.</p> : <>
        {rating.event_status !== 'active' && <p>Зачёт завершён. Результаты сохранены.</p>}
        {rating.data?.length ? <ListGroup className="fantasy-list-group">
          {rating.data.map(row => <ListGroup.Item key={row.id} className={`fantasy-list-item ${row.is_self ? 'border-warning fw-bold' : ''}`}>
            <div className="d-flex justify-content-between align-items-start gap-2">
              <span className="text-break">{row.player_position}. {row.name}{row.is_self ? ' (вы)' : ''}</span>
              <strong className="text-nowrap">{row.score} очк.</strong>
            </div>
          </ListGroup.Item>)}
        </ListGroup> : <p>Пока никто не набрал очков за эту неделю.</p>}
        <p className="mt-2 mb-1">Участников: {rating.participant_count}.</p>
        {rating.player_entry ? <p>Ваше место: {rating.player_entry.player_position}, очки: {rating.player_entry.score}.</p>
          : <p>Вы пока не участвуете в этом недельном зачёте.</p>}
        <small>Очки и награды за каждую неделю считаются отдельно от обычного рейтинга.</small>
      </>}
    </>}
  </section>;
}
