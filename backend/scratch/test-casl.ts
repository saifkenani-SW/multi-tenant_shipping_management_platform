import { AbilityBuilder, createMongoAbility, subject } from '@casl/ability';

const builder = new AbilityBuilder(createMongoAbility);
builder.can('view', 'Shipment', {
  tenant_id: '101',
  $or: [
    { origin_org_unit_id: '502' },
    { destination_org_unit_id: '502' },
  ],
} as any);

const ability = builder.build();

const shipment = {
  tenant_id: '101',
  origin_org_unit_id: '502',
  destination_org_unit_id: '501'
};

const result = ability.can('view', subject('Shipment', shipment));
console.log('Result:', result);
