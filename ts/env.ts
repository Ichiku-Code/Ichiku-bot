import { promises } from 'fs';
import { parse } from 'smol-toml';

import type { ServerConfig } from './lib/server.js';

interface Env {
    onebot: ServerConfig;
    qq: {
        id: number;
        notice: number;
    };
    model: {
        chat: string;
        compress: string;
        threshold: number;
    };
    openai: {
        key: string;
        url?: string;
    };
    tavily: {
        key: string;
        url?: string;
    };
}

export const env = parse(await promises.readFile('env.toml', 'utf-8')) as unknown as Env;