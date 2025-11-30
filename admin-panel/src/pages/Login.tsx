import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo ve Başlık */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center rounded-full glass-strong glow-lime">
            <span className="text-5xl">🎾</span>
          </div>
          <h2 className="text-4xl font-bold text-tennis-white mb-2">
            Admin Paneli
          </h2>
          <p className="text-tennis-white/70 text-sm">
            Lütfen admin bilgilerinizle giriş yapın
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6 glass-strong rounded-2xl p-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg backdrop-blur-xl">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-tennis-white/90 mb-2">
                Email Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="glass appearance-none relative block w-full px-4 py-3 text-tennis-white placeholder-tennis-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-tennis-lime focus:border-transparent transition-all duration-300"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-tennis-white/90 mb-2">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="glass appearance-none relative block w-full px-4 py-3 text-tennis-white placeholder-tennis-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-tennis-lime focus:border-transparent transition-all duration-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3 px-4 text-sm font-bold rounded-lg text-tennis-navy bg-gradient-to-r from-tennis-lime to-tennis-green hover:from-tennis-green hover:to-tennis-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tennis-lime disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-tennis-lime/50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-tennis-navy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-tennis-white/50 text-xs">
          Tenis App © 2024 - Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
};

export default Login;

