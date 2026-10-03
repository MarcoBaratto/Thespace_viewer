import React from 'react';
import { Globe } from 'lucide-react';
import { SessionAttribute } from '../types';

export const isSessionOriginalLanguage = (attributes: SessionAttribute[]) => {
  const langAttr = attributes?.find(a => a.attributeType === 'Language');
  return !!(langAttr?.value?.toLowerCase().includes('original') || langAttr?.name?.toLowerCase().includes('v.o.'));
};

export const getLanguageBadge = (attributes: SessionAttribute[]) => {
  if (isSessionOriginalLanguage(attributes)) {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border border-emerald-500/30">
        <Globe size={10} /> V.O.
      </span>
    );
  }
  const langAttr = attributes?.find(a => a.attributeType === 'Language');
  return (
    <span className="inline-flex items-center gap-1 bg-white/10 text-gray-300 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border border-white/10">
      {langAttr?.value || 'ITA'}
    </span>
  );
};
