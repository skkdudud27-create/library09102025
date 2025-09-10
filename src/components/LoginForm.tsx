import React, { useState } from 'react';
import { User, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onReturnHome: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onReturnHome }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      toast.error(error.message || 'Invalid credentials.');
    } else {
      toast.success('Login successful!');
      onLoginSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-neutral-200/80"
      >
        <div>
          <h2 className="text-center text-3xl font-extrabold text-neutral-900 tracking-tight">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Muhimmath Library Management
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-12 w-full px-4 py-3 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm"
                  placeholder="Email address"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-12 w-full px-4 py-3 border border-neutral-300 placeholder-neutral-500 text-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light sm:text-sm"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={onReturnHome}
            className="font-medium text-primary hover:text-primary-dark flex items-center justify-center w-full gap-2"
          >
            <ArrowLeft size={16} />
            Return to Home Page
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
