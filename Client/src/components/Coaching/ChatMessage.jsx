/**
 * ChatMessage Component
 * Renders a single chat message with support for text, images, and file attachments
 */

import { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, Download, File, Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getChatAttachmentUrl, formatFileSize } from '@/services/api/coach.service';

/**
 * Format time from ISO string
 */
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Get file extension from filename
 */
const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : '';
};

/**
 * Check if mime type is an image
 */
const isImageMime = (mimeType) => {
  return mimeType && mimeType.startsWith('image/');
};

/**
 * Image Attachment Component
 */
const ImageAttachment = memo(({ attachmentPath, attachmentName, attachmentSize }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!attachmentPath) return;
      setLoading(true);
      const { url, error } = await getChatAttachmentUrl(attachmentPath);
      if (error) {
        setError(true);
      } else {
        setImageUrl(url);
      }
      setLoading(false);
    };
    fetchUrl();
  }, [attachmentPath]);

  if (loading) {
    return (
      <div className="w-48 h-36 bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="w-48 h-36 bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground">
        <ImageIcon className="h-8 w-8 mb-2" />
        <span className="text-xs">Failed to load</span>
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative group cursor-pointer max-w-[280px]"
        onClick={() => setFullscreen(true)}
      >
        <img
          src={imageUrl}
          alt={attachmentName || 'Image attachment'}
          className="rounded-lg max-h-[300px] w-auto object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
          <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      
      {/* Fullscreen modal */}
      {fullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={imageUrl}
            alt={attachmentName || 'Image attachment'}
            className="max-w-full max-h-full object-contain"
          />
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setFullscreen(false)}
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
    </>
  );
});

ImageAttachment.displayName = 'ImageAttachment';

/**
 * File Attachment Component
 */
const FileAttachment = memo(({ attachmentPath, attachmentName, attachmentSize, attachmentMime, isOwn }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!attachmentPath) return;
    setDownloading(true);
    
    try {
      const { url, error } = await getChatAttachmentUrl(attachmentPath);
      if (error) throw error;
      
      // Open in new tab or trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = attachmentName || 'attachment';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const extension = getFileExtension(attachmentName);

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg min-w-[200px] max-w-[280px]",
        isOwn 
          ? "bg-primary-foreground/10" 
          : "bg-background/50"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
        isOwn ? "bg-primary-foreground/20" : "bg-primary/10"
      )}>
        <File className={cn(
          "h-5 w-5",
          isOwn ? "text-primary-foreground" : "text-primary"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isOwn ? "text-primary-foreground" : "text-foreground"
        )}>
          {attachmentName || 'Attachment'}
        </p>
        <p className={cn(
          "text-xs",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {extension && `${extension} • `}{formatFileSize(attachmentSize)}
        </p>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "flex-shrink-0 h-8 w-8",
          isOwn 
            ? "hover:bg-primary-foreground/20 text-primary-foreground" 
            : "hover:bg-muted"
        )}
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
});

FileAttachment.displayName = 'FileAttachment';

/**
 * Main ChatMessage Component
 */
const ChatMessage = memo(({ 
  message, 
  isOwn,
  showAvatar = false,
  avatarUrl = null,
  avatarFallback = 'U',
}) => {
  const {
    body,
    message_type = 'text',
    attachment_path,
    attachment_name,
    attachment_mime,
    attachment_size,
    created_at,
    read_at,
  } = message;

  const isImage = message_type === 'image' || isImageMime(attachment_mime);
  const isFile = message_type === 'file' || (attachment_path && !isImage);
  const hasText = body && body.trim().length > 0;
  const hasAttachment = attachment_path && attachment_name;

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Attachment */}
        {hasAttachment && (
          <div className={cn(
            'mb-1',
            isOwn ? 'ml-auto' : 'mr-auto',
            // If no text, apply message bubble styling to attachment
            !hasText && 'rounded-2xl overflow-hidden',
            !hasText && (isOwn 
              ? 'bg-primary rounded-br-sm' 
              : 'bg-muted rounded-bl-sm'),
            !hasText && 'p-1'
          )}>
            {isImage ? (
              <ImageAttachment
                attachmentPath={attachment_path}
                attachmentName={attachment_name}
                attachmentSize={attachment_size}
              />
            ) : (
              <FileAttachment
                attachmentPath={attachment_path}
                attachmentName={attachment_name}
                attachmentSize={attachment_size}
                attachmentMime={attachment_mime}
                isOwn={isOwn}
              />
            )}
          </div>
        )}

        {/* Text bubble */}
        {hasText && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2',
              isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{body}</p>
          </div>
        )}

        {/* Timestamp and read status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 px-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px] text-muted-foreground'
            )}
          >
            {formatTime(created_at)}
          </span>
          {isOwn && (
            read_at ? (
              <CheckCheck className="h-3 w-3 text-primary" />
            ) : (
              <Check className="h-3 w-3 text-muted-foreground" />
            )
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
