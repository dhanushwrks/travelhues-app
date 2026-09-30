"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote, Underline } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

export function BlogEditor({ value = "", onChange }: { value?: string; onChange: (html: string) => void }) {
  const [revision, setRevision] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkHint, setLinkHint] = useState("");
  const selection = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true },
      }),
      Placeholder.configure({
        placeholder: "Write the post. What would you tell a friend who is going?",
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "min-h-56 px-4 py-3 text-[15px] leading-7 outline-none",
        "aria-label": "Post",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    onTransaction: () => setRevision((value) => value + 1),
  });

  function openLink() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const inLink = editor.isActive("link");
    if (from === to && !inLink) {
      selection.current = null;
      setLinkUrl("");
      setLinkHint("Select the words first");
      setLinkOpen(true);
      return;
    }
    selection.current = { from, to };
    setLinkUrl(String(editor.getAttributes("link").href ?? ""));
    setLinkHint("");
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor || !selection.current) return;
    const href = linkUrl.trim();
    const chain = editor.chain().focus().setTextSelection(selection.current);
    if (!href) {
      chain.extendMarkRange("link").unsetLink().run();
    } else {
      const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
      chain.extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
  }

  return (
    <div className="blog-editor overflow-hidden rounded-2xl border border-border bg-background" data-rev={revision}>
      <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
        <Tool editor={editor} label="Bold" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold />
        </Tool>
        <Tool editor={editor} label="Italic" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic />
        </Tool>
        <Tool
          editor={editor}
          label="Underline"
          active={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <Underline />
        </Tool>
        <Tool
          editor={editor}
          label="Heading"
          active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </Tool>
        <Tool
          editor={editor}
          label="Bulleted list"
          active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List />
        </Tool>
        <Tool
          editor={editor}
          label="Numbered list"
          active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </Tool>
        <Tool
          editor={editor}
          label="Quote"
          active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </Tool>
        <Tool editor={editor} label="Link" active={editor?.isActive("link") || linkOpen} onClick={openLink}>
          <Link2 />
        </Tool>
      </div>
      {linkOpen ? (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <input
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            placeholder={linkHint || "https://"}
            aria-label="Link address"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button type="button" onClick={applyLink} className="text-sm font-medium text-primary">
            Add
          </button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

function Tool({
  editor,
  label,
  active,
  onClick,
  children,
}: {
  editor: Editor | null;
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={Boolean(active)}
      disabled={!editor}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg disabled:opacity-40 [&_svg]:size-4 ${
        active ? "bg-foreground text-background" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
