import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Loader2, Check, AlertCircle, X, Clipboard } from 'lucide-react';

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
const MAX_BASE64_LENGTH = 2_000_000;

function processImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
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
      resolve({ base64, dataUrl, originalSize: file.size, width, height, processedSize: Math.round(base64.length * 0.75) });
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Failed to load image')); };
    img.src = URL.createObjectURL(file);
  });
}

export default function OcrUploader({ lang, theme, onImport }) {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const testToken = new URLSearchParams(window.location.search).get('test');

  const analyzeAndImport = useCallback(async (data) => {
    if (!data || !testToken) return;

    setLoading(true);
    setError(null);
    setImportedCount(null);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Token': testToken,
        },
        body: JSON.stringify({ image: data.base64, lang }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || `Error: ${response.status}`);
        return;
      }

      if (result.items && result.items.length > 0) {
        // Auto-import immediately
        onImport?.(result.items);
        setImportedCount(result.items.length);
      } else {
        setError(result.error || 'No items found in the screenshot.');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [testToken, lang, onImport]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError(null);
    setImportedCount(null);

    try {
      const data = await processImage(file);
      if (data.base64.length > MAX_BASE64_LENGTH) {
        setError(`Image still too large after resize (${(data.processedSize / 1024).toFixed(0)}KB). Try cropping.`);
        return;
      }
      setImageData(data);
      // Auto-analyze immediately after processing
      analyzeAndImport(data);
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

  const handleClear = () => {
    setImageData(null);
    setImportedCount(null);
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
          <span className={`text-sm font-medium ${theme.text}`}>Screenshot OCR Import</span>
          <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">TEST</Badge>
        </div>
        {(imageData || importedCount) && (
          <Button variant="ghost" size="sm" onClick={handleClear}
            className={`h-7 px-2 ${theme.textMuted} hover:text-red-500`}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Upload Area */}
      {!imageData && !loading && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${theme.card} hover:border-emerald-500/50`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${theme.textMuted}`} />
          <p className={`text-sm ${theme.textMuted}`}>Click to upload or paste (Ctrl+V) a screenshot</p>
          <p className={`text-xs mt-1 ${theme.textMuted} opacity-60`}>
            Trading post / market screen · Any resolution OK
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>
      )}

      {/* Image Preview + Size Info */}
      {imageData && (
        <div className="space-y-2">
          <img src={imageData.dataUrl} alt="Screenshot preview"
            className="w-full max-h-48 object-contain rounded-lg border border-gray-700/30" />
          <div className={`flex items-center gap-2 text-[11px] ${theme.textMuted}`}>
            <span>{formatSize(imageData.originalSize)}</span>
            <span>→</span>
            <span>{formatSize(imageData.processedSize)} JPEG ({imageData.width}×{imageData.height})</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={`flex items-center justify-center gap-2 py-3 ${theme.textMuted}`}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Analyzing with Gemini Flash...</span>
        </div>
      )}

      {/* Success */}
      {importedCount && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="text-sm text-emerald-500">
            {importedCount} items imported to calculator
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      {/* Paste hint */}
      <div className={`flex items-center gap-1.5 text-[10px] ${theme.textMuted} opacity-50`}>
        <Clipboard className="w-3 h-3" />
        Tip: Paste screenshots with Ctrl+V / Cmd+V
      </div>
    </Card>
  );
}
