export const FAVORITES_UPGRADE = 'Избранное';

export const isFavoriteItem = (player, itemId) =>
  (player?.favorite_items || []).some(id => String(id) === String(itemId));

export const favoriteInventory = (inventory, player) => Object.fromEntries(
  Object.entries(inventory || {}).map(([id, item]) => [id, item && typeof item === 'object' ? {
    ...item, favorite: isFavoriteItem(player, id)
  } : item])
);
