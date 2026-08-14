import { AbilityBuilder, createMongoAbility, subject } from '@casl/ability';

enum ShipmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  IN_TRANSIT = 'IN_TRANSIT',
}

const builder = new AbilityBuilder(createMongoAbility);
builder.can('update', 'Shipment', {
  status: { $in: [ShipmentStatus.PENDING, ShipmentStatus.PROCESSING] },
});

const ability = builder.build();

console.log('Testing CASL $in:');

const s1 = { status: ShipmentStatus.PENDING };
console.log('PENDING:', ability.can('update', subject('Shipment', s1))); // Should be true

const s2 = { status: ShipmentStatus.PROCESSING };
console.log('PROCESSING:', ability.can('update', subject('Shipment', s2))); // Should be true

const s3 = { status: ShipmentStatus.IN_TRANSIT };
console.log('IN_TRANSIT:', ability.can('update', subject('Shipment', s3))); // Should be false
