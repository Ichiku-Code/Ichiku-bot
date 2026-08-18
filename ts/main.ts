import { env } from './env.js';
import type { Message } from './lib/message.js';
import { Server } from './lib/server.js';
import { Memory } from './model.js';
import { notify, setNotify } from './notify.js';
import { Session } from './session.js';

const server = await Server.of(env.onebot);

setNotify(async message => void await server.api.sendGroupMsg({ group_id: env.qq.notice, message }));

Session.memories.set('Ichiku', await Memory.from('memories/ichiku.json'));
Session.memories.set('Ichiha', await Memory.from('memories/ichiha.json'));

await notify('启动喵~');

server.onClose(async () => await notify('关机喵~'));

server.handles('message/group', async event => {
    const commands = parse(event.message);
    let [name] = commands;
    if (name === undefined) return;
    name = name[0]!.toUpperCase() + name.slice(1);
    const session = new Session(name, event, server);
    try {
        await session.reply();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        await session.notify(`出错了喵！错误信息：${(e as Error | undefined)?.message ?? 'unknown error'}`);
    }
});

// Changes message in-place
function parse(message: Message['In']): Set<string> {
    const commands = new Set<string>();
    if (typeof message === 'string') return commands;
    for (const segment of message) {
        if (segment.type !== 'text') continue;
        segment.data.text = segment.data.text.replaceAll(/#(ichi[b-df-hj-np-tv-z][aeiou])/ig, (_, name: string) => {
            commands.add(name);
            return '';
        });
    }
    return commands;
}