import { MongoClient } from 'mongodb';
import { promisify } from 'util';

MongoClient.connect = promisify(MongoClient.connect);

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 27017;
    const dbDatabase = process.env.DB_DATABASE || 'files_manager';

    MongoClient.connect(`mongodb://${dbHost}:${dbPort}`)
      .then((client) => {
        this.client = client;
        this.db = client.db(dbDatabase);
        this.usersColl = this.db.collection('users');
        this.filesColl = this.db.collection('files');
      });
  }

  isAlive() {
    if (this.client) {
      return true;
    }
    return false;
  }

  async nbUsers() {
    return this.usersColl.countDocuments({});
  }

  async nbFiles() {
    return this.filesColl.countDocuments({});
  }
}

const dbClient = new DBClient();
export default dbClient;
