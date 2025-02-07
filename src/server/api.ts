import express, { Request, Response, Router } from 'express';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Employee {
  id: number;
  name: string;
  position: string;
  specialty: string;
  department: string;
  division: string;
  salary: number;
  termination_month: number | null;
  isLeadership: boolean;
}

interface SalaryData {
  employees: Employee[];
  metadata?: {
    total_employees: number;
    divisions: string[];
    last_updated: string;
  };
}

const router: Router = express.Router();

router.post('/save-salary', async (req: Request<{}, {}, SalaryData>, res: Response) => {
  try {
    const data = req.body;
    
    // Validate request body
    if (!data || !Array.isArray(data.employees)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request body: employees array is required' 
      });
    }

    const salaryJsonPath = path.join(__dirname, '../../src/salary.json');
    const salaryMdPath = path.join(__dirname, '../../Salary.md');
    
    console.log('Saving to salary.json at:', salaryJsonPath);
    try {
      // Save to salary.json
      await fs.promises.writeFile(
        salaryJsonPath,
        JSON.stringify({ employees: data.employees }, null, 2)
      );
    } catch (error) {
      console.error('Error saving to salary.json:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save to salary.json file' 
      });
    }
    
    console.log('Saving to Salary.md at:', salaryMdPath);
    try {
      // Generate and save Salary.md content
      const mdContent = data.employees.map((emp: Employee) => 
        `${emp.id}\t${emp.name}\t${emp.position}\t${emp.specialty}\t${emp.department}\t${emp.division}\t${emp.salary.toLocaleString()}`
      ).join('\n');
      
      await fs.promises.writeFile(
        salaryMdPath,
        mdContent
      );
    } catch (error) {
      console.error('Error saving to Salary.md:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save to Salary.md file' 
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in save-salary endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred while saving salary data' 
    });
  }
});

// Data file paths - using absolute paths from workspace root
const WORKSPACE_ROOT = path.join(__dirname, '../..');
const REAL_DATA = path.join(WORKSPACE_ROOT, 'src/salary.json');
const EXAMPLE_DATA = path.join(WORKSPACE_ROOT, 'src/salary.example.json');
const BACKUP_DATA = path.join(WORKSPACE_ROOT, 'src/salary.backup.json');

// Check if salary data exists
router.get('/data-status', (req, res) => {
  try {
    console.log('Checking data status...');
    console.log('Paths:', {
      workspace: WORKSPACE_ROOT,
      real: REAL_DATA,
      example: EXAMPLE_DATA,
      backup: BACKUP_DATA
    });

    const status = {
      hasRealData: fs.existsSync(REAL_DATA),
      hasExampleData: fs.existsSync(EXAMPLE_DATA),
      hasBackupData: fs.existsSync(BACKUP_DATA),
      currentMode: 'example'
    };

    console.log('File existence status:', status);

    // Determine if we're using example data by comparing files
    if (status.hasRealData && status.hasExampleData) {
      try {
        const realContent = fs.readFileSync(REAL_DATA, 'utf-8');
        const exampleContent = fs.readFileSync(EXAMPLE_DATA, 'utf-8');
        status.currentMode = realContent === exampleContent ? 'example' : 'real';
        console.log('Current mode:', status.currentMode);
      } catch (error) {
        console.error('Error reading files for comparison:', error);
      }
    }

    // If we don't have real data but have example data, copy example to real
    if (!status.hasRealData && status.hasExampleData) {
      try {
        fs.copyFileSync(EXAMPLE_DATA, REAL_DATA);
        status.hasRealData = true;
        status.currentMode = 'example';
        console.log('Copied example data to real data location');
      } catch (error) {
        console.error('Error copying example data:', error);
      }
    }

    res.json(status);
  } catch (error) {
    console.error('Error in data-status endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check data status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Switch between real and example data
router.post('/switch-data', (req, res) => {
  try {
    const { mode } = req.body;
    
    if (!mode || (mode !== 'real' && mode !== 'example')) {
      throw new Error('Invalid mode specified');
    }

    if (mode === 'real') {
      // Check if backup exists
      if (!fs.existsSync(BACKUP_DATA)) {
        throw new Error('No backup data found');
      }
      // Restore from backup
      fs.copyFileSync(BACKUP_DATA, REAL_DATA);
    } else {
      // Switching to example mode
      // First backup real data if it exists
      if (fs.existsSync(REAL_DATA)) {
        fs.copyFileSync(REAL_DATA, BACKUP_DATA);
      }
      // Copy example data to real data location
      fs.copyFileSync(EXAMPLE_DATA, REAL_DATA);
    }

    res.json({ 
      success: true, 
      message: `Successfully switched to ${mode} data` 
    });
  } catch (error: any) {
    console.error('Error switching data:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to switch data mode' 
    });
  }
});

// Upload salary data
router.post('/upload-data', (req, res) => {
  try {
    console.log('Uploading salary data...');
    const data = req.body;
    
    // Validate data structure
    if (!data || !data.employees || !Array.isArray(data.employees)) {
      throw new Error('Invalid data structure. File must contain an "employees" array.');
    }

    // Validate each employee object
    for (const emp of data.employees) {
      if (!emp.id || !emp.name || !emp.position || !emp.department || !emp.division || typeof emp.salary !== 'number' || typeof emp.isLeadership !== 'boolean') {
        throw new Error('Invalid employee data structure. Each employee must have id, name, position, department, division, salary, and isLeadership status.');
      }
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(REAL_DATA);
    if (!fs.existsSync(dir)) {
      console.log('Creating directory:', dir);
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save as real data
    console.log('Saving data to:', REAL_DATA);
    fs.writeFileSync(REAL_DATA, JSON.stringify(data, null, 2), 'utf8');

    // Backup the data
    console.log('Creating backup at:', BACKUP_DATA);
    fs.copyFileSync(REAL_DATA, BACKUP_DATA);

    res.json({ 
      success: true,
      message: 'Salary data uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading data:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to upload salary data',
      details: error.stack
    });
  }
});

// Get current data
router.get('/current-data', (req, res) => {
  try {
    if (!fs.existsSync(REAL_DATA)) {
      throw new Error('No data file found');
    }
    const data = fs.readFileSync(REAL_DATA, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router; 