import { randomUUID } from 'crypto';
import type { WebSocket } from 'ws';

import type { APIs } from '../apis.js';
import type { Event } from '../events.js';
import { Server } from '../server.js';

interface ApiReply<Echo> {
    echo: Echo;
    status: 'ok' | 'async' | 'failed';
    retcode: number;
    data: ReturnType<APIs[keyof APIs]>;
    message?: string;
}

export abstract class WsCommonServer extends Server {
    private callbacks = new Map<string, { resolve: (result: any) => void, reject: (reason?: any) => void }>();

    protected constructor(protected socket: WebSocket) {
        super();
        socket.on('message', async data => await this.handle(JSON.parse(data.toString())));
    }

    protected override call<Action extends keyof APIs>(action: Action,
        params: Parameters<APIs[Action]>[0]): Promise<ReturnType<APIs[Action]>> {
        const { promise, resolve, reject } = Promise.withResolvers<any>();
        const echo = randomUUID();
        this.callbacks.set(echo, { resolve, reject });
        this.socket.send(JSON.stringify({ action, params, echo }));
        return promise;
    }

    private async handle(data: Event | ApiReply<string>) {
        if ('post_type' in data) return await this.handleEvent(data);
        const callback = this.callbacks.get(data.echo);
        if (data.status === 'ok') callback?.resolve(data.data);
        else callback?.reject(new Error(data.message));
    }
}
