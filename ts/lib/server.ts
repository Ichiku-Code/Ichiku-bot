import type { APIs } from './apis.js';
import type { Event, SelectEventType } from './events.js';
import type { SnakeToCamel } from './mangle.js';
import { camelToSnake } from './mangle.js';

export type HandlerReturnType = boolean | undefined | Promise<boolean | undefined>;

// Should only be used in server impls.
export const close = Symbol('close');
const servers: Server[] = [];

const dispose = async () => {
    for (const server of servers) await server[close]();
    process.exit(0);
};
process.on('SIGINT', dispose);
process.on('SIGTERM', dispose);
process.on('SIGBREAK', dispose);

export type ServerConfig = {
    mode: 'ws';
    host: string;
    port: number;
    token: string;
} | {
    mode: 'ws-reverse';
    host: string;
    port: number;
};

export type ServerConfigOf<Mode extends ServerConfig['mode']> = ServerConfig & { mode: Mode };

export abstract class Server {
    private dispose: (() => void | Promise<void>) | undefined;
    private handlers: { type: string, handler: (event: any) => HandlerReturnType }[] = [];

    static async of(config: ServerConfig): Promise<Server> {
        const { Server } = await import(`./server/${config.mode}.js`);
        const server = await Server.new(config);
        servers.push(server);
        return server;
    }

    protected abstract call<Action extends keyof APIs>(action: Action,
        params: Parameters<APIs[Action]>[0]): Promise<ReturnType<APIs[Action]>>;

    get api(): { [Action in keyof APIs as SnakeToCamel<Action>]: 
        (..._: Parameters<APIs[Action]>) => Promise<ReturnType<APIs[Action]>> } {
        return new Proxy({}, {
            get: (_, action, __) => (params: any) => this.call(camelToSnake(action.toString()) as any, params)
        }) as any;
    }

    protected async handleEvent(event: Event) {
        for (const { type, handler } of this.handlers)
            if (Server.match(event, type) && !await handler(event))
                break;
    }

    private static match(data: any, type: string) {
        if (!type.includes('/')) return data.post_type === type;
        const [post, sub] = type.split('/');
        return data.post_type === post && data[`${post}_type`] === sub;
    }

    handles<Type extends string>(type: Type, handler: (event: SelectEventType<Type>) => HandlerReturnType) {
        this.handlers.push({ type, handler });
    }

    onClose(callback: () => void | Promise<void>) {
        if (this.dispose !== undefined) throw new Error('On-close hook already exists');
        this.dispose = callback;
    }

    async [close]() {
        await this.dispose?.();
    }
}