import axios from "axios";

const $host = axios.create({
    baseURL: process.env.REACT_APP_API_URL

})

const $authHost = axios.create({
    
    baseURL: process.env.REACT_APP_API_URL

})

const authInterceptor = config => {
    //config.headers.authorization = `Bearer ${localStorage.getItem('token')}`;
    config.headers['ngrok-skip-browser-warning'] = 'true' // or any other value;
    return config
}

$authHost.interceptors.request.use(authInterceptor)

const hostInterceptor = config => {
    config.headers['ngrok-skip-browser-warning'] = 'true'
    return config
}

$host.interceptors.request.use(hostInterceptor)

export {
    $host,
    $authHost
}