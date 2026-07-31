import { TenantQueryCriteriaBuilder } from './tenant-query-criteria.builder';
import { TenantSearchField } from '../../../domain/enums/tenant-search-field.enum';
import { Pagination } from '../../../../../common/pagination';

describe('TenantQueryCriteriaBuilder', () => {
  let builder: TenantQueryCriteriaBuilder;

  beforeEach(() => {
    builder = new TenantQueryCriteriaBuilder();
  });

  it('should build criteria object from query and scope', () => {
    const criteria = builder.build(
      {
        page: 2,
        limit: 25,
        search: 'Acme',
        searchType: TenantSearchField.TAX_NUMBER,
      } as any,
      { tenantId: 'tenant-id' },
    );

    expect(criteria.pagination).toBeInstanceOf(Pagination);
    expect(criteria.pagination).toEqual({
      page: 2,
      limit: 25,
      skip: 25,
      take: 25,
    });
    expect(criteria.search).toEqual({
      keyword: 'Acme',
      field: TenantSearchField.TAX_NUMBER,
    });
    expect(criteria.tenantId).toBe('tenant-id');
  });

  it('should default search field to name when search type is omitted', () => {
    const criteria = builder.build(
      {
        page: 1,
        limit: 10,
        search: 'Acme',
      } as any,
      {},
    );

    expect(criteria.search).toEqual({
      keyword: 'Acme',
      field: TenantSearchField.NAME,
    });
  });
});
