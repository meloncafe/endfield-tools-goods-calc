// Language configurations
export const LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

// Translations
const translations = {
  ko: {
    // Header
    title: '차익 계산기',
    quantity: '수량',
    reset: '초기화',
    light: '라이트',
    dark: '다크',
    memo: '메모',
    memoOn: '메모 ON',
    memoOff: '메모 OFF',
    
    // Table
    buyPrice: '구매가',
    sellPrice: '판매가',
    profitPerUnit: '개당 이익',
    totalProfit: '총 이익',
    
    // Result
    itemRecommended: '#{n}번 상품 추천',
    cost: '비용',
    revenue: '수익',
    profit: '이익',
    
    // Helper
    helperText: '구매가 입력 시 자동으로 다음 행이 추가됩니다',
    
    // Footer
    footerTitle: 'Endfield Tools',
    footerDisclaimer1: '본 도구는 팬메이드이며, Gryphline/Hypergryph와 무관합니다.',
    footerDisclaimer2: 'Arknights: Endfield™ 및 관련 상표는 각 소유자의 자산입니다.',
  },
  en: {
    title: 'Profit Calculator',
    quantity: 'Qty',
    reset: 'Reset',
    light: 'Light',
    dark: 'Dark',
    memo: 'Memo',
    memoOn: 'Memo ON',
    memoOff: 'Memo OFF',
    
    buyPrice: 'Buy Price',
    sellPrice: 'Sell Price',
    profitPerUnit: 'Profit/Unit',
    totalProfit: 'Total Profit',
    
    itemRecommended: 'Item #{n} Recommended',
    cost: 'Cost',
    revenue: 'Revenue',
    profit: 'Profit',
    
    helperText: 'Next row is automatically added when you enter buy price',
    
    footerTitle: 'Endfield Tools',
    footerDisclaimer1: 'This is a fan-made tool, not affiliated with Gryphline/Hypergryph.',
    footerDisclaimer2: 'Arknights: Endfield™ and related trademarks are property of their respective owners.',
  },
  ja: {
    title: '利益計算機',
    quantity: '数量',
    reset: 'リセット',
    light: 'ライト',
    dark: 'ダーク',
    memo: 'メモ',
    memoOn: 'メモ ON',
    memoOff: 'メモ OFF',
    
    buyPrice: '購入価格',
    sellPrice: '売却価格',
    profitPerUnit: '単価利益',
    totalProfit: '総利益',
    
    itemRecommended: '#{n}番商品おすすめ',
    cost: 'コスト',
    revenue: '収益',
    profit: '利益',
    
    helperText: '購入価格入力時に次の行が自動追加されます',
    
    footerTitle: 'Endfield Tools',
    footerDisclaimer1: 'これはファンメイドツールであり、Gryphline/Hypergryphとは無関係です。',
    footerDisclaimer2: 'Arknights: Endfield™および関連商標は各所有者の資産です。',
  },
  zh: {
    title: '利润计算器',
    quantity: '数量',
    reset: '重置',
    light: '浅色',
    dark: '深色',
    memo: '备注',
    memoOn: '备注 ON',
    memoOff: '备注 OFF',
    
    buyPrice: '买入价',
    sellPrice: '卖出价',
    profitPerUnit: '单价利润',
    totalProfit: '总利润',
    
    itemRecommended: '推荐商品#{n}',
    cost: '成本',
    revenue: '收益',
    profit: '利润',
    
    helperText: '输入买入价后会自动添加下一行',
    
    footerTitle: 'Endfield Tools',
    footerDisclaimer1: '这是粉丝制作的工具，与Gryphline/Hypergryph无关。',
    footerDisclaimer2: 'Arknights: Endfield™及相关商标均为各自所有者的财产。',
  },
};

// Detect browser language
export function detectBrowserLanguage() {
  const browserLang = navigator.language?.split('-')[0] || 'en';
  const supported = LANGUAGES.map(l => l.code);
  return supported.includes(browserLang) ? browserLang : 'en';
}

// Get translation for a language
export function getTranslation(lang) {
  return translations[lang] || translations.en;
}

// Format item recommended text with number
export function formatItemRecommended(lang, n) {
  const t = getTranslation(lang);
  return t.itemRecommended.replace('#{n}', n);
}
