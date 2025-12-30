/**
 * ChatInput Component
 * Text input with file attachment support for chat
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Paperclip, 
  X, 
  Image as ImageIcon, 
  File, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isAllowedAttachmentType,
  MAX_ATTACHMENT_SIZE,
  formatFileSize,
  getMessageTypeFromMime,
} from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';

/**
 * Attachment Preview Component
 */
const AttachmentPreview = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const [previewUrl, setPreviewUrl] = useState(null);

  // Create preview URL for images
  useState(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
      {isImage && previewUrl ? (
        <img 
          src={previewUrl} 
          alt="Preview" 
          className="h-10 w-10 object-cover rounded"
        />
      ) : (
        <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
          <File className="h-5 w-5 text-primary" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 flex-shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

/**
 * Main ChatInput Component
 */
const ChatInput = ({ 
  onSend, 
  disabled = false, 
  placeholder = "Type a message...",
  canSend = true,
  readOnlyMessage = "Chat is read-only",
}) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isAllowedAttachmentType(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image, PDF, document, or zip file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`,
        variant: 'destructive',
      });
      return;
    }

    setAttachment(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [toast]);

  /**
   * Remove selected attachment
   */
  const handleRemoveAttachment = useCallback(() => {
    setAttachment(null);
  }, []);

  /**
   * Handle send
   */
  const handleSend = useCallback(async () => {
    if (sending || disabled || !canSend) return;
    
    const hasMessage = message.trim().length > 0;
    const hasAttachment = attachment !== null;
    
    if (!hasMessage && !hasAttachment) return;

    setSending(true);

    try {
      await onSend({
        body: message.trim() || null,
        attachment: attachment,
        messageType: attachment ? getMessageTypeFromMime(attachment.type) : 'text',
      });
      
      // Clear inputs on success
      setMessage('');
      setAttachment(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error handling is done in parent component
    } finally {
      setSending(false);
      textInputRef.current?.focus();
    }
  }, [message, attachment, onSend, sending, disabled, canSend]);

  /**
   * Handle key press
   */
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  /**
   * Open file picker
   */
  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // If chat is read-only
  if (!canSend) {
    return (
      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{readOnlyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t p-4 space-y-2">
      {/* Attachment preview */}
      {attachment && (
        <AttachmentPreview 
          file={attachment} 
          onRemove={handleRemoveAttachment} 
        />
      )}
      
      {/* Input area */}
      <div className="flex gap-2 items-end">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv"
          className="hidden"
          onChange={handleFileSelect}
          disabled={sending || disabled}
        />
        
        {/* Attach button */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={handleAttachClick}
          disabled={sending || disabled}
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        {/* Text input */}
        <Input
          ref={textInputRef}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending || disabled}
          className="flex-1"
        />
        
        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !attachment) || sending || disabled}
          size="icon"
          className="flex-shrink-0"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
