import type { IOrder } from './order.model.js';
import { Product } from '../products/product.model.js';
import { User } from '../users/user.model.js';
import { env } from '../../config/env.js';
import { sendEmail } from '../../shared/utils/email.js';
import {
  renderNewOrderVendorEmail,
  renderOrderStatusBuyerEmail,
  type EmailOrderItem,
  type OrderEmailData,
} from '../../shared/utils/email-templates.js';

interface ResolvedItem extends EmailOrderItem {
  productId: string;
  vendorId?: string;
}

interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
}

/** Order fields may hold a raw ObjectId or a populated document. */
function resolveId(value: unknown): string {
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

async function resolveItems(order: IOrder): Promise<ResolvedItem[]> {
  const productIds = order.items.map((item) => resolveId(item.productId));

  const products = await Product.find({ _id: { $in: productIds } })
    .select('title vendor')
    .lean();

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return order.items.map((item) => {
    const productId = resolveId(item.productId);
    const product = productMap.get(productId);

    return {
      productId,
      vendorId: product ? String(product.vendor) : undefined,
      title: product?.title || 'Product',
      quantity: item.quantity,
      price: item.price,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    };
  });
}

async function resolveCustomer(order: IOrder): Promise<CustomerInfo> {
  const user = await User.findById(resolveId(order.user))
    .select('firstName lastName email')
    .lean();

  if (!user) {
    return {
      name: order.delivery.name,
      phone: order.delivery.phone,
    };
  }

  return {
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: order.delivery.phone,
  };
}

function buildEmailData(
  order: IOrder,
  items: EmailOrderItem[],
  customer: CustomerInfo,
): OrderEmailData {
  return {
    orderId: order.customOrderId,
    orderDate: order.createdAt,
    status: order.status,
    customer,
    delivery: {
      name: order.delivery.name,
      phone: order.delivery.phone,
      address: order.delivery.address,
    },
    items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
  };
}

/**
 * Notify every vendor whose products appear in a newly created order.
 * One email is sent per vendor containing only that vendor's line items.
 */
export async function notifyVendorsOfNewOrder(order: IOrder): Promise<void> {
  try {
    const items = await resolveItems(order);

    const itemsByVendor = new Map<string, ResolvedItem[]>();
    for (const item of items) {
      if (!item.vendorId) continue;
      const list = itemsByVendor.get(item.vendorId) ?? [];
      list.push(item);
      itemsByVendor.set(item.vendorId, list);
    }

    if (itemsByVendor.size === 0) return;

    const [customer, vendors] = await Promise.all([
      resolveCustomer(order),
      User.find({ _id: { $in: [...itemsByVendor.keys()] } })
        .select('firstName lastName email businessName')
        .lean(),
    ]);

    await Promise.all(
      vendors.map(async (vendor) => {
        const vendorItems = itemsByVendor.get(String(vendor._id));
        if (!vendorItems?.length || !vendor.email) return;

        const vendorTotal = vendorItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        const vendorName =
          vendor.businessName ||
          `${vendor.firstName} ${vendor.lastName}`.trim() ||
          vendor.email;

        const data: OrderEmailData = {
          ...buildEmailData(order, vendorItems, customer),
          subtotal: vendorTotal,
          shipping: 0,
          total: vendorTotal,
        };

        const { subject, htmlContent } = renderNewOrderVendorEmail({
          data,
          vendorName,
          dashboardUrl: `${env.clientUrl.replace(/\/+$/, '')}/dashboard`,
        });

        await sendEmail({
          to: { email: vendor.email, name: vendorName },
          subject,
          htmlContent,
          replyTo: customer.email
            ? { email: customer.email, name: customer.name }
            : undefined,
          tags: ['new-order', 'vendor'],
        });
      }),
    );
  } catch (err) {
    console.error('❌ Failed to send new-order vendor email(s):', err);
  }
}

/**
 * Notify the buyer that their order status changed.
 */
export async function notifyBuyerOfStatusChange(order: IOrder): Promise<void> {
  try {
    const [items, customer] = await Promise.all([
      resolveItems(order),
      resolveCustomer(order),
    ]);

    if (!customer.email) return;

    const { subject, htmlContent } = renderOrderStatusBuyerEmail({
      data: buildEmailData(order, items, customer),
    });

    await sendEmail({
      to: { email: customer.email, name: customer.name },
      subject,
      htmlContent,
      tags: ['order-status', order.status],
    });
  } catch (err) {
    console.error('❌ Failed to send order-status buyer email:', err);
  }
}
