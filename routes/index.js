import AppController from '../controllers/AppController';

const routes = {
  '/status/': AppController.getStatus,
  '/stats/': AppController.getStats,
};
export default routes;
