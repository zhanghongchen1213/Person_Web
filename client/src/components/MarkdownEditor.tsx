import * as React from "react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold,
  Italic,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Columns,
  FileText,
  Eye,
} from "lucide-react";

/**
 * View mode for the Markdown editor
 */
type ViewMode = "split" | "edit" | "preview";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

/**
 * Toolbar button component for markdown formatting actions
 */
function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  className,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "p-1.5 hover:bg-muted rounded transition-colors",
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/**
 * Process pasted content and convert to Markdown format
 */
function processClipboardData(
  clipboardData: DataTransfer,
  currentValue: string,
  selectionStart: number,
  selectionEnd: number
): { newValue: string; newCursorPos: number } | null {
  // Handle image paste
  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith("image/")) {
      // For now, we'll create a placeholder for the image
      // In a real implementation, this would upload the image
      const placeholder = "![Pasted Image](uploading...)";
      const before = currentValue.slice(0, selectionStart);
      const after = currentValue.slice(selectionEnd);
      return {
        newValue: before + placeholder + after,
        newCursorPos: selectionStart + placeholder.length,
      };
    }
  }

  // Handle HTML paste (convert to Markdown)
  const html = clipboardData.getData("text/html");
  if (html) {
    const markdown = convertHtmlToMarkdown(html);
    if (markdown) {
      const before = currentValue.slice(0, selectionStart);
      const after = currentValue.slice(selectionEnd);
      return {
        newValue: before + markdown + after,
        newCursorPos: selectionStart + markdown.length,
      };
    }
  }

  // Handle plain text with code detection
  const text = clipboardData.getData("text/plain");
  if (text) {
    const processed = processPlainTextPaste(text);
    if (processed !== text) {
      const before = currentValue.slice(0, selectionStart);
      const after = currentValue.slice(selectionEnd);
      return {
        newValue: before + processed + after,
        newCursorPos: selectionStart + processed.length,
      };
    }
  }

  return null;
}

/**
 * Convert HTML to Markdown (basic conversion)
 */
function convertHtmlToMarkdown(html: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  if (!body || !body.textContent?.trim()) {
    return null;
  }

  let result = "";

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    const children = Array.from(node.childNodes)
      .map(processNode)
      .join("");

    switch (tagName) {
      case "h1":
        return `# ${children}\n\n`;
      case "h2":
        return `## ${children}\n\n`;
      case "h3":
        return `### ${children}\n\n`;
      case "h4":
        return `#### ${children}\n\n`;
      case "h5":
        return `##### ${children}\n\n`;
      case "h6":
        return `###### ${children}\n\n`;
      case "p":
        return `${children}\n\n`;
      case "br":
        return "\n";
      case "strong":
      case "b":
        return `**${children}**`;
      case "em":
      case "i":
        return `*${children}*`;
      case "code":
        return `\`${children}\``;
      case "pre":
        return `\`\`\`\n${children}\n\`\`\`\n\n`;
      case "a":
        const href = element.getAttribute("href") || "";
        return `[${children}](${href})`;
      case "img":
        const src = element.getAttribute("src") || "";
        const alt = element.getAttribute("alt") || "image";
        return `![${alt}](${src})`;
      case "ul":
        return children;
      case "ol":
        return children;
      case "li":
        const parent = element.parentElement;
        if (parent?.tagName.toLowerCase() === "ol") {
          return `1. ${children}\n`;
        }
        return `- ${children}\n`;
      case "blockquote":
        return children
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n") + "\n\n";
      default:
        return children;
    }
  }

  result = processNode(body);
  return result.trim() || null;
}

/**
 * Process plain text paste to detect and format code blocks
 */
function processPlainTextPaste(text: string): string {
  // Detect if the text looks like code
  const codeIndicators = [
    /^(import|export|const|let|var|function|class|interface|type)\s/m,
    /^(def|class|import|from|if|for|while)\s/m,
    /^(#include|int|void|char|float|double)\s/m,
    /[{};]\s*$/m,
    /^\s*(\/\/|#|\/\*)/m,
  ];

  const looksLikeCode = codeIndicators.some((pattern) => pattern.test(text));
  const hasMultipleLines = text.includes("\n");

  if (looksLikeCode && hasMultipleLines) {
    // Detect language
    let lang = "";
    if (/^(import|export|const|let|var|function|class|interface|type)\s/m.test(text)) {
      lang = "typescript";
    } else if (/^(def|class|import|from)\s/m.test(text)) {
      lang = "python";
    } else if (/^(#include|int main)/m.test(text)) {
      lang = "c";
    }

    return `\`\`\`${lang}\n${text}\n\`\`\``;
  }

  return text;
}

/**
 * MarkdownEditor - A split-view Markdown editor component
 *
 * Features:
 * - Split view (editor | preview)
 * - Toolbar for common formatting
 * - Paste auto-formatting (images, code blocks, HTML to Markdown)
 * - Resizable panels
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content in Markdown...",
  className,
  minHeight = "500px",
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("split");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  /**
   * Insert text at cursor position or wrap selection
   */
  const insertAtCursor = React.useCallback(
    (before: string, after: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.slice(start, end);

      const newText =
        value.slice(0, start) + before + selectedText + after + value.slice(end);

      onChange(newText);

      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + before.length + selectedText.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [value, onChange]
  );

  /**
   * Handle paste event for auto-formatting
   */
  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const result = processClipboardData(
        e.clipboardData,
        value,
        textarea.selectionStart,
        textarea.selectionEnd
      );

      if (result) {
        e.preventDefault();
        onChange(result.newValue);

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(result.newCursorPos, result.newCursorPos);
        });
      }
    },
    [value, onChange]
  );

  /**
   * Toolbar actions
   */
  const toolbarActions = React.useMemo(
    () => ({
      bold: () => insertAtCursor("**", "**"),
      italic: () => insertAtCursor("*", "*"),
      code: () => insertAtCursor("`", "`"),
      codeBlock: () => insertAtCursor("```\n", "\n```"),
      link: () => insertAtCursor("[", "](url)"),
      image: () => insertAtCursor("![alt](", ")"),
      h1: () => insertAtCursor("# "),
      h2: () => insertAtCursor("## "),
      h3: () => insertAtCursor("### "),
      ul: () => insertAtCursor("- "),
      ol: () => insertAtCursor("1. "),
      quote: () => insertAtCursor("> "),
    }),
    [insertAtCursor]
  );

  return (
    <div className={cn("border-2 border-border", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b-2 border-border px-2 py-1 bg-muted/30">
        <div className="flex items-center gap-0.5">
          <ToolbarButton icon={Bold} label="Bold" onClick={toolbarActions.bold} />
          <ToolbarButton icon={Italic} label="Italic" onClick={toolbarActions.italic} />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton icon={Heading1} label="Heading 1" onClick={toolbarActions.h1} />
          <ToolbarButton icon={Heading2} label="Heading 2" onClick={toolbarActions.h2} />
          <ToolbarButton icon={Heading3} label="Heading 3" onClick={toolbarActions.h3} />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton icon={Code} label="Inline Code" onClick={toolbarActions.code} />
          <ToolbarButton icon={Quote} label="Quote" onClick={toolbarActions.quote} />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton icon={List} label="Bullet List" onClick={toolbarActions.ul} />
          <ToolbarButton icon={ListOrdered} label="Numbered List" onClick={toolbarActions.ol} />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton icon={Link} label="Link" onClick={toolbarActions.link} />
          <ToolbarButton icon={Image} label="Image" onClick={toolbarActions.image} />
        </div>

        {/* View mode toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-7">
            <TabsTrigger value="edit" className="text-xs px-2 py-1 h-6">
              <FileText className="w-3 h-3 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="split" className="text-xs px-2 py-1 h-6">
              <Columns className="w-3 h-3 mr-1" />
              Split
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-2 py-1 h-6">
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Editor content */}
      <div style={{ minHeight }}>
        {viewMode === "edit" && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="w-full h-full p-4 font-mono text-sm bg-transparent resize-none outline-none"
            style={{ minHeight }}
          />
        )}

        {viewMode === "preview" && (
          <div className="p-4 prose-brutalist overflow-auto" style={{ minHeight }}>
            <Streamdown>{value || "*No content*"}</Streamdown>
          </div>
        )}

        {viewMode === "split" && (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onPaste={handlePaste}
                placeholder={placeholder}
                className="w-full h-full p-4 font-mono text-sm bg-transparent resize-none outline-none"
                style={{ minHeight }}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div
                className="p-4 prose-brutalist overflow-auto border-l-2 border-border bg-muted/10"
                style={{ minHeight }}
              >
                <Streamdown>{value || "*No content*"}</Streamdown>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}

export default MarkdownEditor;
