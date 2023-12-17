import dbClient from '../utils/db';

export default class UsersController {
  static postNew(request, response) {
    const email = request.body.email;
    const password = request.body.password;

    if (email === undefined) {
      request.status(400);
      request.send({ error: 'Missing email' });
    } else if (password === undefined) {
      request.status(400);
      request.send({ error: 'Missing password' });
    } else if (dbClient.findUser(email)) {
      request.status(400);
      request.send({ error: 'Already exist' });
    } else {
      const { success, id } = dbClient.addUser(email, password);
      if (!success) {
        response.status(500);
        response.send({ error: 'Failed to add new user' });
      } else {
        response.status(201);
        response.send({ email: email, id });
      }
    }
  }
}
