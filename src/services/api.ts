import axios, { AxiosResponse } from 'axios';
import { getFromNetworkFirst } from './caching';

const api = axios.create({
    // Before running your 'json-server', get your computer's IP address and
    // update your baseURL to `http://your_ip_address_here:3333` and then run:
    // `npx json-server --watch db.json --port 3333 --host your_ip_address_here`
    //
    // To access your server online without running json-server locally,
    // you can set your baseURL to:
    // `https://my-json-server.typicode.com/<your-github-username>/<your-github-repo>`
        // `https://my-json-server.typicode.com/LeiDizon/assignment-task3-lei`
    //
    // To use `my-json-server`, make sure your `db.json` is located at the repo root.

    // baseURL: 'http://0.0.0.0:3333',
    baseURL: 'http://192.168.4.24:3333',
    //  baseURL: 'https://my-json-server.typicode.com/LeiDizon/assignment-task3-lei',
    // baseURL: 'http://localhost:3333',
});

export const authenticateUser = (email: string, password: string): Promise<AxiosResponse> => {
    return api.post(`/login`, { email, password });
};

// Get events with network-first, fallback to cache strategy
// This function gets events from the network, and if the network request fails, it will fallback to the cache.
export const getEvents = () => {
    // Get the events from the network
    return getFromNetworkFirst('events', api.get('/events')
        // If the network request is successful, return the data
        .then(res => res.data)
        // If the network request fails, fallback to the cache
    );
};
