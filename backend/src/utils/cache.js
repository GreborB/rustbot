class Cache {
    constructor() {
        this.cache = new Map();
    }

    async get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    async set(key, value, ttlSeconds = 300) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + (ttlSeconds * 1000)
        });
    }

    async del(key) {
        this.cache.delete(key);
    }

    async flush() {
        this.cache.clear();
    }
}

export const cache = new Cache(); 