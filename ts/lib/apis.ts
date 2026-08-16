import type { Anonymous, MessageEvent, MessageSender } from './events.js';
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
    send_private_msg(params: {
        user_id: number;
        message: Message['Out'];
        auto_escape?: boolean;
    }): {
        message_id: number;
    };
    send_group_msg(params: {
        group_id: number;
        message: Message['Out'];
        auto_escape?: boolean;
    }): {
        message_id: number;
    };
    send_msg(params: {
        message_type?: 'private' | 'group';
        user_id?: number;
        group_id?: number;
        message: Message['Out'];
        auto_escape?: boolean;
    }): {
        message_id: number;
    };

    delete_msg(params: {
        message_id: number;
    }): void;

    get_msg(params: {
        message_id: number;
    }): {
        time: number;
        message_type: string;
        message_id: number;
        real_id: number;
        sender: MessageSender;
        message: Message['In'];
    };

    get_forward_msg(params: {
        id: string;
    }): {
        messages: MessageEvent[];
    };

    send_like(params: {
        user_id: number;
        times?: number;
    }): void;

    set_group_kick(params: {
        group_id: number;
        user_id: number;
        reject_add_request?: boolean;
    }): void;

    set_group_ban(params: {
        group_id: number;
        user_id: number;
        duration?: number;
    }): void;

    set_group_anonymous_ban(params: {
        group_id: number;
        anonymous?: Anonymous;
        anonymous_flag?: string;
        flag?: string;
        duration?: number;
    }): void;

    set_group_whole_ban(params: {
        group_id: number;
        enable?: boolean;
    }): void;

    set_group_admin(params: {
        group_id: number;
        user_id: number;
        enable?: boolean;
    }): void;

    set_group_anonymous(params: {
        group_id: number;
        enable?: boolean;
    }): void;

    set_group_card(params: {
        group_id: number;
        user_id: number;
        card?: string;
    }): void;

    set_group_name(params: {
        group_id: number;
        group_name: string;
    }): void;

    set_group_leave(params: {
        group_id: number;
        is_dismiss?: boolean;
    }): void;

    set_group_special_title(params: {
        group_id: number;
        user_id: number;
        special_title?: string;
        duration?: number;
    }): void;

    set_friend_add_request(params: {
        flag: string;
        approve?: boolean;
        remark?: string;
    }): void;

    set_group_add_request(params: {
        flag: string;
        sub_type?: 'add' | 'invite';
        type?: 'add' | 'invite';
        approve?: boolean;
        reason?: string;
    }): void;

    get_login_info(params: {}): {
        user_id: number;
        nickname: string;
    };

    get_stranger_info(params: {
        user_id: number;
        no_cache?: boolean;
    }): {
        user_id: number;
        nickname: string;
        sex: 'male' | 'female' | 'unknown';
        age: number;
    };

    get_friend_list(params: {}): {
        user_id: number;
        nickname: string;
        remark: string;
    }[];

    get_group_info(params: {
        group_id: number;
        no_cache?: boolean;
    }): {
        group_id: number;
        group_name: string;
        member_count: number;
        max_member_count: number;
    };

    get_group_list(params: {}): {
        group_id: number;
        group_name: string;
        member_count: number;
        max_member_count: number;
    }[];

    get_group_member_info(params: {
        group_id: number;
        user_id: number;
        no_cache?: boolean;
    }): {
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
    };

    get_group_member_list(params: {
        group_id: number;
    }): {
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
    }[];

    get_group_honor_info(params: {
        group_id: number;
        type: 'talkative' | 'performer' | 'legend' | 'strong_newbie' | 'emotion' | 'all';
    }): {
        group_id: number;
        current_talkative?: CurrentTalkativeUser;
        talkative_list?: GroupHonorUser[];
        performer_list?: GroupHonorUser[];
        legend_list?: GroupHonorUser[];
        strong_newbie_list?: GroupHonorUser[];
        emotion_list?: GroupHonorUser[];
    };

    get_cookies(params: {
        domain?: string;
    }): {
        cookies: string;
    };

    get_csrf_token(params: {}): {
        token: number;
    };

    get_credentials(params: {
        domain?: string;
    }): {
        cookies: string;
        csrf_token: number;
    };

    get_record(params: {
        file: string;
        out_format: 'mp3' | 'amr' | 'wma' | 'm4a' | 'spx' | 'ogg' | 'wav' | 'flac' | string;
    }): {
        file: string;
    };

    get_image(params: {
        file: string;
    }): {
        file: string;
    };

    can_send_image(params: {}): {
        yes: boolean;
    };

    can_send_record(params: {}): {
        yes: boolean;
    };

    get_status(params: {}): {
        online: boolean | null;
        good: boolean;
        [key: string]: any;
    };

    get_version_info(params: {}): {
        app_name: string;
        app_version: string;
        protocol_version: string;
        [key: string]: any;
    };

    // set_restart(params: {
    //     delay?: number;
    // }): void;

    clean_cache(params: {}): void;
}