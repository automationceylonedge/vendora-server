import { Order } from '../orders/order.model.js';
import { User } from '../users/user.model.js';
import { Product } from '../products/product.model.js';
import { serializeWithVendor, PopulatedVendor } from '../products/product.service.js';

/** Admin dashboard stats: vendor/product/order counts and total revenue. */
export async function getStats() {
  const [vendors, products, orders, revenueAgg] = await Promise.all([
    User.countDocuments({ userType: 'vendor' }),
    Product.countDocuments(),
    Order.countDocuments(),
    Order.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  return {
    vendors,
    products,
    orders,
    revenue: revenueAgg[0]?.total ?? 0,
  };
}

/** List all vendors with a per-vendor product count. */
export async function listVendors() {
  const vendors = await User.find({ userType: 'vendor' })
    .select('firstName lastName email businessName businessLogo status createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // Product counts per vendor (parallel-safe, limited set)
  const vendorsWithCounts = await Promise.all(
    vendors.map(async (v) => ({
      ...v,
      productCount: await Product.countDocuments({ vendor: v._id }),
    })),
  );

  return vendorsWithCounts;
}

/** List all products across all vendors, embedding vendor business info. */
export async function listAllProducts() {
  const products = await Product.find()
    .populate<{ vendor: PopulatedVendor }>('vendor', 'businessName businessLogo firstName')
    .sort({ createdAt: -1 })
    .lean();

  return products.map(serializeWithVendor);
}
