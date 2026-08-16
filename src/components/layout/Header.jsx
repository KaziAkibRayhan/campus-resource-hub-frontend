// src/components/layout/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bot,
  Loader2,
  Menu,
  MessageSquarePlus,
  Search,
  Moon,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { chatService } from "../../services/api";
import { streamAssistant } from "../../services/assistantStream";
import Markdown from "../common/Markdown";
import NotificationDropdown from "./NotificationDropdown";

const SUGGESTED_PROMPTS = [
  "What CSE resources are available?",
  "Summarize the latest PDF resource",
  "এই image resource-এ কী আছে?",
  "Kon document e database niye bola ache?",
];

const Header = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [aiQuery, setAiQuery] = useState("");
  // Conversation thread: [{ role: "user"|"assistant", content, sources? }]
  const [aiThread, setAiThread] = useState([]);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiError, setAiError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const threadEndRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  const resetInputHeight = () => {
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  // Abort any in-flight stream when the header unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const typeLabels = {
    resource: "Resource",
    club: "Club",
    announcement: "Announcement",
    event: "Event",
    "lost-found": "Lost & Found",
    person: "Person",
  };

  const typeColors = {
    resource: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    club: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    announcement: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    event: "bg-green-500/10 text-green-400 border border-green-500/20",
    "lost-found": "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    person: "bg-slate-500/10 text-slate-300 border border-slate-500/20",
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setSearchOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiThread, aiSearching]);

  // Update the last (streaming) assistant turn in place.
  const patchLastTurn = (patch) => {
    setAiThread((prev) => {
      if (!prev.length || prev[prev.length - 1].role !== "assistant") return prev;
      const next = [...prev];
      next[next.length - 1] = {
        ...next[next.length - 1],
        ...(typeof patch === "function" ? patch(next[next.length - 1]) : patch),
      };
      return next;
    });
  };

  const askAi = async (rawQuestion) => {
    const question = (rawQuestion || "").trim();

    if (question.length < 3) {
      setAiError("Type at least 3 characters");
      setSearchOpen(true);
      return;
    }

    // History for the RAG backend: prior turns, role + content only
    const history = aiThread
      .filter((turn) => turn.content)
      .map(({ role, content }) => ({ role, content }));

    // Asking a new question aborts any still-running stream.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAiThread((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", sources: [], streaming: true },
    ]);
    setAiQuery("");
    resetInputHeight();
    setAiSearching(true);
    setAiError("");
    setSearchOpen(true);

    try {
      await streamAssistant({
        question,
        history,
        signal: controller.signal,
        onSources: (sources) => {
          setAiSearching(false);
          patchLastTurn({ sources });
        },
        onToken: (t) => {
          setAiSearching(false);
          patchLastTurn((turn) => ({ content: turn.content + t }));
        },
        onDone: (data) => {
          patchLastTurn({ content: data.answer || "", streaming: false });
        },
      });
    } catch {
      if (controller.signal.aborted) return; // superseded by a newer question
      // Streaming failed — silently fall back to the non-streaming endpoint.
      try {
        const res = await chatService.askAssistant(question, history);
        patchLastTurn({
          content: res.data.answer || "",
          sources: res.data.sources || [],
          streaming: false,
        });
      } catch (fallbackError) {
        patchLastTurn({ streaming: false });
        // No response at all means the request timed out or never reached the
        // backend — say so, instead of implying the assistant rejected it.
        const noResponse = !fallbackError.response;
        setAiError(
          fallbackError.response?.data?.message ||
            (noResponse
              ? "Could not reach the assistant. Check your connection and try again."
              : "AI search failed")
        );
      }
    } finally {
      if (!controller.signal.aborted) setAiSearching(false);
    }
  };

  const handleAiSearch = (event) => {
    event.preventDefault();
    askAi(aiQuery);
  };

  const openSource = (source) => {
    if (!source.href) return;
    navigate(source.href);
    setSearchOpen(false);
  };

  const clearSearch = () => {
    abortRef.current?.abort();
    setAiQuery("");
    setAiThread([]);
    setAiError("");
    setAiSearching(false);
    resetInputHeight();
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-20 w-full items-center bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border-color)] px-4 py-3 lg:px-8">
      <div className="flex w-full flex-wrap items-center gap-3">
        <div className="flex items-center space-x-4 lg:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2.5 lg:hidden hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
          >
            <Menu size={22} className="text-[var(--text-main)]" />
          </button>
        </div>

        {/* AI Search Bar — the wrapper keeps a fixed one-line footprint so the
            header never grows; the inner column is absolutely positioned and
            floats OVER the header border when the textarea expands. */}
        <div ref={searchRef} className="order-3 w-full md:order-none md:w-[28rem] md:max-w-[28rem] relative h-[42px]">
          <div className="absolute inset-x-0 top-0 z-50">
            <form onSubmit={handleAiSearch} className="relative group">
              <Bot className="absolute left-3 top-3 text-blue-500 transition-colors" size={18} />
              <textarea
                ref={inputRef}
                rows={1}
                value={aiQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setAiQuery(event.target.value);
                  if (aiError) setAiError("");
                  // Auto-grow up to ~4 lines; floats over the header border.
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 110)}px`;
                }}
                onKeyDown={(event) => {
                  // Enter submits; Shift+Enter inserts a newline.
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    askAi(aiQuery);
                  }
                }}
                placeholder="Ask what a file contains or request a summary..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl text-sm leading-relaxed transition-[border,box-shadow] outline-none border border-blue-500/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-[var(--bg-secondary)] text-[var(--text-main)] resize-none overflow-y-auto shadow-sm focus:shadow-xl"
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                {aiQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                    title="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={aiSearching}
                  className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  title="Ask AI"
                >
                  {aiSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </button>
              </div>
            </form>

            {searchOpen && (
              <div className="mt-2 w-full max-h-[70vh] overflow-hidden rounded-2xl border border-blue-500/20 bg-[var(--bg-card)] shadow-2xl">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                    <Bot size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--text-main)]">Campus Knowledge Search</p>
                    <p className="text-[11px] text-blue-500 flex items-center gap-1">
                      <Sparkles size={10} /> Answers grounded in accessible hub records and files
                    </p>
                  </div>
                  {aiThread.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition flex-shrink-0"
                      title="Clear conversation and start over"
                    >
                      <MessageSquarePlus size={14} /> New chat
                    </button>
                  )}
                </div>

                <div className="max-h-[58vh] overflow-y-auto p-3 space-y-3">
                  {aiThread.length === 0 && !aiSearching && !aiError && (
                    <div className="p-5 text-center text-[var(--text-muted)]">
                      <Bot size={34} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-semibold text-[var(--text-main)]">Ask campus AI</p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {SUGGESTED_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => askAi(prompt)}
                            className="px-3 py-1.5 rounded-full text-xs border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:border-blue-500 transition"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] mt-3 opacity-70 flex items-center justify-center gap-1">
                        <Sparkles size={11} className="text-blue-500" />
                        Semantic search — Bangla, Banglish &amp; English bujhi. File er bhitorer content niye o jiggesh korte paro.
                      </p>
                    </div>
                  )}

                  {aiThread.map((turn, index) =>
                    turn.role === "user" ? (
                      <div key={index} className="flex justify-end">
                        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-blue-600 text-white text-sm whitespace-pre-wrap">
                          {turn.content}
                        </div>
                      </div>
                    ) : turn.content || turn.sources?.length ? (
                      <div key={index} className="space-y-2">
                        <div className="p-4 rounded-2xl rounded-bl-md bg-blue-500/10 border border-blue-500/20">
                          <p className="text-[10px] font-bold uppercase text-blue-500 mb-1">AI Answer</p>
                          <div className="text-sm text-[var(--text-main)] leading-relaxed">
                            <Markdown>{turn.content}</Markdown>
                            {turn.streaming && (
                              <span className="inline-block w-2 text-blue-500 animate-pulse">▍</span>
                            )}
                          </div>
                        </div>

                        {turn.sources?.length > 0 && (
                          <details className="group">
                            <summary className="cursor-pointer list-none text-[10px] font-bold uppercase text-[var(--text-muted)] px-1 hover:text-blue-500">
                              Sources ({turn.sources.length}) — click to expand
                            </summary>
                            <div className="mt-2 space-y-2">
                              {turn.sources.map((source, sourceIndex) => (
                                <button
                                  key={`${index}-${source.type}-${source.id}`}
                                  type="button"
                                  onClick={() => openSource(source)}
                                  disabled={!source.href}
                                  className="w-full p-3 text-left rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition disabled:cursor-default"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-[var(--text-main)] truncate">
                                        <span className="text-blue-500 mr-1">[{sourceIndex + 1}]</span>
                                        {source.title}
                                      </p>
                                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{source.subtitle}</p>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${typeColors[source.type]}`}>
                                      {source.type === "resource" && source.fileType
                                        ? `${source.fileType} resource`
                                        : typeLabels[source.type] || source.type}
                                    </span>
                                  </div>
                                  {source.description && (
                                    <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">
                                      {source.description}
                                    </p>
                                  )}
                                  {source.type === "resource" && source.knowledgeReady && (
                                    <p className="text-[10px] text-emerald-500 mt-2 font-semibold">
                                      File content indexed · open the matching resource
                                    </p>
                                  )}
                                </button>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ) : null
                  )}

                  {aiSearching && (
                    <div className="flex items-center gap-2 text-blue-500 px-2 py-1">
                      <Loader2 size={18} className="animate-spin" />
                      <p className="text-sm font-medium">Searching hub data & thinking...</p>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {aiError}
                    </div>
                  )}

                  <div ref={threadEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-2 lg:space-x-5">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-[var(--bg-hover)] rounded-xl transition-all duration-300 hover:rotate-12 group"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun size={22} className="text-yellow-400" />
            ) : (
              <Moon size={22} className="text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-2 lg:pl-4 border-l border-[var(--border-color)]">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-bold text-[var(--text-main)] leading-none mb-1">
                {user?.name}
              </p>
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
            <Link to="/profile" className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full border-2 border-blue-600/20 p-0.5 hover:border-blue-600/50 transition-colors">
                <div className="h-full w-full rounded-full bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-[var(--text-muted)]" />
                  )}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
