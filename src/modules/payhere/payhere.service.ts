import crypto from 'crypto';
import { Order } from '../orders/order.model.js';
import { notifyBuyerOfStatusChange } from '../orders/order-email.service.js';

interface PayHereNotification {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  custom_1?: string;
  custom_2?: string;
  method?: string;
  status_message?: string;
  payment_id?: string;
  card_holder_name?: string;
  card_no?: string;
  card_expiry?: string;
}

/**
 * Verify PayHere MD5 signature.
 *
 * md5sig = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret))
 */
function verifySignature(
  notification: PayHereNotification,
  merchantId: string,
  merchantSecret: string,
): boolean {
  const secretHash = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const data = `${merchantId}${notification.order_id}${notification.payhere_amount}${notification.payhere_currency}${notification.status_code}${secretHash}`;

  const expected = crypto
    .createHash('md5')
    .update(data)
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
  merchantSecret: string,
) {
  console.log('── PayHere Notify ──');
  console.log(JSON.stringify(body, null, 2));

  const notification = body as unknown as PayHereNotification;

  const merchantId = notification.merchant_id;

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

  const update: Record<string, unknown> = { status: orderStatus };

  if (orderStatus === 'confirmed') {
    update.payment = {
      paymentId: notification.payment_id || '',
      method: notification.method || '',
      cardNo: notification.card_no || '',
      cardHolderName: notification.card_holder_name || '',
      cardExpiry: notification.card_expiry || '',
    };
  }

  const order = await Order.findOneAndUpdate(
    { customOrderId: notification.custom_1 },
    { $set: update },
    { new: true },
  );

  if (!order) {
    console.warn(`⚠️ Order not found for custom_1: ${notification.custom_1}`);
  } else {
    console.log(`✅ Order ${notification.order_id} → ${orderStatus}`);
    void notifyBuyerOfStatusChange(order);
  }

  return { ok: true };
}
