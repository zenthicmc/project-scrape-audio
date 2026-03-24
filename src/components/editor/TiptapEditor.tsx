"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2, Heading3, Link as LinkIcon, Code, Quote,
  Undo, Redo, Copy, Check
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange?: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  /** When provided, editor content will be updated reactively (for streaming) */
  streamingContent?: string;
}

export default function TiptapEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Mulai mengetik script Anda...",
  streamingContent,
}: TiptapEditorProps) {
  const [copied, setCopied] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      Markdown.configure({
        html: true,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.storage.markdown.getMarkdown());
    },
  });

  // Handle streaming content updates from outside
  useEffect(() => {
    if (!editor || streamingContent === undefined) return;
    const currentMd = editor.storage.markdown.getMarkdown();
    if (currentMd !== streamingContent && streamingContent) {
      editor.commands.setContent(streamingContent);
    }
  }, [streamingContent, editor]);

  // Handle editable prop changes
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editable, editor]);

  const handleCopy = useCallback(async () => {
    if (!editor) return;
    const text = editor.getText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
    disabled,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        disabled && "opacity-30 cursor-not-allowed",
        !disabled && active
          ? "bg-primary text-white"
          : !disabled
            ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
            : ""
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="tiptap-editor border border-border rounded-xl overflow-hidden bg-card">
      <div className={cn(
        "flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-secondary/30 transition-opacity",
        !editable && "opacity-50"
      )}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold" disabled={!editable}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic" disabled={!editable}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline" disabled={!editable}>
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1" disabled={!editable}>
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2" disabled={!editable}>
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3" disabled={!editable}>
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left" disabled={!editable}>
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center" disabled={!editable}>
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right" disabled={!editable}>
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List" disabled={!editable}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List" disabled={!editable}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote" disabled={!editable}>
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block" disabled={!editable}>
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link" disabled={!editable}>
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editable}>
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editable}>
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <div className="flex-1" />

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Text</>}
        </button>
      </div>
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  );
}
