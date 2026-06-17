import { useState } from 'react';
import { PersonalNote } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, Calendar, Edit3, X, FileText, Check } from 'lucide-react';

interface NotesProps {
  notes: PersonalNote[];
  onAddNote: (title: string, body: string) => void;
  onUpdateNote: (id: string, title: string, body: string) => void;
  onDeleteNote: (id: string) => void;
}

export default function Notes({ notes, onAddNote, onUpdateNote, onDeleteNote }: NotesProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal editor states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: PersonalNote) => {
    setEditingId(note.id);
    setTitle(note.title);
    setBody(note.body);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!title && !body) return;
    
    if (editingId) {
      onUpdateNote(editingId, title || 'Без названия', body);
    } else {
      onAddNote(title || 'Без названия', body);
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col space-y-4 max-w-[540px] md:max-w-[720px] xl:max-w-[1020px] mx-auto px-4 pb-28">
      {/* Search and add floating header */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Поиск по заметкам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#14141b]/90 border border-white/5 rounded-2xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          className="w-12 h-12 bg-gradient-to-r from-red-500 to-[#ff6b6b] rounded-2xl flex items-center justify-center text-white active:scale-95 transition cursor-pointer shadow-lg shadow-red-500/10"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* List cards view */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <FileText className="w-12 h-12 text-gray-600 mb-2" />
          <p className="text-sm font-semibold">
            {search ? 'Ничего не найдено' : 'Список заметок пуст'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleOpenEdit(note)}
                className="bg-[#14141b]/90 border border-white/5 p-5 rounded-2xl shadow-md cursor-pointer hover:bg-[#1a1a24] active:scale-[0.99] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <h4 className="font-extrabold text-sm text-gray-200 line-clamp-1">
                      {note.title}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {note.date.split(',')[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {note.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Editor Modal Sheet */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            {/* Backdrop cover */}
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
            
            <motion.div
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-[#14141b] border-t md:border border-white/5 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* iOS style sheet drag handle */}
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 md:hidden" />

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-100">
                  {editingId ? 'Редактировать заметку' : 'Новая заметка'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">
                    Заголовок
                  </label>
                  <input
                    type="text"
                    placeholder="Название заметки..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0e] border border-white/5 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400 transition font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">
                    Текст заметки
                  </label>
                  <textarea
                    placeholder="Введите текст вашей заметки..."
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a0a0e] border border-white/5 rounded-xl text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400 transition text-sm leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  {editingId ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteNote(editingId);
                        setIsModalOpen(false);
                      }}
                      className="py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold text-sm rounded-xl cursor-pointer hover:bg-red-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Удалить
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="py-3.5 bg-white/5 text-gray-400 font-extrabold text-sm rounded-xl cursor-pointer hover:bg-white/10 active:scale-95 transition"
                    >
                      Отмена
                    </button>
                  )}

                  <button
                    onClick={handleSave}
                    className="py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-sm rounded-xl cursor-pointer hover:from-amber-300 hover:to-amber-400 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
                  >
                    <Check className="w-4 h-4" />
                    Сохранить
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
