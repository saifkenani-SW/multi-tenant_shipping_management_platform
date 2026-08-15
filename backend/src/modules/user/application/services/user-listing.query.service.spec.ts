import { ForbiddenException } from '@nestjs/common';

import { UserListingQueryService } from './user-listing.query.service';
import { SubjectType } from '../../../../packages/context/principal/principal/SubjectType';
import { UserQueryDto } from '../dtos/requests/user-query.dto';

const CALLER_TENANT = '00000000-0000-7000-8000-000000000101';
const OTHER_TENANT = '00000000-0000-7000-8000-000000000102';

const emptyPage = { data: [], meta: {} as never };

const query = (over: Partial<UserQueryDto> = {}): UserQueryDto =>
  ({ limit: 10, ...over }) as UserQueryDto;

describe('UserListingQueryService', () => {
  let repository: { list: jest.Mock };
  let requestContext: { getPrincipal: jest.Mock };
  let service: UserListingQueryService;

  const signedInAs = (type: SubjectType, tenantId?: string) =>
    requestContext.getPrincipal.mockReturnValue({
      subject: { id: 'user-1', type },
      tenantId,
      branches: [],
      warehouses: [],
    });

  beforeEach(() => {
    repository = { list: jest.fn().mockResolvedValue(emptyPage) };
    requestContext = { getPrincipal: jest.fn() };
    service = new UserListingQueryService(
      repository as never,
      requestContext as never,
    );
  });

  describe('workspace boundary', () => {
    it('confines a tenant admin to their own workspace', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, CALLER_TENANT);

      await service.list(query());

      expect(repository.list).toHaveBeenCalledWith(
        expect.objectContaining({ tenantScope: CALLER_TENANT }),
      );
    });

    it('refuses a tenant admin asking for another workspace', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, CALLER_TENANT);

      await expect(
        service.list(query({ tenantId: OTHER_TENANT })),
      ).rejects.toThrow(ForbiddenException);

      expect(repository.list).not.toHaveBeenCalled();
    });

    it('refuses rather than silently narrowing, so an empty page is never mistaken for an empty workspace', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, CALLER_TENANT);

      await expect(
        service.list(query({ tenantId: OTHER_TENANT })),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a tenant admin to name their own workspace explicitly', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, CALLER_TENANT);

      await service.list(query({ tenantId: CALLER_TENANT }));

      expect(repository.list).toHaveBeenCalledWith(
        expect.objectContaining({ tenantScope: CALLER_TENANT }),
      );
    });

    it('refuses a tenant admin with no workspace attached', async () => {
      signedInAs(SubjectType.TENANT_ADMIN, undefined);

      await expect(service.list(query())).rejects.toThrow(ForbiddenException);
    });

    it('leaves a platform owner unrestricted', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);

      await service.list(query());

      expect(repository.list).toHaveBeenCalledWith(
        expect.objectContaining({ tenantScope: null }),
      );
    });

    it('lets a platform owner narrow to one workspace', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);

      await service.list(query({ tenantId: OTHER_TENANT }));

      expect(repository.list).toHaveBeenCalledWith(
        expect.objectContaining({ tenantScope: OTHER_TENANT }),
      );
    });
  });

  describe('search', () => {
    it('passes the search term through', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);

      await service.list(query({ search: 'sami' }));

      expect(repository.list).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'sami' }),
      );
    });
  });

  describe('mapping', () => {
    it('gives an avatar path only when an image exists', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.list.mockResolvedValue({
        data: [
          {
            id: 'u1',
            email: 'a@b.c',
            phone: null,
            full_name: 'A',
            profile_image_key: 'avatars/u1/avatar.jpg',
            account_types: ['EMPLOYEE'],
            tenant_ids: [CALLER_TENANT],
            created_at: new Date(),
          },
          {
            id: 'u2',
            email: 'd@e.f',
            phone: null,
            full_name: 'D',
            profile_image_key: null,
            account_types: ['CUSTOMER'],
            tenant_ids: [],
            created_at: new Date(),
          },
        ],
        meta: {} as never,
      });

      const page = await service.list(query());

      expect(page.data[0].profileImageUrl).toBe('/me/avatar/u1');
      expect(page.data[1].profileImageUrl).toBeNull();
    });

    it('carries every account type a person holds', async () => {
      signedInAs(SubjectType.PLATFORM_OWNER);
      repository.list.mockResolvedValue({
        data: [
          {
            id: 'u1',
            email: 'super@all-in-one.com',
            phone: null,
            full_name: 'Super Employee',
            profile_image_key: null,
            account_types: ['PLATFORM_ADMIN', 'TENANT_OWNER', 'EMPLOYEE'],
            tenant_ids: [CALLER_TENANT],
            created_at: new Date(),
          },
        ],
        meta: {} as never,
      });

      const page = await service.list(query());

      expect(page.data[0].accountTypes).toEqual([
        'PLATFORM_ADMIN',
        'TENANT_OWNER',
        'EMPLOYEE',
      ]);
    });
  });
});
