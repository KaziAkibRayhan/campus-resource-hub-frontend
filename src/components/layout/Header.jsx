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
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiSources, setAiSources] = useState([]);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiError, setAiError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const typeLabels = {
    resource: "Resource",
    club: "Club",
    announcement: "Announcement",
    event: "Event",
    "lost-found": "Lost & Found",
    person: "Person",
  };

  const typeColors = {
    resource: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    club: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    announcement: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    event: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "lost-found": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    person: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
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

  const handleAiSearch = async (event) => {
    event.preventDefault();
    const question = aiQuery.trim();

    if (question.length < 2) {
      setAiError("Type at least 2 characters");
      setSearchOpen(true);
      return;
    }

    try {
      setAiSearching(true);
      setAiError("");
      setSearchOpen(true);
      const res = await chatService.askAssistant(question);
      setAiAnswer(res.data.answer || "");
      setAiSources(res.data.sources || []);
    } catch (error) {
      setAiAnswer("");
      setAiSources([]);
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
    setAiAnswer("");
    setAiSources([]);
    setAiError("");
  };

  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--border-color)] px-4 lg:px-8">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2.5 lg:hidden hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu size={22} className="text-[var(--text-main)]" />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-[var(--text-main)]">
              Campus Resource Hub
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 lg:space-x-5">
          {/* AI Search Bar */}
          <div ref={searchRef} className="hidden md:block relative">
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
                placeholder="Ask AI about resources, clubs, events..."
                className="w-72 lg:w-[28rem] pl-10 pr-20 py-2.5 rounded-xl text-sm transition-all outline-none border border-blue-500/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-[var(--bg-secondary)] text-[var(--text-main)]"
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
              <div className="absolute right-0 top-14 w-[28rem] max-h-[70vh] overflow-hidden rounded-2xl border border-blue-500/20 bg-[var(--bg-card)] shadow-2xl z-50">
                <div className="p-4 border-b border-[var(--border-color)] bg-blue-50/70 dark:bg-blue-950/20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text-main)]">AI Search</p>
                    <p className="text-[11px] text-blue-500">Answers from your campus hub data</p>
                  </div>
                </div>

                <div className="max-h-[58vh] overflow-y-auto p-3 space-y-3">
                  {aiSearching ? (
                    <div className="h-40 flex flex-col items-center justify-center text-blue-500">
                      <Loader2 size={28} className="animate-spin mb-2" />
                      <p className="text-sm font-medium">Thinking with campus data...</p>
                    </div>
                  ) : aiError ? (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                      {aiError}
                    </div>
                  ) : aiAnswer || aiSources.length > 0 ? (
                    <>
                      {aiAnswer && (
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40">
                          <p className="text-[10px] font-bold uppercase text-blue-500 mb-1">AI Answer</p>
                          <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">
                            {aiAnswer}
                          </p>
                        </div>
                      )}

                      {aiSources.length > 0 && (
                        <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] px-1">
                          Sources
                        </p>
                      )}

                      {aiSources.map((source) => (
                        <button
                          key={`${source.type}-${source.id}`}
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
                    </>
                  ) : (
                    <div className="p-5 text-center text-[var(--text-muted)]">
                      <Bot size={34} className="mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-semibold text-[var(--text-main)]">Ask campus AI</p>
                      <p className="text-xs mt-1">Try “CSE er kon resources ache?” or “Upcoming event ache?”</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 hover:rotate-12 group"
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
                <div className="h-full w-full rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
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
