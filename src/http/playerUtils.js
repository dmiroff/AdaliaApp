import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

export const modifyParameter = async (playerId, param, value) => {
  try {
    const response = await axios.post(`${SERVER_APP_API_URL}/api/player/update`, {
      id: playerId,
      param: param,
      value: value
    });
    return response.status === 200 ? response.data : false;
  } catch (error) {
    console.error("Error updating player parameter:", error);
    return false;
  }
};
