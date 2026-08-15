import type { MessageEvent } from './events.js';

export function unescape(message: string): MessageSegment['Out'][] {
    const cq = (text: string) => text
        .replace(/&#44;/g, ',')
        .replace(/&#91;/g, '[')
        .replace(/&#93;/g, ']')
        .replace(/&amp;/g, '&');

    const segments: MessageSegment['Out'][] = [];
    const regex = /\[CQ:([^\],]+)((?:,[^=\],]+=[^\]]*)*)\]/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(message)) !== null) {
        if (match.index > lastIndex) {
            const text = message.slice(lastIndex, match.index);
            if (text) segments.push({ type: 'text', data: { text: cq(text) } });
        }

        const type = match[1];
        const rawParams = match[2];
        const data: Record<string, string> = {};

        if (rawParams) {
            const pairs = rawParams.replace(/^,/, '').split(',');
            for (const pair of pairs) {
                const eqIdx = pair.indexOf('=');
                if (eqIdx !== -1) {
                    const key = pair.slice(0, eqIdx);
                    const val = pair.slice(eqIdx + 1);
                    data[key] = cq(val);
                }
            }
        }

        segments.push({ type, data } as any);
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < message.length) {
        const text = message.slice(lastIndex);
        if (text) segments.push({ type: 'text', data: { text: cq(text) } });
    }

    return segments;
}

export function escape(message: Message['In']): string {
    const cq = (text: string) => text
        .replace(/&/g, '&amp;')
        .replace(/\[/g, '&#91;')
        .replace(/\]/g, '&#93;');
    return typeof message === 'string' ? message : message
        .map(seg => {
            if (seg.type === 'text')
                return cq(seg.data?.text ?? '');
            if (!seg.data || Object.keys(seg.data).length === 0)
                return `[CQ:${seg.type}]`;
            const params = Object.entries(seg.data)
                .map(([key, val]) => `${key}=${cq(String(val))}`)
                .join(',');
            return `[CQ:${seg.type},${params}]`;
        })
        .join('');
}

export interface Message {
    In: string | MessageSegment['In'][];
    Out: string | MessageSegment['Out'][];
}

export type MessageSegment =
    | TextMessageSegment
    | FaceMessageSegment
    | ImageMessageSegment
    | RecordMessageSegment
    | VideoMessageSegment
    | AtMessageSegment
    | RpsMessageSegment
    | DiceMessageSegment
    | ShakeMessageSegment
    | PokeMessageSegment
    | AnonymousMessageSegment
    | ShareMessageSegment
    | ContactMessageSegment
    | LocationMessageSegment
    | MusicPlatformMessageSegment
    | CustomMusicMessageSegment
    | ReplyMessageSegment
    | ForwardMessageSegment
    | NodeIdMessageSegment
    | XmlMessageSegment
    | JsonMessageSegment;

interface Both<T> { In: T, Out: T }

export type TextMessageSegment = Both<{
    type: 'text';
    data: {
        text: string;
    };
}>;

export type FaceMessageSegment = Both<{
    type: 'face';
    data: {
        id: string;
    };
}>;

export interface ImageMessageSegment {
    In: {
        type: 'image';
        data: {
            file: string;
            type?: 'flash';
            url: string;
        };
    };
    Out: {
        type: 'image';
        data: {
            file: string;
            type?: 'flash';
            cache?: boolean;
            proxy?: boolean;
            timeout?: string | number;
        };
    };
}

export interface RecordMessageSegment {
    In: {
        type: 'record';
        data: {
            file: string;
            magic?: boolean;
            url: string;
        };
    };
    Out: {
        type: 'record';
        data: {
            file: string;
            magic?: boolean;
            cache?: boolean;
            proxy?: boolean;
            timeout?: string | number;
        };
    };
}

export interface VideoMessageSegment {
    In: {
        type: 'video';
        data: {
            file: string;
            url: string;
        };
    };
    Out: {
        type: 'video';
        data: {
            file: string;
            cache?: boolean;
            proxy?: boolean;
            timeout?: string | number;
        };
    }
}

export type AtMessageSegment = Both<{
    type: 'at';
    data: {
        qq: string | 'all';
    };
}>;

export type RpsMessageSegment = Both<{
    type: 'rps';
    data: Record<string, never>;
}>;

export type DiceMessageSegment = Both<{
    type: 'dice';
    data: Record<string, never>;
}>;

export type ShakeMessageSegment = Both<{
    type: 'shake';
    data: Record<string, never>;
}>;

export interface PokeMessageSegment {
    In: {
        type: 'poke';
        data: {
            type: string;
            id: string;
            name: string;
        };
    };
    Out: {
        type: 'poke';
        data: {
            type: string;
            id: string;
        };
    };
}

export interface AnonymousMessageSegment {
    In: {
        type: 'anonymous';
        data: Record<string, never>;
    };
    Out: {
        type: 'anonymous';
        data: {
            ignore: boolean;
        };
    };
}

export type ShareMessageSegment = Both<{
    type: 'share';
    data: {
        url: string;
        title: string;
        content?: string;
        image?: string;
    };
}>;

export type ContactMessageSegment = Both<{
    type: 'contact';
    data: {
        type: 'qq' | 'group';
        id: string;
    };
}>;

export type LocationMessageSegment = Both<{
    type: 'location';
    data: {
        lat: string;
        lon: string;
        title?: string;
        content?: string;
    };
}>;

export interface MusicPlatformMessageSegment {
    In: {
        type: 'music';
        data: Record<string, never>;
    };
    Out: {
        type: 'music';
        data: {
            type: 'qq' | '163' | 'xm';
            id: string;
        };
    };
}

export interface CustomMusicMessageSegment {
    In: {
        type: 'music';
        data: Record<string, never>;
    };
    Out: {
        type: 'music';
        data: {
            type: 'custom';
            url: string;
            audio: string;
            title: string;
            content?: string;
            image?: string;
        };
    };
}

export type ReplyMessageSegment = Both<{
    type: 'reply';
    data: {
        id: string;
    };
}>;

export interface ForwardMessageSegment {
    In: {
        type: 'forward';
        data: {
            id: string;
            /** TODO: Need to confirm its source; might be an extension. */
            content?: MessageEvent[];
        };
    };
    Out: {
        type: 'forward';
        data: Record<string, never>;
    };
}

export interface NodeIdMessageSegment {
    In: {
        type: 'node';
        data: Record<string, never>;
    };
    Out: {
        type: 'node';
        data: {
            id: string;
        };
    };
}

export type CustomNodeMessageSegment = Both<{
    type: 'node';
    data: {
        user_id: string;
        nickname: string;
        content: string | MessageSegment[];
    };
}>;

export type XmlMessageSegment = Both<{
    type: 'xml';
    data: {
        data: string;
    };
}>;

export type JsonMessageSegment = Both<{
    type: 'json';
    data: {
        data: string;
    };
}>;