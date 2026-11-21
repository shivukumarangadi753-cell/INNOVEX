import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English
import enCommon from '../locales/en/common.json';
import enOverview from '../locales/en/overview.json';
import enForest from '../locales/en/forest.json';
import enAlerts from '../locales/en/alerts.json';
import enAbout from '../locales/en/about.json';
import enExplore from '../locales/en/explore.json';

// Hindi
import hiCommon from '../locales/hi/common.json';
import hiOverview from '../locales/hi/overview.json';
import hiForest from '../locales/hi/forest.json';
import hiAlerts from '../locales/hi/alerts.json';
import hiAbout from '../locales/hi/about.json';
import hiExplore from '../locales/hi/explore.json';

// Kannada
import knCommon from '../locales/kn/common.json';
import knOverview from '../locales/kn/overview.json';
import knForest from '../locales/kn/forest.json';
import knAlerts from '../locales/kn/alerts.json';
import knAbout from '../locales/kn/about.json';
import knExplore from '../locales/kn/explore.json';

const resources = {
  en: {
    common: enCommon,
    overview: enOverview,
    forest: enForest,
    alerts: enAlerts,
    about: enAbout,
    explore: enExplore,
  },
  hi: {
    common: hiCommon,
    overview: hiOverview,
    forest: hiForest,
    alerts: hiAlerts,
    about: hiAbout,
    explore: hiExplore,
  },
  kn: {
    common: knCommon,
    overview: knOverview,
    forest: knForest,
    alerts: knAlerts,
    about: knAbout,
    explore: knExplore,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'overview', 'forest', 'alerts', 'about', 'explore'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
