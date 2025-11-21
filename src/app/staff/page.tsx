'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabaseClient';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Button,
  Avatar,
} from '@heroui/react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from "next/image";

type User = {
  id: string;
  name: string;
  gmail: string;
  role: string;
  profile_url: string;
};

export default function UserManagement() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
   const supabase = createClient();
  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc('get_all_users');
    console.log("data",data)
    if (error) setError(error.message);
    else setUsers(data as User[]);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setProfileImage(null);
    setSelectedUser(null);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let profileUrl = selectedUser?.profile_url || '';

    // Upload new image if provided
    if (profileImage) {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `user-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-images')
        .upload(filePath, profileImage);

      if (uploadError) {
        setMessage(`❌ Failed to upload image: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(filePath);

      profileUrl = publicUrlData.publicUrl;
    }

    if (modalMode === 'add') {
      // Sign up new user
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'staff',
            profile_url: profileUrl,
          },
        },
      });

      if (error) {
        setMessage(`❌ ${error.message}`);
      } else {
        setMessage('✅ User added. Please check email to confirm.');
        fetchUsers();
        setModalOpen(false);
        resetForm();
      }
    } else if (modalMode === 'edit' && selectedUser) {
      // Update user via RPC
      const { error } = await supabase.rpc('update_user', {
        _id: selectedUser.id,
        _name: fullName,
        _email: email,
        _profile_url: profileUrl,
      });

      if (error) {
        setMessage(`❌ Update failed: ${error.message}`);
      } else {
        setMessage('✅ User updated.');
        fetchUsers();
        setModalOpen(false);
        resetForm();
      }
    }
  };

const handleDelete = async (id: string) => {
  const confirmDelete = window.confirm('Are you sure you want to delete this user?');

  if (!confirmDelete) return;

  const { error } = await supabase.rpc('delete_user', { _id: id });

  if (error) {
    setMessage(`❌ Delete failed: ${error.message}`);
  } else {
    setMessage('✅ User deleted successfully.');
    fetchUsers();
  }
};


  const openEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFullName(user.name);
    setEmail(user.gmail);
    setPassword(''); // leave blank, optional to change
    setProfileImage(null);
    setModalOpen(true);
  };

  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setModalOpen(true);
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
  <h2 className="text-white text-lg sm:text-xl font-semibold">Users</h2>
  <Button color="primary" onClick={openAddModal} size="sm" className="w-full sm:w-auto">
    + Add User
  </Button>
</div>



      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black p-4 sm:p-6 rounded-lg shadow-lg max-w-md w-full relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">
              {modalMode === 'add' ? 'Add User' : 'Edit User'}
            </h2>
<form onSubmit={handleSubmit} className="flex flex-col gap-3">
  <input
    type="text"
    placeholder="Full Name"
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
    required
    className="border p-2 rounded"
  />

  <input
    type="email"
    placeholder="Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
    className="border p-2 rounded"
    disabled={modalMode === 'edit'} // Prevent editing email if needed
  />

  {modalMode === 'add' && (
    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      className="border p-2 rounded"
    />
  )}

  {/* Show existing image preview */}
  {modalMode === 'edit' && selectedUser?.profile_url && (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">Current Image:</span>
      <Image
        src={selectedUser.profile_url}
        alt="Profile"
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover border"
      />
    </div>
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
  />

  <button
    type="submit"
    className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
  >
    {modalMode === 'add' ? 'Add User' : 'Update User'}
  </button>

  {message && <p className="text-green-600 text-sm">{message}</p>}
</form>

          </div>
        </div>
      )}

      {/* User Table */}
      <div className="overflow-x-auto">
        <Table isStriped aria-label="User Table" className="min-w-[600px]">
        <TableHeader>
          <TableColumn>#</TableColumn>
          <TableColumn>Profile</TableColumn>
          <TableColumn>Name</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Role</TableColumn>
          <TableColumn>Action</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No users found.">
          {users.map((user, index) => (
            <TableRow key={user.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Avatar
                  isBordered
                  size="sm"
                  src={user.profile_url || '/default-avatar.png'}
                  alt={user.name}
                />
              </TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.gmail}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
<div className="flex gap-2">
  <Button
    size="sm"
    // color="primary"
    isIconOnly
    aria-label="Edit"
    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 touch-manipulation"
    onClick={() => openEditModal(user)}
    onPress={() => openEditModal(user)}
  >
    <PencilSquareIcon className="w-5 h-5" />
  </Button>
  
  <Button
    size="sm"
    // color="danger"
    isIconOnly
    aria-label="Delete"
    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 touch-manipulation"
    onClick={() => handleDelete(user.id)}
    onPress={() => handleDelete(user.id)}
  >
    <TrashIcon className="w-5 h-5" />
  </Button>
</div>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
