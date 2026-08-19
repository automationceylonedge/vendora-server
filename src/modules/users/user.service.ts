import { User } from './user.model.js';
import { ApiError } from '../../shared/utils/api-error.js';
import type { UpdateDeliveryInput } from './user.validation.js';

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user.toJSON();
}

export async function updateDelivery(userId: string, delivery: UpdateDeliveryInput) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { delivery } },
    { new: true, runValidators: true },
  );
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user.toJSON();
}
