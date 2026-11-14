import { Slider, ISlider } from './slider.model.js';
import { ApiError } from '../../shared/utils/api-error.js';
import { uploadFile, deleteFile } from '../../shared/utils/r2.js';

/** Public, mobile-facing read: active slides in display order. */
export async function listActiveSliders(): Promise<ISlider[]> {
  return Slider.find({ isActive: true }).sort({ order: 1 }).lean();
}

/** Admin read: all slides in display order. */
export async function listAllSliders(): Promise<ISlider[]> {
  return Slider.find().sort({ order: 1 }).lean();
}

interface AddSliderInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

/** Upload a new slide image to R2 and append it to the end of the carousel. */
export async function addSlider(input: AddSliderInput): Promise<ISlider> {
  const { url, key } = await uploadFile({
    buffer: input.buffer,
    fileName: input.fileName,
    mimeType: input.mimeType,
    folder: 'Home Sliders',
  });

  const order = await Slider.countDocuments();

  return Slider.create({ imageUrl: url, imageKey: key, order });
}

/** Reposition slides to match the supplied ordered id sequence. */
export async function reorderSliders(orderedIds: string[]): Promise<ISlider[]> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new ApiError(400, 'An ordered list of slide ids is required');
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      Slider.updateOne({ _id: id }, { $set: { order: index } }),
    ),
  );

  return listAllSliders();
}

/** Delete a slide and remove its file from R2 (best-effort cleanup). */
export async function removeSlider(id: string): Promise<void> {
  const slider = await Slider.findById(id);
  if (!slider) {
    throw new ApiError(404, 'Slider not found');
  }

  await deleteFile(slider.imageKey).catch(() => {
    // Best-effort cleanup — don't fail deletion if the file is already gone
  });

  await Slider.deleteOne({ _id: id });
}
