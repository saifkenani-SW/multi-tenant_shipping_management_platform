import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Readable } from 'stream';

import { RequestContextService } from '../../../../packages/context/services/request-context.service';
import { STORAGE_PROVIDER } from '../../../../packages/storage/src';
import type {
  IStorageProvider,
  StorageFile,
} from '../../../../packages/storage/src';
import { TransactionalPrismaService } from '../../../../packages/transaction';
import { PROFILE_AVATAR } from '../../constants/profile.constants';

/**
 * Extensions are chosen from the mime type rather than taken from the uploaded
 * filename, so a caller cannot decide what the stored file is called.
 */
const IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * The avatar of whoever is making the request.
 *
 * It is stored against the users row, which is the one record every login type
 * has — employee, driver, tenant admin, platform owner and customer alike. A
 * tenant admin has no profile table, so anywhere else would have left that type
 * unable to have one.
 *
 * The identity always comes from the request context. There is no user id in
 * the request to tamper with, so a caller can only ever change their own.
 */
@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name);

  constructor(
    private readonly requestContext: RequestContextService,
    private readonly prisma: TransactionalPrismaService,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async upload(file: StorageFile): Promise<{ profileImageUrl: string }> {
    const userId = this.requestContext.getPrincipal().subject.id;

    const extension = IMAGE_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException(
        'Only JPEG, PNG and WebP images are allowed.',
      );
    }

    const current = await this.prisma.client.users.findUnique({
      where: { id: userId },
      select: { profile_image_key: true },
    });

    if (!current) {
      throw new NotFoundException('User not found.');
    }

    const saved = await this.storageProvider.save(
      { ...file, originalname: `avatar${extension}` },
      userId,
      PROFILE_AVATAR.CATEGORY,
    );

    // If recording the new key fails, the file just written would otherwise be
    // left behind with nothing pointing at it.
    try {
      await this.prisma.client.users.update({
        where: { id: userId },
        data: { profile_image_key: saved.storage_key },
      });
    } catch (error) {
      await this.storageProvider
        .delete(saved.storage_key)
        .catch(() => undefined);
      throw error;
    }

    // The old file is removed only after the new key is safely recorded, and a
    // failure here is logged rather than thrown: the upload did succeed, and an
    // orphaned file is not worth failing the request over.
    if (current.profile_image_key && current.profile_image_key !== saved.storage_key) {
      await this.storageProvider
        .delete(current.profile_image_key)
        .catch((error) =>
          this.logger.warn(
            `Could not delete the previous avatar of user ${userId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
        );
    }

    return { profileImageUrl: PROFILE_AVATAR.urlFor(userId) };
  }

  async remove(): Promise<void> {
    const userId = this.requestContext.getPrincipal().subject.id;

    const current = await this.prisma.client.users.findUnique({
      where: { id: userId },
      select: { profile_image_key: true },
    });

    if (!current?.profile_image_key) {
      return;
    }

    await this.prisma.client.users.update({
      where: { id: userId },
      data: { profile_image_key: null },
    });

    await this.storageProvider
      .delete(current.profile_image_key)
      .catch((error) =>
        this.logger.warn(
          `Could not delete the avatar file of user ${userId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
  }

  /**
   * Streams a user's avatar by id.
   *
   * Reading is open to any signed-in user because an avatar is shown next to a
   * name across the app — a branch listing its staff, a shipment showing who
   * created it. Only the owner can change theirs.
   */
  async getStream(
    userId: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    const user = await this.prisma.client.users.findUnique({
      where: { id: userId },
      select: { profile_image_key: true },
    });

    if (!user?.profile_image_key) {
      throw new NotFoundException('This user has no profile image.');
    }

    const stream = await this.storageProvider.get(user.profile_image_key);

    return {
      stream,
      contentType: contentTypeFor(user.profile_image_key),
    };
  }
}

function contentTypeFor(storageKey: string): string {
  if (storageKey.endsWith('.png')) return 'image/png';
  if (storageKey.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}
