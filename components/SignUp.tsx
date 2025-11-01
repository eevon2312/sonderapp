import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SignUpProps {
  onSwitchToLogin: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup, loginAsGuest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signup(name, email, password);
      // Success will be handled by the App component re-rendering to onboarding
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center flex flex-col items-center justify-center h-full animate-fade-in">
      <h1 className="text-4xl sm:text-5xl font-lora text-green-200 mb-4">Join Sonder</h1>
      <p className="text-lg text-gray-300 max-w-md mb-8">Create your private, safe space for reflection.</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First Name"
          required
          className="w-full bg-[#222a26] rounded-lg p-4 text-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          required
          className="w-full bg-[#222a26] rounded-lg p-4 text-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 6 characters)"
          required
          className="w-full bg-[#222a26] rounded-lg p-4 text-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400/50"
        />

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 px-8 py-3 bg-green-400/20 text-green-200 rounded-lg hover:bg-green-400/30 transition-colors disabled:bg-gray-600/20 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <div className="my-4 flex items-center w-full max-w-sm">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="flex-shrink mx-4 text-gray-400">or</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>
      
      <button
        onClick={loginAsGuest}
        className="w-full max-w-sm px-8 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
      >
        Continue as Guest (Demo)
      </button>
      
      <p className="text-gray-400 mt-6">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-green-300 hover:underline font-semibold">
          Sign In
        </button>
      </p>
    </div>
  );
};

export default SignUp;