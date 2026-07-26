import { Subject } from './Subject';
import { ScopeAccess } from './ScopeAccess';

export interface Principal {
  subject: Subject;

  tenantId?: string;

  branches: ScopeAccess[];

  warehouses: ScopeAccess[];
}
