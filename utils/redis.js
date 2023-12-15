import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.alive = true;

    // localhost:6739
    this.client = createClient();
    this.client.on('error', (error) => {
      this.alive = false;
      console.log(`ERROR: ${error}`);
    });

    this.client.get = promisify(this.client.get);
    this.client.set = promisify(this.client.set);
    this.client.del = promisify(this.client.del);
  }

  isAlive() { /* TODO */ }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, duration) {
    await this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
