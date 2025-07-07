import { supabase } from './supabaseClient';

// INSERT
export async function createStudent(student: any) {
    console.log("Inserting student:", student);
  
    const { data, error } = await supabase
      .from('student')
      .insert([student])
      .select(); // or .throwOnError() if you want it to crash on error
  
    if (error) {
      console.error("Insert Error:", error.message);
      return null;
    }
  
    return data;
  }
  
// READ
export async function getAllStudents() {
  return await supabase.from('student').select('*');
}

// UPDATE
export async function updateStudent(student_id: string, updates: any) {
  return await supabase.from('student').update(updates).eq('student_id', student_id);
}

// DELETE
export async function deleteStudent(student_id: string) {
  return await supabase.from('student').delete().eq('student_id', student_id);
}
