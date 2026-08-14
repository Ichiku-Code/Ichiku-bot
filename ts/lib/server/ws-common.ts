import { randomUUID } from 'crypto';
import type { WebSocket } from 'ws';

import type { APIs } from '../apis.js';
import { Server as AbstractServer } from '../server.js';

export abstract class WsCommonServer extends AbstractServer {
    private callbacks = new Map<string, { resolve: (result: any) => void, reject: (reason?: any) => void }>();

    protected constructor(protected socket: WebSocket) {
        super();
        socket.on('message', async data => await this.handle(JSON.parse(data.toString())));
    }

    protected override call<Action extends keyof APIs>(action: Action,
        params: APIs[Action][0]): Promise<APIs[Action][1]> {
        const { promise, resolve, reject } = Promise.withResolvers<any>();
        const echo = randomUUID();
        this.callbacks.set(echo, { resolve, reject });
        this.socket.send(JSON.stringify({ action, params, echo }));
        return promise;
    }

    private isEvent(data: any): data is Event {
        return 'post_type' in data;
    }

    private async handle(data: any) {
        if (this.isEvent(data)) return await this.handleEvent(data);
        const callback = this.callbacks.get(data.echo);
        if (data.status === 'ok') callback?.resolve(data.data);
        else callback?.reject(new Error(data.message));
    }
}
