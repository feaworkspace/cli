// write type definition for pushAndGet
declare global {
    interface Array<T> {
        pushAndGet<K extends T>(item: K): K;
    }
}

Object.defineProperty(Array.prototype, 'pushAndGet', {
    value: function <T>(this: T[], item: T): T {
        this.push(item);
        return item;
    },
    writable: false,
    enumerable: false,
    configurable: false
});

export {};
// This file is intentionally left empty. It only exists to extend the Array prototype with a new method.