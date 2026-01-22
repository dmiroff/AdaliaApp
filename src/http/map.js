import apiClient from "./apiClient";

export const travelToLocation = async (locationId) => {
  try {
    const response = await apiClient.post(`/map/travel`, {
      location_id: locationId
    });
    return response.data;
  } catch (error) {
    console.error("Error traveling to location:", error);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  try {
    const response = await apiClient.get(`/map/current-location`);
    return response.data;
  } catch (error) {
    console.error("Error fetching current location:", error);
    throw error;
  }
};