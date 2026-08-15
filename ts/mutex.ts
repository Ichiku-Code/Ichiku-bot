const unlock = Symbol('unlock');

export class Mutex {
    private locked = false;
    private queue: (() => void)[] = [];

    async acquire() {
        if (!this.locked) this.locked = true;
        else await new Promise<void>(resolve => this.queue.push(resolve));
        return new MutexGuard(this);
    }

    [unlock]() {
        const resolve = this.queue.shift();
        this.locked = resolve !== undefined;
        resolve?.();
    }
}

class MutexGuard {
    constructor(private mutex: Mutex) { }

    [Symbol.dispose]() {
        this.mutex[unlock]();
    }
}