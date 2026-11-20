import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Flame, Compass } from 'lucide-react';

/**
 * Placeholder: Sidharthan's Lane
 * Owns NASA FIRMS active fire hotspots and wildlife corridor disruption monitoring.
 */
export const FireWildlife: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-bg text-amber-dark rounded-xl">
          <Flame className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Fire & Wildlife Corridors</h1>
          <p className="text-xs text-slate-500">
            Thermal anomaly monitoring via NASA FIRMS & Western Ghats elephant/tiger corridor integrity
          </p>
        </div>
      </div>

      <Card className="max-w-xl mx-auto my-12 text-center p-8 border-dashed border-2">
        <CardHeader className="justify-center border-none">
          <div className="p-4 bg-amber-50 text-amber-dark rounded-full inline-flex">
            <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
        </CardHeader>
        <CardTitle className="text-xl mt-2 text-slate-800">Feature Under Active Construction</CardTitle>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            This module is being built in parallel by <strong>Sidharthan</strong>.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 font-mono">
            Lane: pages/FireWildlife.tsx & features/fire-wildlife/*
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FireWildlife;
