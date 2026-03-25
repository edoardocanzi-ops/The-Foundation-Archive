import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FolderOpen, FileText, File, ChevronRight, ChevronDown, 
  Menu, X, Home, BookOpen, Bold, Italic, Heading1, Heading2, 
  List, Type, Sparkles, Loader2, Check, Wand2, Shield, Building, FileUp
} from 'lucide-react';

// --- STRUTTURA ARCHIVIO ---
const loreTree = [
  { id: 'home', title: 'Archive Home', type: 'system', icon: Home },
  { id: 'notice-board', title: 'FOUNDATION NOTICE BOARD', type: 'doc' },
  {
    id: 'admin-info',
    title: 'Administrative info',
    type: 'folder',
    children: [
      { id: 'gen-org', title: 'General Organization', type: 'doc' },
      { id: 'gen-hierarchy', title: 'General Hierarchy', type: 'doc' },
      { id: 'regions-body-admin', title: 'Regions of the Body', type: 'doc' },
      { id: 'reg-admin', title: 'Regional Administration', type: 'doc' },
      { id: 'id-officer', title: 'The Identity Officer [REDACTED]', type: 'doc' },
      { id: 'defcon', title: 'DEFCON', type: 'doc' },
    ]
  },
  {
    id: 'bfaf',
    title: 'BFAF',
    type: 'folder',
    children: [
      { id: 'army', title: 'Army Document', type: 'doc' },
      { id: 'navy', title: 'Navy Document', type: 'doc' },
      { id: 'air-force', title: 'Air Force Document', type: 'doc' },
      { id: 'nu-7', title: 'NU-7 Document', type: 'doc' },
      { id: 'cbrn', title: 'CBRN Document', type: 'doc' },
      { id: 'high-command', title: 'High Command Document', type: 'doc' },
      { id: 'delta-force', title: 'DELTA FORCE DOCUMENT', type: 'doc' },
    ]
  },
  {
    id: 'visual-archive',
    title: 'Visual Archive',
    type: 'folder',
    children: [
      { 
        id: 'ai-online', 
        title: 'AI and Online images', 
        type: 'folder', 
        children: [
          { id: 'armed-forces', title: 'ARMED FORCES', type: 'doc' },
          { id: 'armed-forces-officers', title: 'ARMED FORCES OFFICERS', type: 'doc' },
          { id: 'gov-officials', title: 'GOVERNMENT OFFICIALS', type: 'doc' },
          { id: 'foundations-machinery', title: 'FOUNDATION\'S MACHINERY', type: 'doc' }
        ] 
      }
    ]
  },
  {
    id: 'prin-facility',
    title: 'Principal Facility Complexes',
    type: 'folder',
    children: [
      { id: 'heart', title: 'The Heart Complex', type: 'doc' },
      { id: 'brain', title: 'The Brain Complex', type: 'doc' },
      { id: 'intestine', title: 'The Intestine Complex', type: 'doc' },
      { id: 'lungs', title: 'The Lungs Complex', type: 'doc' },
      { id: 'esophagus', title: 'The Esophagus Complex', type: 'doc' },
    ]
  },
  {
    id: 'regions',
    title: 'The Regions of the Body',
    type: 'folder',
    children: [
      { id: 'head', title: 'The Head', type: 'folder', iconColor: 'text-amber-400', children: [] },
      { id: 'upper-body', title: 'The Upper Body', type: 'folder', iconColor: 'text-purple-400', children: [] },
      { id: 'lower-body', title: 'The Lower Body', type: 'folder', iconColor: 'text-orange-700', children: [] },
    ]
  }
];

// --- AI & PARSER ---
const apiKey = "LA_TUA_API_KEY_GEMINI"; // Se non ce l'hai, l'IA non funzionerà, ma la scrittura sì.

const parseMarkdown = (text) => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>').replace(/\*(.*?)\*/gim, '<em>$1</em>');
  const lines = html.split('\n');
  let result = [];
  lines.forEach(line => {
    if (line.trim().startsWith('- ')) result.push(`<li>${line.trim().substring(2)}</li>`);
    else if (line.trim().length > 0) result.push(`<p>${line}</p>`);
  });
  return result.join('\n');
};

// --- EDITOR COMPONENT ---
const RichTextEditor = ({ documentId, initialTitle, content, onSave }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content || `<h1>${initialTitle}</h1><p><br></p>`;
    }
  }, [documentId]);

  const handleInput = () => { onSave(documentId, editorRef.current.innerHTML); };
  const execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val); editorRef.current.focus(); handleInput(); };

  const handleMarkdownImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      editorRef.current.innerHTML += `<br/>${parseMarkdown(ev.target.result)}`;
      handleInput();
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center gap-2 p-3 bg-white/[0.02] border-b border-white/[0.05] rounded-t-2xl shrink-0 flex-wrap">
        <button onClick={() => execCmd('formatBlock', 'H1')} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><Heading1 className="w-4 h-4"/></button>
        <button onClick={() => execCmd('bold')} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><Bold className="w-4 h-4"/></button>
        <button onClick={() => execCmd('insertUnorderedList')} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><List className="w-4 h-4"/></button>
        <div className="flex-1"></div>
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-neutral-400 hover:text-white flex items-center text-sm"><FileUp className="w-4 h-4 mr-2"/>Importa .md</button>
        <input type="file" accept=".md,.txt" className="hidden" ref={fileInputRef} onChange={handleMarkdownImport} />
      </div>
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div ref={editorRef} contentEditable onInput={handleInput} className="editor-content outline-none max-w-3xl mx-auto min-h-full" />
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [activeNode, setActiveNode] = useState(loreTree[0]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['admin-info', 'bfaf']));
  const [documentsContent, setDocumentsContent] = useState({});

  // CARICA DA LOCALSTORAGE
  useEffect(() => {
    const saved = localStorage.getItem('foundation_archive_data');
    if (saved) setDocumentsContent(JSON.parse(saved));
  }, []);

  const handleSaveContent = (id, content) => {
    const newData = { ...documentsContent, [id]: content };
    setDocumentsContent(newData);
    localStorage.setItem('foundation_archive_data', JSON.stringify(newData));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/5 font-bold tracking-widest text-sm text-neutral-400 uppercase">Archive</div>
        <div className="flex-1 overflow-y-auto py-4">
          {loreTree.map(node => (
            <div key={node.id} onClick={() => setActiveNode(node)} className={`px-6 py-2 cursor-pointer text-sm ${activeNode.id === node.id ? 'text-white bg-white/5' : 'text-neutral-500'}`}>
              {node.title}
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeNode.id === 'home' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12">
            <h1 className="text-6xl font-bold tracking-tighter text-white">The Archive.</h1>
            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
              <div onClick={() => setActiveNode(loreTree.find(n => n.id === 'bfaf'))} className="p-8 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10">
                <img src="/1000013824.png" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
                <h3 className="font-bold">BFAF</h3>
              </div>
              <div onClick={() => setActiveNode(loreTree.find(n => n.id === 'admin-info'))} className="p-8 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10">
                <img src="/1000013825.png" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
                <h3 className="font-bold">Administrative Info</h3>
              </div>
            </div>
          </div>
        ) : (
          <RichTextEditor key={activeNode.id} documentId={activeNode.id} initialTitle={activeNode.title} content={documentsContent[activeNode.id]} onSave={handleSaveContent} />
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .editor-content h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #fff; }
        .editor-content p { margin-bottom: 1rem; line-height: 1.7; color: #d4d4d4; }
        .editor-content ul { list-style: disc; margin-left: 1.5rem; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
}

