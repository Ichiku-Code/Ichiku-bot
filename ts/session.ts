import { env } from './env.js';
import { Formatter } from './formatter.js';
import type { GroupMessageEvent } from './lib/events.js';
import { unescape } from './lib/message.js';
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

    async* content() {
        const formatter = new Formatter(this);
        let text = '';
        for await (const item of formatter.content(this.user, Temporal.Now.instant(), this.event.message)) {
            if (typeof item === 'string') text += item;
            else {
                if (text) {
                    yield { type: 'text', text } as const;
                    text = '';
                }
                yield item;
            }
        }
        if (text) yield { type: 'text', text } as const;
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
        memory.add({ role: 'user', content: await Array.fromAsync(this.content()) });
        for (let i = 0; i < 5; i++) {
            const response = await request({
                model: env.model.chat,
                messages: memory.all,
                tools: tools.all()
            }, { timeout: 180000 });
            const message = response.choices[0]?.message;
            if (message === undefined) throw new Error('Reply is empty');
            const { tool_calls, content } = message;
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
        }
        throw new Error('Too many tool calls');
    }
}