import { TransportManifest } from '../../domain/entities/transport-manifest.entity';
import { ManifestStatus } from '../../domain/enums/manifest-status.enum';
import { ManifestNotFoundException } from '../../domain/exceptions/manifest-not-found.exception';
import { TransportManifestQueryRepository } from '../../infrastructure/repositories/transport-manifest-query.repository';
import { ManifestQueryCriteriaBuilder } from '../builders/query/manifest-query-criteria.builder';
import { ManifestResponseMapper } from '../mappers/manifest-response.mapper';
import { ManifestQueryDto } from '../dtos/requests/manifest-query.dto';
import { ManifestQueryService } from './manifest-query.service';
import { ParcelLookup } from '../../../contracts/parcel-lookup';

/**
 * A platform owner carries no tenant in the request context, so every read
 * path must accept `undefined` and leave the tenant filter off.
 */
describe('ManifestQueryService — tenant scoping', () => {
  const tenantId = '01910b80-6e42-7000-8000-000000000000';
  const manifestId = '01910b80-6e42-7000-8000-0000000000d1';

  const manifest = TransportManifest.restore({
    id: manifestId,
    tenantId,
    tripId: '01910b80-6e42-7000-8000-0000000000c1',
    originOrgUnitId: '01910b80-6e42-7000-8000-0000000000f1',
    destinationOrgUnitId: '01910b80-6e42-7000-8000-0000000000f2',
    status: ManifestStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const queryRepository = {
    findMany: jest.fn(),
    findById: jest.fn(),
    findItems: jest.fn(),
    findItemById: jest.fn(),
    isParcelInActiveManifest: jest.fn(),
    existsItemForParcel: jest.fn(),
  };

  /** Parcel labels are decoration on these reads; the tenant scoping is not. */
  const parcelLookup: ParcelLookup = {
    getParcelsByIds: jest.fn().mockResolvedValue([]),
  };

  let service: ManifestQueryService;

  beforeEach(() => {
    jest.resetAllMocks();
    (parcelLookup.getParcelsByIds as jest.Mock).mockResolvedValue([]);
    service = new ManifestQueryService(
      queryRepository as unknown as TransportManifestQueryRepository,
      new ManifestQueryCriteriaBuilder(),
      new ManifestResponseMapper(),
      parcelLookup,
    );
  });

  it('scopes the criteria to the tenant for a tenant-bound caller', async () => {
    queryRepository.findMany.mockResolvedValue([[], 0]);

    await service.findManifests(tenantId, new ManifestQueryDto());

    const [criteria] = queryRepository.findMany.mock.calls[0] as [
      { tenantId: string | undefined },
    ];
    expect(criteria.tenantId).toBe(tenantId);
  });

  it('leaves the criteria unscoped for a platform owner', async () => {
    queryRepository.findMany.mockResolvedValue([[], 0]);

    await service.findManifests(undefined, new ManifestQueryDto());

    const [criteria] = queryRepository.findMany.mock.calls[0] as [
      { tenantId: string | undefined },
    ];
    expect(criteria.tenantId).toBeUndefined();
  });

  it('reads a manifest from any tenant for a platform owner', async () => {
    queryRepository.findById.mockResolvedValue(manifest);
    queryRepository.findItems.mockResolvedValue([]);

    const result = await service.getManifestDetails(undefined, manifestId);

    expect(queryRepository.findById).toHaveBeenCalledWith(
      undefined,
      manifestId,
    );
    expect(result.id).toBe(manifestId);
  });

  it('still raises not-found when the manifest does not exist', async () => {
    queryRepository.findById.mockResolvedValue(null);

    await expect(
      service.getManifestDetails(undefined, manifestId),
    ).rejects.toBeInstanceOf(ManifestNotFoundException);
  });
});
