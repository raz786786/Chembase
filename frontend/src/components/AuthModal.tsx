import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Lock, User, Calendar, ShieldCheck, ArrowRight, 
  KeyRound, LogIn, UserPlus, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SupabaseUser | null;
  onAuthSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, currentUser, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'otp' | 'complete_profile'>('signin');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-detect profile setup requirement (e.g. after Google OAuth or email signup)
  useEffect(() => {
    if (currentUser) {
      const meta = currentUser.user_metadata || {};
      if (!meta.profile_completed || !meta.display_name || !meta.age) {
        setMode('complete_profile');
        if (meta.full_name || meta.name) setDisplayName(meta.full_name || meta.name);
      }
    }
  }, [currentUser]);

  if (!isOpen) return null;

  // ─── Google OAuth Sign In / Up ─────────────
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize Google Sign In');
      setLoading(false);
    }
  };

  // ─── Email + Password Sign Up ──────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check system toggle for registration
    try {
      const savedConfig = JSON.parse(localStorage.getItem('system_config') || '{}');
      if (savedConfig.userRegistrationOpen === false) {
        setErrorMsg('New user registration is currently disabled by the System Administrator. Existing users can still sign in.');
        return;
      }
    } catch { /* ignore */ }

    if (!email || !password || !displayName || !age) {
      setErrorMsg('Please fill in all fields (Email, Password, Display Name, and Age)');
      return;
    }
    if (parseInt(age) < 5 || parseInt(age) > 120) {
      setErrorMsg('Please enter a valid age (5 - 120)');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Set admin role automatically if email is raoa87442@gmail.com
      const userRole = email.toLowerCase() === 'raoa87442@gmail.com' ? 'admin' : 'user';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            age: parseInt(age),
            role: userRole,
            profile_completed: true,
          },
        },
      });
      if (error) throw error;

      if (data.session) {
        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 1000);
      } else {
        setSuccessMsg('Verification code sent to your email! Enter the code below.');
        setMode('otp');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Email + Password Sign In (Supabase Password & Role Verification) ────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter your email and password');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Password Verification via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // 2. Role Verification
      const signedInUser = data.user;
      const isSuperAdmin = signedInUser?.email?.toLowerCase() === 'raoa87442@gmail.com';
      const currentRole = isSuperAdmin ? 'admin' : (signedInUser?.user_metadata?.role || 'user');

      // Auto-sync super admin role in Supabase metadata if missing
      if (isSuperAdmin && signedInUser?.user_metadata?.role !== 'admin') {
        await supabase.auth.updateUser({
          data: { role: 'admin' },
        });
      }

      const meta = signedInUser?.user_metadata || {};
      if (!meta.profile_completed || !meta.display_name || !meta.age) {
        setMode('complete_profile');
      } else {
        setSuccessMsg(`Verified! Signed in as ${currentRole.toUpperCase()} (${signedInUser?.email})`);
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Invalid email or password verified by Supabase. Please check your credentials or click "Sign Up" above.');
      } else {
        setErrorMsg(err.message || 'Sign in authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Send Email Verification Code / OTP ────
  const handleSendOTP = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setSuccessMsg('Verification code sent to your email!');
      setMode('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify Email OTP Code ──────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setErrorMsg('Please enter the verification code');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      });
      if (error) throw error;

      const meta = data.user?.user_metadata || {};
      if (!meta.profile_completed || !meta.display_name || !meta.age) {
        setMode('complete_profile');
      } else {
        setSuccessMsg('Verification successful!');
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // ─── Complete Profile Details (First-time user / Google user) ───
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !age) {
      setErrorMsg('Please provide your Display Name and Age');
      return;
    }
    if (parseInt(age) < 5 || parseInt(age) > 120) {
      setErrorMsg('Please enter a valid age (5 - 120)');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const userRole = currentUser?.email?.toLowerCase() === 'raoa87442@gmail.com' ? 'admin' : (currentUser?.user_metadata?.role || 'user');

      // Update Supabase Metadata
      const { error: metaErr } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          age: parseInt(age),
          role: userRole,
          profile_completed: true,
        },
      });
      if (metaErr) throw metaErr;

      // Update Account Password if provided so user can log in with Email & Password anytime!
      if (password) {
        const { error: passErr } = await supabase.auth.updateUser({ password });
        if (passErr) throw passErr;
      }

      setSuccessMsg('Profile setup complete!');
      setTimeout(() => {
        onAuthSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              {mode === 'signin' && 'Sign In to ChemBase Pro'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'otp' && 'Email Verification'}
              {mode === 'complete_profile' && 'First-Time Setup: Set Profile & Password'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {mode === 'signin' && 'Access engineering database & AI solvers'}
              {mode === 'signup' && 'Join the chemical analysis platform'}
              {mode === 'otp' && 'Enter the verification code sent to your email'}
              {mode === 'complete_profile' && 'Set display name, age & optional password for email sign in'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE: Complete Profile (First-Time Registration / Google Login) */}
          {mode === 'complete_profile' && (
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-300 font-medium">
                Welcome! Please set your <strong>Display Name</strong>, <strong>Age</strong>, and a <strong>Password</strong> so you can sign in anytime using Email + Password too.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Display Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Rao Ahmad"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Age *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    required
                    min="5"
                    max="120"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Set Account Password (For Email Login) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Set a password for email login"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Save & Start Using ChemBase Pro
              </button>
            </form>
          )}

          {/* MODE: Sign In or Sign Up */}
          {(mode === 'signin' || mode === 'signup') && (
            <>
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-bold text-slate-400 absolute">
                  Or Email
                </span>
              </div>

              {/* Form */}
              <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3.5">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Display Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-600 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Age *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          required
                          min="5"
                          max="120"
                          value={age}
                          onChange={e => setAge(e.target.value)}
                          placeholder="Your Age"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-600 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Password *
                    </label>
                    {mode === 'signin' && (
                      <button 
                        type="button" 
                        onClick={handleSendOTP}
                        className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        Send Code (OTP)
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-sky-600 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {/* Mode Toggle */}
              <div className="text-center pt-2">
                {mode === 'signin' ? (
                  <p className="text-xs text-slate-500">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => { setMode('signup'); setErrorMsg(null); }}
                      className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button 
                      onClick={() => { setMode('signin'); setErrorMsg(null); }}
                      className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

          {/* MODE: Email Verification Code (OTP) */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Verification Code (Sent to {email})
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm font-semibold tracking-widest text-slate-900 dark:text-white outline-none focus:border-sky-600 transition-all text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Verify & Sign In
              </button>

              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Back to Sign In
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
