// 'use client';

// import React, { useEffect, useState } from 'react';
// import {
//   Button,
//   Input,
//   Modal,
//   ModalBody,
//   ModalContent,
//   useDisclosure,
// } from '@heroui/react';
// import { supabase } from '../../../lib/supabaseClient';
// import { Icon } from '@iconify/react';

// type Props = {
//   editingPayment: any;
//   onSuccess?: () => void;
//   triggerButton?: React.ReactNode;
// };

// export default function EditPaymentModal({ editingPayment, onSuccess, triggerButton }: Props) {
//   const { isOpen, onOpen, onOpenChange } = useDisclosure();
//   const [formData, setFormData] = useState(editingPayment);
//   const [students, setStudents] = useState<any[]>([]);
//   const [branches, setBranches] = useState<any[]>([]);
//   const [programs, setPrograms] = useState<any[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchInitialData();
//   }, []);

//   useEffect(() => {
//     if (editingPayment) setFormData(editingPayment);
//   }, [editingPayment]);

//   const fetchInitialData = async () => {
//     const [stu, pro, bra] = await Promise.all([
//       supabase.rpc('get_all_students'),
//       supabase.rpc('get_all_programs'),
//       supabase.rpc('get_all_branches'),
//     ]);

//     if (stu.error || pro.error || bra.error) {
//       setError(stu.error?.message || pro.error?.message || bra.error?.message || 'Failed to load data');
//     } else {
//       setStudents(stu.data || []);
//       setPrograms(pro.data || []);
//       setBranches(bra.data || []);
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev: any) => ({ ...prev, [name]: value }));
//   };

//   const handleUpdate = async () => {
//     const {
//       id,
//       student_id,
//       program_id,
//       branch_id,
//       payment_for,
//       amount,
//       due_date,
//       paid_date,
//       payment_method,
//       status,
//       note,
//     } = formData;

//     if (!student_id || !program_id || !branch_id || !amount || !payment_method || !status) {
//       setError('Please fill in all required fields.');
//       return;
//     }

//     const { error } = await supabase.rpc('update_payment', {
//       _id: id,
//       _student_id: student_id,
//       _program_id: program_id,
//       _branch_id: branch_id,
//       _payment_for: payment_for,
//       _amount: parseFloat(amount),
//       _due_date: due_date || null,
//       _paid_date: paid_date || null,
//       _payment_method: payment_method,
//       _status: status,
//       _note: note,
//       _updated_by: supabase.auth.getUser()?.user?.id || null,
//     });

//     if (error) {
//       setError(error.message);
//     } else {
//       onOpenChange(false);
//       onSuccess?.();
//     }
//   };

//   return (
//     <>
//       {triggerButton || (
//         <Button color="primary" onPress={onOpen} endContent={<Icon icon="solar:pen-bold" width={20} />}>
//           Edit Payment
//         </Button>
//       )}

//       <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
//         <ModalContent className="dark text-foreground bg-background w-[500px] max-w-full p-4">
//           {(onClose) => (
//             <>
//               <ModalBody>
//                 <h3 className="text-lg font-semibold mb-4">Edit Payment</h3>
//                 <div className="space-y-4">
//                   {error && <p className="text-sm text-red-500">{error}</p>}

//                   <select name="student_id" value={formData.student_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
//                     <option value="">Select Student</option>
//                     {students.map((s) => (
//                       <option key={s.id} value={s.id}>
//                         {s.first_name} {s.last_name}
//                       </option>
//                     ))}
//                   </select>

//                   <select name="program_id" value={formData.program_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
//                     <option value="">Select Program</option>
//                     {programs.map((p) => (
//                       <option key={p.id} value={p.id}>
//                         {p.name}
//                       </option>
//                     ))}
//                   </select>

//                   <select name="branch_id" value={formData.branch_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
//                     <option value="">Select Branch</option>
//                     {branches.map((b) => (
//                       <option key={b.id} value={b.id}>
//                         {b.name}
//                       </option>
//                     ))}
//                   </select>

//                   <Input name="payment_for" label="Payment For" value={formData.payment_for} onChange={handleChange} />
//                   <Input name="amount" label="Amount ($)" type="number" value={formData.amount} onChange={handleChange} />
//                   <Input name="paid_date" label="Paid Date" type="date" value={formData.paid_date} onChange={handleChange} />
//                   <Input name="due_date" label="Due Date" type="date" value={formData.due_date} onChange={handleChange} />

//                   <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="w-full border px-3 py-2 rounded">
//                     <option value="">Select Method</option>
//                     <option value="cash">Cash</option>
//                     <option value="card">Card</option>
//                     <option value="transfer">Bank Transfer</option>
//                     <option value="aba">ABA</option>
//                     <option value="wing">Wing</option>
//                   </select>

//                   <select name="status" value={formData.status} onChange={handleChange} className="w-full border px-3 py-2 rounded">
//                     <option value="">Select Status</option>
//                     <option value="paid">Paid</option>
//                     <option value="unpaid">Unpaid</option>
//                   </select>

//                   <textarea name="note" value={formData.note} onChange={handleChange} className="w-full border px-3 py-2 rounded" placeholder="Optional note" />
//                 </div>

//                 <div className="mt-6 flex justify-end gap-2">
//                   <Button variant="bordered" radius="full" onPress={onClose}>
//                     Cancel
//                   </Button>
//                   <Button color="primary" radius="full" onPress={handleUpdate}>
//                     Save Changes
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
