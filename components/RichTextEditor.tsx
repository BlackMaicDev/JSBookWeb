"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code2, Heading1, Heading2, Heading3, Highlighter, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Pilcrow, Quote, Redo2, RemoveFormatting, Strikethrough, Underline, Undo2, Upload } from "lucide-react";

type Props = { id: string; initialHtml: string; onChange: (html: string) => void; onUploadImage?: (file: File) => Promise<string>; onUploadStateChange?: (uploading: boolean) => void; placeholder?: string };
type Tool = { label: string; icon: React.ComponentType<{ size?: number }>; run: () => void; active?: boolean };
const IMAGE_SIZES = [
  { label: "เล็ก", width: 240 },
  { label: "กลาง", width: 480 },
  { label: "ใหญ่", width: 720 },
  { label: "เต็มความกว้าง", width: 1200 },
] as const;

export default function RichTextEditor({ id, initialHtml, onChange, onUploadImage, onUploadStateChange, placeholder }: Props) {
  const [insertMode, setInsertMode] = useState<"link" | "image" | null>(null);
  const [url, setUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      Image,
      TextStyle,
      Color,
      FontSize,
    ],
    content: initialHtml || "<p></p>",
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
    editorProps: { attributes: { id, class: "rich-editor-content", "aria-label": placeholder || "เนื้อหา" } },
  });

  if (!editor) return <div className="rich-editor-loading">กำลังเปิดเครื่องมือเขียน...</div>;

  const tools: Tool[][] = [
    [
      { label: "ย่อหน้า", icon: Pilcrow, run: () => editor.chain().focus().setParagraph().run(), active: editor.isActive("paragraph") },
      { label: "หัวข้อใหญ่", icon: Heading1, run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
      { label: "หัวข้อรอง", icon: Heading2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
      { label: "หัวข้อย่อย", icon: Heading3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    ],
    [
      { label: "ตัวหนา", icon: Bold, run: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
      { label: "ตัวเอียง", icon: Italic, run: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
      { label: "ขีดเส้นใต้", icon: Underline, run: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
      { label: "ขีดฆ่า", icon: Strikethrough, run: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
      { label: "ไฮไลต์", icon: Highlighter, run: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive("highlight") },
      { label: "โค้ด", icon: Code2, run: () => editor.chain().focus().toggleCode().run(), active: editor.isActive("code") },
    ],
    [
      { label: "รายการจุด", icon: List, run: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
      { label: "รายการตัวเลข", icon: ListOrdered, run: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
      { label: "ข้อความอ้างอิง", icon: Quote, run: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
      { label: "เส้นคั่น", icon: Minus, run: () => editor.chain().focus().setHorizontalRule().run() },
    ],
    [
      { label: "ชิดซ้าย", icon: AlignLeft, run: () => editor.chain().focus().setTextAlign("left").run(), active: editor.isActive({ textAlign: "left" }) },
      { label: "กึ่งกลาง", icon: AlignCenter, run: () => editor.chain().focus().setTextAlign("center").run(), active: editor.isActive({ textAlign: "center" }) },
      { label: "ชิดขวา", icon: AlignRight, run: () => editor.chain().focus().setTextAlign("right").run(), active: editor.isActive({ textAlign: "right" }) },
      { label: "กระจายเต็มบรรทัด", icon: AlignJustify, run: () => editor.chain().focus().setTextAlign("justify").run(), active: editor.isActive({ textAlign: "justify" }) },
    ],
  ];

  function insertUrl() {
    const value = url.trim();
    if (!/^https?:\/\//i.test(value) || (insertMode === "image" && !/^https:\/\//i.test(value))) return;
    if (insertMode === "image") editor?.chain().focus().setImage({ src: value, width: 480 }).run();
    if (insertMode === "link") editor?.chain().focus().extendMarkRange("link").setLink({ href: value, target: "_blank" }).run();
    setInsertMode(null);
    setUrl("");
  }

  async function insertUploadedImage(file: File | undefined) {
    if (!file || !onUploadImage) return;
    setUploadError("");
    setUploadingImage(true);
    onUploadStateChange?.(true);
    try {
      const imageUrl = await onUploadImage(file);
      editor?.chain().focus().setImage({ src: imageUrl, alt: file.name.replace(/\.[^.]+$/, ""), width: 480 }).run();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "อัปโหลดภาพไม่สำเร็จ");
    } finally {
      setUploadingImage(false);
      onUploadStateChange?.(false);
    }
  }

  const imageSelected = editor.isActive("image");
  const selectedImageWidth = Number(editor.getAttributes("image").width);

  return <div className="rich-editor">
    <div className="rich-editor-toolbar" role="toolbar" aria-label="เครื่องมือจัดรูปแบบ">
      {tools.map((group, index) => <div className="rich-editor-tools" key={index}>{group.map((tool) => <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} aria-pressed={Boolean(tool.active)} className={tool.active ? "is-active" : ""} onClick={tool.run}><tool.icon size={17} /></button>)}</div>)}
      <div className="rich-editor-tools">
        <button type="button" title="เพิ่มลิงก์" aria-label="เพิ่มลิงก์" aria-pressed={editor.isActive("link")} onClick={() => { setInsertMode("link"); setUrl(editor.getAttributes("link").href || ""); }}><Link2 size={17} /></button>
        <button type="button" className="rich-editor-image-button" title="แทรกรูปจากลิงก์" aria-label="แทรกรูปจากลิงก์" onClick={() => { setInsertMode("image"); setUrl(""); }}><ImagePlus size={17} /><span>รูปจากลิงก์</span></button>
        {onUploadImage && <><button type="button" className="rich-editor-image-button rich-editor-upload-button" title="เลือกรูปจากเครื่อง" aria-label="เลือกรูปจากเครื่อง" disabled={uploadingImage} onClick={() => imageInput.current?.click()}><Upload size={17} /><span>เลือกรูปจากเครื่อง</span></button><input ref={imageInput} className="rich-editor-upload-input" type="file" accept="image/webp,image/png,image/jpeg" aria-label="เลือกรูปสำหรับเนื้อหา" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void insertUploadedImage(file); }} /></>}
        <label className="rich-editor-color" title="สีตัวอักษร"><span>สี</span><input type="color" aria-label="สีตัวอักษร" defaultValue="#59445f" onChange={(event) => editor.chain().focus().setColor(event.target.value).run()} /></label>
        <select className="rich-editor-font-size" aria-label="ขนาดตัวอักษร" title="ขนาดตัวอักษร" value={editor.getAttributes("textStyle").fontSize || ""} onChange={(event) => event.target.value ? editor.chain().focus().setFontSize(event.target.value).run() : editor.chain().focus().unsetFontSize().run()}><option value="">ขนาด</option><option value="14px">14</option><option value="16px">16</option><option value="18px">18</option><option value="22px">22</option><option value="28px">28</option></select>
      </div>
      <div className="rich-editor-tools">
        <button type="button" title="ล้างรูปแบบ" aria-label="ล้างรูปแบบ" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={17} /></button>
        <button type="button" title="ย้อนกลับ" aria-label="ย้อนกลับ" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={17} /></button>
        <button type="button" title="ทำซ้ำ" aria-label="ทำซ้ำ" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={17} /></button>
      </div>
    </div>
    <div className="rich-editor-image-size" role="group" aria-label="ปรับขนาดรูปภาพ">
      <span>{imageSelected ? "ขนาดรูปที่เลือก" : "คลิกรูปเพื่อปรับขนาด"}</span>
      {IMAGE_SIZES.map(({ label, width }) => <button key={width} type="button" disabled={!imageSelected} aria-pressed={imageSelected && selectedImageWidth === width} onClick={() => editor.chain().focus().updateAttributes("image", { width, height: null }).run()}>{label}</button>)}
    </div>
    {insertMode && <div className="rich-editor-insert"><label htmlFor={`${id}-url`}>{insertMode === "link" ? "ลิงก์" : "URL รูปภาพ"}</label><input id={`${id}-url`} type="url" placeholder="https://..." value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); insertUrl(); } }} autoFocus required /><button type="button" onClick={insertUrl}>แทรก</button><button type="button" onClick={() => setInsertMode(null)}>ยกเลิก</button></div>}
    {uploadingImage && <p className="rich-editor-upload-status" role="status">กำลังย่อและอัปโหลดรูป...</p>}
    {uploadError && <p className="rich-editor-upload-error" role="alert">{uploadError}</p>}
    <EditorContent editor={editor} />
    <p className="rich-editor-hint">คลิกรูปในเนื้อหาแล้วเลือกขนาดด้านบน เพิ่มรูปจากเครื่องหรือใช้ HTTPS URL ได้</p>
  </div>;
}
