import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // Ramp up continuously to 3000 users to find the exact breaking point
    stages: [
        { duration: '2m', target: 3000 },  // Ramp up to 3000 users over 2 minutes
        { duration: '10s', target: 0 },    // Ramp down
    ],
    thresholds: {
        // No abortOnFail, we want to see the whole curve
    },
};

const BASE_URL_BACKEND = 'http://localhost:8080';

export default function () {
    // Only test the backend API, testing a Vite dev server is not accurate for load testing
    let resBackend = http.get(`${BASE_URL_BACKEND}/api/problems`);
    check(resBackend, {
        'backend status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
