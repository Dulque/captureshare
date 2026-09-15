'use client';

import { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

interface UploadModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onUploadSuccess?: () => void;
}

interface SelectedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export default function UploadModal({
  eventId,
  isOpen,
  onClose,
  onSuccess,
  onUploadSuccess,
}: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newSelected: SelectedFile[] = files.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      status: 'pending',
      progress: 0,
    }));
    setSelectedFiles((prev) => [...prev, ...newSelected]);
    setGlobalError(null);
  };

  const removeFile = (id: string) => {
    if (isUploading) return;
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setGlobalError(null);

    try {
      // 1. Request presigned upload targets for all files
      const presignPayload = {
        files: selectedFiles.map((sf) => ({
          filename: sf.file.name,
          sizeBytes: sf.file.size,
          mimeType: sf.file.type || 'image/jpeg',
        })),
      };

      const presignRes = await fetch(`/api/events/${eventId}/photos/presign-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presignPayload),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || 'Failed to initialize presigned upload URLs');
      }

      const uploadConfigs: Array<{
        filename: string;
        uploadUrl: string;
        storageKey: string;
        publicUrl: string;
        isDirectS3: boolean;
      }> = presignData.uploads;

      const confirmedUploads: Array<{
        filename: string;
        storageKey: string;
        storageUrl: string;
        fileSize: number;
        mimeType: string;
      }> = [];

      // 2. Perform direct binary upload for each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const item = selectedFiles[i];
        const config = uploadConfigs[i];

        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 20 } : f))
        );

        try {
          // Direct PUT to S3 or POST to local fallback endpoint
          const uploadHeaders: Record<string, string> = {};
          if (item.file.type) {
            uploadHeaders['Content-Type'] = item.file.type;
          }

          const uploadResponse = await fetch(config.uploadUrl, {
            method: config.isDirectS3 ? 'PUT' : 'POST',
            headers: uploadHeaders,
            body: item.file,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status: ${uploadResponse.status}`);
          }

          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: 'completed', progress: 100 } : f))
          );

          confirmedUploads.push({
            filename: item.file.name,
            storageKey: config.storageKey,
            storageUrl: config.publicUrl,
            fileSize: item.file.size,
            mimeType: item.file.type || 'image/jpeg',
          });
        } catch (uploadErr: any) {
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: 'error', error: uploadErr.message || 'Failed' }
                : f
            )
          );
        }
      }

      // 3. Confirm recorded metadata on server
      if (confirmedUploads.length > 0) {
        const confirmRes = await fetch(`/api/events/${eventId}/photos/confirm-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos: confirmedUploads }),
        });

        if (!confirmRes.ok) {
          const errData = await confirmRes.json();
          throw new Error(errData.error || 'Failed to record photo metadata in database');
        }

        if (onUploadSuccess) onUploadSuccess();
        if (onSuccess) onSuccess();

        setTimeout(() => {
          onClose();
          setSelectedFiles([]);
          setIsUploading(false);
        }, 1200);
      } else {
        throw new Error('No photos could be successfully uploaded');
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Error occurred during upload');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl max-w-xl w-full p-7 shadow-2xl relative border border-slate-800 text-white max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Upload Event Photos</h2>
            <p className="text-xs text-slate-400 mt-0.5">High-speed direct-to-cloud object storage uploads</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {globalError && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        <div className="mt-5 flex-1 overflow-y-auto pr-1">
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950/60 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-slate-950"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Click to select photos or drag & drop files
            </p>
            <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WEBP (Supports RAW / high-res batches)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {/* File list */}
          {selectedFiles.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Selected Queue ({selectedFiles.length})
              </p>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <ImageIcon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-200">{item.file.name}</span>
                      <span className="text-[11px] text-slate-400 flex-shrink-0 font-mono">
                        ({(item.file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {item.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                      )}
                      {item.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      {!isUploading && (
                        <button
                          onClick={() => removeFile(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={startUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading to Cloud...</span>
              </>
            ) : (
              <span>Start Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
