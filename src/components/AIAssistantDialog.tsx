"use client";

import { useState, useRef, useEffect } from "react";
import { X, MessageSquare, Send, Sparkles, Loader2, CheckCircle2, AlertCircle, Info, Zap, ThumbsUp, ThumbsDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "positive" | "negative" | null;
  feedbackComment?: string;
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
}

type AIMode = "plan" | "agent";

export default function AIAssistantDialog({
  isOpen,
  onClose,
  formData,
  currentError,
  allErrors = [],
  onApplyFixes,
}: AIAssistantDialogProps) {
  const [mode, setMode] = useState<AIMode>("plan");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [proposedFixes, setProposedFixes] = useState<ErrorFix[] | null>(null);
  const [feedbackMessageIndex, setFeedbackMessageIndex] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Initialize welcome message based on mode
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        role: "assistant",
        content: mode === "plan"
          ? `Hello! I'm your AI assistant in **Plan Mode**. I can help you understand and resolve errors.\n\n**I can help with:**\n- Explain current error: "${currentError?.code || 'error code'}"\n- Show IRM guidance\n- Provide step-by-step resolution instructions\n- List all errors on the form\n\nSwitch to **Agent Mode** for automatic error fixes.`
          : `Hello! I'm your AI assistant in **Agent Mode**. I can automatically analyze and fix errors.\n\n**Available commands:**\n- "Fix the current error"\n- "Fix all errors on this form"\n- "Analyze all errors"\n\nI'll show you proposed fixes with confidence scores before applying any changes.`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, mode, currentError, messages.length]);

  // Reset messages when mode changes
  const handleModeChange = (newMode: AIMode) => {
    setMode(newMode);
    setMessages([]);
    setProposedFixes(null);
  };

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

  // Simulate Agent Mode response with fixes
  const simulateAgentResponse = (userMessage: string): ErrorFix[] => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("fix all") || lowerMessage.includes("analyze all")) {
      return allErrors.slice(0, 3).map(error => ({
        errorCode: error.code,
        errorDescription: error.description,
        proposedFix: [
          {
            field: error.fieldMappings?.[0] || "primarySSN",
            currentValue: formData?.[error.fieldMappings?.[0] || "primarySSN"] || "123456789",
            suggestedValue: "987654321",
            reason: "Corrected based on source document analysis"
          }
        ],
        confidenceScore: Math.random() * 0.3 + 0.7, // 70-100%
        requiresManualReview: Math.random() > 0.6
      }));
    }
    
    if (lowerMessage.includes("fix current") || lowerMessage.includes("fix the error")) {
      if (!currentError) return [];
      
      return [{
        errorCode: currentError.code,
        errorDescription: currentError.description,
        proposedFix: [
          {
            field: currentError.fieldMappings?.[0] || "primarySSN",
            currentValue: formData?.[currentError.fieldMappings?.[0] || "primarySSN"] || "123456789",
            suggestedValue: "987654321",
            reason: "Corrected to match EIF record"
          }
        ],
        confidenceScore: 0.92,
        requiresManualReview: false
      }];
    }
    
    return [];
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

    // Simulate AI response based on mode
    setTimeout(() => {
      if (mode === "plan") {
        const response = simulatePlanResponse(userMessage.content);
        const assistantMessage: Message = {
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      } else {
        // Agent mode - generate fixes
        const fixes = simulateAgentResponse(userMessage.content);
        
        if (fixes.length > 0) {
          // Initialize all fixes as selected by default
          const fixesWithSelection = fixes.map(fix => ({ ...fix, selected: true, rejected: false }));
          setProposedFixes(fixesWithSelection);
          const assistantMessage: Message = {
            role: "assistant",
            content: `I've analyzed the errors and prepared ${fixes.length} fix${fixes.length > 1 ? 'es' : ''}. Please review the proposed changes below.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          const assistantMessage: Message = {
            role: "assistant",
            content: "I couldn't find any errors to fix. Please try commands like:\n- \"Fix the current error\"\n- \"Fix all errors on this form\"",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleToggleFixSelection = (fixIndex: number) => {
    setProposedFixes(prev => {
      if (!prev) return prev;
      return prev.map((fix, idx) => {
        if (idx === fixIndex) {
          // Toggle selection - if rejected, clear rejected and select
          if (fix.rejected) {
            return { ...fix, selected: true, rejected: false };
          }
          // Otherwise just toggle selected
          return { ...fix, selected: !fix.selected };
        }
        return fix;
      });
    });
  };

  const handleRejectFix = (fixIndex: number) => {
    setProposedFixes(prev => {
      if (!prev) return prev;
      return prev.map((fix, idx) => 
        idx === fixIndex ? { ...fix, rejected: true, selected: false } : fix
      );
    });
  };

  const handleApplySelectedFixes = () => {
    if (proposedFixes && onApplyFixes) {
      const selectedFixes = proposedFixes.filter(fix => fix.selected && !fix.rejected);
      
      if (selectedFixes.length === 0) {
        const warningMessage: Message = {
          role: "assistant",
          content: "⚠️ No fixes selected. Please select at least one fix to apply.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, warningMessage]);
        return;
      }
      
      onApplyFixes(selectedFixes);
      const confirmMessage: Message = {
        role: "assistant",
        content: `✅ Applied ${selectedFixes.length} fix${selectedFixes.length > 1 ? 'es' : ''} successfully! The form has been updated.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    }
    setProposedFixes(null);
  };

  const handleSelectAllFixes = () => {
    setProposedFixes(prev => {
      if (!prev) return prev;
      return prev.map(fix => ({ ...fix, selected: true, rejected: false }));
    });
  };

  const handleDeselectAllFixes = () => {
    setProposedFixes(prev => {
      if (!prev) return prev;
      return prev.map(fix => ({ ...fix, selected: false }));
    });
  };

  const handleCancelFixes = () => {
    setProposedFixes(null);
    const cancelMessage: Message = {
      role: "assistant",
      content: "Fixes cancelled. No changes were made to the form.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cancelMessage]);
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
    <div className="fixed bottom-24 right-6 w-[480px] h-[650px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 animate-slide-up">
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
        
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange("plan")}
            className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              mode === "plan"
                ? "bg-white text-blue-700"
                : "bg-blue-800 text-white hover:bg-blue-900"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>Plan Mode</span>
            </div>
          </button>
          <button
            onClick={() => handleModeChange("agent")}
            className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              mode === "agent"
                ? "bg-white text-blue-700"
                : "bg-blue-800 text-white hover:bg-blue-900"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Zap className="w-4 h-4" />
              <span>Agent Mode</span>
            </div>
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
        
        {/* Fix Summary Panel */}
        {proposedFixes && proposedFixes.length > 0 && (
          <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Proposed Fixes</h4>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAllFixes}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleDeselectAllFixes}
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {proposedFixes.map((fix, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 transition-all ${
                    fix.rejected 
                      ? 'bg-gray-100 border-gray-300 opacity-60' 
                      : fix.selected
                      ? getConfidenceBgColor(fix.confidenceScore)
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    {/* Selection Checkbox */}
                    <div className="flex items-center pt-0.5">
                      <input
                        type="checkbox"
                        checked={fix.selected && !fix.rejected}
                        onChange={() => handleToggleFixSelection(idx)}
                        disabled={fix.rejected}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className={`font-medium text-sm ${fix.rejected ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            Error {fix.errorCode}
                          </p>
                          <p className={`text-xs ${fix.rejected ? 'text-gray-400' : 'text-gray-600'}`}>
                            {fix.errorDescription}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <p className={`text-sm font-semibold ${fix.rejected ? 'text-gray-400' : getConfidenceColor(fix.confidenceScore)}`}>
                            {(fix.confidenceScore * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">confidence</p>
                        </div>
                      </div>
                      
                      {fix.requiresManualReview && !fix.rejected && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-orange-700">
                          <AlertCircle className="w-3 h-3" />
                          <span>Requires manual review</span>
                        </div>
                      )}
                      
                      {fix.rejected && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-red-600">
                          <X className="w-3 h-3" />
                          <span>Rejected</span>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {fix.proposedFix.map((change, changeIdx) => (
                          <div key={changeIdx} className="bg-white bg-opacity-50 rounded p-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">{change.field}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`${fix.rejected ? 'text-gray-400' : 'text-red-600'} line-through`}>
                                {change.currentValue}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className={`font-medium ${fix.rejected ? 'text-gray-400' : 'text-green-600'}`}>
                                {change.suggestedValue}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 italic ${fix.rejected ? 'text-gray-400' : 'text-gray-600'}`}>
                              {change.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      {/* Individual Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        {!fix.rejected && (
                          <button
                            onClick={() => handleRejectFix(idx)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        )}
                        {fix.rejected && (
                          <button
                            onClick={() => handleToggleFixSelection(idx)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Undo Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleApplySelectedFixes}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!proposedFixes.some(fix => fix.selected && !fix.rejected)}
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply Selected ({proposedFixes.filter(fix => fix.selected && !fix.rejected).length})
              </button>
              <button
                onClick={handleCancelFixes}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Analyzing...</span>
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
    </div>
  );
}
