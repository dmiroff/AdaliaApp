import axios from "axios";

const $host = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': "*",
    },

})

const $authHost = axios.create({
    
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },

})

const authInterceptor = config => {
    //config.headers.authorization = `Bearer ${localStorage.getItem('token')}`;
    config.headers['ngrok-skip-browser-warning'] = 'true' // or any other value;
    config.headers['Control-Allow-Origin'] = "*"
    config.headers['Control-Allow-Methods'] = "*"
    config.headers['Access-Control-Allow-Origin'] = "*"
    return config
}

$authHost.interceptors.request.use(authInterceptor)

const hostInterceptor = config => {
    config.headers['ngrok-skip-browser-warning'] = 'true'
    config.headers['Control-Allow-Origin'] = "*"
    config.headers['Control-Allow-Methods'] = "*"
    config.headers['Access-Control-Allow-Origin'] = "*"
    return config
}

$host.interceptors.request.use(hostInterceptor)

export {
    $host,
    $authHost
}