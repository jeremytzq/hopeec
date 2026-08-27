import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const TRACKED_COMMANDS = ["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"];

// Minimal WYSIWYG editor for the intro note: a contentEditable box driven by
// document.execCommand. The div's innerHTML is managed imperatively (not via
// React children/dangerouslySetInnerHTML) so typing doesn't get clobbered by
// re-renders - we only push `value` into the DOM when it changes from outside
// this component (switching weeks, loading a saved plan).
export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef<string>(value);
  const [active, setActive] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value;
    lastEmittedRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value !== lastEmittedRef.current && editorRef.current) {
      editorRef.current.innerHTML = value;
      lastEmittedRef.current = value;
    }
  }, [value]);

  // Keeps the toolbar in sync with the formatting at the cursor - contentEditable
  // carries a "current typing style" forward (e.g. text typed right after deleting
  // bold content stays bold), so this is the only way a user can see that state.
  useEffect(() => {
    function updateActive() {
      if (document.activeElement !== editorRef.current) return;
      const next = new Set<string>();
      for (const cmd of TRACKED_COMMANDS) {
        try {
          if (document.queryCommandState(cmd)) next.add(cmd);
        } catch {
          // queryCommandState can throw for unsupported commands in some browsers
        }
      }
      setActive(next);
    }
    document.addEventListener("selectionchange", updateActive);
    return () => document.removeEventListener("selectionchange", updateActive);
  }, []);

  function emit() {
    const html = editorRef.current?.innerHTML ?? "";
    lastEmittedRef.current = html;
    onChange(html);
  }

  function run(command: string, commandValue?: string) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      editorRef.current?.focus();
      document.execCommand(command, false, commandValue);
      emit();
    };
  }

  function toolbarButton(command: string, label: React.ReactNode, title: string) {
    return (
      <button
        type="button"
        onMouseDown={run(command)}
        title={title}
        className={active.has(command) ? "active" : undefined}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="rich-text">
      <div className="rich-toolbar">
        {toolbarButton("bold", <b>B</b>, "Bold")}
        {toolbarButton("italic", <i>I</i>, "Italic")}
        {toolbarButton("underline", <u>U</u>, "Underline")}
        <span className="rich-toolbar-sep" />
        {toolbarButton("insertUnorderedList", <>&bull; List</>, "Bullet list")}
        {toolbarButton("insertOrderedList", "1. List", "Numbered list")}
        <span className="rich-toolbar-sep" />
        <button type="button" onMouseDown={run("removeFormat")} title="Clear formatting">Clear</button>
      </div>
      <div
        ref={editorRef}
        className="rich-text-editable"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
