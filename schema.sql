-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    division VARCHAR(255) NOT NULL,
    salary DECIMAL(12,2) NOT NULL,
    termination_month INTEGER,
    is_leadership BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_division ON employees(division);
CREATE INDEX IF NOT EXISTS idx_employees_salary ON employees(salary);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_leadership ON employees(is_leadership) WHERE is_leadership = true;
CREATE INDEX IF NOT EXISTS idx_employees_termination ON employees(termination_month) WHERE termination_month IS NOT NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON employees;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON employees;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON employees;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON employees;
END $$;

CREATE POLICY "Enable read access for authenticated users" ON employees
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON employees
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON employees
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON employees
    FOR DELETE
    TO authenticated
    USING (true); 