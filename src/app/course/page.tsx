'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import CardAaa from '@/components/card/card-aaa';
import AddCourse from '@/components/modal/add-course';
import EditCourseModal from '@/components/modal/edit-course';

type Course = {
  id: string;
  program_id: string;
  name: string;
  code: string;
  description: string;
};

type Program = {
  id: string;
  name: string;
};

export default function CoursePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    const { data, error } = await supabase.rpc('get_all_courses');
    if (error) setError(error.message);
    else setCourses(data as Course[]);
  };

  const fetchPrograms = async () => {
    const { data, error } = await supabase.rpc('get_all_programs');
    if (!error) setPrograms(data as Program[]);
    else setError(error.message);
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Delete this course?');
    if (!confirm) return;

    const { error } = await supabase.rpc('delete_course', { _id: id });
    if (!error) fetchCourses();
    else setError(error.message);
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchPrograms()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

const getProgramNameById = (programId: string): string => {
  if (!programId || programs.length === 0) {
    console.warn('⚠️ programId is missing or programs list is empty');
    return 'Unknown Program';
  }

  console.log('👉 Trying to match programId:', programId);
  console.log('📦 All program IDs:', programs.map(p => p.id));

  const match = programs.find((p) =>
    String(p.id).trim().toLowerCase() === String(programId).trim().toLowerCase()
  );

  if (!match) {
    console.warn(`❌ No match for programId: "${programId}"`);
    return 'Unknown Program';
  }

  console.log(`✅ Found match: ${match.name}`);
  return match.name;
};

  useEffect(() => {
    if (courses.length && programs.length) {
      console.log("🔍 Matching courses to programs...");
      courses.forEach((c) => {
        const programName = getProgramNameById(c.program_id);
        console.log(`[Course: ${c.name}] → Program: ${programName}`);
      });
    }
  }, [courses, programs]);

  const filteredCourses = selectedProgram
    ? courses.filter((course) => course.program_id === selectedProgram)
    : courses;

  return (
    <div className="px-6 mt-6 mb-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-default-900">Courses</h2>
        <AddCourse onSuccess={fetchCourses} />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className={`px-4 py-2 rounded-full border text-sm transition-all duration-150 ${
            selectedProgram === null
              ? 'bg-primary text-white'
              : 'bg-default-100 hover:bg-default-200'
          }`}
          onClick={() => setSelectedProgram(null)}
        >
          All Programs
        </button>

        {programs.map((program) => (
          <button
            key={program.id}
            className={`px-4 py-2 rounded-full border text-sm transition-all duration-150 ${
              selectedProgram === program.id
                ? 'bg-primary text-white'
                : 'bg-default-100 hover:bg-default-200'
            }`}
            onClick={() => setSelectedProgram(program.id)}
          >
            {program.name}
          </button>
        ))}
      </div>

      {/* Grid of Courses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-8">Loading...</p>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CardAaa
              key={course.id}
              name={course.name}
              age={getProgramNameById(course.program_id)}
              description={course.description}
              onEdit={() => setSelectedCourse(course)}
              onDelete={() => handleDelete(course.id)}
            />
          ))
        ) : (
          <p className="text-default-500 col-span-full text-center py-8">
            No courses found for this program.
          </p>
        )}
      </div>

      {selectedCourse && (
        <EditCourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onSuccess={fetchCourses}
        />
      )}
    </div>
  );
}
