import { defineConfig } from '@prisma/config';
import { Pool } from 'pg';

// إنشاء الـ Pool للاتصال
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

export default defineConfig({
  schema: 'prisma/schema.prisma',
});
