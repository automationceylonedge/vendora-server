import { User } from './user.model.js';
import { ApiError } from '../../shared/utils/api-error.js';
import { deleteFile } from '../../shared/utils/r2.js';
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

export interface UpdateBusinessInputFull {
  businessName?: string;
  /** New logo object (already uploaded to R2). Replaces any existing logo. */
  logo?: { url: string; key: string };
}

export async function updateBusiness(userId: string, input: UpdateBusinessInputFull) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const update: {
    businessName?: string;
    businessLogo?: { url: string; key: string };
  } = {};

  if (input.businessName !== undefined) {
    update.businessName = input.businessName;
  }

  if (input.logo) {
    // Replace the previous logo in R2, if any
    if (user.businessLogo?.key) {
      await deleteFile(user.businessLogo.key).catch(() => {
        // Best-effort cleanup — don't fail the update if deletion fails
      });
    }
    update.businessLogo = input.logo;
  }

  Object.assign(user, update);
  await user.save({ validateModifiedOnly: true });

  return user.toJSON();
}

