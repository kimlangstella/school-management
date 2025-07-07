// 'use client';

// import React, { useState, useEffect } from 'react';
// import {
//   Button,
//   Input,
//   Modal,
//   ModalBody,
//   ModalContent,
//   useDisclosure,
// } from '@heroui/react';
// import { Icon } from '@iconify/react';
// import { supabase } from '../../../lib/supabaseClient';

// type Student = {
//   id: string;
//   first_name: string;
//   last_name: string;
// };

// type Program = {
//   id: string;
//   name: string;
// };

// type Branch = {
//   id: string;
//   name: string;
// };

// type PaymentForm = {
//   student_id: string;
//   program_id: string;
//   branch_id: string;
//   payment_for: string;
//   total_amount: string;
//   due_date: string;
//   paid_date: string;
//   payment_method: string;
//   status: string;
//   note: string;
// };

// export default function AddPayment({ onSuccess }: { onSuccess?: () => void }) {
//   const { isOpen, onOpen, onOpenChange } = useDisclosure();
//   const [students, setStudents] = useState<Student[]>([]);
//   const [programs, setPrograms] = useState<Program[]>([]);
//   const [branches, setBranches] = useState<Branch[]>([]);
//   const [formData, setFormData] = useState<PaymentForm>({
//     student_id: '',
//     program_id: '',
//     branch_id: '',
//     payment_for: '',
//     total_amount: '',
//     due_date: '',
//     paid_date: '',
//     payment_method: '',
//     status: '',
//     note: '',
//   });
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchStudents();
//     fetchPrograms();
//     fetchBranches();
//   }, []);

//   const fetchStudents = async () => {
//     const { data, error } = await supabase.rpc('get_all_students');
//     if (error) setError(error.message);
//     else setStudents(data || []);
//   };

//   const fetchPrograms = async () => {
//     const { data, error } = await supabase.rpc('get_all_programs');
//     if (error) setError(error.message);
//     else setPrograms(data || []);
//   };

//   const fetchBranches = async () => {
//     const { data, error } = await supabase.rpc('get_all_branches');
//     if (error) setError(error.message);
//     else setBranches(data || []);
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleAdd = async () => {
//     const {
//       student_id,
//       program_id,
//       branch_id,
//       payment_for,
//       total_amount,
//       due_date,
//       paid_date,
//       payment_method,
//       status,
//       note,
//     } = formData;

//     if (!student_id || !program_id || !branch_id || !payment_for || !total_amount || !payment_method || !status) {
//       setError('Please fill in all required fields.');
//       return;
//     }

//     const { error } = await supabase.rpc('insert_payment', {
//       _student_id: student_id,
//       _program_id: program_id,
//       _branch_id: branch_id,
//       _payment_for: payment_for,
//       _amount: parseFloat(total_amount),
//       _due_date: due_date || null,
//       _paid_date: paid_date || null,
//       _payment_method: payment_method,
//       _status: status,
//       _note: note,
//     });

//     if (error) {
//       setError(error.message);
//     } else {
//       setFormData({
//         student_id: '',
//         program_id: '',
//         branch_id: '',
//         payment_for: '',
//         total_amount: '',
//         due_date: '',
//         paid_date: '',
//         payment_method: '',
//         status: '',
//         note: '',
//       });
//       setError(null);
//       onOpenChange(false);
//       onSuccess?.();
//     }
//   };

//   return (
//     <>
//       <Button
//         color="primary"
//         onPress={onOpen}
//         endContent={<Icon icon="solar:wallet-add-bold" width={20} />}
//       >
//         Add Payment
//       </Button>

//       <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
//         <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-4">
//           {(onClose) => (
//             <>
//               <ModalBody>
//                 <div className="space-y-4">
//                   {error && <p className="text-sm text-red-500">{error}</p>}

//                   <select
//                     name="student_id"
//                     value={formData.student_id}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border rounded"
//                     required
//                   >
//                     <option value="">Select Student</option>
//                     {students.map((student) => (
//                       <option key={student.id} value={student.id}>
//                         {student.first_name} {student.last_name}
//                       </option>
//                     ))}
//                   </select>

//                   <select
//                     name="program_id"
//                     value={formData.program_id}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border rounded"
//                     required
//                   >
//                     <option value="">Select Program</option>
//                     {programs.map((program) => (
//                       <option key={program.id} value={program.id}>
//                         {program.name}
//                       </option>
//                     ))}
//                   </select>

//                   <select
//                     name="branch_id"
//                     value={formData.branch_id}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border rounded"
//                     required
//                   >
//                     <option value="">Select Branch</option>
//                     {branches.map((branch) => (
//                       <option key={branch.id} value={branch.id}>
//                         {branch.name}
//                       </option>
//                     ))}
//                   </select>

//                   <Input
//                     name="payment_for"
//                     label="Payment For"
//                     placeholder="e.g. Tuition, Exam Fee"
//                     value={formData.payment_for}
//                     onChange={handleChange}
//                     isRequired
//                   />

//                   <Input
//                     name="total_amount"
//                     label="Total Amount ($)"
//                     placeholder="0.00"
//                     value={formData.total_amount}
//                     onChange={handleChange}
//                     type="number"
//                     isRequired
//                   />

//                   <Input
//                     name="paid_date"
//                     label="Paid Date"
//                     type="date"
//                     value={formData.paid_date}
//                     onChange={handleChange}
//                   />

//                   <Input
//                     name="due_date"
//                     label="Due Date"
//                     type="date"
//                     value={formData.due_date}
//                     onChange={handleChange}
//                   />

//                   <select
//                     name="payment_method"
//                     value={formData.payment_method}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border rounded"
//                     required
//                   >
//                     <option value="">Select Payment Method</option>
//                     <option value="cash">Cash</option>
//                     <option value="card">Card</option>
//                     <option value="transfer">Bank Transfer</option>
//                     <option value="aba">ABA</option>
//                     <option value="wing">Wing</option>
//                   </select>

//                   <select
//                     name="status"
//                     value={formData.status}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border rounded"
//                     required
//                   >
//                     <option value="">Select Status</option>
//                     <option value="paid">Paid</option>
//                     <option value="unpaid">Unpaid</option>
//                   </select>

//                   <textarea
//                     name="note"
//                     value={formData.note}
//                     onChange={handleChange}
//                     className="w-full px-3 py-2 border rounded"
//                     placeholder="Optional note"
//                   />
//                 </div>

//                 <div className="mt-6 flex justify-end gap-2">
//                   <Button variant="bordered" radius="full" onPress={onClose}>
//                     Cancel
//                   </Button>
//                   <Button color="primary" radius="full" onPress={handleAdd}>
//                     Add Payment
//                   </Button>
//                 </div>
//               </ModalBody>
//             </>
//           )}
//         </ModalContent>
//       </Modal>
//     </>
//   );
// }
