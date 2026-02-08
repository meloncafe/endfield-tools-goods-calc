import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Loader2, Check, AlertCircle, X, Clipboard } from 'lucide-react';

export default function OcrUploader({ lang, theme, onImport }) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Get test token from URL
  const testToken = new URLSearchParams(window.location.search).get('test');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size (1MB)
    if (file.size > 1_048_576) {
      setError('Image must be under 1MB. Try cropping or compressing.');
      return;
    }

    setError(null);
    setResult(null);

    // Preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result; // includes data:image/...;base64,
      setImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Validate size
          if (file.size > 1_048_576) {
            setError('Pasted image is too large. Max 1MB.');
            return;
          }

          setError(null);
          setResult(null);

          const previewUrl = URL.createObjectURL(file);
          setImagePreview(previewUrl);

          const reader = new FileReader();
          reader.onload = () => setImage(reader.result);
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleAnalyze = async () => {
    if (!image || !testToken) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Strip data URL prefix for API, send raw base64
      let base64Data = image;
      const match = image.match(/^data:image\/\w+;base64,(.+)$/);
      if (match) {
        base64Data = match[1];
      }

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Token': testToken,
        },
        body: JSON.stringify({
          image: base64Data,
          lang: lang,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Error: ${response.status}`);
        return;
      }

      if (data.items && data.items.length > 0) {
        setResult(data);
      } else {
        setError(data.error || 'No items found in the screenshot.');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (result?.items && onImport) {
      onImport(result.items);
      setResult(null);
      setImage(null);
      setImagePreview(null);
    }
  };

  const handleClear = () => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card
      className={`${theme.card} transition-colors duration-200 p-4 space-y-4`}
      onPaste={handlePaste}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className={`w-4 h-4 ${theme.textMuted}`} />
          <span className={`text-sm font-medium ${theme.text}`}>
            Screenshot OCR Import
          </span>
          <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">TEST</Badge>
        </div>
        {(image || result) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className={`h-7 px-2 ${theme.textMuted} hover:text-red-500`}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Upload Area */}
      {!image && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${theme.card} hover:border-emerald-500/50`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${theme.textMuted}`} />
          <p className={`text-sm ${theme.textMuted}`}>
            Click to upload or paste (Ctrl+V) a screenshot
          </p>
          <p className={`text-xs mt-1 ${theme.textMuted} opacity-60`}>
            Trading post / shop screen · Max 1MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Screenshot preview"
            className="w-full max-h-64 object-contain rounded-lg border border-gray-700/30"
          />
        </div>
      )}

      {/* Analyze Button */}
      {image && !result && (
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing with Gemini Flash...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Analyze Screenshot
            </>
          )}
        </Button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      {/* Results */}
      {result?.items && result.items.length > 0 && (
        <div className="space-y-3">
          <div className={`text-sm font-medium ${theme.text}`}>
            Found {result.items.length} items:
          </div>

          <div className="space-y-1">
            {result.items.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between text-sm px-3 py-2 rounded ${theme.tableRow}`}
              >
                <span className={theme.text}>{item.name}</span>
                <div className="flex items-center gap-4">
                  <span className={theme.textMuted}>
                    Buy: <span className="font-mono font-medium text-red-400">{item.buyPrice}</span>
                  </span>
                  {item.sellPrice != null && (
                    <span className={theme.textMuted}>
                      Sell: <span className="font-mono font-medium text-emerald-400">{item.sellPrice}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleImport}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Import {result.items.length} items to calculator
          </Button>
        </div>
      )}

      {/* Paste listener hint */}
      <div className={`flex items-center gap-1.5 text-[10px] ${theme.textMuted} opacity-50`}>
        <Clipboard className="w-3 h-3" />
        Tip: You can paste screenshots directly with Ctrl+V / Cmd+V
      </div>
    </Card>
  );
}
