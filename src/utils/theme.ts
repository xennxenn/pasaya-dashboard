import { FontTheme, ThemeMode } from '../types';

export const THEME_CONFIGS: Record<
  FontTheme,
  {
    name: string;
    primaryText: string;
    lightPrimaryText: string;
    accentText: string;
    lightAccentText: string;
    borderAccent: string;
    bgAccentGlow: string;
    badgeBg: string;
    chartColor: string;
  }
> = {
  cyan: {
    name: 'Cyan Neon (ค่าเริ่มต้น)',
    primaryText: 'text-cyan-400',
    lightPrimaryText: 'text-cyan-700',
    accentText: 'text-cyan-300',
    lightAccentText: 'text-cyan-600',
    borderAccent: 'border-cyan-500/30',
    bgAccentGlow: 'bg-cyan-500/10',
    badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
    chartColor: '#06b6d4',
  },
  blue: {
    name: 'Royal Blue (น้ำเงินคราม)',
    primaryText: 'text-blue-400',
    lightPrimaryText: 'text-blue-700',
    accentText: 'text-blue-300',
    lightAccentText: 'text-blue-600',
    borderAccent: 'border-blue-500/30',
    bgAccentGlow: 'bg-blue-500/10',
    badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    chartColor: '#3b82f6',
  },
  emerald: {
    name: 'Emerald Mint (เขียวมรกต)',
    primaryText: 'text-emerald-400',
    lightPrimaryText: 'text-emerald-700',
    accentText: 'text-emerald-300',
    lightAccentText: 'text-emerald-600',
    borderAccent: 'border-emerald-500/30',
    bgAccentGlow: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    chartColor: '#10b981',
  },
  amber: {
    name: 'Warm Gold (ทองหรูหรา)',
    primaryText: 'text-amber-400',
    lightPrimaryText: 'text-amber-700',
    accentText: 'text-amber-300',
    lightAccentText: 'text-amber-600',
    borderAccent: 'border-amber-500/30',
    bgAccentGlow: 'bg-amber-500/10',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
    chartColor: '#f59e0b',
  },
  purple: {
    name: 'Electric Violet (ม่วงไซเบอร์)',
    primaryText: 'text-purple-400',
    lightPrimaryText: 'text-purple-700',
    accentText: 'text-purple-300',
    lightAccentText: 'text-purple-600',
    borderAccent: 'border-purple-500/30',
    bgAccentGlow: 'bg-purple-500/10',
    badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    chartColor: '#a855f7',
  },
  slate: {
    name: 'Pure Monochrome (ขาว-ดำ คมชัดสูง)',
    primaryText: 'text-white',
    lightPrimaryText: 'text-slate-900',
    accentText: 'text-slate-200',
    lightAccentText: 'text-slate-700',
    borderAccent: 'border-slate-400/30',
    bgAccentGlow: 'bg-white/10',
    badgeBg: 'bg-slate-700/40 text-white border-slate-600/40',
    chartColor: '#0ea5e9',
  },
};

export function getThemePrimaryText(theme: FontTheme, mode: ThemeMode): string {
  const config = THEME_CONFIGS[theme] || THEME_CONFIGS.cyan;
  return mode === 'light' ? config.lightPrimaryText : config.primaryText;
}

