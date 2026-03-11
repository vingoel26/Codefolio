import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
    Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus, Undo, Redo, Link as LinkIcon,
    Image as ImageIcon, Code2
} from 'lucide-react';

const lowlight = createLowlight(common);

export default function TipTapEditor({ content, onChange, placeholder = 'Start writing...' }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            CodeBlockLowlight.configure({ lowlight }),
            Placeholder.configure({ placeholder }),
            Link.configure({ openOnClick: false }),
            Image,
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
    });

    if (!editor) return null;

    const addImage = () => {
        const url = window.prompt('Enter image URL:');
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };

    const addLink = () => {
        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const ToolBtn = ({ onClick, active, children, title }) => (
        <button
            type="button"
            className={`editor-toolbar-btn ${active ? 'active' : ''}`}
            onClick={onClick}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div className="tiptap-editor">
            <div className="editor-toolbar">
                <div className="editor-toolbar-group">
                    <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                        <Bold size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                        <Italic size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                        <Strikethrough size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
                        <Code size={16} />
                    </ToolBtn>
                </div>

                <div className="editor-toolbar-divider" />

                <div className="editor-toolbar-group">
                    <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                        <Heading1 size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                        <Heading2 size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                        <Heading3 size={16} />
                    </ToolBtn>
                </div>

                <div className="editor-toolbar-divider" />

                <div className="editor-toolbar-group">
                    <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                        <List size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
                        <ListOrdered size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
                        <Quote size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
                        <Minus size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                        <Code2 size={16} />
                    </ToolBtn>
                </div>

                <div className="editor-toolbar-divider" />

                <div className="editor-toolbar-group">
                    <ToolBtn onClick={addLink} active={editor.isActive('link')} title="Link">
                        <LinkIcon size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={addImage} title="Image">
                        <ImageIcon size={16} />
                    </ToolBtn>
                </div>

                <div className="editor-toolbar-spacer" />

                <div className="editor-toolbar-group">
                    <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
                        <Undo size={16} />
                    </ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
                        <Redo size={16} />
                    </ToolBtn>
                </div>
            </div>
            <EditorContent editor={editor} className="editor-content" />
        </div>
    );
}
