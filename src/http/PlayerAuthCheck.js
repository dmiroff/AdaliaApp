import { SERVER_APP_API_URL } from "../utils/constants";
import {$authHost} from '../http/index';

const PlayerAuthCheck = async (playerId, token) => {
  // Returns a boolean to indicate if a player is authorized

  try {
    const response = await $authHost.get(
      `${SERVER_APP_API_URL}/player/auth/${playerId}/${token}`
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
