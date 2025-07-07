'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import CardAaa from '@/components/card/card-aaa'
import AddExam from '@/components/modal/add-exam'
import EditExamModal from '@/components/modal/edit-exam'

type Exam = {
  id: string
  branch_id: string
  program_id: string
  name: string
  description: string
  exam_type: string
  total_marks: number
  exam_date: string
  created_at: string
}

type Branch = { id: string; name: string }
type Program = { id: string; name: string }

export default function ExamPage() {
  const [exams, setExams] = useState<Exam[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
const [editExam, setEditExam] = useState<Exam | null>(null);
useEffect(() => {
  const loadData = async () => {
    setLoading(true)

    const [examRes, branchRes, programRes] = await Promise.all([
      supabase.rpc('get_all_exams'),
      supabase.rpc('get_all_branches'),
      supabase.rpc('get_all_programs')
    ])

    // No normalization — use actual field names from DB
    setExams(examRes.data || [])
    setBranches(branchRes.data || [])
    setPrograms(programRes.data || [])

    setLoading(false)
  }

  loadData()
}, [])

const getProgramNameById = (id: string): string => {
  const program = programs.find((p: any) => p.id === id)
  return program ? program.name : 'Unknown Program'
}

const handleEdit = (exam: Exam) => {
  setEditExam(exam); // This will trigger modal open
};

  const handleDelete = async (id: string) => {
    const { error } = await supabase.rpc('delete_exam', { _id: id })
    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      setExams(exams.filter((ex) => ex.id !== id))
    }
  }

  return (
<div className="p-6">
 <div className='flex items-center justify-between mb-6'>
  
  <h1 className="text-2xl font-bold mb-6">All Exams</h1>
   <AddExam />
  <EditExamModal
    examToEdit={editExam}
    onSuccess={() => {
      setEditExam(null);
      supabase.rpc('get_all_exams').then(({ data }) => setExams(data || []));
    }}
  />

 </div>

  {loading ? (
    <p className="text-gray-500">Loading...</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {exams.map((exam) => (
        <CardAaa
          key={exam.id}
          name={exam.name}
          description={exam.description}
          age={`Created at: ${new Date(exam.created_at).toLocaleDateString()}`}
          program={getProgramNameById(exam.program_id)}
          totalMarks={exam.total_marks}
          examType={exam.exam_type}
          examDate={new Date(exam.exam_date).toLocaleDateString()}
          onEdit={() => handleEdit(exam)}
          onDelete={() => handleDelete(exam.id)}
        />
      ))}
    </div>
  )}
</div>

  )
}
