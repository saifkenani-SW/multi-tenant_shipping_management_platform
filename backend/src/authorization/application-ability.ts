import { ApplicationActions } from './application-actions';
import { ApplicationSubjects } from './application-subjects';
import { AppAbility } from '../packages/authorization-casl';

export type ApplicationAbility = AppAbility<
  ApplicationActions,
  ApplicationSubjects
>;
