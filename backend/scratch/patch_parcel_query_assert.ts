import * as fs from 'fs';

const file = 'src/modules/customer-shipment/parcel/application/services/parcel.query.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace sender_customer_profile_id with sender_phone and receiver_phone checks
const oldAssert = `    if (
      scope.shipment?.sender_customer_profile_id &&
      record.sender_customer_profile_id !==
        scope.shipment.sender_customer_profile_id
    ) {
      throw new NotFoundException('Parcel not found');
    }`;

const newAssert = `    if (
      scope.shipment?.sender_phone || scope.shipment?.receiver_phone
    ) {
      const matchesSender = scope.shipment.sender_phone && record.sender_phone === scope.shipment.sender_phone;
      const matchesReceiver = scope.shipment.receiver_phone && record.receiver_phone === scope.shipment.receiver_phone;

      if (!matchesSender && !matchesReceiver) {
        throw new NotFoundException('Parcel not found');
      }
    }`;

content = content.replace(oldAssert, newAssert);
fs.writeFileSync(file, content);
console.log('Done!');
