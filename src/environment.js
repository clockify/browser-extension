import * as stage from "./environment.stage";
import * as prod from "./environment.prod";
import * as dev from "./environment.dev";

export function getEnv() {
    if (process.env.NODE_ENV === 'prod') {
        return prod.getEnv();
    }

    if (process.env.NODE_ENV === 'stage') {
        return stage.getEnv();
    }
    return dev.getEnv();
}

