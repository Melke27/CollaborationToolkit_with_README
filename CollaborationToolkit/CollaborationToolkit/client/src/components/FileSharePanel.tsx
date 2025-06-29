import { useRef, useState } from "react";
import { Upload, Download, Share, FileText, File, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SharedFile } from "@/types";

interface FileSharePanelProps {
  files: SharedFile[];
  onFileUpload: (file: File) => void;
}

export default function FileSharePanel({ files, onFileUpload }: FileSharePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles && selectedFiles.length > 0) {
      Array.from(selectedFiles).forEach(file => {
        onFileUpload(file);
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-purple-600" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-600" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileText className="h-4 w-4 text-green-600" />;
    }
    return <File className="h-4 w-4 text-gray-600" />;
  };

  const getFileIconBg = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return 'bg-purple-100';
    } else if (mimeType.includes('pdf')) {
      return 'bg-red-100';
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return 'bg-green-100';
    }
    return 'bg-gray-100';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (file: SharedFile) => {
    window.open(`/api/files/${file.id}/download`, '_blank');
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-200 h-1/2">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Files</h3>
          <Button
            size="sm"
            onClick={handleUploadClick}
            className="px-3 py-1"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </div>
      
      {/* File List */}
      <div className="p-4 space-y-3 overflow-y-auto max-h-48 scrollbar-thin">
        {files.map((file) => (
          <div 
            key={file.id}
            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
          >
            <div className={`w-8 h-8 ${getFileIconBg(file.mimeType)} rounded-lg flex items-center justify-center`}>
              {getFileIcon(file.mimeType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.originalName}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)} • Shared by {file.user.displayName}
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(file)}
                className="p-1 h-6 w-6"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-6 w-6"
              >
                <Share className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        
        {files.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No files shared yet</p>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div className="p-4 border-t border-gray-200">
        <div 
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragOver 
              ? 'border-primary bg-blue-50' 
              : 'border-gray-300 hover:border-primary'
          }`}
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-5 w-5 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Drop files here or click to upload
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>
    </div>
  );
}
