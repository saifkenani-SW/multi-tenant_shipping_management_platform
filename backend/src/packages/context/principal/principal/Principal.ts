import { Subject } from './Subject';
import { ScopeAccess } from './ScopeAccess';

export interface Principal {
  subject: Subject;

  tenantId?: string;

  profileId?: string;

  phone?: string;

  vehicleId?: string;

  branches: ScopeAccess[];

  warehouses: ScopeAccess[];

  hubs?: ScopeAccess[];

  headquarters?: ScopeAccess[];
}
