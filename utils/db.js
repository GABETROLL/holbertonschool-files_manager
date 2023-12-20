import { MongoClient } from 'mongodb';
import { promisify } from 'util';
import sha1 from 'sha1';

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

  async userAlreadyExists(email) {
    const matches = await this.usersColl.find({ email }).toArray();
    return !!matches.length;
  }

  async userId(email) {
    return this.usersColl.findOne({ email });
  }

  async addUser(email, password) {
    return this.usersColl.insertOne({ email, password: sha1(password) });
  }

  async validCredentials(email, password) {
    // assuming there can't be multiple users with the same email and password,
    // NOR same email.
    const matches = await this.usersColl.find({ email, password: sha1(password) }).toArray();
    return !!matches.length;
  }

  async nbFiles() {
    return this.filesColl.countDocuments({});
  }

  async fileWithID(id) {
    return this.filesColl.findOne({ _id: id });
  }

  async addFile(file) {
    return this.filesColl.insertOne(file);
  }
}

const dbClient = new DBClient();
export default dbClient;
