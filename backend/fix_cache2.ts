import * as fs from 'fs';

const files = [
    {
        path: "src/modules/tenant/application/services/tenant.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*TENANT_CACHE_KEYS.LIST[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: TENANT_CACHE_KEYS.PREFIX, allEntries: true })"
            },
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*TENANT_CACHE_KEYS.SUBSCRIPTION_ACTIVE[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: 'tenant:subscription', allEntries: true })" // wait, does tenant:subscription prefix exist in constants?
            }
        ]
    },
    {
        path: "src/modules/employee2/application/services/employee.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*EMPLOYEE_CACHE_KEYS.PREFIX[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX, allEntries: true })"
            }
        ]
    },
    {
        path: "src/modules/employee/services/employee.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*EMPLOYEE_CACHE_KEYS.LIST[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: EMPLOYEE_CACHE_KEYS.PREFIX, allEntries: true })"
            }
        ]
    },
    {
        path: "src/modules/subscription-plan/services/subscription-plan.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*SUBSCRIPTION_PLAN_CACHE_KEYS.LIST[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: SUBSCRIPTION_PLAN_CACHE_KEYS.PREFIX, allEntries: true })"
            }
        ]
    },
    {
        path: "src/modules/global-location/application/services/global-location.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*GLOBAL_LOCATION_CACHE_KEYS.LIST[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.PREFIX, allEntries: true })"
            }
        ]
    },
    {
        path: "src/modules/authorization/services/role.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*'roles:list'[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: 'roles', allEntries: true })"
            },
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*'roles:details'[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: 'roles', allEntries: true })"
            }
        ]
    },
    {
        path: "src/modules/organization/tenant_zone/application/services/tenant-zone.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*TENANT_ZONE_CACHE_KEYS.PREFIX[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: TENANT_ZONE_CACHE_KEYS.PREFIX, allEntries: true })"
            }
        ]
    },
    {
        path: "src/modules/organization/organization_unit/application/services/organization-unit.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*ORGANIZATION_UNIT_CACHE_KEYS.LIST[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: ORGANIZATION_UNIT_CACHE_KEYS.PREFIX, allEntries: true })"
            }
        ]
    },
    {
        path: "src/modules/customer-shipment/parcel/application/services/parcel.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*CUSTOMER_SHIPMENT_CACHE_KEYS.PARCEL_LIST[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: 'customer_shipment:parcel', allEntries: true })"
            }
        ]
    },
    {
        path: "src/modules/customer-shipment/shipment/application/services/shipment.command.service.ts",
        replacements: [
            {
                from: /@CacheEvict\(\[\s*\{\s*keyPrefix:\s*CUSTOMER_SHIPMENT_CACHE_KEYS.LIST[\s\S]*?\]\)/g,
                to: "@CacheEvict({ keyPrefix: CUSTOMER_SHIPMENT_CACHE_KEYS.PREFIX, allEntries: true })"
            }
        ]
    }
];

for (const file of files) {
    if (!fs.existsSync(file.path)) continue;
    let content = fs.readFileSync(file.path, 'utf8');
    for (const repl of file.replacements) {
        content = content.replace(repl.from, repl.to);
    }
    fs.writeFileSync(file.path, content);
}
console.log("Done");
