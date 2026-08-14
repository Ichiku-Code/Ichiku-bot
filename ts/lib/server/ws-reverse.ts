import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

import type { ServerConfigOf } from '../server.js';
import { close } from '../server.js';
import { WsCommonServer } from './ws-common.js';

export class Server extends WsCommonServer {
    private constructor(private server: WebSocketServer, socket: WebSocket) {
        super(socket);
    }

    static new(config: ServerConfigOf<'ws-reverse'>) {
        const { promise, resolve } = Promise.withResolvers<Server>();
        const server = new WebSocketServer(config);
        server.once('connection', socket => resolve(new this(server, socket)));
        return promise;
    }

    override async [close]() {
        await super[close]();
        this.server.clients.forEach(client => client.close(1001));
        await new Promise<void>((resolve, reject) => this.server.close(e => e === undefined ? resolve() : reject(e)));
    }
}
