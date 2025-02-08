-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'manager', 'employee');

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    department VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role)
    VALUES (new.id, new.email, 'employee');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update RLS policies for employees table based on user roles
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Admins and HR can see all records
CREATE POLICY "Allow full access for admins and hr"
    ON employees
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role IN ('admin', 'hr')
        )
    );

-- Managers can see their department's records
CREATE POLICY "Allow managers to see their department"
    ON employees
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'manager'
            AND user_profiles.department = employees.department
        )
    );

-- Employees can only see their own record
CREATE POLICY "Allow employees to see their own record"
    ON employees
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'employee'
            AND user_profiles.email = employees.email
        )
    );

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles
    SET role = 'admin'
    WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 