import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Employee = Database['public']['Tables']['employees']['Row'];
type NewEmployee = Database['public']['Tables']['employees']['Insert'];
type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data;
  },

  async create(employee: NewEmployee): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: number, updates: EmployeeUpdate): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getByDepartment(department: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('department', department)
      .order('salary', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getByDivision(division: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('division', division)
      .order('salary', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('employees_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        callback
      )
      .subscribe();
  }
}; 