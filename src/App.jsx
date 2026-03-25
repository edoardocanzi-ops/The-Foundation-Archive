import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FolderOpen, FileText, File, ChevronRight, ChevronDown, 
  Menu, X, Home, BookOpen, Bold, Italic, Heading1, Heading2, 
  List, Type, Sparkles, Loader2, Check, Wand2, Shield, Building, FileUp
} from 'lucide-react';

// --- DATA STRUCTURE ---
const loreTree = [
  { id: 'home', title: 'Archive Home', type: 'system', icon: Home },
  { id: 'notice-board', title: 'FOUNDATION NOTICE BOARD', type: 'doc' },
  {
    id: 'admin-info', title: 'Administrative info', type: 'folder',
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
    id: 'bfaf', title: 'BFAF', type: 'folder',
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
    id: 'visual-archive', title: 'Visual Archive', type: 'folder',
    children: [
      { 
        id: 'ai-online', title: 'AI and Online images', type: 'folder', 
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
    id: 'prin-facility', title: 'Principal Facility Complexes', type: 'folder',
    children: [
      { id: 'heart', title: 'The Heart Complex', type: 'doc' },
      { id: 'brain', title: 'The Brain Complex', type: 'doc' },
      { id: 'intestine', title: 'The Intestine Complex', type: 'doc' },
      { id: 'lungs', title: 'The Lungs Complex', type: 'doc' },
      { id: 'esophagus', title: 'The Esophagus Complex', type: 'doc' },
    ]
  },
  {
    id: 'regions', title: 'The Regions of the Body', type: 'folder',
    children: [
      { id: 'head', title: 'The Head', type: 'folder', iconColor: 'text-amber-400', children: [] },
      { id: 'upper-body', title: 'The Upper Body', type: 'folder', iconColor: 'text-purple-400', children: [] },
      { id: 'lower-body', title: 'The Lower Body', type: 'folder', iconColor: 'text-orange-700', children: [] },
    ]
  }
];

// --- MARKDOWN PARSER ---
const parseMarkdown = (text) => {
  let html = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  const lines = html.split('\n');
  let result = [];
  let inList = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) { result.push('</ul>'); inList = false; }
      if (trimmed.length > 0 && !trimmed.startsWith('<h')) {
        result.push(`<p>${line}</p>`);
      } else if (trimmed.length > 0) {
        result.push(line);
      }
    }
  });
  if (inList) result.push('</ul>');
  return result.join('\n');
};

const Background = () => (
  <div className="fixed inset-0 z-[-1] bg-[#050505] overflow-hidden pointer-events-none">
    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-slate-800/10 blur-[150px]" />
    <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-zinc-700/5 blur-[100px]" />
  </div>
);
const GlassCard = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl ${className}`}>
    {children}
  </div>
);

const SidebarNode = ({ node, level = 0, expandedFolders, toggleFolder, selectDocument, activeDocId }) => {
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = activeDocId === node.id;
  const paddingLeft = `${level * 1.5 + 1}rem`;

  if (node.type === 'system') {
    return (
      <div onClick={() => selectDocument(node)} className={`flex items-center py-2.5 px-4 mx-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'}`}>
        <node.icon className="w-4 h-4 mr-3" />
        <span className="text-sm font-medium tracking-wide">{node.title}</span>
      </div>
    );
  }

  if (node.type === 'folder') {
    let folderIconColor = node.iconColor || "text-neutral-500";
    return (
      <div className="select-none">
        <div onClick={() => toggleFolder(node.id)} className="flex items-center py-2 pr-4 mx-2 rounded-lg cursor-pointer hover:bg-white/5 text-neutral-400 hover:text-neutral-200 transition-colors group" style={{ paddingLeft }}>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 mr-1.5 opacity-50 group-hover:opacity-100" /> : <ChevronRight className="w-3.5 h-3.5 mr-1.5 opacity-50 group-hover:opacity-100" />}
          {isExpanded ? <FolderOpen className={`w-4 h-4 mr-2.5 ${node.iconColor || 'text-blue-400/80'}`} /> : <Folder className={`w-4 h-4 mr-2.5 ${folderIconColor} group-hover:${node.iconColor || 'text-blue-400/80'}`} />}
          <span className="text-[13px] font-medium truncate">{node.title}</span>
        </div>
        {isExpanded && node.children && (
          <div className="mt-1">
            {node.children.map(child => (
              <SidebarNode key={child.id} node={child} level={level + 1} expandedFolders={expandedFolders} toggleFolder={toggleFolder} selectDocument={selectDocument} activeDocId={activeDocId} />
            ))}
          </div>
        )}
      </div>
    );
  }

  let Icon = FileText;
  let iconColor = "text-neutral-500";
  if (node.type === 'pdf') { Icon = File; iconColor = "text-blue-500/80"; }
  if (node.type === 'copyright') { Icon = BookOpen; iconColor = "text-neutral-500"; }

  return (
    <div onClick={() => selectDocument(node)} className={`flex items-center py-2 pr-4 mx-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'}`} style={{ paddingLeft }}>
      <Icon className={`w-4 h-4 mr-2.5 ${isSelected ? 'text-white' : iconColor}`} />
      <span className="text-[13px] truncate">{node.title}</span>
    </div>
  );
};

// --- EDITOR COMPONENT ---
const RichTextEditor = ({ documentId, initialTitle, content, onSave }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showFontDropdown, setShowFontDropdown] = useState(false);

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
      const parsedHtml = parseMarkdown(ev.target.result);
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml.trim() === '' || currentHtml === `<h1>${initialTitle}</h1><p><br></p>`) {
        editorRef.current.innerHTML = parsedHtml;
      } else {
        editorRef.current.innerHTML += `<br/>${parsedHtml}`;
      }
      handleInput();
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center gap-2 p-3 bg-white/[0.02] border-b border-white/[0.05] rounded-t-2xl shrink-0 flex-wrap overflow-x-auto custom-scrollbar">
        <div className="relative">
          <button onClick={() => setShowFontDropdown(!showFontDropdown)} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><Type className="w-4 h-4" /></button>
          {showFontDropdown && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-20 py-1">
              <button className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 font-sans" onClick={() => { execCmd('fontName', 'Inter, system-ui, sans-serif'); setShowFontDropdown(false); }}>Sans</button>
              <button className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 font-serif" onClick={() => { execCmd('fontName', 'Georgia, serif'); setShowFontDropdown(false); }}>Serif</button>
              <button className="w-full text-left px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 font-mono" onClick={() => { execCmd('fontName', 'monospace'); setShowFontDropdown(false); }}>Mono</button>
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-white/10 mx-1"></div>
        <button onClick={() => execCmd('formatBlock', 'H1')} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => execCmd('formatBlock', 'H2')} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><Heading2 className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-white/10 mx-1"></div>
        <button onClick={() => execCmd('bold')} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><Bold className="w-4 h-4" /></button>
        <button onClick={() => execCmd('italic')} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><Italic className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-white/10 mx-1"></div>
        <button onClick={() => execCmd('insertUnorderedList')} className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg"><List className="w-4 h-4" /></button>
        <div className="flex-1"></div>
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center text-sm font-medium whitespace-nowrap"><FileUp className="w-4 h-4 mr-2" />Importa .md</button>
        <input type="file" accept=".md,.txt" className="hidden" ref={fileInputRef} onChange={handleMarkdownImport} />
      </div>
      <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar" onClick={() => { if (editorRef.current) editorRef.current.focus(); }}>
        <div ref={editorRef} contentEditable onInput={handleInput} onBlur={handleInput} className="editor-content outline-none max-w-3xl mx-auto min-h-full" style={{ minHeight: '60vh' }} />
      </div>
    </div>
  );
};
// --- MAIN APP ---
export default function App() {
  const [activeNode, setActiveNode] = useState(loreTree[0]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['admin-info', 'prin-facility', 'regions']));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [documentsContent, setDocumentsContent] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('foundation_archive_data');
    if (saved) setDocumentsContent(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const handleResize = () => { setIsSidebarOpen(window.innerWidth >= 768); };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFolder = (id) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedFolders(next);
  };

  const selectDocument = (node) => {
    setActiveNode(node);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleSaveContent = (id, content) => {
    const newData = { ...documentsContent, [id]: content };
    setDocumentsContent(newData);
    localStorage.setItem('foundation_archive_data', JSON.stringify(newData));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 flex overflow-hidden font-sans">
      <Background />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .editor-content h1 { font-size: 2.2rem; font-weight: 700; margin-bottom: 1.5rem; color: #fff; line-height: 1.2; }
        .editor-content h2 { font-size: 1.5rem; font-weight: 500; margin-top: 2rem; margin-bottom: 1rem; color: #a3a3a3; }
        .editor-content p { margin-bottom: 1rem; line-height: 1.7; color: #d4d4d4; }
        .editor-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; color: #d4d4d4; }
        .editor-content strong { color: #fff; font-weight: 600; }
        .editor-content em { color: #a3a3a3; font-style: italic; }
        .editor-content:empty:before { content: "Inizia a scrivere la lore..."; color: #525252; pointer-events: none; }
        @media (min-width: 768px) { .editor-content h1 { font-size: 2.5rem; } }
      `}} />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar (Responsive!) */}
      <aside className={`fixed md:relative flex-shrink-0 w-80 h-screen z-50 transition-transform duration-300 ease-in-out border-r border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-neutral-200 to-neutral-500 flex items-center justify-center mr-3 shadow-lg">
            <span className="text-[#050505] font-bold text-xs">A</span>
          </div>
          <h1 className="font-semibold text-sm tracking-widest uppercase text-neutral-300 truncate">Archive</h1>
          <button className="ml-auto md:hidden text-neutral-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
          {loreTree.map(node => (
            <SidebarNode key={node.id} node={node} expandedFolders={expandedFolders} toggleFolder={toggleFolder} selectDocument={selectDocument} activeDocId={activeNode?.id} />
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 flex items-center px-4 md:px-8 border-b border-white/5 bg-transparent shrink-0 z-10">
          <button className="mr-4 text-neutral-400 hover:text-white md:hidden" onClick={() => setIsSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <div className="flex items-center text-sm text-neutral-500">
            <span>Archive</span><ChevronRight className="w-3 h-3 mx-2 opacity-50" />
            <span className="text-neutral-300 truncate">{activeNode?.title || 'Unknown'}</span>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-hidden flex flex-col">
          {activeNode.id === 'home' ? (
             <div className="h-full flex items-center justify-center animate-in fade-in duration-700 overflow-y-auto">
               <div className="text-center space-y-8 max-w-4xl mx-auto w-full px-4 py-8">
                 <div className="space-y-4">
                   <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">The Archive.</h1>
                   <p className="text-neutral-400 font-light leading-relaxed max-w-xl mx-auto">
                     Seleziona un file dall'archivio per iniziare a scrivere la lore. Puoi importare i tuoi appunti in Markdown (.md) direttamente nell'editor.
                   </p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 text-left">
                    <GlassCard className="p-6 cursor-pointer hover:bg-white/[0.08] transition-all group border-white/[0.1] hover:border-red-500/30" onClick={() => { const n = loreTree.find(x => x.id === 'bfaf'); if (n) { selectDocument(n); setExpandedFolders(prev => new Set(prev).add('bfaf')); } }}>
                      <div className="flex items-center mb-4">
                          <div className="w-14 h-14 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden shrink-0 shadow-lg bg-white">
                              <img src="/1000013824.png" alt="BFAF Logo" className="w-full h-full object-cover scale-[1.05]" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/fff/000?text=BFAF'; }} />
                          </div>
                          <h3 className="text-xl font-semibold text-white group-hover:text-red-400 transition-colors">BFAF</h3>
                      </div>
                      <p className="text-sm text-neutral-400 leading-relaxed">Accedi agli archivi militari: documenti dell'Esercito, Marina, Aeronautica, CBRN e Forze Speciali della Fondazione.</p>
                    </GlassCard>
                    <GlassCard className="p-6 cursor-pointer hover:bg-white/[0.08] transition-all group border-white/[0.1] hover:border-blue-500/30" onClick={() => { const n = loreTree.find(x => x.id === 'admin-info'); if (n) { selectDocument(n); setExpandedFolders(prev => new Set(prev).add('admin-info')); } }}>
                      <div className="flex items-center mb-4">
                          <div className="w-14 h-14 rounded-full border border-white/10 mr-4 group-hover:scale-110 transition-transform duration-300 overflow-hidden shrink-0 shadow-lg bg-[#0d0d0f]">
                              <img src="/1000013825.png" alt="Organization Logo" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x150/000/fff?text=ADMIN'; }} />
                          </div>
                          <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">Administrative Info</h3>
                      </div>
                      <p className="text-sm text-neutral-400 leading-relaxed">Consulta la struttura organizzativa della Fondazione: Gerarchia, Amministrazione Regionale e Livelli DEFCON.</p>
                    </GlassCard>
                 </div>
               </div>
             </div>
          ) : (
            <GlassCard className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
              <RichTextEditor key={activeNode.id} documentId={activeNode.id} initialTitle={activeNode.title} content={documentsContent[activeNode.id] || ''} onSave={handleSaveContent} />
            </GlassCard>
          )}
        </div>
      </main>
    </div>
  );
}
