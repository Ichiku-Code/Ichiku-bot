import { env } from './env.js';
import { Server } from './lib/server.js';
import { notify, setNotify } from './notify.js';
import { Session } from './session.js';

const server = await Server.of(env.onebot);

setNotify(async message => void await server.api.sendGroupMsg({ group_id: env.qq.notice, message }));

await notify('启动喵~');

server.onClose(async () => await notify('关机喵~'));

server.handles('message/group', async event => {
    const session = new Session(event, server);
    try {
        await session.reply();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        await session.notify(`出错了喵！错误信息：${(e as Error | undefined)?.message ?? 'unknown error'}`);
    }
});