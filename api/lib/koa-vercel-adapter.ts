import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Koa from 'koa';

/**
 * Adapter para executar uma aplicação Koa como handler Vercel Serverless
 * Converte VercelRequest para formato compatível com Koa e captura a resposta
 */
export function createVercelHandler(app: Koa) {
  const callback = app.callback();

  return async (req: VercelRequest, res: VercelResponse) => {
    await callback(req, res);
  };
}
