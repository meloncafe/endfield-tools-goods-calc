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

    // OCR
    ocrTitle: '스크린샷 자동 입력',
    ocrUpload: '클릭하여 업로드하거나 붙여넣기 (Ctrl+V)',
    ocrUploadHint: '물자 관리 화면 · 해상도 무관',
    ocrAnalyzing: '분석 중...',
    ocrImported: '#{n}개 항목을 계산기에 불러왔습니다',
    ocrNoItems: '스크린샷에서 아이템을 찾을 수 없습니다.',
    ocrImageError: '이미지 파일을 선택해주세요.',
    ocrTooLarge: '이미지가 너무 큽니다. 크롭 후 다시 시도해주세요.',
    ocrClear: '지우기',
    ocrPasteHint: '팁: Ctrl+V / Cmd+V로 스크린샷 붙여넣기',
    ocrDailyLimit: '일일 사용 횟수를 초과했습니다 (5회/일). 내일 다시 시도해주세요.',
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

    // OCR
    ocrTitle: 'Screenshot Auto-Import',
    ocrUpload: 'Click to upload or paste (Ctrl+V) a screenshot',
    ocrUploadHint: 'Supply management screen · Any resolution OK',
    ocrAnalyzing: 'Analyzing...',
    ocrImported: '#{n} items imported to calculator',
    ocrNoItems: 'No items found in the screenshot.',
    ocrImageError: 'Please select an image file.',
    ocrTooLarge: 'Image too large after resize. Try cropping.',
    ocrClear: 'Clear',
    ocrPasteHint: 'Tip: Paste screenshots with Ctrl+V / Cmd+V',
    ocrDailyLimit: 'Daily limit reached (5/day). Try again tomorrow.',
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

    // OCR
    ocrTitle: 'スクリーンショット自動入力',
    ocrUpload: 'クリックしてアップロードまたは貼り付け（Ctrl+V）',
    ocrUploadHint: '物資管理画面 · 解像度不問',
    ocrAnalyzing: '分析中...',
    ocrImported: '#{n}件を計算機にインポートしました',
    ocrNoItems: 'スクリーンショットからアイテムが見つかりませんでした。',
    ocrImageError: '画像ファイルを選択してください。',
    ocrTooLarge: '画像が大きすぎます。クロップしてください。',
    ocrClear: 'クリア',
    ocrPasteHint: 'ヒント: Ctrl+V / Cmd+Vでスクリーンショットを貼り付け',
    ocrDailyLimit: '1日の使用回数を超えました（5回/日）。明日再度お試しください。',
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

    // OCR
    ocrTitle: '截图自动导入',
    ocrUpload: '点击上传或粘贴（Ctrl+V）截图',
    ocrUploadHint: '物资管理界面 · 任意分辨率',
    ocrAnalyzing: '分析中...',
    ocrImported: '已导入#{n}个物品到计算器',
    ocrNoItems: '未在截图中找到物品。',
    ocrImageError: '请选择图片文件。',
    ocrTooLarge: '图片过大，请裁剪后重试。',
    ocrClear: '清除',
    ocrPasteHint: '提示：使用 Ctrl+V / Cmd+V 粘贴截图',
    ocrDailyLimit: '已达每日使用上限（5次/天），请明天再试。',
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

// Format OCR imported text with count
export function formatOcrImported(lang, n) {
  const t = getTranslation(lang);
  return t.ocrImported.replace('#{n}', n);
}
