import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const routes = {
  'GET /status': AppController.getStatus,
  'GET /stats': AppController.getStats,
  'POST /users': UsersController.postNew,
};
export default routes;
