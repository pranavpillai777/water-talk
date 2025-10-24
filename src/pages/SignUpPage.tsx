// src/pages/SignupPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'citizen' | 'ngo'>('citizen');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    latitude: null,
    longitude: null,
    operation_area: '',
  });
  const [error, setError] = useState('');

  // map selection simulation — integrate map picker later
  const handleMapSelect = (lat: number, lng: number) => {
    setForm({ ...form, latitude: lat, longitude: lng });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signup({
        ...form,
        role,
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">Sign Up</h2>

      <div className="mb-3">
        <label>Select Role</label>
        <select
          className="form-select"
          value={role}
          onChange={(e) => setRole(e.target.value as 'citizen' | 'ngo')}
        >
          <option value="citizen">Citizen</option>
          <option value="ngo">NGO</option>
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Full Name</label>
          <input name="full_name" className="form-control" onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label>Email</label>
          <input type="email" name="email" className="form-control" onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label>Password</label>
          <input type="password" name="password" className="form-control" onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" className="form-control" onChange={handleChange} />
        </div>

        {role === 'ngo' && (
          <>
            <div className="mb-3">
              <label>Operational Area (City / Town)</label>
              <input name="operation_area" className="form-control" onChange={handleChange} />
            </div>

            <div className="mb-3">
              <label>Location (Latitude, Longitude)</label>
              <div className="d-flex gap-2">
                <input type="number" step="any" placeholder="Lat" className="form-control" onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })} />
                <input type="number" step="any" placeholder="Long" className="form-control" onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })} />
              </div>
            </div>
          </>
        )}

        {error && <p className="text-danger">{error}</p>}
        <button type="submit" className="btn btn-primary">Sign Up</button>
      </form>
    </div>
  );
};

export default SignupPage;
