import PlayerAuthCheck from "./PlayerAuthCheck"; // Import PlayerAuthCheck

// Function to check user access
export const Checker = async () => {
  try {
    // Retrieve user ID and token from localStorage
    const id = localStorage.getItem("id");
    const token = localStorage.getItem("token");
    if (id && token) {// Use PlayerAuthCheck to authenticate
      const isAuthorized = await PlayerAuthCheck(id, token);
      if (isAuthorized) {
        // If user is authorized, resolve the promise
        return Promise.resolve();
      }
    }    
    return Promise.reject(new Error("User ID or token not found in localStorage"));
  } catch (error) {
    // If an error occurs during the authentication process, reject the promise
    return Promise.reject(error);
  }
};
