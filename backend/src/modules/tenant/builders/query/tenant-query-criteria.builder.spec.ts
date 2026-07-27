import { TenantQueryCriteriaBuilder } from './tenant-query-criteria.builder';
import { TenantSearchField } from '../../enums/tenant-search-field.enum';
import { TenantQueryCriteria } from './tenant-query-criteria';
import { Pagination } from '../../../../common/pagination';

describe('TenantQueryCriteriaBuilder', () => {
  let builder: TenantQueryCriteriaBuilder;

  beforeEach(() => {
    builder = new TenantQueryCriteriaBuilder();
  });

  it('should build immutable criteria from query and scope', () => {
    const criteria = builder.build(
      {
        page: 2,
        limit: 25,
        search: 'Acme',
        searchType: TenantSearchField.TAX_NUMBER,
      } as any,
      { tenantId: 'tenant-id' },
    );

    expect(criteria).toBeInstanceOf(TenantQueryCriteria);
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
    expect(Object.isFrozen(criteria)).toBe(true);
    expect(Object.isFrozen(criteria.pagination)).toBe(true);
    expect(Object.isFrozen(criteria.search)).toBe(true);
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
