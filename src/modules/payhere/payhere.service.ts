import crypto from 'crypto';
import { Order } from '../orders/order.model.js';

interface PayHereNotification {
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  method?: string;
  status_message?: string;
  transaction_id?: string;
  card_holder_name?: string;
  card_no?: string;
  card_brand?: string;
  card_expiry_date?: string;
}

/**
 * Verify PayHere MD5 signature.
 *
 * PayHere concatenates: merchant_id + order_id + amount + currency + status_code
 * then upper-case MD5 hashes it with the merchant secret.
 */
function verifySignature(
  notification: PayHereNotification,
  merchantId: string,
  merchantSecret: string,
): boolean {
  const data = `${merchantId}${notification.order_id}${notification.payhere_amount}${notification.payhere_currency}${notification.status_code}`;
  const expected = crypto
    .createHash('md5')
    .update(data + merchantSecret)
    .digest('hex')
    .toUpperCase();

  return expected === notification.md5sig;
}

/**
 * Handle a PayHere IPN (Instant Payment Notification).
 *
 * 1. Log the raw body for debugging.
 * 2. Verify the MD5 signature.
 * 3. Update the order status in the database.
 */
export async function handlePayHereNotify(
  body: Record<string, string>,
  merchantId: string,
  merchantSecret: string,
) {
  console.log('── PayHere Notify ──');
  console.log(JSON.stringify(body, null, 2));

  const notification = body as unknown as PayHereNotification;

  // Verify signature
  if (!verifySignature(notification, merchantId, merchantSecret)) {
    console.error('❌ PayHere signature verification failed');
    throw new Error('Invalid PayHere signature');
  }

  // Map PayHere status_code to order status
  const statusCode = parseInt(notification.status_code, 10);
  let orderStatus: 'confirmed' | 'cancelled';
  switch (statusCode) {
    case 2:
      orderStatus = 'confirmed';
      break;
    case -1:
    case -2:
    case -3:
    default:
      orderStatus = 'cancelled';
      break;
  }

  const order = await Order.findOneAndUpdate(
    { _id: notification.order_id },
    {
      $set: {
        status: orderStatus,
      },
    },
    { new: true },
  );

  if (!order) {
    console.warn(`⚠️ Order not found for payhere order_id: ${notification.order_id}`);
  } else {
    console.log(`✅ Order ${notification.order_id} → ${orderStatus}`);
  }

  return { ok: true };
}
