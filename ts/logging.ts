type Logger = (message: string) => void | Promise<void>;

let loggers: { debug: Logger, notify: Logger };

export function setLogger(debug: Logger, notify: Logger) {
    loggers = { debug, notify };
}

export async function debug(message: string) {
    await loggers.debug(message);
}

export async function notify(message: string) {
    await loggers.notify(message);
}