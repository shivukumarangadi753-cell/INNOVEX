import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TreePine,
  Droplets,
  Globe2,
  Calendar,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Radio,
  BookOpen,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';

export const About: React.FC = () => {
  const { t } = useTranslation('about');
  const [tourStep, setTourStep] = useState<number | null>(null);

  const tourSteps = [
    {
      num: 1,
      title: t('tour.step1Title', '1. The Satellite Eye'),
      desc: t('tour.step1Desc', 'Welcome to Prakriti-Netra. We monitor high-biodiversity ecosystems using Copernicus Sentinel-2 optical and Sentinel-1 radar satellites.'),
      badge: 'Constellation Feeds',
    },
    {
      num: 2,
      title: t('tour.step2Title', '2. Alerts, Not Just Maps'),
      desc: t('tour.step2Desc', 'Instead of waiting for 2-year survey cycles, our automated pipeline flags sudden canopy loss and fires as soon as a satellite passes overhead.'),
      badge: 'Continuous Detection',
    },
    {
      num: 3,
      title: t('tour.step3Title', '3. Hydrological Watch'),
      desc: t('tour.step3Desc', 'Track lake water spread contraction and groundwater depletion to protect wetlands before drinking water crises emerge.'),
      badge: 'Water Security',
    },
    {
      num: 4,
      title: t('tour.step4Title', '4. Ground Action & Telegram'),
      desc: t('tour.step4Desc', 'Review flagged alerts with Before/After satellite imagery, confirm status, and dispatch instant GPS alerts to field patrol officers via Telegram.'),
      badge: 'Field Response',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header with Guided Tour CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-forest uppercase tracking-wider">
              Code for Innovex '26 • Protecting Natural Wealth
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy mt-1">
            {t('title', 'About PRAKRITI-NETRA')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('subtitle', "The Satellite Eye for India's Forests, Water & Wildlife")}
          </p>
        </div>

        <Button
          variant="forest"
          size="md"
          leftIcon={<Sparkles className="w-4 h-4" />}
          onClick={() => setTourStep(0)}
        >
          {t('tour.btnStart', 'Start 4-Step Guided Tour')}
        </Button>
      </div>

      {/* Mission Card: Alerts, Not Just Maps */}
      <Card className="bg-gradient-to-br from-navy via-navy-dark to-navy-surface text-white p-6 sm:p-8 shadow-float border border-white/10 rounded-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/30 border border-forest-light text-forest-light text-xs font-bold shadow-xs">
            <ShieldCheck className="w-4 h-4" />
            Core Architectural Principle
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('mission.heading', 'Why Alerts, Not Just Maps?')}
          </h2>
          <p className="text-sm sm:text-base text-cream-100/90 leading-relaxed font-normal">
            {t(
              'mission.body',
              'Traditional conservation platforms provide beautiful static maps, but maps do not stop chainsaws or save drying wetlands. PRAKRITI-NETRA shifts the paradigm from passive monitoring to automated, proactive alerting. By continuously running change-detection algorithms over Sentinel and NASA open satellite feeds, we deliver targeted, geocoded alerts straight to range officers before damage becomes irreversible.'
            )}
          </p>
        </div>
      </Card>

      {/* Key National Stats Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-navy dark:text-cream" />
          <h2 className="text-lg font-bold text-navy dark:text-white">
            {t('stats.heading', "The Challenge: India's Natural Wealth in Numbers")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-forest bg-gradient-to-br from-forest-bg/15 to-white dark:to-navy-dark shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
            <span className="text-3xl font-black text-forest">{t('stats.stat1Value', '21.76%')}</span>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">{t('stats.stat1Label', 'National Forest Cover')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('stats.stat1Sub', '25.17% including tree cover outside forests (ISFR 2023)')}</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-rust bg-gradient-to-br from-rust-bg/15 to-white dark:to-navy-dark shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
            <span className="text-3xl font-black text-rust">{t('stats.stat2Value', '2 Years')}</span>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">{t('stats.stat2Label', 'Survey Gap')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('stats.stat2Sub', 'Time between biennial ISFR surveys—far too slow to halt illegal clearing')}</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-teal bg-gradient-to-br from-teal-bg/15 to-white dark:to-navy-dark shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
            <span className="text-3xl font-black text-teal">{t('stats.stat3Value', '~80%')}</span>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">{t('stats.stat3Label', 'Agricultural Freshwater')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('stats.stat3Sub', "Share of India's annual freshwater consumed by irrigation")}</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber bg-gradient-to-br from-amber-bg/15 to-white dark:to-navy-dark shadow-subtle hover:shadow-card hover:-translate-y-0.5 transition-all">
            <span className="text-3xl font-black text-amber-dark">{t('stats.stat4Value', '~25%')}</span>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">{t('stats.stat4Label', 'Global Extraction')}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('stats.stat4Sub', 'Share of global groundwater extracted in India—more than China & US combined')}</p>
          </Card>
        </div>
      </div>

      {/* UN Sustainable Development Goals Section */}
      <Card className="p-6 bg-cream-50 border border-slate-200">
        <h3 className="font-bold text-base text-navy mb-4 flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-forest" />
          {t('sdgs.heading', 'United Nations Sustainable Development Goals Alignment')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <Chip variant="custom" icon={<Droplets className="w-4 h-4 text-teal" />} label={t('sdgs.sdg6', 'SDG 6: Clean Water & Sanitation')} />
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('sdgs.sdg6Desc', 'Monitoring surface reservoir contraction and incentivizing water reuse via Jal-Score benchmarking.')}
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <Chip variant="custom" icon={<Globe2 className="w-4 h-4 text-amber-dark" />} label={t('sdgs.sdg13', 'SDG 13: Climate Action')} />
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('sdgs.sdg13Desc', 'Preventing canopy biomass carbon loss and detecting wildfire risk using NASA FIRMS thermal telemetry.')}
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <Chip variant="custom" icon={<TreePine className="w-4 h-4 text-forest" />} label={t('sdgs.sdg15', 'SDG 15: Life on Land')} />
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('sdgs.sdg15Desc', 'Defending UNESCO Western Ghats biodiversity hotspots and maintaining wildlife corridor connectivity.')}
            </p>
          </div>
        </div>
      </Card>

      {/* Now / Next / Later Product Roadmap */}
      <Card className="p-6">
        <h3 className="font-bold text-base text-navy mb-4 flex items-center gap-2">
          <Compass className="w-5 h-5 text-navy" />
          {t('roadmap.heading', 'Product Evolution Roadmap')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border-2 border-forest bg-forest-bg/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-forest uppercase tracking-wider">{t('roadmap.nowTitle', 'NOW (MVP)')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest text-white">Active</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {t('roadmap.nowDesc', 'Kudremukh Western Ghats reserve pilot; Sentinel-2 & SAR bi-temporal canopy change detection; Telegram field alert dispatch; mock & live API integration.')}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">{t('roadmap.nextTitle', 'NEXT')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">Q1 2027</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('roadmap.nextDesc', 'Automated Copernicus weekly ingestion cron; offline SMS alerts for remote beats without 4G; drone coordinate dispatch for high-confidence anomalies.')}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">{t('roadmap.laterTitle', 'LATER')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">2027-28</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('roadmap.laterDesc', 'Pan-India coverage of 106 National Parks & 573 Wildlife Sanctuaries; citizen ground-truthing portal; on-orbit satellite edge AI inference.')}
            </p>
          </div>
        </div>
      </Card>

      {/* Official Data Sources & References Footer */}
      <div className="p-5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          {t('sources.heading', 'Official References & Data Sources')}
        </h4>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] list-disc list-inside">
          <li>{t('sources.source1', 'Forest Survey of India (FSI) — India State of Forest Report (ISFR 2023)')}</li>
          <li>{t('sources.source2', 'Ministry of Jal Shakti & NITI Aayog — Composite Water Management Index')}</li>
          <li>{t('sources.source3', 'UN-Water & World Bank — Ground Water Resource Assessment Report')}</li>
          <li>{t('sources.source4', 'European Space Agency (ESA) & Copernicus Open Access Hub — Sentinel-1 & Sentinel-2')}</li>
          <li className="sm:col-span-2">{t('sources.source5', 'NASA FIRMS — Fire Information for Resource Management System (VIIRS/MODIS)')}</li>
        </ul>
      </div>

      {/* Guided Tour Modal Walkthrough */}
      {tourStep !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-forest uppercase tracking-wider">
                Guided Tour ({tourStep + 1} of {tourSteps.length})
              </span>
              <button
                type="button"
                onClick={() => setTourStep(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                aria-label="Close tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="inline-block px-2.5 py-1 rounded-md bg-forest-bg text-forest-dark text-xs font-semibold">
                {tourSteps[tourStep].badge}
              </span>
              <h3 className="text-xl font-bold text-navy">{tourSteps[tourStep].title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{tourSteps[tourStep].desc}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex gap-1.5">
                {tourSteps.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${
                      i === tourStep ? 'bg-forest' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {tourStep > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTourStep((prev) => (prev !== null ? prev - 1 : 0))}
                  >
                    Back
                  </Button>
                )}
                {tourStep < tourSteps.length - 1 ? (
                  <Button
                    size="sm"
                    variant="forest"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => setTourStep((prev) => (prev !== null ? prev + 1 : 0))}
                  >
                    Next
                  </Button>
                ) : (
                  <Button size="sm" variant="forest" onClick={() => setTourStep(null)}>
                    Finish Tour
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
