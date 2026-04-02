'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { hashPassword, storeSession } from '@/lib/crypto';
import { Lock, Shield } from 'lucide-react';

// Demo password — publicly known, no real data behind it
const EXPECTED_HASH = hashPassword('demo2026');

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate async verification
    await new Promise((resolve) => setTimeout(resolve, 500));

    const hash = hashPassword(password);

    if (hash === EXPECTED_HASH) {
      storeSession(password);
      onAuthenticated();
    } else {
      setError('Invalid password. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-forest-600/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-forest-500" />
          </div>
          <div>
            <CardTitle className="text-2xl">Wealth Engine 2026</CardTitle>
            <CardTitle className="text-xl text-forest-400">Wealth Architecture</CardTitle>
          </div>
          <CardDescription>
            Demo password: <code className="text-forest-400">demo2026</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Verifying...' : 'Unlock Dashboard'}
            </Button>
          </form>
          <p className="mt-6 text-xs text-center text-slate-500">
            Demo mode — all data is fictional
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
