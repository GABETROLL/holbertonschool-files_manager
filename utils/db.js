import { MongoClient } from 'mongodb';
import { promisify } from 'util';

MongoClient.connect = promisify(MongoClient.connect);

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 27017;
    const dbDatabase = process.env.DB_DATABASE || 'files_manager';

    this.alive = false;

    this.client = MongoClient.connect(`mongodb://${dbHost}:${dbPort}`)
      .then((client) => {
        this.alive = true;
        return client;
      });
    this.db = this.client.db(dbDatabase);
  }

  isAlive() {
    return this.alive;
  }
}
