import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class UsersController {
  static async postNew(request, response) {
    const { email, password } = request.body;

    if (email === undefined) {
      response.status(400);
      response.send({ error: 'Missing email' });
    } else if (password === undefined) {
      response.status(400);
      response.send({ error: 'Missing password' });
    } else if (await dbClient.userAlreadyExists(email)) {
      response.status(400);
      response.send({ error: 'Already exist' });
    } else {
      const result = await dbClient.addUser(email, password);

      if (!result.result.ok) {
        response.status(500);
        response.send({ error: 'Failed to add new user' });
      } else {
        response.status(201);
        response.send({ email, id: result.insertedId });
      }
    }
  }

  static async getMe(request, response) {
    const userSessionToken = request.get('X-Token');
    // console.log(userSessionToken);

    if (typeof userSessionToken !== 'string') {
      response.status(403);
      response.send({ error: 'Forbidden' });
      return;
    }

    const userEmail = await redisClient.get(userSessionToken);
    // console.log(userEmail);

    if (typeof userEmail !== 'string') {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    const userObject = await dbClient.userId(userEmail);
    // console.log(userObject);

    if (typeof userObject !== 'object') {
      response.status(401);
      response.send({ error: 'Unauthorized' });
      return;
    }

    response.send({ id: userObject._id, email: userObject.email });
  }
}
