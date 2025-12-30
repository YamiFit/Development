/**
 * Coach Client Chat Page
 * Real-time messaging between coach and client
 * Supports text, images, and file attachments
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import {
  getCoachClients,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sendMessageWithAttachment,
  subscribeToMessages,
  markMessagesAsRead,
  uploadChatAttachment,
  deleteChatAttachment,
  generateMessageId,
  getChatStatus,
} from '@/services/api/coach.service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ChatMessage from '@/components/Coaching/ChatMessage';
import ChatInput from '@/components/Coaching/ChatInput';

const CoachClientChat = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Refs
  const messagesEndRef = useRef(null);

  // State
  const [client, setClient] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [chatStatus, setChatStatus] = useState({ can_send: true, status: 'active' });

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !clientId) return;

      setLoading(true);
      try {
        // Verify authorization
        const { data: clients, error: clientsError } = await getCoachClients();
        
        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
          toast({
            title: 'Error',
            description: 'Failed to verify client assignment.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        const assignment = clients.find(a => a.user_id === clientId);

        if (!assignment) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setClient(assignment.user);

        // Get or create conversation
        const { data: convResult, error: convError } = await getOrCreateConversation(clientId);

        if (convError) {
          console.error('Conversation error:', convError);
          toast({
            title: 'Error',
            description: 'Failed to load conversation.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        if (convResult?.success && convResult.conversation) {
          setConversation(convResult.conversation);

          // Get chat status
          const { data: status } = await getChatStatus(convResult.conversation.id);
          if (status?.success) {
            setChatStatus({
              can_send: status.can_send,
              status: status.status,
              has_active_assignment: status.has_active_assignment,
            });
          }

          // Fetch messages
          const { data: msgs } = await getMessages(convResult.conversation.id);
          setMessages(msgs || []);

          // Mark as read
          await markMessagesAsRead(convResult.conversation.id);
        } else if (convResult && !convResult.success) {
          console.error('Conversation creation failed:', convResult.error);
          toast({
            title: 'Error',
            description: convResult.error || 'Failed to access conversation.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, clientId, toast]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversation?.id) return;

    const subscription = subscribeToMessages(conversation.id, async (newMsg) => {
      // Fetch full message with sender info
      const { data: msgs } = await getMessages(conversation.id);
      setMessages(msgs || []);

      // Mark as read if from other user
      if (newMsg.sender_id !== user?.id) {
        await markMessagesAsRead(conversation.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversation?.id, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Handle sending a message (text and/or attachment)
   */
  const handleSend = async ({ body, attachment, messageType }) => {
    if (!conversation?.id) return;

    let uploadedPath = null;

    try {
      // If there's an attachment, upload it first
      if (attachment) {
        const messageId = generateMessageId();
        const uploadResult = await uploadChatAttachment(
          conversation.id,
          messageId,
          attachment
        );

        if (!uploadResult.success) {
          throw new Error('Failed to upload attachment');
        }

        uploadedPath = uploadResult.path;

        // Send message with attachment
        const { data: result, error } = await sendMessageWithAttachment(conversation.id, {
          body: body,
          messageType: messageType,
          attachmentPath: uploadResult.path,
          attachmentName: uploadResult.name,
          attachmentMime: uploadResult.mime,
          attachmentSize: uploadResult.size,
        });

        if (error || !result?.success) {
          // Try to clean up the uploaded file
          if (uploadedPath) {
            await deleteChatAttachment(uploadedPath);
          }
          throw new Error(result?.error || 'Failed to send message');
        }

        // Optimistically add message
        if (result.message) {
          setMessages(prev => [...prev, { ...result.message, sender: { id: user.id } }]);
        }
      } else {
        // Text-only message
        const { data: result, error } = await sendMessage(conversation.id, body);

        if (error || !result?.success) {
          throw new Error(result?.error || 'Failed to send message');
        }

        // Optimistically add message
        if (result.message) {
          setMessages(prev => [...prev, { ...result.message, sender: { id: user.id } }]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message.',
        variant: 'destructive',
      });
      throw error; // Re-throw so ChatInput knows it failed
    }
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date separator
  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let currentDate = null;

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msg.created_at });
      }
      groups.push({ type: 'message', ...msg });
    });

    return groups;
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="h-[calc(100vh-180px)] flex flex-col">
          <Skeleton className="h-16 w-full" />
          <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-12 w-48 ml-auto" />
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-12 w-56 ml-auto" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </Layout>
    );
  }

  // Unauthorized
  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">This client is not assigned to you.</p>
          <Button onClick={() => navigate('/coach/clients')}>
            Back to My Clients
          </Button>
        </div>
      </Layout>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Layout>
      <Card className="h-[calc(100vh-180px)] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b py-3 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/coach/clients')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              {client?.avatar_url ? (
                <AvatarImage src={client.avatar_url} alt={client.full_name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(client?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{client?.full_name || 'Client'}</p>
              <p className="text-xs text-muted-foreground">
                {chatStatus.status === 'read_only' ? 'Assignment ended' : client?.email}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/coach/clients/${clientId}`)}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </div>
        </CardHeader>

        {/* Read-only banner */}
        {chatStatus.status === 'read_only' && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <span className="text-sm text-yellow-700 dark:text-yellow-400">
              This client's assignment has ended. You can view message history but cannot send new messages.
            </span>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No messages yet.</p>
                <p className="text-sm text-muted-foreground">
                  Start the conversation with your client!
                </p>
              </div>
            )}

            {groupedMessages.map((item, index) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${index}`} className="flex justify-center my-4">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {formatDateSeparator(item.date)}
                    </span>
                  </div>
                );
              }

              return (
                <ChatMessage
                  key={item.id}
                  message={item}
                  isOwn={item.sender_id === user?.id}
                />
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          disabled={loading}
          canSend={chatStatus.can_send}
          readOnlyMessage="This client's assignment has ended. Messages are read-only."
          placeholder="Type a message..."
        />
      </Card>
    </Layout>
  );
};

export default CoachClientChat;
