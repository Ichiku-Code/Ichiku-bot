import * as mutex from 'async-mutex';

export class Mutex {
    inner = new mutex.Mutex();

    async acquire() {
        return new MutexGuard(await this.inner.acquire());
    }
}

class MutexGuard {
    constructor(private release: mutex.MutexInterface.Releaser) { }

    [Symbol.dispose]() {
        this.release();
    }
}