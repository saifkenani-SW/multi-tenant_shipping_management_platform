import { PermissionQueryDto } from '../dtos/requests/permission-query.dto';
import { PermissionDetailsDto } from '../dtos/responses/permission-details.dto';
import { PaginatedPermissionListDto } from '../dtos/responses/permission-list.dto';

export interface IPermissionQueryService {
  findPermissions(
    query: PermissionQueryDto,
  ): Promise<PaginatedPermissionListDto>;
  getPermissionDetails(id: string): Promise<PermissionDetailsDto>;
}
