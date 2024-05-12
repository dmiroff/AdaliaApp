import axios from "axios";
import { SERVER_APP_API_URL } from "../utils/constants";

const PlayerAuthCheck = async (playerId, token) => {
  // Returns a boolean to indicate if a player is authorized

  try {
    const response = await axios.get(
      `${SERVER_APP_API_URL}/api/player/auth/${playerId}/${token}`
    );

    if (response.status === 200 && response.data.authorized) {
      return true; // Authorization successful
    } else {
      return false; // Not authorized
    }
  } catch (error) {
    console.error("Error checking player authorization:", error);
    return false; // Authorization failed due to error
  }
};

export default PlayerAuthCheck;
