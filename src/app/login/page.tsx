'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, SEEDED_ACCOUNTS } from '@/lib/supabase';
import { ShieldCheck, User, Key, ArrowRight, AlertCircle, Check, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/farmer';

  const [email, setEmail] = useState('farmer.mandya@agritrust.live');
  const [password, setPassword] = useState('mandya2026');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const { session, error } = await signIn(email, password);
      if (error || !session) {
        setErrorMsg(error || 'Authentication failed. Please verify credentials.');
        setIsLoading(false);
        return;
      }

      if (session.user.role === 'admin') {
        router.push('/admin/issue-card');
      } else {
        router.push(returnUrl.startsWith('/admin') ? '/farmer' : returnUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error during login.');
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (accountEmail: string) => {
    const acc = SEEDED_ACCOUNTS[accountEmail];
    if (!acc) return;
    setEmail(accountEmail);
    setPassword(acc.password);
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand / Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-ink rounded-ats shadow-hard-sm mb-3">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink">
            AgriTrust Verification System
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-ink font-heading">
          Field Officer & Farmer Sign In
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Official access portal for Karnataka farming parcels
        </p>
      </div>

      {/* Main Card */}
      <div className="card-hard p-6 sm:p-7 bg-white">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border-ink rounded-ats flex items-start gap-2.5 text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-band-attention flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
              Registered Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agritrust.live"
                className="w-full pl-9 pr-3 py-2.5 bg-paper border-ink rounded-ats text-sm text-ink font-medium placeholder-stone-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
              Access Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-paper border-ink rounded-ats text-sm text-ink font-medium placeholder-stone-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-accent text-white btn-hard flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Session...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Seeded Profiles */}
        <div className="mt-6 pt-5 border-t border-stone-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2.5 flex items-center justify-between">
            <span>Quick Select Registered Profile:</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {Object.entries(SEEDED_ACCOUNTS).map(([accEmail, item]) => {
              const isSelected = email === accEmail;
              const isFarmer = item.user.role === 'farmer';

              return (
                <button
                  key={accEmail}
                  type="button"
                  onClick={() => handleQuickSelect(accEmail)}
                  className={`text-left p-2.5 rounded-ats border-ink transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-accent font-bold'
                      : 'bg-paper hover:bg-stone-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <span>{item.user.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border border-ink ${
                          isFarmer ? 'bg-band-good/20 text-accent' : 'bg-stone-200 text-stone-800'
                        }`}
                      >
                        {isFarmer ? `${item.user.district} Farmer` : 'Field Admin'}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                      {accEmail} • {isFarmer ? item.user.parcel_id : 'Full Operations Access'}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-accent stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-4 text-center text-[11px] text-stone-500 font-mono">
        AgriTrust ID Authentication • Protected by JWT Token Enforcement
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center p-4 sm:p-6">
      <Suspense
        fallback={
          <div className="card-hard p-10 bg-white text-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-2" />
            <p className="text-xs text-stone-500">Loading sign in...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
