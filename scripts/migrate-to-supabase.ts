import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function migrateData() {
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, '../src/salary.json');
    console.log('Reading data from:', jsonPath);
    
    let rawData;
    try {
      rawData = await fs.readFile(jsonPath, 'utf-8');
    } catch (error) {
      console.error('Error reading salary.json:', error);
      throw new Error('Failed to read salary.json file. Make sure it exists and is readable.');
    }

    let employees;
    try {
      const data = JSON.parse(rawData);
      employees = data.employees;
      if (!Array.isArray(employees)) {
        throw new Error('employees property is not an array');
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      throw new Error('Failed to parse salary.json. Make sure it contains valid JSON with an employees array.');
    }

    console.log(`Found ${employees.length} employees to migrate...`);

    // Clear existing data first
    console.log('Clearing existing data...');
    const { error: clearError } = await supabaseAdmin
      .from('employees')
      .delete()
      .neq('id', 0); // Delete all rows

    if (clearError) {
      console.error('Error clearing existing data:', clearError);
      throw new Error(`Failed to clear existing data: ${clearError.message}`);
    }

    // Insert data in batches of 50
    const batchSize = 50;
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      const currentBatch = i / batchSize + 1;
      const totalBatches = Math.ceil(employees.length / batchSize);
      
      console.log(`Processing batch ${currentBatch} of ${totalBatches}...`);
      
      try {
        const { error } = await supabaseAdmin
          .from('employees')
          .insert(batch.map(emp => ({
            name: emp.name,
            position: emp.position,
            specialty: emp.specialty,
            department: emp.department,
            division: emp.division,
            salary: emp.salary,
            termination_month: emp.termination_month,
            is_leadership: emp.isLeadership
          })));

        if (error) {
          console.error(`Error details:`, error);
          throw new Error(`Failed to insert batch ${currentBatch}: ${error.message}`);
        }

        console.log(`Successfully migrated batch ${currentBatch} of ${totalBatches}`);
      } catch (error) {
        console.error(`Error processing batch ${currentBatch}:`, error);
        throw error;
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

migrateData().catch((error) => {
  console.error('Top level error:', error);
  process.exit(1);
}); 