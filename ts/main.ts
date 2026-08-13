import 'dotenv/config';

import { env } from './env.js';
import { Server } from './lib/server.js';
import * as logging from './logging.js';
import { Session } from './session.js';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT: string;
            NOTICE_GROUP: string;
            CHAT_MODEL: string;
            COMPRESS_MODEL: string;
            THRESHOLD: string;

            OPENAI_API_KEY: string;
            OPENAI_BASE_URL?: string;
            TAVILY_API_KEY: string;
        }
    }
}

const server = await Server.of(Number(env.port));

logging.setLogger(
    // eslint-disable-next-line no-console
    message => console.log(`[Ichiku] ${message}`),
    async message => void await server.api.send_group_msg({ group_id: Number(env.noticeGroup), message })
);

await logging.notify('Ichiku启动喵~');

server.onclose(async () => await logging.notify('Ichiku关机喵~'));

server.handles('message/group', async event => {
    const session = new Session(event, server);
    try {
        await session.reply();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        await logging.notify(`出错了喵！错误信息：${(e as Error | undefined)?.message ?? 'unknown error'}`);
    }
});