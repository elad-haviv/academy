/**
 * Pricing constants (spec §5.2). Prices are stored in agorot, never floats,
 * and shown here as the single source for /pricing and the paywall card.
 */

export type Plan = {
  sku: 'sub_monthly' | 'sub_annual';
  name: string;
  amountAgorot: number;
  price: string;
  period: string;
  pitch: string;
  featured: boolean;
};

export const ANNUAL_AGOROT = 34900;
export const MONTHLY_AGOROT = 3900;

export const PLANS: Plan[] = [
  {
    sku: 'sub_annual',
    name: 'שנתי',
    amountAgorot: ANNUAL_AGOROT,
    price: '₪349',
    period: 'לשנה',
    pitch: 'המסלול המומלץ. יוצא ₪29 לחודש — חודשיים מתנה.',
    featured: true,
  },
  {
    sku: 'sub_monthly',
    name: 'חודשי',
    amountAgorot: MONTHLY_AGOROT,
    price: '₪39',
    period: 'לחודש',
    pitch: 'ביטול בכל עת. הגישה נשארת עד סוף התקופה ששולמה.',
    featured: false,
  },
];

export const TRIAL_DAYS = 7;
export const REFUND_DAYS = 14;
export const ANNUAL_PRICE = '₪349';
