import express from 'express';
import routes from './routes/index';

const port = process.env.PORT || 5000;

const app = express();
for (const [route, callback] of Object.entries(routes)) {
  app.get(route, callback);
}
app.listen(port, () => undefined);
