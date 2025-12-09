import { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Trophy } from 'lucide-react';

interface SignupProps {
  onSignup: () => void;
  onLogin: () => void;
}

export function Signup({ onSignup, onLogin }: SignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col h-full px-8 overflow-y-auto" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Header */}
      <div className="pt-16 mb-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B4AEBD' }}>
            <Trophy size={28} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl" style={{ color: '#B4AEBD' }}>EGEV Tenis</h1>
        </div>
        <h2 className="text-3xl text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-600">Join our tennis community</p>
      </div>

      {/* Form */}
      <div className="flex-1 pb-8">
        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <User size={20} color="#9CA3AF" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 transition-all"
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Mail size={20} color="#9CA3AF" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 transition-all"
              />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Phone size={20} color="#9CA3AF" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 transition-all"
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                className="w-full pl-12 pr-12 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-3 pt-2">
            <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300" style={{ accentColor: '#54CE8F' }} />
            <p className="text-sm text-gray-600">
              I agree to the Terms & Conditions and Privacy Policy
            </p>
          </div>

          {/* Signup Button */}
          <button
            onClick={onSignup}
            className="w-full py-4 rounded-2xl text-white shadow-lg transition-all mt-6"
            style={{ backgroundColor: '#54CE8F' }}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Login Link */}
      <div className="pb-12 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button onClick={onLogin} className="font-medium" style={{ color: '#54CE8F' }}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
