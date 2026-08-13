import type {
    Anonymous, GroupMessageEvent, GroupMessageSender, PrivateMessageEvent, PrivateMessageSender
} from './events.js';
import type { Message } from './message.js';

export interface GroupHonorUser {
    user_id: number;
    nickname: string;
    avatar: string;
    description: string;
}

export interface CurrentTalkativeUser {
    user_id: number;
    nickname: string;
    avatar: string;
    day_count: number;
}

export interface APIs {
    send_private_msg: [{
        user_id: number;
        message: Message['Out'];
        auto_escape?: boolean;
    }, {
        message_id: number;
    }];
    send_group_msg: [{
        group_id: number;
        message: Message['Out'];
        auto_escape?: boolean;
    }, {
        message_id: number;
    }];
    send_msg: [{
        message_type?: 'private' | 'group';
        user_id?: number;
        group_id?: number;
        message: Message['Out'];
        auto_escape?: boolean;
    }, {
        message_id: number;
    }];

    delete_msg: [{
        message_id: number;
    }, void];

    get_msg: [{
        message_id: number;
    }, {
        time: number;
        message_type: string;
        message_id: number;
        real_id: number;
        sender: PrivateMessageSender | GroupMessageSender;
        message: Message['In'];
    }];

    get_forward_msg: [{
        id: string;
    }, {
        messages: (PrivateMessageEvent | GroupMessageEvent)[];
    }];

    send_like: [{
        user_id: number;
        times?: number;
    }, void];

    set_group_kick: [{
        group_id: number;
        user_id: number;
        reject_add_request?: boolean;
    }, void];

    set_group_ban: [{
        group_id: number;
        user_id: number;
        duration?: number;
    }, void];

    set_group_anonymous_ban: [{
        group_id: number;
        anonymous?: Anonymous;
        anonymous_flag?: string;
        flag?: string;
        duration?: number;
    }, void];

    set_group_whole_ban: [{
        group_id: number;
        enable?: boolean;
    }, void];

    set_group_admin: [{
        group_id: number;
        user_id: number;
        enable?: boolean;
    }, void];

    set_group_anonymous: [{
        group_id: number;
        enable?: boolean;
    }, void];

    set_group_card: [{
        group_id: number;
        user_id: number;
        card?: string;
    }, void];

    set_group_name: [{
        group_id: number;
        group_name: string;
    }, void];

    set_group_leave: [{
        group_id: number;
        is_dismiss?: boolean;
    }, void];

    set_group_special_title: [{
        group_id: number;
        user_id: number;
        special_title?: string;
        duration?: number;
    }, void];

    set_friend_add_request: [{
        flag: string;
        approve?: boolean;
        remark?: string;
    }, void];

    set_group_add_request: [{
        flag: string;
        sub_type?: 'add' | 'invite';
        type?: 'add' | 'invite';
        approve?: boolean;
        reason?: string;
    }, void];

    get_login_info: [{}, {
        user_id: number;
        nickname: string;
    }];

    get_stranger_info: [{
        user_id: number;
        no_cache?: boolean;
    }, {
        user_id: number;
        nickname: string;
        sex: 'male' | 'female' | 'unknown';
        age: number;
    }];

    get_friend_list: [{}, {
        user_id: number;
        nickname: string;
        remark: string;
    }[]];

    get_group_info: [{
        group_id: number;
        no_cache?: boolean;
    }, {
        group_id: number;
        group_name: string;
        member_count: number;
        max_member_count: number;
    }];

    get_group_list: [{}, {
        group_id: number;
        group_name: string;
        member_count: number;
        max_member_count: number;
    }[]];

    get_group_member_info: [{
        group_id: number;
        user_id: number;
        no_cache?: boolean;
    }, {
        group_id: number;
        user_id: number;
        nickname: string;
        card: string;
        sex: 'male' | 'female' | 'unknown';
        age: number;
        area: string;
        join_time: number;
        last_sent_time: number;
        level: string;
        role: 'owner' | 'admin' | 'member';
        unfriendly: boolean;
        title: string;
        title_expire_time: number;
        card_changeable: boolean;
    }];

    get_group_member_list: [{
        group_id: number;
    }, {
        group_id: number;
        user_id: number;
        nickname: string;
        card: string;
        sex: 'male' | 'female' | 'unknown';
        age: number;
        area?: string;
        join_time: number;
        last_sent_time: number;
        level: string;
        role: 'owner' | 'admin' | 'member';
        unfriendly: boolean;
        title?: string;
        title_expire_time: number;
        card_changeable: boolean;
    }[]];

    get_group_honor_info: [{
        group_id: number;
        type: 'talkative' | 'performer' | 'legend' | 'strong_newbie' | 'emotion' | 'all';
    }, {
        group_id: number;
        current_talkative?: CurrentTalkativeUser;
        talkative_list?: GroupHonorUser[];
        performer_list?: GroupHonorUser[];
        legend_list?: GroupHonorUser[];
        strong_newbie_list?: GroupHonorUser[];
        emotion_list?: GroupHonorUser[];
    }];

    get_cookies: [{
        domain?: string;
    }, {
        cookies: string;
    }];

    get_csrf_token: [{}, {
        token: number;
    }];

    get_credentials: [{
        domain?: string;
    }, {
        cookies: string;
        csrf_token: number;
    }];

    get_record: [{
        file: string;
        out_format: 'mp3' | 'amr' | 'wma' | 'm4a' | 'spx' | 'ogg' | 'wav' | 'flac' | string;
    }, {
        file: string;
    }];

    get_image: [{
        file: string;
    }, {
        file: string;
    }];

    can_send_image: [{}, {
        yes: boolean;
    }];

    can_send_record: [{}, {
        yes: boolean;
    }];

    get_status: [{}, {
        online: boolean | null;
        good: boolean;
        [key: string]: any;
    }];

    get_version_info: [{}, {
        app_name: string;
        app_version: string;
        protocol_version: string;
        [key: string]: any;
    }];

    // set_restart: [{
    //     delay?: number;
    // }, void];

    clean_cache: [{}, void];
}