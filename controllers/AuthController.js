import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(request, response) {
    const auth = request.get('Authorization');
    // console.log(`auth: ${auth}`);

    if (typeof auth !== 'string') {
      response.status(403);
      response.send({ error: 'Forbidden '});
      return;
    } 

    const authContents = auth.split(' ');
    // console.log(`authContents: ${authContents}`);

    if (!authContents || authContents.length !== 2) {
      response.status(403);
      response.send({ error: 'Forbidden' });
      return;
    }

    const [ authType, b64Credentials ] = authContents;
    // console.log(` authType: ${authType}, b64Credentials: ${b64Credentials}`);

    if (typeof authType !== 'string' || authType !== 'Basic' || typeof b64Credentials !== 'string') {
      response.status(403);
      response.send({ error: 'Forbidden' });
      return;
    }

    const credentials = Buffer.from(b64Credentials, 'base64')
      .toString('ascii')
      .split(':');
    // console.log(`credentials: ${credentials}`);

    if (credentials.length !== 2) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    const [ email, password ] = credentials;
    // console.log(`${email}, ${password}`);

    if (!(await dbClient.validCredentials(email, password))) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    // Create 24h session token for user, and send the token back to the user,
    // for them to use to get bac in their session, later.
    const userSessionToken = uuidv4();
    redisClient.set(userSessionToken, email, 60 * 60 * 24);

    response.status(200);
    response.send({ token: userSessionToken });
  }

  static async getDisconnect(request, response) {
    const userSessionToken = request.get('X-Token');
    // console.log(userSessionToken);

    if (typeof userSessionToken !== 'string') {
      response.status(403);
      response.send({ error: 'Forbidden' });
      return;
    }

    const userEmail = await redisClient.get(userSessionToken);
    // console.log(userEmail);

    if (!userEmail || !dbClient.userAlreadyExists(userEmail)) {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    redisClient.del(userSessionToken);
    response.status(204);
    response.send();
  }
}
