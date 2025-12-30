/**
 * User Coaching Chat Page
 * Real-time messaging between user and their assigned coach
 * Supports text, images, and file attachments
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  User,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuthRedux';
import {
  getCurrentAssignment,
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

const UserCoachingChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Refs
  const messagesEndRef = useRef(null);

  // State
  const [coach, setCoach] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatStatus, setChatStatus] = useState({ can_send: true, status: 'active' });

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Get current assignment
        const { data: assignmentData, error: assignmentError } = await getCurrentAssignment();

        if (assignmentError) {
          console.error('Assignment error:', assignmentError);
          // Don't treat as "no coach" - might be a temporary error
          toast({
            title: 'Error',
            description: 'Failed to load assignment. Please try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        if (!assignmentData) {
          setAssignment(null);
          setLoading(false);
          return;
        }

        setAssignment(assignmentData);
        const coachData = assignmentData.coach_profile || assignmentData.coach;
        setCoach(coachData);

        // Get or create conversation
        const { data: convResult, error: convError } = await getOrCreateConversation(assignmentData.coach_id);

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
          description: 'Failed to load chat. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, toast]);

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
    if (!name) return 'C';
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

  // No coach assigned
  if (!assignment) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Coach Assigned</h2>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            You need to select a coach to start messaging.
          </p>
          <Button onClick={() => navigate('/tracker')}>
            Find a Coach
          </Button>
        </div>
      </Layout>
    );
  }

  const coachName = coach?.full_name || assignment.coach?.full_name || 'Your Coach';
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Layout>
      <Card className="h-[calc(100vh-180px)] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b py-3 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              {coach?.profile_image_url ? (
                <AvatarImage src={coach.profile_image_url} alt={coachName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(coachName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{coachName}</p>
              <p className="text-xs text-muted-foreground">
                {chatStatus.status === 'read_only' ? 'Assignment ended' : 'Your Coach'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/my-plan')}
              >
                <FileText className="h-4 w-4 mr-2" />
                My Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/appointments')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Read-only banner */}
        {chatStatus.status === 'read_only' && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <span className="text-sm text-yellow-700 dark:text-yellow-400">
              Your coaching assignment has ended. You can view message history but cannot send new messages.
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
                  Send a message to your coach to get started!
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
          readOnlyMessage="Your coaching assignment has ended. Messages are read-only."
          placeholder="Type a message..."
        />
      </Card>
    </Layout>
  );
};

export default UserCoachingChat;
