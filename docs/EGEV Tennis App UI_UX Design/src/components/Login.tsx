import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Trophy } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function Login({ onLogin, onSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col h-full px-8" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="pt-20 mb-12">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B4AEBD' }}>
            <Trophy size={28} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl" style={{ color: '#B4AEBD' }}>EGEV Tenis</h1>
        </div>
        <h2 className="text-3xl text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to continue playing</p>
      </div>

      {/* Form */}
      <div className="flex-1">
        <div className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Email or Phone</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail size={20} color="#9CA3AF" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or phone"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 transition-all"
                style={{ focusRingColor: '#54CE8F' }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock size={20} color="#9CA3AF" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 transition-all"
                style={{ focusRingColor: '#54CE8F' }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button className="text-sm" style={{ color: '#B4AEBD' }}>
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            onClick={onLogin}
            className="w-full py-4 rounded-2xl text-white shadow-lg transition-all mt-8"
            style={{ backgroundColor: '#54CE8F' }}
          >
            Login
          </button>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="pb-12 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button onClick={onSignup} className="font-medium" style={{ color: '#54CE8F' }}>
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
