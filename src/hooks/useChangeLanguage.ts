import { useTranslation } from 'react-i18next';

export const useChangeLanguage = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const getCurrentLabel = () => {
    return i18n.language === 'zh' ? '中' : 'EN';
  };

  return {
    toggleLanguage,
    getCurrentLabel,
    currentLanguage: i18n.language as 'zh' | 'en',
  };
};
