import sys
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    out_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if this line is an @CacheEvict
        if re.search(r'^\s*@CacheEvict\(\{', line):
            # We found the start of one. Let's collect it until the closing \s*\}\)
            blocks = []
            while i < len(lines) and re.search(r'^\s*@CacheEvict\(\{', lines[i]):
                # read lines until })
                block_lines = []
                # append the first line but remove @CacheEvict({
                first_line = lines[i].replace('@CacheEvict({', '{')
                block_lines.append(first_line)
                i += 1
                while i < len(lines):
                    if re.search(r'^\s*\}\)', lines[i]):
                        block_lines.append(lines[i].replace('})', '}'))
                        i += 1
                        break
                    else:
                        block_lines.append(lines[i])
                        i += 1
                blocks.append("".join(block_lines))
            
            # Now we have a list of blocks.
            if len(blocks) > 1:
                # Merge them
                merged = "  @CacheEvict([\n"
                for b in blocks:
                    # b is something like "{\n    keyPrefix: ...\n  }\n"
                    # we need to make sure they are comma separated
                    # trim trailing newline
                    b = b.rstrip()
                    merged += b + ",\n"
                merged += "  ])\n"
                out_lines.append(merged)
            else:
                # Just one block, restore it
                out_lines.append("  @CacheEvict(" + blocks[0].replace('}', '})'))
        else:
            out_lines.append(line)
            i += 1

    with open(filepath, 'w') as f:
        f.writelines(out_lines)

files = [
    "src/modules/tenant/application/services/tenant.command.service.ts",
    "src/modules/subscription-plan/services/subscription-plan.command.service.ts",
    "src/modules/global-location/application/services/global-location.command.service.ts",
    "src/modules/authorization/services/role.service.ts",
    "src/modules/employee/services/employee.command.service.ts",
    "src/modules/shipment-request/pricing/application/services/zone-pricing.command.service.ts",
    "src/modules/shipment-request/quotation/application/services/quotation.command.service.ts",
]

for file in files:
    try:
        process_file(file)
        print(f"Processed {file}")
    except Exception as e:
        print(f"Failed {file}: {e}")
