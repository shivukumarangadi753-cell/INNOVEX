import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enFire from './locales/en/fire.json';
import enWater from './locales/en/water.json';
import enAdvisor from './locales/en/advisor.json';

import hiFire from './locales/hi/fire.json';
import hiWater from './locales/hi/water.json';
import hiAdvisor from './locales/hi/advisor.json';

import knFire from './locales/kn/fire.json';
import knWater from './locales/kn/water.json';
import knAdvisor from './locales/kn/advisor.json';

const resources = {
  en: {
    fire: enFire,
    water: enWater,
    advisor: enAdvisor,
  },
  hi: {
    fire: hiFire,
    water: hiWater,
    advisor: hiAdvisor,
  },
  kn: {
    fire: knFire,
    water: knWater,
    advisor: knAdvisor,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'fire',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
