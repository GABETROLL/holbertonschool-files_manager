import { createClient } from 'redis';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

class RedisClient {
  constructor() {
    // localhost:6739
    this.client = createClient();
    this.client.on('error', (error) => {
      console.log(`ERROR: ${error}`);
    });

    this.client.get = promisify(this.client.get);
    this.client.set = promisify(this.client.set);
    this.client.del = promisify(this.client.del);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, value, duration) {
    await this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    await this.client.del(key);
  }

  /**
   * Returns the email corresponding to `userSessionToken`,
   * from the Redis DB.
   * If something goes wrong, if the `userSessionToken`
   * isn't a key in the DB or if the key has no value,
   * this method returns null.
   */
  async getUserEmail(userSessionToken) {
    return this.client.get(`auth_${userSessionToken}`);
  }

  /**
   * Creates user session token uuidv4,
   * and adds it to the Redis DB with `userEmail`
   * as the value.
   *
   * Returns [ <DB insert result>, userSessionToken ];
   */
  async makeUserSession(userEmail) {
    const userSessionToken = uuidv4();
    const key = `auth_${userSessionToken}`;

    return [this.client.set(key, userEmail), userSessionToken];
  }

  /**
   * Attempts to delete `userSessionToken` from the RedisDB.
   * Returns the DB's response.
   */
  async endUserSession(userSessionToken) {
    return this.client.del(`auth_${userSessionToken}`);
  }
}

const redisClient = new RedisClient();
export default redisClient;
