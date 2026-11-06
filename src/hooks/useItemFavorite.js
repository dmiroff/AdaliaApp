import { useRef, useState } from 'react';
import apiClient from '../http/apiClient';
import { FAVORITES_UPGRADE, isFavoriteItem } from '../utils/favorites';

export default function useItemFavorite(user, itemId, notify) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const isFavorite = isFavoriteItem(user.player_data, itemId);
  const enabled = Boolean(user.player_data?.upgrades?.includes(FAVORITES_UPGRADE)) || isFavorite;

  const toggleFavorite = async event => {
    event?.stopPropagation();
    if (busy.current) return;
    if (!enabled) {
      notify('Избранное доступно в магазине за 200 далеонов.', 'info');
      return;
    }
    busy.current = true;
    setPending(true);
    try {
      const { data } = await apiClient.put(`/inventory/${itemId}/favorite`, {
        favorite: !isFavoriteItem(user.player_data, itemId)
      });
      if (!data?.data) throw new Error('Не удалось изменить избранное.');
      user.setPlayer(data.data);
      user.setPlayerInventory(data.data.inventory_new || {});
      notify(data.message, 'success');
    } catch (error) {
      notify(error.response?.data?.detail || error.message || 'Не удалось изменить избранное.', 'error');
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return { isFavorite, enabled, pending, toggleFavorite };
}
