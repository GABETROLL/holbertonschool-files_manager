import dbClient from '../utils/db';

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
}
