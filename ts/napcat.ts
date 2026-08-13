import './lib/apis.js';

// Napcat extensions.

declare module './lib/apis.js' {
    export interface APIs {
        group_poke: [{
            group_id: number;
            user_id: number;
        }, null];

        friend_poke: [{
            user_id: number;
            target_id?: number;
        }, null];
    }
}