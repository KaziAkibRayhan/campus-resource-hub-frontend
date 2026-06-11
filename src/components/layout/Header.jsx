// src/components/layout/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Loader2, Menu, Search, Moon, Sun, User, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { chatService } from "../../services/api";
import NotificationDropdown from "./NotificationDropdown";

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

  const handleAiSearch = async (event) => {
    event.preventDefault();
    const question = aiQuery.trim();

    if (question.length < 2) {
      setAiError("Type at least 2 characters");
      setSearchOpen(true);
      return;
    }

    // History for the RAG backend: prior turns, role + content only
    const history = aiThread.map(({ role, content }) => ({ role, content }));

    setAiThread((prev) => [...prev, { role: "user", content: question }]);
    setAiQuery("");

    try {
      setAiSearching(true);
      setAiError("");
      setSearchOpen(true);
      const res = await chatService.askAssistant(question, history);
      setAiThread((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.answer || "",
          sources: res.data.sources || [],
        },
      ]);
    } catch (error) {
      setAiError(error.response?.data?.message || "AI search failed");
    } finally {
      setAiSearching(false);
    }
  };

  const openSource = (source) => {
    if (!source.href) return;
    navigate(source.href);
    setSearchOpen(false);
  };

  const clearSearch = () => {
    setAiQuery("");
    setAiThread([]);
    setAiError("");
  };

  return (
    <header className="sticky top-0 z-40 flex min-h-20 lg:h-20 w-full items-center bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border-color)] px-4 py-3 lg:px-8 lg:py-0">
      <div className="flex w-full flex-wrap items-center gap-3">
        <div className="flex items-center space-x-4 lg:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2.5 lg:hidden hover:bg-[var(--bg-hover)] rounded-xl transition-colors"
          >
            <Menu size={22} className="text-[var(--text-main)]" />
          </button>
        </div>

        {/* AI Search Bar */}
        <div ref={searchRef} className="order-3 w-full md:order-none md:w-[28rem] md:max-w-[28rem] relative">
            <form onSubmit={handleAiSearch} className="relative group">
              <Bot className="absolute left-3 top-3 text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                value={aiQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setAiQuery(event.target.value);
                  if (aiError) setAiError("");
                }}
                placeholder="Ask AI about resources..."
                className="w-full pl-10 pr-20 py-2.5 rounded-xl text-sm transition-all outline-none border border-blue-500/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-[var(--bg-secondary)] text-[var(--text-main)]"
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
              <div className="absolute left-0 right-0 top-14 w-full md:left-auto md:w-[28rem] max-h-[70vh] overflow-hidden rounded-2xl border border-blue-500/20 bg-[var(--bg-card)] shadow-2xl z-50">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text-main)]">AI Search</p>
                    <p className="text-[11px] text-blue-500">Answers from your campus hub data</p>
                  </div>
                </div>

                <div className="max-h-[58vh] overflow-y-auto p-3 space-y-3">
                  {aiThread.length === 0 && !aiSearching && !aiError && (
                    <div className="p-5 text-center text-[var(--text-muted)]">
                      <Bot size={34} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-semibold text-[var(--text-main)]">Ask campus AI</p>
                      <p className="text-xs mt-1">Try “What CSE resources are available?” or “Any upcoming events?”</p>
                      <p className="text-[10px] mt-2 opacity-70">You can ask follow-up questions — I remember the context. Bangla and Banglish work too.</p>
                    </div>
                  )}

                  {aiThread.map((turn, index) =>
                    turn.role === "user" ? (
                      <div key={index} className="flex justify-end">
                        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-blue-600 text-white text-sm whitespace-pre-wrap">
                          {turn.content}
                        </div>
                      </div>
                    ) : (
                      <div key={index} className="space-y-2">
                        <div className="p-4 rounded-2xl rounded-bl-md bg-blue-500/10 border border-blue-500/20">
                          <p className="text-[10px] font-bold uppercase text-blue-500 mb-1">AI Answer</p>
                          <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">
                            {turn.content}
                          </p>
                        </div>

                        {turn.sources?.length > 0 && (
                          <details className="group">
                            <summary className="cursor-pointer list-none text-[10px] font-bold uppercase text-[var(--text-muted)] px-1 hover:text-blue-500">
                              Sources ({turn.sources.length}) — click to expand
                            </summary>
                            <div className="mt-2 space-y-2">
                              {turn.sources.map((source) => (
                                <button
                                  key={`${index}-${source.type}-${source.id}`}
                                  type="button"
                                  onClick={() => openSource(source)}
                                  disabled={!source.href}
                                  className="w-full p-3 text-left rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition disabled:cursor-default"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-[var(--text-main)] truncate">{source.title}</p>
                                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{source.subtitle}</p>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${typeColors[source.type]}`}>
                                      {typeLabels[source.type] || source.type}
                                    </span>
                                  </div>
                                  {source.description && (
                                    <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">
                                      {source.description}
                                    </p>
                                  )}
                                </button>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )
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
