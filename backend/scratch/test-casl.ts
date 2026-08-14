import { AbilityBuilder, createMongoAbility } from '@casl/ability';

const { can, build } = new AbilityBuilder(createMongoAbility);
can('view', 'CustomerShipment');
const ability = build();

import { subject } from '@casl/ability';
console.log(ability.can('view', subject('CustomerShipment', { id: 1 })));
