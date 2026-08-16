import type { MessageEvent } from './lib/events.js';
import type { ForwardMessageSegment } from './lib/message.js';

// Napcat extensions.

declare module './lib/apis.js' {
    export interface APIs {
        group_poke(params: {
            group_id: number;
            user_id: number;
        }): void;

        friend_poke(params: {
            user_id: number;
            target_id?: number;
        }): void;
    }
}

export type ForwardMessageSegmentData = ForwardMessageSegment['In']['data'] & { content?: MessageEvent[] };