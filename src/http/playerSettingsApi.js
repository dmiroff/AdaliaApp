import apiClient from "./apiClient";

export const getPlayerSettings = async () => {
  try {
    const response = await apiClient.get(`/player/settings`);
    return response.data;
  } catch (error) {
    console.error("Error getting player settings:", error);
    throw error;
  }
};

export const updatePlayerSettings = async (settings) => {
  try {
    // Создаем объект только с теми полями, которые были переданы
    const settingsToSend = {};
    
    // Маппинг полей с фронта на бэк
    if (settings.log_type !== undefined) settingsToSend.log_type = settings.log_type;
    if (settings.show_dice_images !== undefined) settingsToSend.show_dice_images = settings.show_dice_images;
    if (settings.show_item_images !== undefined) settingsToSend.show_item_images = settings.show_item_images;
    if (settings.language !== undefined) settingsToSend.language = settings.language;
    if (settings.theme !== undefined) settingsToSend.theme = settings.theme;
    if (settings.notifications_enabled !== undefined) settingsToSend.notifications_enabled = settings.notifications_enabled;
    if (settings.sound_enabled !== undefined) settingsToSend.sound_enabled = settings.sound_enabled;
    if (settings.auto_collect_loot !== undefined) settingsToSend.auto_collect_loot = settings.auto_collect_loot;
    // current_image отправляем только если явно меняем образ
    
    const response = await apiClient.post(`/player/settings`, settingsToSend);
    return response.data;
  } catch (error) {
    console.error("Error updating player settings:", error);
    throw error;
  }
};

export const setCurrentImage = async (imagePath) => {
  try {
    // Отправляем полный путь к изображению
    const response = await apiClient.post(`/player/settings/image`, { 
      image_name: imagePath 
    });
    return response.data;
  } catch (error) {
    console.error("Error setting current image:", error);
    throw error;
  }
};

export const getAvailableImages = async () => {
  try {
    const response = await apiClient.get(`/player/images`);
    return response.data;
  } catch (error) {
    console.error("Error getting available images:", error);
    throw error;
  }
};