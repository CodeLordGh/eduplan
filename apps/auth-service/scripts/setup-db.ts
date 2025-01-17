import { execSync } from 'child_process';
import { join } from 'path';

const main = async () => {
  try {
    // Path to shared Prisma schema
    const schemaPath = join(__dirname, '../../../libs/prisma/schema.prisma');

    // Generate Prisma client
    console.log('Generating Prisma client...');
    execSync(`prisma generate --schema=${schemaPath}`, { stdio: 'inherit' });

    // Push schema changes to database
    console.log('Pushing schema changes to database...');
    execSync(`prisma db push --schema=${schemaPath}`, { stdio: 'inherit' });

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
};

main(); 