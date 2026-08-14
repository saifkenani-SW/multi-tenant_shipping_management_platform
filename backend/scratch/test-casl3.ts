import { AbilityBuilder, createMongoAbility, subject } from '@casl/ability';

const builder = new AbilityBuilder(createMongoAbility);
builder.can('view', 'Shipment', {
  tenant_id: '101',
  origin_org_unit_id: '502'
});
builder.can('view', 'Shipment', {
  tenant_id: '101',
  destination_org_unit_id: '502'
});

const ability = builder.build();

const shipment1 = { tenant_id: '101', origin_org_unit_id: '502', destination_org_unit_id: '501' };
const shipment2 = { tenant_id: '101', origin_org_unit_id: '501', destination_org_unit_id: '502' };
const shipment3 = { tenant_id: '101', origin_org_unit_id: '501', destination_org_unit_id: '501' };

console.log('Result 1 (origin):', ability.can('view', subject('Shipment', shipment1 as any)));
console.log('Result 2 (dest):', ability.can('view', subject('Shipment', shipment2 as any)));
console.log('Result 3 (none):', ability.can('view', subject('Shipment', shipment3 as any)));
