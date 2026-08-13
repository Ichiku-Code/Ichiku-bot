type Logger = (message: string) => void | Promise<void>;

let debug_logger: Logger;
let notify_logger: Logger;

export function setLogger(debug: Logger, notify: Logger) {
    debug_logger = debug;
    notify_logger = notify;
}

export async function debug(message: string) {
    await debug_logger(message);
}

export async function notify(message: string) {
    await notify_logger(message);
}