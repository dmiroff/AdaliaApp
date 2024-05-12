import PlayerAuthCheck from "./PlayerAuthCheck"; // Import PlayerAuthCheck

// Function to check user access
export const Checker = async () => {
  try {
    // Retrieve user ID and token from localStorage
    const id = localStorage.getItem("id");
    const token = localStorage.getItem("token");

    if (!id || !token) {
      // If either ID or token is missing, reject the promise
      return Promise.reject(new Error("User ID or token not found in localStorage"));
    }

    // Use PlayerAuthCheck to authenticate
    const isAuthorized = await PlayerAuthCheck(id, token);

    if (isAuthorized) {
      // If user is authorized, resolve the promise
      return Promise.resolve();
    } else {
      // If user is not authorized, reject the promise
      return Promise.reject(new Error("Access denied"));
    }
  } catch (error) {
    // If an error occurs during the authentication process, reject the promise
    return Promise.reject(error);
  }
};