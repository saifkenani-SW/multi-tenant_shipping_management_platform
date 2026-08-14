import * as fs from 'fs';

const file = 'src/modules/customer-shipment/parcel/domain/authorization/abilities/parcel.ability.ts';
let content = fs.readFileSync(file, 'utf8');

// We need to import Permission from core/security/Permission if not imported
if (!content.includes("import { Permission }")) {
  content = content.replace(
    "import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';",
    "import { SubjectType } from '../../../../../../packages/context/principal/principal/SubjectType';\nimport { Permission } from '../../../../../../core/security/Permission';"
  );
}

const oldCustomerLogic = `    // A customer sees parcels only through the shipments they sent; the
    // ownership check happens on the owning shipment, which the query layer
    // joins in.
    if (type === SubjectType.CUSTOMER) {
      if (principal.profileId) {
        builder.can(ParcelAction.View, ParcelSubject, {
          sender_customer_profile_id: principal.profileId,
        } as any);
      }
      return;
    }`;

const newCustomerLogic = `    // Customers see parcels via tracking.
    // The query layer joins \`customer_shipment\` to expose sender_phone and receiver_phone.
    if (type === SubjectType.CUSTOMER) {
      if (principal.phone) {
        builder.can(ParcelAction.View, ParcelSubject, {
          sender_phone: principal.phone,
        } as any);
        builder.can(ParcelAction.View, ParcelSubject, {
          receiver_phone: principal.phone,
        } as any);
      }
      return;
    }`;

content = content.replace(oldCustomerLogic, newCustomerLogic);

const oldEmployeeLogic = `    if (type === SubjectType.EMPLOYEE) {
      builder.can(ParcelAction.View, ParcelSubject, ownTenant);
      builder.can(ParcelAction.UpdateStatus, ParcelSubject, ownTenant);
      return;
    }`;

const newEmployeeLogic = `    if (type === SubjectType.EMPLOYEE) {
      const orgUnits = [
        ...(principal.branches || []),
        ...(principal.warehouses || []),
      ];

      for (const orgUnit of orgUnits) {
        const perms = orgUnit.role?.permissions || [];
        
        // A parcel is visible/updatable if it belongs to the tenant AND is currently at 
        // OR destined for the employee's org unit.
        
        const currentOrgScope = {
          tenant_id: principal.tenantId,
          current_org_unit_id: orgUnit.id,
        } as any;

        const destOrgScope = {
          tenant_id: principal.tenantId,
          destination_org_unit_id: orgUnit.id,
        } as any;

        if (perms.includes(Permission.READ_PARCEL)) {
          builder.can(ParcelAction.View, ParcelSubject, currentOrgScope);
          builder.can(ParcelAction.View, ParcelSubject, destOrgScope);
        }

        if (perms.includes(Permission.UPDATE_PARCEL)) {
          builder.can(ParcelAction.UpdateStatus, ParcelSubject, currentOrgScope);
          builder.can(ParcelAction.UpdateStatus, ParcelSubject, destOrgScope);
        }
      }
      return;
    }`;

content = content.replace(oldEmployeeLogic, newEmployeeLogic);

fs.writeFileSync(file, content);
console.log('Done patching ParcelAbility');
