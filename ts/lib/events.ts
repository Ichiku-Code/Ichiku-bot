import type { Message } from './message.js';

export type Event = MessageEvent | NoticeEvent | RequestEvent | MetaEvent;

// #region Selecting

type SelectEventType1<T extends string> = Event & { post_type: T };
type SelectEventType2<T extends string, U extends string> = SelectEventType1<T> & Record<`${T}_type`, U>;

export type SelectEventType<Type extends string> = Type extends `${infer T}/${infer U}`
    ? SelectEventType2<T, U> : SelectEventType1<Type>;

// #region Message

export type MessageEvent = PrivateMessageEvent | GroupMessageEvent;

export interface PrivateMessageEvent {
    time: number;
    self_id: number;
    post_type: 'message';
    message_type: 'private';
    sub_type: 'friend' | 'group' | 'other';
    message_id: number;
    user_id: number;
    message: Message['In'];
    raw_message: string;
    font: number;
    sender: PrivateMessageSender;
}

export interface PrivateMessageSender {
    user_id?: number;
    nickname?: string;
    sex?: 'male' | 'female' | 'unknown';
    age?: number;
}

export interface GroupMessageEvent {
    time: number;
    self_id: number;
    post_type: 'message';
    message_type: 'group';
    sub_type: 'normal' | 'anonymous' | 'notice';
    message_id: number;
    group_id: number;
    user_id: number;
    anonymous: Anonymous;
    message: Message['In'];
    raw_message: string;
    font: number;
    sender: GroupMessageSender;
}

export interface Anonymous {
    id: number;
    name: string;
    flag: string;
}

export interface GroupMessageSender {
    user_id?: number;
    nickname?: string;
    card?: string;
    sex?: 'male' | 'female' | 'unknown';
    age?: number;
    area?: string;
    level?: string;
    role?: 'owner' | 'admin' | 'member';
    title?: string;
}

// #region Notice

export type NoticeEvent =
    | GroupUploadEvent
    | GroupAdminEvent
    | GroupDecreaseEvent
    | GroupIncreaseEvent
    | GroupBanEvent
    | FriendAddEvent
    | GroupRecallEvent
    | FriendRecallEvent
    | GroupPokeEvent
    | GroupLuckyKingEvent
    | GroupHonorEvent;

export interface GroupUploadEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'group_upload';
    group_id: number;
    user_id: number;
    file: File;
}

export interface File {
    id: string;
    name: string;
    size: number;
    busid: number;
}

export interface GroupAdminEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'group_admin';
    sub_type: 'set' | 'unset';
    group_id: number;
    user_id: number;
}

export interface GroupDecreaseEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'group_decrease';
    sub_type: 'leave' | 'kick' | 'kick_me';
    group_id: number;
    operator_id: number;
    user_id: number;
}

export interface GroupIncreaseEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'group_increase';
    sub_type: 'approve' | 'invite';
    group_id: number;
    operator_id: number;
    user_id: number;
}

export interface GroupBanEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'group_ban';
    sub_type: 'ban' | 'lift_ban';
    group_id: number;
    operator_id: number;
    user_id: number;
    duration: number;
}

export interface FriendAddEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'friend_add';
    user_id: number;
}

export interface GroupRecallEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'group_recall';
    group_id: number;
    user_id: number;
    operator_id: number;
    message_id: number;
}

export interface FriendRecallEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'friend_recall';
    user_id: number;
    message_id: number;
}

export interface GroupPokeEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'notify';
    sub_type: 'poke';
    group_id: number;
    user_id: number;
    target_id: number;
}

export interface GroupLuckyKingEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'notify';
    sub_type: 'lucky_king';
    group_id: number;
    user_id: number;
    target_id: number;
}

export interface GroupHonorEvent {
    time: number;
    self_id: number;
    post_type: 'notice';
    notice_type: 'notify';
    sub_type: 'honor';
    group_id: number;
    honor_type: 'talkative' | 'performer' | 'emotion';
    user_id: number;
}

// #region Request

export type RequestEvent = FriendRequestEvent | GroupRequestEvent;

export interface FriendRequestEvent {
    time: number;
    self_id: number;
    post_type: 'request';
    request_type: 'friend';
    user_id: number;
    comment: string;
    flag: string;
}

export interface GroupRequestEvent {
    time: number;
    self_id: number;
    post_type: 'request';
    request_type: 'group';
    sub_type: 'add' | 'invite';
    group_id: number;
    user_id: number;
    comment: string;
    flag: string;
}

// #region Meta

export type MetaEvent = LifecycleMetaEvent | HeartbeatMetaEvent;

export interface LifecycleMetaEvent {
    time: number;
    self_id: number;
    post_type: 'meta_event';
    meta_event_type: 'lifecycle';
    sub_type: 'enable' | 'disable' | 'connect';
}

export interface HeartbeatMetaEvent {
    time: number;
    self_id: number;
    post_type: 'meta_event';
    meta_event_type: 'heartbeat';
    status: Record<string, any>;
    interval: number;
}