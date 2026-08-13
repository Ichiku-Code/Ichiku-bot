import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

import type { APIs } from './apis.js';
import type { SelectEventType } from './events.js';
import type { Event } from './events.js';
import type { SnakeToCamel } from './mangle.js';
import { camelToSnake } from './mangle.js';

type HandlerReturnType = boolean | undefined | Promise<boolean | undefined>;

const close = Symbol('close');
const servers: Server[] = [];

const dispose = async () => {
    for (const server of servers) await server[close]();
    process.exit(0);
};
process.on('SIGINT', dispose);
process.on('SIGTERM', dispose);
process.on('SIGBREAK', dispose);

export class Server {
    private callbacks: { resolve: (result: any) => void, reject: (reason?: any) => void }[] = [];
    private handlers: { type: string, handler: (event: any) => HandlerReturnType }[] = [];
    private dispose: (() => void | Promise<void>) | undefined;

    private constructor(private server: WebSocketServer, private socket: WebSocket) {
        socket.on('message', async data => await this.handle(JSON.parse(data.toString())));
        servers.push(this);
    }

    static of(port: number) {
        const { promise, resolve } = Promise.withResolvers<Server>();
        const server = new WebSocketServer({ port });
        server.on('connection', socket => resolve(new Server(server, socket)));
        return promise;
    }

    get api(): { [Action in keyof APIs as SnakeToCamel<Action>]:
        (params: APIs[Action][0]) => Promise<APIs[Action][1]> } {
        return new Proxy({}, {
            get: (_, action, __) => (params: any) => {
                const { promise, resolve, reject } = Promise.withResolvers<any>();
                this.socket.send(JSON.stringify({ action: camelToSnake(action.toString()), params }));
                this.callbacks.push({ resolve, reject });
                return promise;
            }
        }) as any;
    }

    handles<Type extends string>(type: Type, handler: (event: SelectEventType<Type>) => HandlerReturnType) {
        this.handlers.push({ type, handler });
    }

    private isEvent(data: any): data is Event {
        return 'post_type' in data;
    }

    private match(data: any, type: string) {
        if (!type.includes('/')) return data.post_type === type;
        const [post, sub] = type.split('/');
        return data.post_type === post && data[`${post}_type`] === sub;
    }

    private async handle(data: any) {
        if (this.isEvent(data)) {
            for (const { type, handler } of this.handlers)
                if (this.match(data, type) && !await handler(data)) break;
            return;
        }
        const callback = this.callbacks.shift();
        if (data.status === 'ok') callback?.resolve(data.data);
        else callback?.reject(new Error(data.message));
    }

    onclose(callback: () => void | Promise<void>) {
        if (this.dispose !== undefined) throw new Error('On-close hook already exists');
        this.dispose = callback;
    }

    // Should not be manually called.
    async [close]() {
        await this.dispose?.();
        this.server.clients.forEach(client => client.close(1001));
        await new Promise<void>((resolve, reject) => this.server.close(e => e === undefined ? resolve() : reject(e)));
    }
}
