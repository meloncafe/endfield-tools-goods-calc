import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, TrendingUp, Sparkles, Sun, Moon, RotateCcw, Github, StickyNote } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';
import OcrUploader from '@/components/OcrUploader';
import { detectBrowserLanguage, getTranslation, formatItemRecommended } from '@/lib/i18n';

const STORAGE_KEY = 'profit-calculator-data';
const EXPIRY_HOURS = 24;

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [items, setItems] = useState([{ id: 1, buyPrice: '', sellPrice: '', memo: '' }]);
  const [quantity, setQuantity] = useState(100);
  const [nextId, setNextId] = useState(2);
  const [isLoaded, setIsLoaded] = useState(false);
  const [memoEnabled, setMemoEnabled] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const t = getTranslation(lang);

  // localStorage에서 데이터 로드
  useEffect(() => {
    try {
      // Detect browser language on first load
      const detectedLang = detectBrowserLanguage();
      setLang(detectedLang);
      
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        const now = Date.now();
        const expiryTime = EXPIRY_HOURS * 60 * 60 * 1000;
        
        if (now - timestamp < expiryTime) {
          // Migrate items without memo field
          const migratedItems = (data.items || []).map(item => ({
            ...item,
            memo: item.memo || ''
          }));
          setItems(migratedItems);
          setQuantity(data.quantity);
          setNextId(data.nextId);
          setDarkMode(data.darkMode || false);
          if (data.lang) setLang(data.lang);
          if (data.memoEnabled !== undefined) setMemoEnabled(data.memoEnabled);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      // localStorage 접근 불가 시 무시
    }
    setIsLoaded(true);
  }, []);

  // 데이터 변경 시 localStorage에 저장
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      const dataToSave = {
        data: { items, quantity, nextId, darkMode, lang, memoEnabled },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      // localStorage 접근 불가 시 무시
    }
  }, [items, quantity, nextId, darkMode, lang, memoEnabled, isLoaded]);

  const calculations = useMemo(() => {
    return items.map(item => {
      const buy = parseFloat(item.buyPrice) || 0;
      const sell = parseFloat(item.sellPrice) || 0;
      const profitPerUnit = sell - buy;
      const totalProfit = profitPerUnit * quantity;
      const isValid = buy > 0 && sell > 0;
      return {
        ...item,
        profitPerUnit,
        totalProfit,
        totalCost: buy * quantity,
        totalRevenue: sell * quantity,
        isValid
      };
    });
  }, [items, quantity]);

  const bestItem = useMemo(() => {
    const validItems = calculations.filter(c => c.isValid);
    if (validItems.length === 0) return null;
    return validItems.reduce((best, current) => 
      current.profitPerUnit > best.profitPerUnit ? current : best
    );
  }, [calculations]);

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const resetAll = () => {
    setItems([{ id: 1, buyPrice: '', sellPrice: '', memo: '' }]);
    setNextId(2);
    setQuantity(100);
    setMemoEnabled(false);
    setResetKey(k => k + 1);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
    
    // 구매가에 입력이 들어오면 자동으로 다음 행 추가
    if (field === 'buyPrice' && value !== '') {
      const currentIndex = items.findIndex(item => item.id === id);
      if (currentIndex === items.length - 1) {
        setItems(prev => [...prev, { id: nextId, buyPrice: '', sellPrice: '', memo: '' }]);
        setNextId(prev => prev + 1);
      }
    }
  };

  // OCR import handler: replace all items with OCR results
  const handleOcrImport = (ocrItems) => {
    if (!ocrItems || ocrItems.length === 0) return;

    let currentId = nextId;
    const newItems = ocrItems.map((ocrItem) => {
      const item = {
        id: currentId++,
        buyPrice: ocrItem.buyPrice != null ? String(ocrItem.buyPrice) : '',
        sellPrice: ocrItem.sellPrice != null ? String(ocrItem.sellPrice) : '',
        memo: ocrItem.name || '',
      };
      return item;
    });

    // Add one empty row at the end for manual entry
    newItems.push({ id: currentId++, buyPrice: '', sellPrice: '', memo: '' });

    setItems(newItems);
    setNextId(currentId);

    // Auto-enable memo if items have names
    if (ocrItems.some(item => item.name)) {
      setMemoEnabled(true);
    }
  };

  const formatNumber = (num) => {
    return num.toLocaleString(lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US');
  };

  // Tab index calculation
  const getTabIndex = (index, field) => {
    if (memoEnabled) {
      // memo=1, buy=2, sell=3 per row
      const base = index * 3;
      if (field === 'memo') return base + 1;
      if (field === 'buy') return base + 2;
      if (field === 'sell') return base + 3;
    } else {
      // buy=1, sell=2 per row
      const base = index * 2;
      if (field === 'buy') return base + 1;
      if (field === 'sell') return base + 2;
    }
    return -1;
  };

  // Theme classes
  const theme = {
    bg: darkMode ? 'bg-zinc-900' : 'bg-gray-50',
    card: darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200',
    text: darkMode ? 'text-zinc-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-gray-500',
    textSecondary: darkMode ? 'text-zinc-300' : 'text-gray-700',
    input: darkMode ? 'bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400',
    tableHeader: darkMode ? 'border-zinc-700 bg-zinc-800/50' : 'border-gray-200 bg-gray-50',
    tableRow: darkMode ? 'border-zinc-700 hover:bg-zinc-700/30' : 'border-gray-100 hover:bg-gray-50',
    tableRowBest: darkMode ? 'bg-emerald-900/30 hover:bg-emerald-900/40' : 'bg-emerald-50 hover:bg-emerald-100',
    resultCard: darkMode ? 'bg-zinc-800 border-emerald-600/50' : 'bg-emerald-50 border-emerald-200',
    button: darkMode ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100 border-zinc-600' : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300',
    buttonActive: darkMode ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500' : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400',
    footer: darkMode ? 'bg-zinc-800/50' : 'bg-slate-100',
    separator: darkMode ? 'bg-zinc-700/50' : 'bg-slate-300/30',
    link: darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700',
    dropdown: darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200',
    dropdownItem: darkMode ? 'hover:bg-zinc-700 text-zinc-100' : 'hover:bg-gray-100 text-gray-900',
    dropdownItemActive: darkMode ? 'bg-zinc-700' : 'bg-gray-100',
  };

  return (
    <div className={`min-h-screen ${theme.bg} p-4 md:p-8 transition-colors duration-200`}>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-600' : 'bg-emerald-500'}`}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-xl md:text-2xl font-bold ${theme.text}`}>
              {t.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quantity Input */}
            <div className="flex items-center gap-2">
              <span className={`text-sm whitespace-nowrap ${theme.textMuted}`}>{t.quantity}</span>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className={`w-20 h-8 text-center text-sm font-medium ${theme.input}`}
                tabIndex={-1}
              />
            </div>
            
            {/* Memo Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMemoEnabled(!memoEnabled)}
              className={`h-8 px-3 ${memoEnabled ? theme.buttonActive : theme.button}`}
            >
              <StickyNote className="w-3.5 h-3.5 mr-1.5" />
              {memoEnabled ? t.memoOn : t.memoOff}
            </Button>
            
            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              className={`h-8 px-3 ${theme.button}`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              {t.reset}
            </Button>
            
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className={`h-8 px-3 ${theme.button}`}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 mr-1.5" />
                  {t.light}
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 mr-1.5" />
                  {t.dark}
                </>
              )}
            </Button>
            
            {/* Language Selector */}
            <LanguageSelector
              currentLang={lang}
              onLanguageChange={setLang}
              theme={theme}
            />
          </div>
        </div>

        {/* OCR Uploader */}
        <OcrUploader
          lang={lang}
          theme={theme}
          onImport={handleOcrImport}
          resetKey={resetKey}
        />

        {/* Items Table */}
        <Card className={`${theme.card} transition-colors duration-200 overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={`text-xs font-medium uppercase tracking-wider ${theme.tableHeader}`}>
                <th className={`text-left py-3 px-4 border-b ${theme.textMuted}`}>#</th>
                {memoEnabled && (
                  <th className={`text-left py-3 px-3 border-b ${theme.textMuted}`}>{t.memo}</th>
                )}
                <th className={`text-left py-3 px-3 border-b ${theme.textMuted}`}>{t.buyPrice}</th>
                <th className={`text-left py-3 px-3 border-b ${theme.textMuted}`}>{t.sellPrice}</th>
                <th className={`text-right py-3 px-3 border-b ${theme.textMuted}`}>{t.profitPerUnit}</th>
                <th className={`text-right py-3 px-3 border-b ${theme.textMuted}`}>{t.totalProfit}</th>
                <th className={`py-3 px-3 border-b w-10`}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const calc = calculations.find(c => c.id === item.id);
                const isBest = bestItem && bestItem.id === item.id && calc?.isValid;
                
                return (
                  <tr 
                    key={item.id}
                    className={`border-b last:border-b-0 transition-colors ${isBest ? theme.tableRowBest : theme.tableRow}`}
                  >
                    <td className="py-3 px-4">
                      <span className={`font-medium ${isBest ? 'text-emerald-500' : theme.textMuted}`}>
                        {index + 1}
                      </span>
                      {isBest && (
                        <Badge className="ml-2 bg-emerald-500 hover:bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                          BEST
                        </Badge>
                      )}
                    </td>
                    {memoEnabled && (
                      <td className="py-3 px-3">
                        <Input
                          type="text"
                          placeholder="-"
                          value={item.memo}
                          onChange={(e) => updateItem(item.id, 'memo', e.target.value)}
                          className={`h-8 w-24 text-sm ${theme.input}`}
                          tabIndex={getTabIndex(index, 'memo')}
                        />
                      </td>
                    )}
                    <td className="py-3 px-3">
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.buyPrice}
                        onChange={(e) => updateItem(item.id, 'buyPrice', e.target.value)}
                        className={`h-8 w-28 text-sm ${theme.input}`}
                        tabIndex={getTabIndex(index, 'buy')}
                      />
                    </td>
                    <td className="py-3 px-3">
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.sellPrice}
                        onChange={(e) => updateItem(item.id, 'sellPrice', e.target.value)}
                        className={`h-8 w-28 text-sm ${theme.input}`}
                        tabIndex={getTabIndex(index, 'sell')}
                      />
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold ${
                      calc?.profitPerUnit > 0 ? 'text-emerald-500' : 
                      calc?.profitPerUnit < 0 ? 'text-red-500' : theme.textMuted
                    }`}>
                      {calc?.isValid ? formatNumber(calc.profitPerUnit) : '-'}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      calc?.totalProfit > 0 ? (isBest ? 'text-emerald-600' : theme.text) : 
                      calc?.totalProfit < 0 ? 'text-red-500' : theme.textMuted
                    }`}>
                      {calc?.isValid ? formatNumber(calc.totalProfit) : '-'}
                    </td>
                    <td className="py-3 px-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                        className={`h-7 w-7 ${theme.textMuted} hover:text-red-500 hover:bg-red-500/10 disabled:opacity-20`}
                        tabIndex={-1}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Result Summary */}
        {bestItem && (
          <Card className={`${theme.resultCard} transition-colors duration-200`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-emerald-600">
                  {formatItemRecommended(lang, items.findIndex(i => i.id === bestItem.id) + 1)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className={theme.textMuted}>{t.cost} </span>
                  <span className="font-semibold text-red-500">-{formatNumber(bestItem.totalCost)}</span>
                </div>
                <div>
                  <span className={theme.textMuted}>{t.revenue} </span>
                  <span className="font-semibold text-blue-500">+{formatNumber(bestItem.totalRevenue)}</span>
                </div>
                <div className={`px-3 py-1 rounded-lg ${darkMode ? 'bg-emerald-600' : 'bg-emerald-500'}`}>
                  <span className="text-white font-bold">
                    {t.profit} {formatNumber(bestItem.totalProfit)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Helper Text */}
        <div className={`text-center text-xs py-2 ${theme.textMuted}`}>
          {t.helperText}
        </div>

        {/* Footer */}
        <Card className={`${theme.footer} border-0 transition-colors duration-200`}>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-center">
              <span className={`font-semibold ${theme.text}`}>{t.footerTitle}</span>
            </div>
            
            <Separator className={theme.separator} />
            
            <div className={`text-center text-xs space-y-1 ${theme.textMuted}`}>
              <p>{t.footerDisclaimer1}</p>
              <p>{t.footerDisclaimer2}</p>
            </div>
            
            <Separator className={theme.separator} />
            
            <div className="flex items-center justify-center">
              <a 
                href="https://github.com/meloncafe/endfield-tools-goods-calc" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-xs ${theme.link} transition-colors`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
