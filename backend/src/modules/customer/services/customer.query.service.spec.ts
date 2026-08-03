import { Readable } from 'stream';
import { Customer } from '../domain/customer.entity';
import { CustomerQueryService } from './customer.query.service';

describe('CustomerQueryService', () => {
  const repository = {
    findProfileByUserId: jest.fn(),
    findProfileImageKeyById: jest.fn(),
  };
  const storage = {
    get: jest.fn(),
  };
  const service = new CustomerQueryService(repository, storage as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns a cache-busted profile image URL when the customer has an image', async () => {
    const updatedAt = '2026-08-02T20:00:00.000Z';
    repository.findProfileByUserId.mockResolvedValue(
      new Customer(
        '0198f7d2-9b6c-7000-8000-000000000001',
        'user-id',
        'customer@example.com',
        'Khaled Omar',
        '0999876543',
        'profile-id/profile-image/image.webp',
        new Date('2026-08-01T20:00:00.000Z'),
        updatedAt as unknown as Date,
      ),
    );

    const result = await service.getProfile('user-id');

    expect(result?.profileImageUrl).toBe(
      `/customer/profile-image/0198f7d2-9b6c-7000-8000-000000000001?v=${new Date(updatedAt).getTime()}`,
    );
  });

  it('returns null as the profile image URL when no image was uploaded', async () => {
    repository.findProfileByUserId.mockResolvedValue(
      new Customer(
        'profile-id',
        'user-id',
        'customer@example.com',
        'Khaled Omar',
        '0999876543',
        null,
        new Date(),
        new Date(),
      ),
    );

    const result = await service.getProfile('user-id');

    expect(result?.profileImageUrl).toBeNull();
  });

  it('loads the image stream and derives its content type', async () => {
    const stream = Readable.from(Buffer.from('image'));
    repository.findProfileImageKeyById.mockResolvedValue(
      'profile-id/profile-image/image.png',
    );
    storage.get.mockResolvedValue(stream);

    await expect(service.getProfileImage('profile-id')).resolves.toEqual({
      stream,
      contentType: 'image/png',
    });
  });
});
