import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { ConversationProgress } from "~/components/conversation/ConversationProgress";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { MessageSquare, Send, CheckCircle2, Paperclip } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { formatDate } from "~/lib/utils";

export const Route = createFileRoute("/dashboard/cases/$caseId/conversation/")({
  component: ConversationScreen,
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const USER_INTENT_OPTIONS = [
  {
    value: "understand_if_case",
    label: "I want to understand if I have a case",
    description: "Help me figure out if what happened to me is worth pursuing legally",
  },
  {
    value: "rejected_by_attorneys",
    label: "I've been rejected by attorneys and need help",
    description: "Other lawyers said no, but I still think I have a valid case",
  },
  {
    value: "organize_situation",
    label: "I need help organizing my situation",
    description: "I have a lot of information and need help making sense of it all",
  },
  {
    value: "find_attorney",
    label: "I'm ready to find an attorney",
    description: "I know I have a case and want to connect with the right lawyer",
  },
  {
    value: "just_exploring",
    label: "Just exploring",
    description: "I'm not sure yet, just looking at my options",
  },
] as const;

function getCurrentStepRoute(stage: string, caseId: string): string {
  switch (stage) {
    case "CONVERSATION":
      return `/dashboard/cases/${caseId}/conversation`;
    case "INTAKE":
      return `/dashboard/cases/${caseId}/intake`;
    case "EVIDENCE":
      return `/dashboard/cases/${caseId}/evidence`;
    case "ANALYSIS":
      return `/dashboard/cases/${caseId}/analysis`;
    case "COMPLETE":
      return `/dashboard/cases/${caseId}`;
    default:
      return `/dashboard/cases/${caseId}`;
  }
}

/**
 * Extracts the narrative content from between <narrative> tags in the AI response.
 * Falls back to the full content if tags are not found (for backwards compatibility).
 */
function extractNarrative(content: string): string {
  const narrativeMatch = content.match(/<narrative>([\s\S]*?)<\/narrative>/);
  if (narrativeMatch && narrativeMatch[1]) {
    return narrativeMatch[1].trim();
  }
  // Fallback: if no tags found, return the full content
  // This maintains backwards compatibility with older responses
  return content;
}

function ConversationScreen() {
  const { caseId } = Route.useParams();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [message, setMessage] = useState("");
  const [showNarrativeConfirmation, setShowNarrativeConfirmation] = useState(false);
  const [generatedNarrative, setGeneratedNarrative] = useState("");
  const [showPreliminaryAssessment, setShowPreliminaryAssessment] = useState(false);
  const [preliminaryAssessment, setPreliminaryAssessment] = useState("");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const caseQuery = useQuery(
    trpc.getCaseDetails.queryOptions({
      token: token!,
      caseId,
    })
  );

  const sendInitialGreetingMutation = useMutation(
    trpc.sendInitialGreeting.mutationOptions({
      onSuccess: () => {
        caseQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to start conversation");
      },
    })
  );

  const saveUserIntentMutation = useMutation(
    trpc.saveUserIntent.mutationOptions({
      onSuccess: async () => {
        await caseQuery.refetch();
        // Fallback: if there are still no messages after refetch, send initial greeting
        if (caseQuery.data?.messages.length === 0) {
          sendInitialGreetingMutation.mutate({
            token: token!,
            caseId,
          });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to save your selection");
      },
    })
  );

  const getPresignedUrlMutation = useMutation(
    trpc.getPresignedUploadUrl.mutationOptions()
  );

  const analyzeDocumentMutation = useMutation(
    trpc.analyzeDocument.mutationOptions()
  );

  const acknowledgeDocumentMutation = useMutation(
    trpc.acknowledgeDocument.mutationOptions()
  );

  const sendMessageMutation = useMutation(
    trpc.sendMessage.mutationOptions({
      onSuccess: (data) => {
        setMessage("");
        caseQuery.refetch();
        
        // Check if AI generated a narrative summary using intakeStep
        if (data.intakeStep === "conversation_summary" || 
            data.intakeStep === "clarification_summary") {
          // Extract only the narrative portion from the AI's response
          const cleanNarrative = extractNarrative(data.assistantMessage.content);
          setGeneratedNarrative(cleanNarrative);
          setShowNarrativeConfirmation(true);
        }
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send message");
      },
    })
  );

  const confirmNarrativeMutation = useMutation(
    trpc.confirmNarrative.mutationOptions({
      onSuccess: (data) => {
        setShowNarrativeConfirmation(false);
        setPreliminaryAssessment(data.preliminaryAssessment);
        setShowPreliminaryAssessment(true);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to confirm narrative");
      },
    })
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [caseQuery.data?.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSelectIntent = (intent: string) => {
    const selectedOption = USER_INTENT_OPTIONS.find((opt) => opt.value === intent);
    saveUserIntentMutation.mutate({
      token: token!,
      caseId,
      userIntent: selectedOption?.label || intent,
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      token: token!,
      caseId,
      content: message.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleConfirmNarrative = () => {
    confirmNarrativeMutation.mutate({
      token: token!,
      caseId,
      narrativeSummary: generatedNarrative,
    });
  };

  const handleClarifyNarrative = async () => {
    setShowNarrativeConfirmation(false);
    
    // Set the case to clarification mode
    try {
      await trpc.updateCaseField.mutate({
        token: token!,
        caseId,
        field: "needsNewSummary",
        value: true,
      });
      toast.success("No problem! Please tell me what needs clarification.");
    } catch (error) {
      console.error("Failed to set clarification mode:", error);
      toast.success("No problem! Please tell me what needs clarification.");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      toast.error("File exceeds 50MB limit");
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);

    try {
      // Get presigned URL
      const result = await getPresignedUrlMutation.mutateAsync({
        token: token!,
        caseId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        category: "OTHER", // Default category for conversation uploads
      });

      // Upload to Minio
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"));
        });

        xhr.open("PUT", result.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Analyze document
      await analyzeDocumentMutation.mutateAsync({
        token: token!,
        documentId: result.documentId,
      });

      // Get AI acknowledgment
      await acknowledgeDocumentMutation.mutateAsync({
        token: token!,
        caseId,
        documentId: result.documentId,
      });

      // Refresh case data to show new message
      caseQuery.refetch();
      
      toast.success(`${file.name} uploaded successfully`);
      setUploadingFile(null);
      setUploadProgress(0);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  if (caseQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!caseQuery.data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-red-600">Case not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const caseData = caseQuery.data;
  const messages = caseData.messages || [];

  // Show read-only view if user has moved past the conversation stage
  if (caseData.stage !== "CONVERSATION") {
    return (
      <DashboardLayout>
        <ConversationProgress currentStage="CONVERSATION" caseId={caseId} />
        
        <div className="mx-auto max-w-3xl py-6">
          <Card>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Story Confirmed
                  </h2>
                  <p className="text-sm text-gray-600">
                    Confirmed on {caseData.narrativeConfirmedAt ? formatDate(caseData.narrativeConfirmedAt) : "Unknown date"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Your Story Summary
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {caseData.narrativeSummary || "No narrative summary available."}
                  </p>
                </div>
              </div>

              {caseData.preliminaryAssessment && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Initial Impressions
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-blue-800">
                      {caseData.preliminaryAssessment}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    const currentRoute = getCurrentStepRoute(caseData.stage, caseId);
                    navigate({ to: currentRoute as any });
                  }}
                >
                  Return to Current Step
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Show user intent selection if not yet set
  if (!caseData.userIntent) {
    return (
      <DashboardLayout>
        <ConversationProgress currentStage="CONVERSATION" caseId={caseId} />
        
        <div className="mx-auto max-w-3xl py-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to Kairav
            </h1>
            <p className="text-lg text-gray-600">
              Before we begin, help us understand what brings you here today
            </p>
          </div>

          <div className="space-y-3">
            {USER_INTENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelectIntent(option.value)}
                disabled={saveUserIntentMutation.isPending}
                className="w-full text-left transition-all duration-200 hover:shadow-card-hover disabled:opacity-50"
              >
                <Card className="hover:border-primary-300 hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-subtle">
                      <MessageSquare className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-serif font-semibold text-secondary-900 mb-1">
                        {option.label}
                      </h3>
                      <p className="text-sm text-secondary-600 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Your selection helps us tailor the conversation to your needs
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show chat interface
  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <ConversationProgress currentStage="CONVERSATION" caseId={caseId} />
        
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-4xl space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center py-12">
                <div>
                  <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
                  <p className="text-gray-600">
                    Starting your conversation...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.createdAt}
                  />
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-50 to-primary-100/50 shadow-sm">
                      <MessageSquare className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 rounded-2xl bg-white border border-secondary-100 px-5 py-3 shadow-card">
                      <div className="flex items-center gap-2 text-sm text-secondary-500">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-400"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: "0.15s" }}></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: "0.3s" }}></div>
                        <span className="ml-2 font-medium">Kairav is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Narrative confirmation modal */}
        {showNarrativeConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-elevated max-h-[85vh] overflow-y-auto">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 p-3 shadow-subtle">
                  <CheckCircle2 className="h-7 w-7 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-serif font-semibold text-secondary-900 mb-2">
                    Does this capture your story?
                  </h3>
                  <p className="text-sm text-secondary-600 leading-relaxed">
                    I've put together a summary based on what you've shared. Please review it and let me know if it's accurate.
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-secondary-50 to-secondary-50/50 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto border border-secondary-200/60">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-secondary-700 leading-relaxed">{generatedNarrative}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmNarrative}
                  isLoading={confirmNarrativeMutation.isPending}
                  className="flex-1"
                  size="lg"
                >
                  Yes, Continue
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleClarifyNarrative}
                  className="flex-1"
                  size="lg"
                  disabled={confirmNarrativeMutation.isPending}
                >
                  Let Me Clarify
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preliminary assessment modal */}
        {showPreliminaryAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-elevated max-h-[85vh] overflow-y-auto">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 p-3 shadow-subtle">
                  <CheckCircle2 className="h-7 w-7 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-serif font-semibold text-secondary-900 mb-2">
                    Initial Impressions
                  </h3>
                  <p className="text-sm text-secondary-600 leading-relaxed">
                    Based on your story, here are my preliminary thoughts:
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary-50/30 to-transparent rounded-xl p-6 mb-6 border border-primary-200/60">
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-secondary-700 leading-relaxed">{preliminaryAssessment}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setShowPreliminaryAssessment(false);
                    navigate({
                      to: "/dashboard/cases/$caseId/intake",
                      params: { caseId },
                    });
                  }}
                  size="lg"
                >
                  Continue to Intake
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="border-t border-secondary-200/60 bg-white/80 backdrop-blur-sm px-4 py-4">
          <div className="mx-auto max-w-4xl">
            {/* File upload progress */}
            {uploadingFile && (
              <div className="mb-3 rounded-xl border border-secondary-200 bg-secondary-50 p-4 shadow-subtle">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-secondary-700 font-medium">Uploading {uploadingFile.name}...</span>
                  <span className="text-secondary-600 font-semibold">{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary-200">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendMessageMutation.isPending || showNarrativeConfirmation || uploadingFile !== null}
                className="flex-shrink-0 rounded-xl border border-secondary-300 p-3 text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 hover:border-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-card"
                title="Upload document"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 rounded-xl border border-secondary-300 px-4 py-3 text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none overflow-hidden transition-all duration-200 shadow-sm"
                disabled={sendMessageMutation.isPending || showNarrativeConfirmation || uploadingFile !== null}
                rows={1}
                style={{ minHeight: "48px", maxHeight: "200px" }}
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending || showNarrativeConfirmation || uploadingFile !== null}
                isLoading={sendMessageMutation.isPending}
                className="px-6 flex-shrink-0 shadow-sm hover:shadow-md"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MessageBubble({
  role,
  content,
  timestamp,
}: {
  role: string;
  content: string;
  timestamp: Date | string;
}) {
  const isUser = role === "USER";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
          isUser ? "bg-gradient-to-br from-primary-600 to-primary-700" : "bg-gradient-to-br from-primary-50 to-primary-100/50"
        }`}
      >
        {isUser ? (
          <span className="text-sm font-semibold text-white">You</span>
        ) : (
          <MessageSquare className="h-5 w-5 text-primary-600" />
        )}
      </div>
      <div className={`flex-1 ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-5 py-3 shadow-card max-w-[85%] ${
            isUser ? "bg-gradient-to-br from-primary-600 to-primary-700 text-white" : "bg-white text-secondary-900 border border-secondary-100"
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
        <p className="mt-1.5 text-xs text-secondary-500">
          {formatDate(timestamp)}
        </p>
      </div>
    </div>
  );
}
