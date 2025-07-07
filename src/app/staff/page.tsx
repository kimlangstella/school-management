'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
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

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_url: string;
};

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc('get_all_users');
    if (error) setError(error.message);
    else setUsers(data as User[]);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    let profileUrl = '';

    // Upload image
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

    // Sign up
    const { data, error } = await supabase.auth.signUp({
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
      setMessage('✅ Check your email to confirm your account.');
      fetchUsers();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.rpc('delete_user', { _id: id });
    if (error) {
      setMessage(`❌ Delete failed: ${error.message}`);
    } else {
      fetchUsers();
    }
  };

  const openModal = (user: User) => {
    alert(`Edit clicked for ${user.name} (you can implement modal here)`);
  };

  return (
    <div className="p-6 space-y-6">
      <form onSubmit={handleSignUp} className="flex flex-col gap-3 max-w-md">
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
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Sign Up
        </button>
        <p>{message}</p>
      </form>

      <Table isStriped aria-label="User Table">
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
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" color="primary" onClick={() => openModal(user)}>
                    Edit
                  </Button>
                  <Button size="sm" color="danger" onClick={() => handleDelete(user.id)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
