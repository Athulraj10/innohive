import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginRequest, ApiError } from '../types/api';
import { toast } from 'react-toastify';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData);
      toast.success('Welcome, Admin!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      const apiError = error.response?.data as ApiError;
      const errorMessage = apiError?.error || error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      if (errorMessage.includes('Access denied') || errorMessage.includes('Admin')) {
        setErrors({ password: 'Admin access required' });
      } else if (errorMessage.includes('credentials') || errorMessage.includes('Invalid')) {
        setErrors({ password: 'Invalid email or password' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-danger-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-danger-500 to-danger-700 rounded-2xl flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-100 mb-2">
            Admin Login
          </h2>
          <p className="text-gray-400">
            Sign in to access the admin panel
          </p>
        </div>

        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field ${errors.email ? 'border-danger-light focus:ring-danger-light' : ''}`}
                  placeholder="admin@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-light animate-slide-down">{errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field ${errors.password ? 'border-danger-light focus:ring-danger-light' : ''}`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-light animate-slide-down">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="btn-primary w-full text-base py-3"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in as Admin'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Admin access only. Unauthorized access is prohibited.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

