import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        // RTL Logic is handled in i18n.js event listener
    };

    return (
        <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-100">
                <Globe size={20} />
                <span className="uppercase font-bold text-xs">{i18n.language.split('-')[0]}</span>
            </button>
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 hidden group-hover:block z-50">
                <button
                    onClick={() => changeLanguage('fr')}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-slate-50 ${i18n.language.startsWith('fr') ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
                >
                    🇫🇷 Français
                </button>
                <button
                    onClick={() => changeLanguage('en')}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-slate-50 ${i18n.language.startsWith('en') ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
                >
                    🇬🇧 English
                </button>
                <button
                    onClick={() => changeLanguage('ar')}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-right hover:bg-slate-50 ${i18n.language.startsWith('ar') ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
                    style={{ justifyContent: 'flex-end' }} // Force right align for Arabic option visual
                >
                    Arabe 🇲🇦
                </button>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
