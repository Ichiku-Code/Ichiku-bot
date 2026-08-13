import { tavily } from '@tavily/core';
import { Parser } from 'expr-eval';
import { zodFunction } from 'openai/helpers/zod';
import type { output, ZodType } from 'zod';
import { z } from 'zod';

import * as logging from './logging.js';
import type { Session } from './session.js';

const tools = new Map<string, {
    description: string, schema: ZodType, process: (args: any, session: Session) => any | Promise<any>
}>();

export function all() {
    return tools.entries().map(([name, { description, schema }]) =>
        zodFunction({ name, description, parameters: schema })).toArray();
}

function register<T extends ZodType>(name: string, description: string, schema: T,
    process: (args: output<T>, session: Session) => any | Promise<any>) {
    tools.set(name, { description, schema, process });
}

export async function call(name: string, raw: string, session: Session) {
    try {
        const tool = tools.get(name);
        if (tool === undefined) throw new Error(`No such tool: ${name}`);
        const args = tool.schema.parse(JSON.parse(raw));
        await logging.notify(`正在使用${name}工具……`);
        const result = await tool.process(args, session);
        return { args, result };
    } catch (e) {
        return { error: e };
    }
}

function raw(strings: readonly string[], ...values: any[]) {
    const raw = strings.reduce((acc, str, i) => acc + values[i - 1] + str);
    return raw.replace(/^[ \t]+/gm, '').trim();
}

register(
    'tool_test',
    'Tool call测试。',
    z.object({ arg: z.string().describe('Tool call参数') }),
    () => 42
);

register(
    'web_search',
    raw`网络搜索。
    在调用搜索工具前，必须将用户的自然语言问题转化为适合搜索引擎的关键字：
    - 去除噪音：丢弃所有疑问词（如“什么是”、“如何”、“为什么”）、停用词（如“的”、“了”）和修饰词。
    - 提取核心：识别核心实体（Entity）、技术名词、特定概念。
    - 补充上下文：如果实体比较宽泛，添加分类词（如将 'Tavily' 补充为 'Tavily AI search API'）。
    - 语言适配：若用户询问技术/专有名词，优先生成英文关键词或中英混合关键词。
    - 时间具体化：将相对时间改为绝对时间点（如“最近”“近期”改为“2026.8”）。`,
    z.object({ query: z.string().describe('搜索关键词') }),
    async ({ query }) => await tavily().search(query, { searchDepth: 'ultra-fast' })
);

const parser = new Parser({ allowMemberAccess: false });

register(
    'simple_eval',
    raw`使用expr-eval安全评估简单算术表达式。
    支持：
    - 数字及列表字面量
    - 算术运算符：+, -, *, /, %, ^
    - 比较与逻辑：==, !=, <, <=, >, >=, in
    - 逻辑运算符：and / &&, or / ||, not / !
    - 三元条件表达式：cond ? left : right
    - 变量及多语句：x = 1; x * 2
    - 箭头函数：(x, y) -> x + y
    - 内置高阶函数：map, filter, fold
    - 特殊函数、常量：pow, sqrt, random, abs, min, max, pi, e等`,
    z.object({ expr: z.string().describe('表达式') }),
    ({ expr }) => parser.evaluate(expr)
);

register(
    'ban',
    '设置指定用户的禁言时长。会覆盖当前的禁言状态，禁言时长为 0 则相当于解除禁言。',
    z.object({
        user_id: z.int().describe('要禁言的用户id'),
        duration: z.int().min(0).max(15).describe('禁言时长（单位为分钟，范围为0~15）')
    }),
    async ({ user_id, duration }, session) => {
        await session.server.api.set_group_ban({ group_id: session.group, user_id, duration: duration * 60 });
        return 'succeed';
    }
);

register(
    'poke',
    '戳一戳指定用户。适合偶尔用于友情提示/催促，或与关系较好的群友进行趣味互动。',
    z.object({ user_id: z.int().describe('要戳一戳的用户id') }),
    async ({ user_id }, session) => {
        await session.server.api.group_poke({ group_id: session.group, user_id });
        return 'succeed';
    }
);

register(
    'get_group_members',
    '获取全部群成员的信息列表。',
    z.object(),
    async (_, session) => {
        const list = await session.server.api.get_group_member_list({ group_id: session.group });
        return list.map(user => ({
            user_id: user.user_id,
            user_name: user.card || user.nickname,
            role: user.role
        }));
    }
);