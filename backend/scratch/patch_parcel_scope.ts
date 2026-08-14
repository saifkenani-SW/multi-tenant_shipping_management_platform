import * as fs from 'fs';

let interfaceFile = 'src/modules/customer-shipment/parcel/domain/authorization/scopes/parcel-scope.interface.ts';
let interfaceContent = fs.readFileSync(interfaceFile, 'utf8');

interfaceContent = interfaceContent.replace(
  "sender_customer_profile_id?: string;",
  "sender_phone?: string;\n    receiver_phone?: string;"
);
fs.writeFileSync(interfaceFile, interfaceContent);

let scopeFile = 'src/modules/customer-shipment/parcel/domain/authorization/scopes/parcel-visibility.scope.ts';
let scopeContent = fs.readFileSync(scopeFile, 'utf8');

const oldCustomer = `    if (type === SubjectType.CUSTOMER) {
      return {
        parcel: {},
        shipment: { sender_customer_profile_id: principal.profileId },
      };
    }`;

const newCustomer = `    if (type === SubjectType.CUSTOMER) {
      return {
        parcel: {},
        shipment: { 
          sender_phone: principal.phone,
          receiver_phone: principal.phone 
        },
      };
    }`;

scopeContent = scopeContent.replace(oldCustomer, newCustomer);
fs.writeFileSync(scopeFile, scopeContent);

console.log('Done!');
