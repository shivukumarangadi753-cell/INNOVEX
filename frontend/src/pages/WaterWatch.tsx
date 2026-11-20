import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Droplet, Compass } from 'lucide-react';

/**
 * Placeholder: Sidharthan's Lane
 * Owns lake surface area shrinkage trends and Central Ground Water Board (CGWB) telemetry.
 */
export const WaterWatch: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-teal-bg text-teal rounded-xl">
          <Droplet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Water Watch</h1>
          <p className="text-xs text-slate-500">
            Kudremukh wetland & Lakhya reservoir water spread area tracking (MNDWI & radar)
          </p>
        </div>
      </div>

      <Card className="max-w-xl mx-auto my-12 text-center p-8 border-dashed border-2">
        <CardHeader className="justify-center border-none">
          <div className="p-4 bg-teal-50 text-teal rounded-full inline-flex">
            <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
        </CardHeader>
        <CardTitle className="text-xl mt-2 text-slate-800">Feature Under Active Construction</CardTitle>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            This module is being built in parallel by <strong>Sidharthan</strong>.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 font-mono">
            Lane: pages/WaterWatch.tsx & features/water-watch/*
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterWatch;
