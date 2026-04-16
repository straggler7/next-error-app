"use client";

import { useState, useRef, useEffect } from "react";
import { aiAgentService } from '../services/aiAgentService';
import { X, MessageSquare, Send, Sparkles, Loader2, CheckCircle2, AlertCircle, Info, Zap, ThumbsUp, ThumbsDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "positive" | "negative" | null;
  feedbackComment?: string;
}

interface FieldChange {
  field: string;
  currentValue: string;
  proposedValue: string;
  confidenceScore: number;
  selected?: boolean;
}

interface ErrorFix {
  errorCode: string;
  errorDescription: string;
  proposedFix: Array<{
    field: string;
    currentValue: string;
    suggestedValue: string;
    reason: string;
  }>;
  confidenceScore: number;
  requiresManualReview: boolean;
  selected?: boolean;
  rejected?: boolean;
}

interface AIAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: Record<string, any>;
  currentError?: {
    code: string;
    description: string;
    fieldMappings?: string[];
  };
  allErrors?: Array<{
    code: string;
    description: string;
    fieldMappings?: string[];
  }>;
  onApplyFixes?: (fixes: ErrorFix[]) => void;
  dln?: string;
}

export default function AIAssistantDialog({
  isOpen,
  onClose,
  formData,
  currentError,
  allErrors = [],
  onApplyFixes,
  dln,
}: AIAssistantDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [proposedFixes, setProposedFixes] = useState<ErrorFix[] | null>(null);
  const [feedbackMessageIndex, setFeedbackMessageIndex] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [fieldChanges, setFieldChanges] = useState<FieldChange[]>([]);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyFeedback, setDenyFeedback] = useState("");
  const [isReworking, setIsReworking] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'submitting' | 'waiting' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const analysisAbortedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      analysisAbortedRef.current = true;
      setAgentStatus('idle');
    } else {
      analysisAbortedRef.current = false;
    }
  }, [isOpen]);

  // Auto-show welcome message and analyze errors when opening
  useEffect(() => {
    if (isOpen && messages.length === 0 && fieldChanges.length === 0) {
      // Show welcome message
      const welcomeMessage: Message = {
        role: "assistant",
        content: `Hello! I'm your AI assistant. I can help you understand and resolve errors.\n\n**I can help with:**\n- Explain current error: "${currentError?.code || 'error code'}"\n- Show IRM guidance\n- Provide step-by-step resolution instructions\n- List all errors on the form\n\nLet me analyze the form for you...`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
      // Automatically analyze errors
      setIsLoading(true);
      
      const analysisMessage: Message = {
        role: "assistant",
        content: "🔍 **Analyzing Form Errors**\n\nI'm examining the form data and errors to identify fields that need correction. This will take just a moment...",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, analysisMessage]);
      
      const dlnValue = dln || (formData as Record<string, any>)?.workRecord?.dln || (formData as Record<string, any>)?.dln;
      const taxPrdValue = (formData as Record<string, any>)?.workRecord?.taxPrd || (formData as Record<string, any>)?.taxPrd || '';

      const runAnalysis = async () => {
        try {
          if (!dlnValue || !formData) {
            const noDataMessage: Message = {
              role: 'assistant',
              content: '⚠️ **Cannot Start Analysis**\n\nNo DLN found for this work record. Please ensure a work record is loaded.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, noDataMessage]);
            setIsLoading(false);
            return;
          }

          setAgentStatus('submitting');
          await aiAgentService.submitWorkRecord(formData as Record<string, unknown>, dlnValue);
          if (analysisAbortedRef.current) return;

          setAgentStatus('waiting');
          const recommendations = await aiAgentService.pollForRecommendations(dlnValue, taxPrdValue);
          if (analysisAbortedRef.current) return;

          setAgentStatus('idle');
          const changes: FieldChange[] = recommendations.map(rec => ({
            field: rec.field,
            currentValue: rec.currentValue,
            proposedValue: rec.proposedValue,
            confidenceScore: rec.confidenceScore,
            selected: true,
          }));

          if (changes.length > 0) {
            setFieldChanges(changes);
            const avgConfidence = (changes.reduce((sum, c) => sum + c.confidenceScore, 0) / changes.length * 100).toFixed(0);
            const highConfidence = changes.filter(c => c.confidenceScore >= 0.9).length;
            const summaryMessage: Message = {
              role: 'assistant',
              content: `✅ **Analysis Complete**\n\nI've identified ${changes.length} field${changes.length > 1 ? 's' : ''} that require correction:\n\n**Summary:**\n- Average confidence: ${avgConfidence}%\n- High confidence fields (≥90%): ${highConfidence}\n- Fields requiring review: ${changes.length - highConfidence}\n\n**Proposed Changes:**\nPlease review the table below and select which changes to apply. You can:\n- **Apply**: Apply selected changes to the form\n- **Deny**: Reject changes and provide feedback\n- **Rework**: Re-submit for fresh analysis\n\nFeel free to ask me questions about any of the proposed changes!`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, summaryMessage]);
          } else {
            const noErrorsMessage: Message = {
              role: 'assistant',
              content: '✅ **Analysis Complete**\n\nNo field-level corrections were identified. If you have specific questions or need guidance on particular errors, feel free to ask.',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, noErrorsMessage]);
          }
          setIsLoading(false);
        } catch (error) {
          if (analysisAbortedRef.current) return;
          setAgentStatus('error');
          setIsLoading(false);
          const errorMessage: Message = {
            role: 'assistant',
            content: `❌ **Analysis Failed**\n\n${error instanceof Error ? error.message : 'An unexpected error occurred.'}\n\nYou can try again using the Rework button, or proceed with manual review.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      };

      runAnalysis();
    }
  }, [isOpen, currentError, messages.length, fieldChanges.length]);


  // Simulate Plan Mode response
  const simulatePlanResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("current error") || lowerMessage.includes("resolve")) {
      return `**Current Error: ${currentError?.code || "N/A"}**\n\n${currentError?.description || "No error description available"}\n\n**IRM Guidance:**\nThis error indicates a mismatch that needs to be corrected. Follow these steps:\n\n1. Review the field values\n2. Compare with source documents\n3. Make necessary corrections\n4. Verify all related fields\n\nWould you like me to switch to Agent Mode to automatically suggest fixes?`;
    }
    
    if (lowerMessage.includes("all errors") || lowerMessage.includes("list errors")) {
      const errorList = allErrors.length > 0
        ? allErrors.map(e => `- **${e.code}**: ${e.description}`).join("\n")
        : "No errors found on this form.";
      return `**All Errors on Form:**\n\n${errorList}\n\nI can provide detailed guidance for any of these errors. Just ask!`;
    }
    
    return `I understand you're asking about: "${userMessage}"\n\nIn Plan Mode, I provide guidance and instructions. For automatic fixes, switch to Agent Mode.\n\n**Need help with:**\n- Understanding specific errors\n- IRM documentation\n- Resolution procedures`;
  };

  // Simulate Agent Mode response with field changes
  const simulateAgentResponse = (userMessage: string): FieldChange[] => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("fix all") || lowerMessage.includes("analyze all")) {
      // Simulate resolution for error 111 (Tax Period/Transaction Date) on form 4868
      const changes: FieldChange[] = [];
      
      // Check if error 111 exists in allErrors
      const error111 = allErrors.find(e => e.code === "111");
      
      if (error111 || currentError?.code === "111") {
        // Read actual current values from form data
        const currentTaxPrd = formData?.taxPrd || formData?.workRecord?.taxPrd || "";
        const currentMeFDate = formData?.meFReceiptDate || formData?.workRecord?.meFReceiptDate || "";
        
        // Tax Period field correction
        changes.push({
          field: "Tax Period (01TXP)",
          currentValue: currentTaxPrd,
          proposedValue: "202412",
          confidenceScore: 0.95,
          selected: true
        });
        
        // Transaction Date field correction
        changes.push({
          field: "Transaction Date (01TDT)",
          currentValue: currentMeFDate,
          proposedValue: "2024-12-15",
          confidenceScore: 0.93,
          selected: true
        });
      }
      
      return changes;
    }
    
    if (lowerMessage.includes("fix current") || lowerMessage.includes("fix the error")) {
      if (!currentError) return [];
      
      // Handle error 111 specifically
      if (currentError.code === "111") {
        // Read actual current values from form data
        const currentTaxPrd = formData?.taxPrd || formData?.workRecord?.taxPrd || "";
        const currentMeFDate = formData?.meFReceiptDate || formData?.workRecord?.meFReceiptDate || "";
        
        return [
          {
            field: "Tax Period (01TXP)",
            currentValue: currentTaxPrd,
            proposedValue: "202412",
            confidenceScore: 0.95,
            selected: true
          },
          {
            field: "Transaction Date (01TDT)",
            currentValue: currentMeFDate,
            proposedValue: "2024-12-15",
            confidenceScore: 0.93,
            selected: true
          }
        ];
      }
      
      // Fallback for other errors
      const fields = currentError.fieldMappings || ["primarySSN"];
      return fields.map(field => ({
        field: field,
        currentValue: formData?.[field] || "123456789",
        proposedValue: "987654321",
        confidenceScore: 0.92,
        selected: true
      }));
    }
    
    return [];
  };

  // Simulate rework with improved confidence scores
  const simulateRework = (changes: FieldChange[]): FieldChange[] => {
    return changes.map(change => ({
      ...change,
      confidenceScore: Math.min(0.99, change.confidenceScore + 0.1 + Math.random() * 0.05),
      proposedValue: change.proposedValue // Could be updated with better analysis
    }));
  };

  // Generate combined responses for all types of questions
  const generateCombinedResponse = (userMessage: string, changes: FieldChange[], error?: { code: string; description: string }, errors?: Array<{ code: string; description: string }>): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("why") || lowerMessage.includes("explain")) {
      if (changes.length > 0) {
        return `**Explanation of Proposed Changes**\n\nThe changes I've identified are based on:\n- Cross-referencing form data with source documents\n- Validation against IRS business rules\n- Pattern analysis from similar cases\n\nEach field has a confidence score indicating how certain I am about the correction. Higher scores (≥90%) indicate strong confidence based on clear validation rules.\n\nWould you like me to explain a specific field change?`;
      }
      return `I analyze errors by examining the form data, comparing it with expected values, and applying IRS validation rules. Currently, there are no proposed changes in the table.`;
    }
    
    if (lowerMessage.includes("confidence") || lowerMessage.includes("sure")) {
      return `**About Confidence Scores**\n\nConfidence scores reflect:\n- **90-100%**: High confidence - validated against multiple sources\n- **75-89%**: Medium confidence - likely correct but review recommended\n- **Below 75%**: Lower confidence - manual review required\n\nThe scores help you prioritize which changes to apply first. You can always select only high-confidence changes and review others manually.`;
    }
    
    if (lowerMessage.includes("help") || lowerMessage.includes("what can")) {
      return `**I can help you with:**\n\n- Explain why specific changes are proposed\n- Provide details about confidence scores\n- Re-analyze with different approaches (Rework button)\n- Answer questions about the current error\n- Show IRM guidance and documentation\n- Provide step-by-step resolution instructions\n- Guide you through the correction process\n\nJust ask me anything about the proposed changes or the errors!`;
    }
    
    if (lowerMessage.includes("current error") || lowerMessage.includes("resolve")) {
      return `**Current Error: ${error?.code || "N/A"}**\n\n${error?.description || "No error description available"}\n\n**IRM Guidance:**\nThis error indicates a mismatch that needs to be corrected. Follow these steps:\n\n1. Review the field values\n2. Compare with source documents\n3. Make necessary corrections\n4. Verify all related fields\n\nI've already analyzed the form and proposed corrections in the table above. Would you like me to explain any specific change?`;
    }
    
    if (lowerMessage.includes("all errors") || lowerMessage.includes("list errors")) {
      const errorList = errors && errors.length > 0
        ? errors.map(e => `- **${e.code}**: ${e.description}`).join("\n")
        : "No errors found on this form.";
      return `**All Errors on Form:**\n\n${errorList}\n\nI can provide detailed guidance for any of these errors. Just ask!`;
    }
    
    return `I understand you're asking about: "${userMessage}"\n\nI'm here to help with:\n- The proposed changes shown in the table\n- IRM guidance and documentation\n- Step-by-step resolution instructions\n- Specific error explanations\n\nWhat would you like to know?`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setProposedFixes(null);

    const lowerContent = userMessage.content.toLowerCase();

    if (lowerContent.includes('analyze') || lowerContent.includes('fix') || lowerContent.includes('check')) {
      const dlnValue = dln || (formData as Record<string, any>)?.workRecord?.dln || (formData as Record<string, any>)?.dln;
      if (!dlnValue || !formData) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ No DLN found for this work record. Cannot submit for agent analysis.',
          timestamp: new Date(),
        }]);
        setIsLoading(false);
        return;
      }

      const taxPrdValue = (formData as Record<string, any>)?.workRecord?.taxPrd || (formData as Record<string, any>)?.taxPrd || '';

      try {
        setAgentStatus('submitting');
        await aiAgentService.submitWorkRecord(formData as Record<string, unknown>, dlnValue);
        setAgentStatus('waiting');
        const recommendations = await aiAgentService.pollForRecommendations(dlnValue, taxPrdValue);
        setAgentStatus('idle');

        const changes: FieldChange[] = recommendations.map(rec => ({
          field: rec.field,
          currentValue: rec.currentValue,
          proposedValue: rec.proposedValue,
          confidenceScore: rec.confidenceScore,
          selected: true,
        }));

        if (changes.length > 0) {
          setFieldChanges(changes);
          const avgConfidence = (changes.reduce((sum, c) => sum + c.confidenceScore, 0) / changes.length * 100).toFixed(0);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `I've analyzed the form and identified ${changes.length} field${changes.length > 1 ? 's' : ''} that require correction with an average confidence of ${avgConfidence}%. Please review the proposed changes in the table below.`,
            timestamp: new Date(),
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'No field-level corrections were identified for that request.',
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        setAgentStatus('error');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ **Analysis Failed**\n\n${error instanceof Error ? error.message : 'An unexpected error occurred.'}`,
          timestamp: new Date(),
        }]);
      }
      setIsLoading(false);
    } else {
      setTimeout(() => {
        const responseContent = generateCombinedResponse(userMessage.content, fieldChanges, currentError, allErrors);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
        }]);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleToggleFieldSelection = (fieldIndex: number) => {
    setFieldChanges(prev => 
      prev.map((change, idx) => 
        idx === fieldIndex ? { ...change, selected: !change.selected } : change
      )
    );
  };

  const handleApplyChanges = () => {
    const selectedChanges = fieldChanges.filter(change => change.selected);
    
    if (selectedChanges.length === 0) {
      const warningMessage: Message = {
        role: "assistant",
        content: "⚠️ **No changes selected**\n\nPlease select at least one field change using the checkboxes before applying. If you'd like me to re-analyze, click the Rework button.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, warningMessage]);
      return;
    }
    
    // Map user-friendly field labels back to technical field names
    const fieldLabelToKey: Record<string, string> = {
      "Tax Period (01TXP)": "taxPrd",
      "Transaction Date (01TDT)": "meFReceiptDate",
      "Taxpayer Identification Number (01TIN)": "primarySSN",
      "Taxpayer Name Control (01NC)": "primaryNameCtrl"
    };
    
    // Apply changes to form via callback
    if (onApplyFixes) {
      // Convert field changes to ErrorFix format for compatibility
      const fixesToApply: ErrorFix[] = selectedChanges.map(change => {
        // Map the display label back to the actual field key
        const actualFieldKey = fieldLabelToKey[change.field] || change.field;
        
        return {
          errorCode: currentError?.code || "MULTI",
          errorDescription: currentError?.description || "Multiple field corrections",
          proposedFix: [{
            field: actualFieldKey,
            currentValue: change.currentValue,
            suggestedValue: change.proposedValue,
            reason: "AI-suggested correction based on IRM guidance"
          }],
          confidenceScore: change.confidenceScore,
          requiresManualReview: change.confidenceScore < 0.9,
          selected: true
        };
      });
      onApplyFixes(fixesToApply);
    }
    
    const avgConfidence = (selectedChanges.reduce((sum, c) => sum + c.confidenceScore, 0) / selectedChanges.length * 100).toFixed(0);
    const successMessage: Message = {
      role: "assistant",
      content: `✅ **Changes Applied Successfully**\n\nI've updated ${selectedChanges.length} field${selectedChanges.length > 1 ? 's' : ''} on the form with an average confidence of ${avgConfidence}%.\n\n**Next Steps:**\n- Review the updated fields to ensure accuracy\n- Verify the changes resolve the associated errors\n- Submit the form when ready\n\nIf you need further assistance, feel free to ask!`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, successMessage]);
    setFieldChanges([]);
  };

  const handleDenyChanges = () => {
    setShowDenyModal(true);
  };

  const handleSubmitDeny = () => {
    const deniedCount = fieldChanges.length;
    
    // Log feedback for AI improvement (replace with API call)
    console.log("User denied changes:", {
      changes: fieldChanges,
      feedback: denyFeedback,
      timestamp: new Date()
    });
    
    const feedbackMessage: Message = {
      role: "assistant",
      content: `📝 **Feedback Received**\n\nThank you for providing feedback on the ${deniedCount} proposed change${deniedCount > 1 ? 's' : ''}. Your input helps me improve my analysis and recommendations.\n\n**What I'll do:**\n- Review your feedback to understand the concerns\n- Refine my analysis approach for similar cases\n- Learn from this interaction to provide better suggestions\n\nNo changes have been applied to the form. Would you like me to:\n- Rework the analysis with a different approach?\n- Focus on specific fields?\n- Provide guidance instead of automatic fixes?`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, feedbackMessage]);
    setFieldChanges([]);
    setShowDenyModal(false);
    setDenyFeedback("");
  };

  const handleCancelDeny = () => {
    setShowDenyModal(false);
    setDenyFeedback("");
  };

  const handleRework = async () => {
    setIsReworking(true);
    analysisAbortedRef.current = false;

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '🔄 **Re-submitting for Analysis**\n\nI\'m re-submitting the work record to the AI agent for a fresh analysis. This may take a moment...',
      timestamp: new Date(),
    }]);

    const dlnValue = dln || (formData as Record<string, any>)?.workRecord?.dln || (formData as Record<string, any>)?.dln;

    try {
      if (!dlnValue || !formData) {
        throw new Error('No DLN found for this work record.');
      }

      setAgentStatus('submitting');
      const taxPrdValue = (formData as Record<string, any>)?.workRecord?.taxPrd || (formData as Record<string, any>)?.taxPrd || '';

      await aiAgentService.submitWorkRecord(formData as Record<string, unknown>, dlnValue);
      setAgentStatus('waiting');

      const recommendations = await aiAgentService.pollForRecommendations(dlnValue, taxPrdValue);
      setAgentStatus('idle');

      const reworkedChanges: FieldChange[] = recommendations.map(rec => ({
        field: rec.field,
        currentValue: rec.currentValue,
        proposedValue: rec.proposedValue,
        confidenceScore: rec.confidenceScore,
        selected: true,
      }));

      setFieldChanges(reworkedChanges);
      const avgConfidence = reworkedChanges.length > 0
        ? (reworkedChanges.reduce((sum, c) => sum + c.confidenceScore, 0) / reworkedChanges.length * 100).toFixed(0)
        : '0';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✨ **Fresh Analysis Complete**\n\nThe AI agent has re-analyzed the work record:\n\n- ${reworkedChanges.length} correction${reworkedChanges.length !== 1 ? 's' : ''} identified\n- Average confidence: ${avgConfidence}%\n\n**Updated Recommendations:**\nPlease review the updated table below.`,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setAgentStatus('error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Re-analysis Failed**\n\n${error instanceof Error ? error.message : 'An unexpected error occurred.'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsReworking(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "text-green-600";
    if (score >= 0.75) return "text-yellow-600";
    return "text-orange-600";
  };

  const getConfidenceBgColor = (score: number) => {
    if (score >= 0.9) return "bg-green-50 border-green-200";
    if (score >= 0.75) return "bg-yellow-50 border-yellow-200";
    return "bg-orange-50 border-orange-200";
  };

  const handleFeedback = (messageIndex: number, feedbackType: "positive" | "negative") => {
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, feedback: feedbackType } : msg
    ));
    
    // If negative feedback, show comment input
    if (feedbackType === "negative") {
      setFeedbackMessageIndex(messageIndex);
      setFeedbackComment("");
    } else {
      setFeedbackMessageIndex(null);
      // Log positive feedback (replace with API call)
      console.log("Positive feedback for message:", messageIndex, messages[messageIndex]);
    }
  };

  const handleSubmitFeedback = (messageIndex: number) => {
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, feedbackComment } : msg
    ));
    
    // Log feedback with comment (replace with API call)
    console.log("Negative feedback for message:", messageIndex, {
      message: messages[messageIndex],
      comment: feedbackComment
    });
    
    setFeedbackMessageIndex(null);
    setFeedbackComment("");
  };

  const handleCancelFeedback = () => {
    if (feedbackMessageIndex !== null) {
      setMessages(prev => prev.map((msg, idx) => 
        idx === feedbackMessageIndex ? { ...msg, feedback: null } : msg
      ));
    }
    setFeedbackMessageIndex(null);
    setFeedbackComment("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-[560px] h-[650px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-blue-800 rounded p-1 transition-colors"
            aria-label="Close AI Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <p
                    className={`text-xs ${
                      message.role === "user" ? "text-purple-100" : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  
                  {/* Feedback buttons for assistant messages */}
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFeedback(index, "positive")}
                        className={`p-1 rounded transition-colors ${
                          message.feedback === "positive"
                            ? "bg-green-100 text-green-600"
                            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                        }`}
                        title="Helpful response"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(index, "negative")}
                        className={`p-1 rounded transition-colors ${
                          message.feedback === "negative"
                            ? "bg-red-100 text-red-600"
                            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Feedback comment input for negative feedback */}
            {message.role === "assistant" && feedbackMessageIndex === index && (
              <div className="mt-2 ml-2 max-w-[85%]">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Help us improve - What went wrong?
                  </p>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Optional: Tell us what could be better..."
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSubmitFeedback(index)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Submit Feedback
                    </button>
                    <button
                      onClick={handleCancelFeedback}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show feedback submitted confirmation */}
            {message.role === "assistant" && message.feedback === "negative" && message.feedbackComment && feedbackMessageIndex !== index && (
              <div className="mt-1 ml-2 text-xs text-gray-500 italic">
                ✓ Feedback submitted
              </div>
            )}
            {message.role === "assistant" && message.feedback === "positive" && (
              <div className="mt-1 ml-2 text-xs text-green-600 italic">
                ✓ Marked as helpful
              </div>
            )}
          </div>
        ))}
        
        {/* Field Changes Table */}
        {fieldChanges.length > 0 && (
          <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-800">Proposed Changes</h4>
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">
                      <input
                        type="checkbox"
                        checked={fieldChanges.every(c => c.selected)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldChanges(prev => prev.map(c => ({ ...c, selected: checked })));
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Select/Deselect All"
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">Field Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">Current</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">Proposed</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldChanges.map((change, idx) => (
                    <tr key={idx} className={`border-b hover:bg-gray-50 ${change.selected ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={change.selected}
                          onChange={() => handleToggleFieldSelection(idx)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">{change.field}</td>
                      <td className="px-3 py-2 text-gray-600">
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200">
                          {change.currentValue}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200">
                          {change.proposedValue}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`font-semibold ${getConfidenceColor(change.confidenceScore)}`}>
                          {(change.confidenceScore * 100).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleApplyChanges}
                disabled={isReworking || !fieldChanges.some(c => c.selected)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply ({fieldChanges.filter(c => c.selected).length})
              </button>
              <button
                onClick={handleDenyChanges}
                disabled={isReworking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Deny
              </button>
              <button
                onClick={handleRework}
                disabled={isReworking}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isReworking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reworking...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Rework
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">
                  {agentStatus === 'submitting' ? 'Submitting to AI agent...' :
                   agentStatus === 'waiting' ? 'Waiting for analysis...' :
                   'Analyzing...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !inputValue.trim() || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Deny Feedback Modal */}
      {showDenyModal && (
        // <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-[61]">
           <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[61]">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 p-6 w-[450px] max-w-[90vw]">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-800">Deny Proposed Changes</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Help me improve by explaining why you're denying these changes. Your feedback is valuable for enhancing future recommendations.
            </p>
            
            <textarea
              value={denyFeedback}
              onChange={(e) => setDenyFeedback(e.target.value)}
              placeholder="Please describe why these changes are not appropriate (e.g., incorrect values, wrong fields, missing context...)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows={4}
              autoFocus
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSubmitDeny}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Submit & Deny
              </button>
              <button
                onClick={handleCancelDeny}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
