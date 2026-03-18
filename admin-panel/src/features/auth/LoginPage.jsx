import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Cards';
import { Input } from '../../components/ui/Forms';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';
import api from '../../services/api';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginPage = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      // Call backend login API
      const response = await api.post('/auth/admin/login', {
        email: data.email,
        password: data.password,
      });

      console.log('LOGIN RESPONSE:', response);

      // Since your interceptor returns response.data directly,
      // response is already the actual payload
      const accessToken =
        response?.accessToken ||
        response?.token ||
        response?.data?.accessToken ||
        response?.data?.token;

      const adminUser =
        response?.user ||
        response?.admin ||
        response?.data?.user ||
        response?.data?.admin;

      if (!accessToken) {
        throw new Error('Access token not found in login response');
      }

      localStorage.setItem('bv_admin_token', accessToken);

      if (adminUser) {
        localStorage.setItem('bv_admin_user', JSON.stringify(adminUser));
      }

      toast.success('Welcome back, Admin!');
      navigate('/dashboard');
    } catch (error) {
      console.log('LOGIN ERROR:', error);

      toast.error(
        error?.message ||
          error?.error ||
          error?.data?.message ||
          'Invalid credentials'
      );
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@saliljaveri.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        <div
          className="flex items-center justify-between"
          style={{ marginTop: 8 }}
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" style={{ width: 16, height: 16 }} />
            <span
              style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}
            >
              Remember me
            </span>
          </label>

          <button
            type="button"
            style={{
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          disabled={isSubmitting}
          icon={LogIn}
          style={{ marginTop: 16 }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In to Dashboard'}
        </Button>
      </form>
    </Card>
  );
};