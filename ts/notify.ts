type Logger = (message: string) => void | Promise<void>;

let notifier: Logger;

export function setNotify(notify: Logger) {
    notifier = notify;
}

export async function notify(message: string, name = 'Bot') {
    await notifier(`[${name}] ${message}`);
}