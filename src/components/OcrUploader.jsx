import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Loader2, Check, AlertCircle, X, Clipboard } from 'lucide-react';

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
const MAX_BASE64_LENGTH = 2_000_000; // ~1.5MB decoded

/**
 * Resize image on client side using Canvas API.
 * Caps at 1920px max dimension, converts to JPEG.
 */
function processImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const base64 = dataUrl.split(',')[1];

      URL.revokeObjectURL(img.src);

      resolve({
        base64,
        dataUrl,
        originalSize: file.size,
        width,
        height,
        processedSize: Math.round(base64.length * 0.75), // approximate decoded size
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function OcrUploader({ lang, theme, onImport }) {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const testToken = new URLSearchParams(window.location.search).get('test');

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const data = await processImage(file);

      if (data.base64.length > MAX_BASE64_LENGTH) {
        setError(`Image still too large after resize (${(data.processedSize / 1024).toFixed(0)}KB). Try cropping the relevant area.`);
        return;
      }

      setImageData(data);
    } catch (err) {
      setError(`Failed to process image: ${err.message}`);
    }
  };

  const handleFileSelect = (e) => handleFile(e.target.files?.[0]);

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        handleFile(item.getAsFile());
        break;
      }
    }
  };

  const handleAnalyze = async () => {
    if (!imageData || !testToken) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Token': testToken,
        },
        body: JSON.stringify({
          image: imageData.base64,
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
      setImageData(null);
    }
  };

  const handleClear = () => {
    setImageData(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes) => bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(0)}KB`;

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
        {(imageData || result) && (
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
      {!imageData && (
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
            Trading post / market screen · Any resolution OK (auto-optimized)
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

      {/* Image Preview + Size Info */}
      {imageData && (
        <div className="space-y-2">
          <img
            src={imageData.dataUrl}
            alt="Screenshot preview"
            className="w-full max-h-64 object-contain rounded-lg border border-gray-700/30"
          />
          <div className={`flex items-center gap-2 text-[11px] ${theme.textMuted}`}>
            <span>{formatSize(imageData.originalSize)}</span>
            <span>→</span>
            <span>{formatSize(imageData.processedSize)} JPEG</span>
            <span className="opacity-50">({imageData.width}×{imageData.height})</span>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {imageData && !result && (
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

      {/* Paste hint */}
      <div className={`flex items-center gap-1.5 text-[10px] ${theme.textMuted} opacity-50`}>
        <Clipboard className="w-3 h-3" />
        Tip: You can paste screenshots directly with Ctrl+V / Cmd+V
      </div>
    </Card>
  );
}
