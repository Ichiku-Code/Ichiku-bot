import { WebSocket } from 'ws';

import type { ServerConfigOf } from '../server.js';
import { close } from '../server.js';
import { WsCommonServer } from './ws-common.js';

export class Server extends WsCommonServer {
    static new(config: ServerConfigOf<'ws'>) {
        const { promise, resolve } = Promise.withResolvers<Server>();
        const socket = new WebSocket(`ws://${config.host}:${config.port}`, {
            headers: { authorization: `Bearer ${config.token}` }
        });
        socket.once('open', () => resolve(new this(socket)));
        return promise;
    }

    override async [close]() {
        await super[close]();
        this.socket.close();
        return new Promise<void>(resolve => this.socket.on('close', resolve));
    }
}