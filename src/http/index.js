import axios from "axios";

const $host = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

const $authHost = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Only add necessary headers (like auth tokens)
const authInterceptor = config => {
    config.headers['skip_zrok_interstitial'] = 'true'; // If needed for zrok
    return config;
};

$authHost.interceptors.request.use(authInterceptor);
$host.interceptors.request.use(authInterceptor);

export { $host, $authHost };