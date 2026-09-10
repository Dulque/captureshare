'use client';

import { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

interface UploadModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export default function UploadModal({ eventId, isOpen, onClose, onSuccess }: UploadModalProps) {
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
          fileSize: sf.file.size,
          mimeType: sf.file.type || 'image/jpeg',
        })),
      };

      const presignRes = await fetch(`/api/events/${eventId}/photos/presign-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presignPayload),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || 'Failed to initialize uploads');
      }

      const { uploads } = await presignRes.json();

      // 2. Perform parallel uploads
      const confirmedPhotos: Array<{
        filename: string;
        storageKey: string;
        storageUrl: string;
        fileSize: number;
        mimeType: string;
      }> = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const item = selectedFiles[i];
        const target = uploads[i];

        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 30 } : f))
        );

        try {
          if (target.isDirectS3) {
            // Direct S3 Presigned PUT
            await fetch(target.uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': item.file.type || 'image/jpeg',
              },
              body: item.file,
            });
          } else {
            // Local fallback upload
            await fetch(target.uploadUrl, {
              method: 'POST',
              body: item.file,
            });
          }

          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, status: 'completed', progress: 100 } : f))
          );

          confirmedPhotos.push({
            filename: item.file.name,
            storageKey: target.storageKey,
            storageUrl: target.publicUrl,
            fileSize: item.file.size,
            mimeType: item.file.type || 'image/jpeg',
          });
        } catch (err: any) {
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: 'error', error: err.message || 'Upload failed' } : f
            )
          );
        }
      }

      // 3. Confirm metadata in Database
      if (confirmedPhotos.length > 0) {
        const confirmRes = await fetch(`/api/events/${eventId}/photos/confirm-upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos: confirmedPhotos }),
        });

        if (!confirmRes.ok) {
          throw new Error('Failed to record photo metadata in database');
        }
      }

      setTimeout(() => {
        setIsUploading(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Upload process failed:', err);
      setGlobalError(err.message || 'Error occurred during upload');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload Event Photos</h2>
            <p className="text-sm text-gray-500">Add multiple high-resolution photos to this event</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {globalError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto">
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 rounded-xl p-8 text-center cursor-pointer transition-colors"
          >
            <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-800">
              Click to browse or drag and drop photos
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 50MB per file</p>
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
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Selected Photos ({selectedFiles.length})
              </p>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate font-medium text-gray-700">{item.file.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        ({(item.file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {item.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      )}
                      {item.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      {!isUploading && (
                        <button
                          onClick={() => removeFile(item.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5"
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

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={startUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading Photos...</span>
              </>
            ) : (
              <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} Photos</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
