// Themed markdown renderer for AI assistant answers. Styled via the app's
// CSS variables so it works in both light and dark mode.
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components = {
  p: (props) => (
    <p className="text-sm text-[var(--text-main)] leading-relaxed mb-2 last:mb-0" {...props} />
  ),
  strong: (props) => <strong className="font-bold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="text-blue-500 hover:text-blue-600 underline underline-offset-2"
      {...props}
    >
      {children}
    </a>
  ),
  ul: (props) => (
    <ul className="text-sm text-[var(--text-main)] list-disc pl-5 mb-2 space-y-1" {...props} />
  ),
  ol: (props) => (
    <ol className="text-sm text-[var(--text-main)] list-decimal pl-5 mb-2 space-y-1" {...props} />
  ),
  li: (props) => <li className="leading-relaxed" {...props} />,
  code: ({ inline, children, ...props }) =>
    inline ? (
      <code
        className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[12px] font-mono"
        {...props}
      >
        {children}
      </code>
    ) : (
      <code className="block text-[12px] font-mono" {...props}>
        {children}
      </code>
    ),
  pre: (props) => (
    <pre
      className="p-3 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-x-auto"
      {...props}
    />
  ),
  h1: (props) => <p className="text-sm font-bold text-[var(--text-main)] mb-1" {...props} />,
  h2: (props) => <p className="text-sm font-bold text-[var(--text-main)] mb-1" {...props} />,
  h3: (props) => <p className="text-sm font-bold text-[var(--text-main)] mb-1" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-blue-500/40 pl-3 text-[var(--text-muted)] mb-2"
      {...props}
    />
  ),
  table: (props) => (
    <div className="overflow-x-auto mb-2">
      <table className="text-xs border-collapse" {...props} />
    </div>
  ),
  th: (props) => (
    <th className="border border-[var(--border-color)] px-2 py-1 font-bold text-left" {...props} />
  ),
  td: (props) => <td className="border border-[var(--border-color)] px-2 py-1" {...props} />,
};

const Markdown = ({ children }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
    {children}
  </ReactMarkdown>
);

export default Markdown;
