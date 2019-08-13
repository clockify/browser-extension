import * as prod from "./environment.prod";
import * as dev from "./environment.dev";

export function getEnv() {
    if (process.env.NODE_ENV === 'prod') {
        return prod.getEnv();
    }
    return dev.getEnv();
}

