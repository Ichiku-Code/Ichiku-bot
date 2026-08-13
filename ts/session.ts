import type { ChatCompletionContentPart } from 'openai/resources';

import { env } from './env.js';
import type { GroupMessageEvent } from './lib/events.js';
import { type Message, unescape } from './lib/message.js';
import type { Server } from './lib/server.js';
import * as logging from './logging.js';
import { Memory, request } from './model.js';
import * as tools from './tools.js';

const memory = await Memory.from('memory.json', 'system.txt');

export class Session {
    constructor(public event: GroupMessageEvent, public server: Server) { }

    get group() {
        return this.event.group_id;
    }

    get user() {
        return this.event.user_id;
    }

    async usernameOf(id: number) {
        const user = await this.server.api.getGroupMemberInfo({ group_id: this.group, user_id: id });
        return user.card || user.nickname;
    }

    async* formatContent(user: number | readonly [number | undefined, string | undefined] | undefined,
        time: Temporal.Instant, message: Message['In']): AsyncGenerator<ChatCompletionContentPart> {
        const [userId, userName] = user === undefined ? ['Unknown', 'unknown']
            : typeof user === 'number' ? [user, await this.usernameOf(user)] : user;
        const metadata = `[Metadata] user_name=${userName} user_id=${userId} time=${time.toLocaleString()} `;
        yield { type: 'text', text: metadata };
        let texts = '';
        if (typeof message === 'string') {
            yield { type: 'text', text: message };
            return message;
        }
        for (const { type, data } of message) {
            switch (type) {
                case 'at': {
                    const id = data.qq;
                    if (id === 'all') texts += '[at:all]';
                    else texts += `[at:${id}(${await this.usernameOf(Number(id))})]`;
                    break;
                }
                case 'image': {
                    if (texts) {
                        yield { type: 'text', text: texts };
                        texts = '';
                    }
                    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
                    const response = await fetch(data.url, { headers });
                    const b64 = Buffer.from(await response.arrayBuffer()).toString('base64');
                    if (!b64 || response.headers.get('content-type') !== 'image/webp')
                        throw new Error(`Failed to download image ${data.url}`);
                    yield { type: 'image_url', image_url: { url: `data:image/webp;base64,${b64}` } };
                    break;
                }
                case 'reply': {
                    yield { type: 'text', text: '<reply>' };
                    try {
                        const reply = await this.server.api.getMsg({ message_id: Number(data.id) });
                        const time = Temporal.Instant.fromEpochMilliseconds(1000 * reply.time);
                        yield* this.formatContent(reply.sender.user_id, time, reply.message);
                    } catch (_) {
                        yield { type: 'text', text: '[unknown message]' };
                    }
                    yield { type: 'text', text: '</reply>' };
                    break;
                }
                case 'forward': {
                    yield { type: 'text', text: '<forward>' };
                    const forward = await this.server.api.getForwardMsg({ id: data.id });
                    for (const event of forward.messages) {
                        const time = Temporal.Instant.fromEpochMilliseconds(1000 * event.time);
                        const sender = [event.sender.user_id, event.sender.nickname] as const;
                        yield* this.formatContent(sender, time, event.message);
                    }
                    yield { type: 'text', text: '</forward>' };
                    break;
                }
                case 'text': {
                    texts += data.text;
                    break;
                }
                default: texts += `[Unknown message segment: ${type}]`;
            }
        }
        if (texts) yield { type: 'text', text: texts };
    }

    get content() {
        return this.formatContent(this.user, Temporal.Now.instant(), this.event.message);
    }

    get isToMe() {
        const message = this.event.message;
        if (typeof message === 'string') return false;
        return message.some(segment => segment?.type === 'at' && segment.data.qq === this.event.self_id.toString());
    }

    async reply() {
        if (!this.isToMe) return;
        await logging.notify(`正在回复${await this.usernameOf(this.user)}的信息~`);
        const start = performance.now();
        memory.add({ role: 'user', content: await Array.fromAsync(this.content) });
        for (let i = 0; i < 5; i++) {
            const response = await request({
                model: env.model.chat,
                messages: memory.all,
                tools: tools.all()
            }, { timeout: 180000 });
            const { tool_calls, content } = response.choices[0].message;
            memory.add({ role: 'assistant', content, tool_calls });
            if (tool_calls === undefined || tool_calls.length === 0) {
                memory.simplify();
                if (content === null) throw new Error('Reply content is null');
                const lines = content.replace('\n\n', '\n').replace('。', ' ').split('\n');
                if (lines.length > 5) throw new Error('Too many lines');
                for (const line of lines) {
                    const message = unescape(line.replace(/\[at:(\d+|all)]/g, '[CQ:at,qq=$1]').trim());
                    if (message.length) await this.server.api.sendGroupMsg({ group_id: this.group, message });
                }
                const end = performance.now();
                await logging.notify(`回复完成！花费了${Math.floor((end - start) / 1000)}s喵~`);
                await memory.compress();
                await memory.save();
                return;
            }
            await logging.notify('进行了一次Tool Call喵~');
            for (const tool of tool_calls) {
                if (tool.type !== 'function') throw new Error('Custom tool call is not supported');
                const result = await tools.call(tool.function.name, tool.function.arguments, this);
                memory.add({
                    role: 'tool',
                    tool_call_id: tool.id,
                    content: JSON.stringify(result)
                });
            }
            throw new Error('Too many tool calls');
        }
    }
}