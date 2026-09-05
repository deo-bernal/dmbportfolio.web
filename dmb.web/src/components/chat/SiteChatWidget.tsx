import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import SendIcon from "@mui/icons-material/Send";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { streamSiteChat, type SiteChatMessage } from "services/siteChat.service";
import { pageFonts } from "styles/main_style";
import useAccountGreeting from "hooks/useAccountGreeting";
import { friendlyAiErrorMessage } from "utils/friendlyAiError";

const ASSISTANT_ICON = "/images/icons/dmb-assistant.png";

const ATTENTION_MESSAGES = [
  "Need a free online profile? ✨",
  "Build your resume with AI",
  "Lots for sale in Pampanga",
  "Ask me how DMB Profiles works",
];

function welcomeMessage(firstName: string): SiteChatMessage {
  const greeting = firstName ? `Hi ${firstName}` : "Hi";
  return {
    role: "assistant",
    content: `${greeting} — I'm **DMB Assistant**. I can help with free portfolio pages or DMB Real Estate lots in Pampanga. Ask anything, or [[Create free profile|/register]] to get started.`,
  };
}

function FormatInlineText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    if (match[2]) {
      parts.push(
        <strong key={key++} style={{ fontWeight: 600 }}>
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return <>{parts.length > 0 ? parts : text}</>;
}

function MessageContent({
  content,
  onNavigate,
}: {
  content: string;
  onNavigate: (path: string) => void;
}) {
  const lines = content.split("\n");

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {lines.map((line, lineIndex) => {
        const bulletMatch = line.match(/^[-•]\s*(.+)$/);
        const numberedMatch = line.match(/^(\d+)[.)]\s*(.+)$/);
        const body = bulletMatch?.[1] ?? numberedMatch?.[2] ?? line;

        return (
          <span key={lineIndex} style={{ display: "block" }}>
            {bulletMatch ? (
              <span style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#b91c1c" }}>•</span>
                <span style={{ flex: 1 }}>{renderLineWithLinks(body, onNavigate)}</span>
              </span>
            ) : numberedMatch ? (
              <span style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#b91c1c", fontWeight: 600 }}>{numberedMatch[1]}.</span>
                <span style={{ flex: 1 }}>{renderLineWithLinks(body, onNavigate)}</span>
              </span>
            ) : (
              renderLineWithLinks(body, onNavigate)
            )}
          </span>
        );
      })}
    </span>
  );
}

function renderLineWithLinks(line: string, onNavigate: (path: string) => void): ReactNode {
  const linkRegex = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = linkRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<FormatInlineText key={key++} text={line.slice(lastIndex, match.index)} />);
    }
    const linkText = match[1];
    const linkPath = match[2];
    parts.push(
      <button
        key={key++}
        type="button"
        onClick={() => {
          if (/^https?:\/\//i.test(linkPath)) {
            window.open(linkPath, "_blank", "noopener,noreferrer");
            return;
          }
          onNavigate(linkPath);
        }}
        style={{
          display: "inline",
          padding: 0,
          border: 0,
          background: "none",
          color: "#b91c1c",
          fontWeight: 600,
          textDecoration: "underline",
          textUnderlineOffset: 2,
          cursor: "pointer",
          font: "inherit",
        }}
      >
        {linkText}
      </button>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    parts.push(<FormatInlineText key={key++} text={line.slice(lastIndex)} />);
  }
  return parts.length > 0 ? parts : <FormatInlineText text={line} />;
}

function stripForSpeech(content: string): string {
  return content
    .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^[-•]\s*/gm, "")
    .replace(/^\d+[.)]\s*/gm, "");
}

export default function SiteChatWidget() {
  const navigate = useNavigate();
  const firstName = useAccountGreeting();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [messages, setMessages] = useState<SiteChatMessage[]>(() => [welcomeMessage("")]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleFading, setBubbleFading] = useState(false);
  const [bubbleMessageIndex, setBubbleMessageIndex] = useState(0);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(text: string) => Promise<void>>(async () => {});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isLoading]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== "assistant") {
        return prev;
      }
      return [welcomeMessage(firstName)];
    });
  }, [firstName]);

  useEffect(() => {
    if (isOpen || bubbleDismissed) return;
    const showTimeout = window.setTimeout(() => setShowBubble(true), 3000);
    return () => window.clearTimeout(showTimeout);
  }, [isOpen, bubbleDismissed]);

  useEffect(() => {
    if (isOpen || bubbleDismissed || !showBubble || bubbleFading) return;

    const fadeTimeout = window.setTimeout(() => {
      setBubbleFading(true);
      window.setTimeout(() => {
        setShowBubble(false);
        setBubbleFading(false);
        window.setTimeout(() => {
          setBubbleMessageIndex((prev) => (prev + 1) % ATTENTION_MESSAGES.length);
          setShowBubble(true);
        }, 3000);
      }, 300);
    }, 5000);

    return () => window.clearTimeout(fadeTimeout);
  }, [isOpen, bubbleDismissed, showBubble, bubbleFading, bubbleMessageIndex]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsEnabled || !synthRef.current) return;
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    },
    [ttsEnabled]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: SiteChatMessage = { role: "user", content: text.trim() };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInputText("");
      setIsLoading(true);
      setStreamingText("");

      try {
        const fullText = await streamSiteChat(nextMessages, setStreamingText);
        const assistantMessage: SiteChatMessage = {
          role: "assistant",
          content: fullText || "I wasn't able to reply just then. Please try again.",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingText("");
        speak(stripForSpeech(assistantMessage.content));
      } catch (error) {
        const message = friendlyAiErrorMessage(
          error instanceof Error ? error.message : "",
          "Something went wrong. Please try again in a moment."
        );
        setMessages((prev) => [...prev, { role: "assistant", content: message }]);
        setStreamingText("");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, speak]
  );

  sendRef.current = handleSendMessage;

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      void sendRef.current(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    recognitionRef.current.start();
    setIsListening(true);
  };

  const openChat = () => {
    setIsOpen(true);
    setShowBubble(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
  };

  return (
    <>
      {!isOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1600,
            display: "flex",
            alignItems: "flex-end",
            gap: 1.5,
            fontFamily: pageFonts.sans,
          }}
        >
          {showBubble && !bubbleDismissed && (
            <Box
              className={bubbleFading ? "dmb-chat-fade-out" : "dmb-chat-fade-in"}
              onClick={openChat}
              sx={{
                position: "relative",
                bgcolor: "#fff",
                borderRadius: "999px",
                boxShadow: "0 10px 24px rgba(15,23,42,0.16)",
                border: "1px solid #e2e8f0",
                px: 2,
                py: 1.25,
                maxWidth: 220,
                cursor: "pointer",
                "&:hover .dmb-chat-dismiss": { opacity: 1 },
              }}
            >
              <IconButton
                className="dmb-chat-dismiss"
                size="small"
                aria-label="Dismiss"
                onClick={(event) => {
                  event.stopPropagation();
                  setBubbleDismissed(true);
                }}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 20,
                  height: 20,
                  bgcolor: "#e2e8f0",
                  opacity: 0,
                  transition: "opacity 0.15s ease",
                  "&:hover": { bgcolor: "#cbd5e1" },
                }}
              >
                <CloseIcon sx={{ fontSize: 12, color: "#475569" }} />
              </IconButton>
              <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 600, lineHeight: 1.35 }}>
                {ATTENTION_MESSAGES[bubbleMessageIndex]}
              </Typography>
            </Box>
          )}

          <Box
            component="button"
            type="button"
            onClick={openChat}
            aria-label="Open chat"
            className="dmb-chat-bounce"
            sx={{
              p: 0,
              border: 0,
              background: "none",
              cursor: "pointer",
              borderRadius: "50%",
              boxShadow: "0 4px 20px rgba(15,23,42,0.4)",
              outline: "2px solid rgba(185,28,28,0.5)",
              outlineOffset: 0,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": {
                transform: "scale(1.1)",
                boxShadow: "0 6px 30px rgba(185,28,28,0.5)",
              },
            }}
          >
            <Box
              component="img"
              src={ASSISTANT_ICON}
              alt="Chat with DMB Assistant"
              sx={{
                display: "block",
                width: { xs: 64, sm: 80 },
                height: { xs: 64, sm: 80 },
                borderRadius: "50%",
              }}
            />
          </Box>
        </Box>
      )}

      {isOpen && (
        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1600,
            width: { xs: "calc(100% - 32px)", sm: 380 },
            height: { xs: 500, sm: 550 },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: "16px",
            boxShadow: "0 24px 48px rgba(15,23,42,0.28)",
            fontFamily: pageFonts.sans,
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%)",
              color: "#fff",
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ position: "relative" }}>
                <Box
                  component="img"
                  src={ASSISTANT_ICON}
                  alt="DMB Assistant"
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    outline: "2px solid #b91c1c",
                  }}
                />
                {(isSpeaking || isLoading) && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      bgcolor: "#38bdf8",
                      borderRadius: "50%",
                      boxShadow: "0 0 8px #38bdf8",
                    }}
                  />
                )}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, color: "#fff", fontSize: 16, lineHeight: 1.2 }}>
                  DMB Assistant
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#38bdf8" }}>
                  {isLoading ? "Typing..." : isSpeaking ? "Speaking..." : "Online"}
                </Typography>
              </Box>
            </Box>
            <Box>
              <IconButton
                aria-label={ttsEnabled ? "Mute voice" : "Enable voice"}
                onClick={() => {
                  setTtsEnabled((prev) => !prev);
                  if (ttsEnabled && synthRef.current) synthRef.current.cancel();
                }}
                sx={{ color: "rgba(255,255,255,0.85)" }}
              >
                {ttsEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
              </IconButton>
              <IconButton aria-label="Close chat" onClick={closeChat} sx={{ color: "rgba(255,255,255,0.85)" }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={`${message.role}-${index}`}
                sx={{ display: "flex", justifyContent: message.role === "user" ? "flex-end" : "flex-start" }}
              >
                <Box
                  sx={{
                    maxWidth: "85%",
                    borderRadius: message.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    px: 2,
                    py: 1,
                    color: message.role === "user" ? "#fff" : "#0f172a",
                    background:
                      message.role === "user"
                        ? "linear-gradient(90deg, #0f172a 0%, #1e3a5f 100%)"
                        : "#fff",
                    boxShadow: message.role === "user" ? "none" : "0 4px 12px rgba(15,23,42,0.08)",
                    border: message.role === "user" ? 0 : "1px solid #e2e8f0",
                  }}
                >
                  <Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>
                    {message.role === "assistant" ? (
                      <MessageContent content={message.content} onNavigate={navigate} />
                    ) : (
                      message.content
                    )}
                  </Typography>
                </Box>
              </Box>
            ))}

            {streamingText && (
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                <Box
                  sx={{
                    maxWidth: "80%",
                    borderRadius: "16px 16px 16px 4px",
                    px: 2,
                    py: 1,
                    bgcolor: "#fff",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Typography sx={{ fontSize: 14 }}>
                    <MessageContent content={streamingText} onNavigate={navigate} />
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: 4,
                        height: 16,
                        bgcolor: "#38bdf8",
                        ml: 0.5,
                        verticalAlign: "middle",
                      }}
                    />
                  </Typography>
                </Box>
              </Box>
            )}

            {isLoading && !streamingText && (
              <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                <Box
                  sx={{
                    bgcolor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px 16px 16px 4px",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    {[0, 0.15, 0.3].map((delay) => (
                      <Box
                        key={delay}
                        className="dmb-chat-dot"
                        sx={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid #e2e8f0", bgcolor: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                aria-label={isListening ? "Stop listening" : "Speak"}
                onClick={toggleListening}
                disabled={isLoading}
                sx={{
                  border: "1px solid",
                  borderColor: isListening ? "#dc2626" : "#1e3a5f",
                  color: isListening ? "#fff" : "#1e3a5f",
                  bgcolor: isListening ? "#dc2626" : "transparent",
                  "&:hover": {
                    bgcolor: isListening ? "#b91c1c" : "#1e3a5f",
                    color: "#fff",
                  },
                }}
              >
                {isListening ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
              </IconButton>
              <InputBase
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSendMessage(inputText);
                  }
                }}
                placeholder={isListening ? "Listening..." : "Type a message..."}
                disabled={isLoading || isListening}
                sx={{
                  flex: 1,
                  px: 1.5,
                  py: 0.75,
                  border: "1px solid #cbd5e1",
                  borderRadius: 2,
                  fontSize: 14,
                  "&.Mui-focused": { borderColor: "#38bdf8" },
                }}
              />
              <IconButton
                aria-label="Send message"
                onClick={() => void handleSendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                sx={{
                  bgcolor: "#b91c1c",
                  color: "#fff",
                  "&:hover": { bgcolor: "#991b1b" },
                  "&.Mui-disabled": { bgcolor: "#fecaca", color: "#fff" },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography sx={{ fontSize: 10, textAlign: "center", color: "#94a3b8", mt: 1 }}>
              Press the mic button to speak or type your message
            </Typography>
          </Box>
        </Paper>
      )}
    </>
  );
}
