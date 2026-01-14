import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './routes.js';
import { createVercelHandler } from './lib/koa-vercel-adapter.js';

const app = new Koa();

app.use(cors());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

export default createVercelHandler(app);
