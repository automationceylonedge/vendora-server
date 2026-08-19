import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { handlePayHereNotify } from './payhere.service.js';

/**
 * PayHere IPN endpoint.
 *
 * PayHere sends a form-encoded POST to this URL after a payment attempt.
 * We log the body, verify the signature, and update the order.
 *
 * PayHere expects a 200 response with "OK" body on success.
 */
export async function payhereNotify(req: Request, res: Response) {
  try {
    await handlePayHereNotify(
      req.body as Record<string, string>,
      env.payHere.merchantId,
    );
    res.status(200).send('OK');
  } catch (err) {
    console.error('PayHere notify error:', err);
    // Still return 200 to PayHere to prevent retries; the error is logged.
    res.status(200).send('OK');
  }
}
