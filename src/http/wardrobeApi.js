import apiClient from "./apiClient";


export const getWardrobe = async () => {
  const response = await apiClient.get("/wardrobe");
  return response.data;
};


export const purchaseWardrobe = async () => {
  const response = await apiClient.post("/wardrobe/purchase");
  return response.data;
};


export const purchaseWardrobeSlot = async () => {
  const response = await apiClient.post("/wardrobe/slots/purchase");
  return response.data;
};


export const saveWardrobeLoadout = async (slotNumber, name) => {
  const response = await apiClient.put(`/wardrobe/loadouts/${slotNumber}`, {
    name: name?.trim() || null,
  });
  return response.data;
};


export const clearWardrobeLoadout = async (slotNumber) => {
  const response = await apiClient.delete(`/wardrobe/loadouts/${slotNumber}`);
  return response.data;
};


export const equipWardrobeLoadout = async (slotNumber) => {
  const response = await apiClient.post(`/wardrobe/loadouts/${slotNumber}/equip`);
  return response.data;
};
