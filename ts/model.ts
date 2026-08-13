import { promises } from 'fs';
import OpenAI, { APIError, RateLimitError } from 'openai';
import type { ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam } from 'openai/resources';

import { env } from './env.js';
import * as logging from './logging.js';

export const openai = new OpenAI({
    apiKey: env.openai.key,
    baseURL: env.openai.url
});

export async function request(
    body: ChatCompletionCreateParamsNonStreaming,
    // Unfortunately we can't import this type since it's internal.
    options?: Parameters<typeof openai.chat.completions.create>[1]
) {
    try {
        const response = await openai.chat.completions.create(body, options);
        const usage = response.usage;
        if (usage !== undefined)
            await logging.notify(`输入${usage.prompt_tokens} token，输出${usage.completion_tokens} token喵~`);
        return response;
    } catch (e) {
        if (e instanceof RateLimitError) throw new Error('Rate limit exceeded', { cause: e });
        if (e instanceof APIError) throw new Error(`API error: ${e.code}`, { cause: e });
        throw e;
    }
}

const threshold = Number(env.model.threshold);

export class Memory {
    private constructor(private memory: string, private compressed: string,
        private recent: ChatCompletionMessageParam[], private system: string) { }

    static async from(memory: string, system: string) {
        const data = await promises.readFile(memory, 'utf-8');
        const { compressed, recent } = JSON.parse(data);
        return new Memory(memory, compressed, recent, await promises.readFile(system, 'utf-8'));
    }

    add(message: ChatCompletionMessageParam) {
        this.recent.push(message);
    }

    simplify() {
        for (const message of this.recent) {
            const content = message.content;
            if (!content || typeof content === 'string') continue;
            message.content = content.map(value => value.type === 'text' ? value.text : `[${value.type}]`).join('');
        }
    }

    get all(): ChatCompletionMessageParam[] {
        return [
            { role: 'system', content: this.system },
            { role: 'system', content: `【此前对话的背景摘要】：${this.compressed}` },
            ...this.recent
        ];
    }

    async save() {
        await promises.writeFile(this.memory, JSON.stringify(
            { compressed: this.compressed, recent: this.recent }, undefined, 2));
    }

    async compress() {
        const length = this.recent.length;
        if (length <= threshold)
            return await logging.notify(`上下文已使用${(length / threshold * 100).toFixed(2)}%~`);
        await logging.notify('上下文压缩中~');

        const start = performance.now();
        const tools = this.recent.map(msg =>
            (msg.role === 'assistant' ? msg.tool_calls?.length ?? 0 : 0) - +(msg.role === 'tool'));
        let size = Math.floor(threshold / 2);
        do if (tools.slice(0, size).reduce((a, b) => a + b, 0) === 0) break;
        while (++size < length);
        const olds = this.recent.slice(0, size).filter(msg => msg.role !== 'tool')
            .map(msg => `${msg.role}: ${msg.content}`).join('\n');
        const prompt = [
            '根据新增的QQ群聊天对话，更新原有的摘要，生成一份全新的、包含全局信息的更新后摘要，不超过500字。',
            '要求融合而非覆盖：把最新对话中的关键增量信息，融合进已有历史摘要中，生成一份统一的最新摘要。',
            '直接输出更新后的全局历史摘要。'
        ].join('\n');

        const response = await request({
            model: env.model.compress,
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: `原有摘要：${this.compressed}` },
                { role: 'user', content: `新增对话：${olds}` },
            ],
            temperature: 0.3
        }, { timeout: 120000 });
        const content = response.choices[0].message.content;
        if (content === null || content.length > 800)
            throw new Error('Invalid compression result!');
        this.recent = this.recent.slice(size);
        this.compressed = content;
        const end = performance.now();
        await logging.notify(`上下文压缩完成！花费了${Math.floor((end - start) / 1000)}s喵~`);
    }
}