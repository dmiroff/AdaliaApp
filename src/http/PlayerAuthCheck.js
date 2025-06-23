import { SERVER_APP_API_URL } from "../utils/constants";
import {$authHost} from '../http/index';
import axios from 'axios';

const PlayerAuthCheck = async (playerId, token) => {
  // Returns a boolean to indicate if a player is authorized

  try {
    const response = await $authHost.post(SERVER_APP_API_URL + '/login', {
      "player_id": playerId,
      "token": token,
    });

    if (response.status === 200 && response.data.access_token) {
      localStorage.setItem("id", playerId)
      localStorage.setItem("token", token)
      localStorage.setItem("access_token", response.data.access_token)
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
