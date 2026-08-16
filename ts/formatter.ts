import type { ChatCompletionContentPart } from 'openai/resources';

import type { Message, MessageSegment } from './lib/message.js';
import type { ForwardMessageSegmentData } from './napcat.js';
import type { Session } from './session.js';

type UserData = number | readonly [id: number | undefined, name: string | undefined] | undefined;

type Contents = AsyncGenerator<ChatCompletionContentPart | string>;

type Data<Type extends MessageSegment['In']['type']> = (MessageSegment['In'] & { type: Type })['data'];

export class Formatter {
    constructor(public session: Session) { }

    async userOf(data: UserData) {
        const id = typeof data === 'number' ? data : data?.[0];
        const name = typeof data === 'number' ? await this.session.usernameOf(data) : data?.[1];
        return { id, name };
    }

    async* content(user: UserData, time: Temporal.Instant, message: Message['In']): Contents {
        const { id, name } = await this.userOf(user);
        yield `[Metadata] user_name=${name} user_id=${id} time=${time.toLocaleString()} `;
        if (typeof message === 'string') return yield message;
        this satisfies { [Type in MessageSegment['In']['type']]: (data: Data<Type>) => Contents };
        for (const { type, data } of message) yield* this[type](data as any);
    }

    async* text(data: Data<'text'>): Contents {
        yield data.text;
    }

    async* face(data: Data<'face'>): Contents {
        yield `[QQ表情${data.id}]`;
    }

    async* image(data: Data<'image'>): Contents {
        const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
        const response = await fetch(data.url, { headers });
        const b64 = Buffer.from(await response.arrayBuffer()).toString('base64');
        if (!b64 || response.headers.get('content-type') !== 'image/webp')
            throw new Error(`Failed to download image ${data.url}`);
        yield { type: 'image_url', image_url: { url: `data:image/webp;base64,${b64}` } };
    }

    async* record(_: Data<'record'>): Contents {
        yield '[音频]';
    }

    async* video(_: Data<'video'>): Contents {
        yield '[视频]';
    }

    async* at(data: Data<'at'>): Contents {
        const id = data.qq;
        yield id === 'all' ? '[at:all]' : `[at:${id}(${await this.session.usernameOf(Number(id))})]`;
    }

    async* rps(_: Data<'rps'>): Contents {
        yield '[QQ特殊表情-猜拳]';
    }

    async* dice(_: Data<'dice'>): Contents {
        yield '[QQ特殊表情-骰子]';
    }

    async* shake(_: Data<'shake'>): Contents {
        yield '[戳一戳]';
    }

    async* poke(_: Data<'poke'>): Contents {
        yield '[戳一戳]';
    }

    async* anonymous(_: Data<'anonymous'>): Contents {
        yield '[匿名]';
    }

    async* share(data: Data<'share'>): Contents {
        yield `[分享:${data.title}${data.content ? ` (${data.content})` : ''} - ${data.url}]`;
    }

    async* contact(data: Data<'contact'>): Contents {
        yield data.type === 'qq' ? `[推荐好友: ${data.id}]` : `[推荐群: ${data.id}]`;
    }

    async* location(data: Data<'location'>): Contents {
        yield `[位置:${data.title ?? ''}${data.content ? ` (${data.content})` : ''} - lat=${data.lat}, lon=${data.lon}]`;
    }

    async* music(_: Data<'music'>): Contents {
        yield '[音乐分享]';
    }

    async* reply(data: Data<'reply'>): Contents {
        yield { type: 'text', text: '<reply>' };
        try {
            const reply = await this.session.server.api.getMsg({ message_id: Number(data.id) });
            const time = Temporal.Instant.fromEpochMilliseconds(1000 * reply.time);
            yield* this.content(reply.sender.user_id, time, reply.message);
        } catch (_) {
            yield '[unknown message]';
        }
        yield { type: 'text', text: '</reply>' };
    }

    async* forward(raw: Data<'forward'>): Contents {
        const data = raw as ForwardMessageSegmentData;
        yield { type: 'text', text: '<forward>' };
        try {
            const forward = data.content ?? (await this.session.server.api.getForwardMsg({ id: data.id })).messages;
            for (const event of forward) {
                const time = Temporal.Instant.fromEpochMilliseconds(1000 * event.time);
                const sender = [event.sender.user_id, event.sender.nickname] as const;
                yield* this.content(sender, time, event.message);
            }
        } catch (_) {
            yield '[unknown message]';
        }
        yield { type: 'text', text: '</forward>' };
    }

    async* node(_: Data<'node'>): Contents {
        // I don't think this will appear.
        yield '';
    }

    async* xml(data: Data<'xml'>): Contents {
        yield `[xml:${data.data}]`;
    }

    async* json(data: Data<'json'>): Contents {
        yield `[json:${data.data}]`;
    }
}