import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Video, 
  FileText, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Save,
  Layout,
  Eye,
  X
} from 'lucide-react';
import { QuizPlayer } from './QuizPlayer';
import { useAuth } from '../AuthContext';

export const CourseBuilder = ({ onSave, onCancel }: any) => {
  const { user } = useAuth();
  const [courseTitle, setCourseTitle] = useState('');
  const [previewQuizId, setPreviewQuizId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<{moduleId: string, lessonId: string, title: string, content: string} | null>(null);
  const [modules, setModules] = useState<any[]>([
    {
      id: crypto.randomUUID(),
      title: 'Introduction',
      lessons: [
        { id: crypto.randomUUID(), title: 'Welcome Video', type: 'VIDEO', content: '' }
      ]
    }
  ]);

  const addModule = () => {
    setModules([...modules, {
      id: crypto.randomUUID(),
      title: 'New Module',
      lessons: []
    }]);
  };

  const addLesson = (moduleId: string, type: 'VIDEO' | 'TEXT' | 'QUIZ') => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: [...m.lessons, { id: crypto.randomUUID(), title: 'New Lesson', type, content: '' }]
        };
      }
      return m;
    }));
  };

  const updateModuleTitle = (id: string, title: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, title } : m));
  };

  const updateLessonTitle = (moduleId: string, lessonId: string, title: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map((l: any) => l.id === lessonId ? { ...l, title } : l)
        };
      }
      return m;
    }));
  };

  const updateLessonContent = (moduleId: string, lessonId: string, content: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map((l: any) => l.id === lessonId ? { ...l, content } : l)
        };
      }
      return m;
    }));
  };

  const removeModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.filter((l: any) => l.id !== lessonId)
        };
      }
      return m;
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
            <Layout size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Builder</h1>
            <p className="text-slate-500">Design your curriculum structure</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-6 py-3 rounded-2xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onSave({ title: courseTitle, modules })}
            className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all"
          >
            <Save size={20} />
            Publish Course
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Course Title</label>
        <input 
          type="text" 
          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
          placeholder="e.g. Advanced System Design"
          value={courseTitle}
          onChange={(e) => setCourseTitle(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {modules.map((module, mIdx) => (
            <motion.div 
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
                <GripVertical className="text-slate-300 cursor-grab" size={20} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Module {mIdx + 1}</span>
                <input 
                  type="text" 
                  className="flex-1 bg-transparent font-bold text-lg outline-none focus:text-brand-primary transition-colors"
                  value={module.title}
                  onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                />
                <button 
                  onClick={() => removeModule(module.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="p-6 space-y-3">
                {module.lessons.map((lesson: any, lIdx: number) => (
                  <div key={lesson.id} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl group hover:border-brand-primary/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/5 group-hover:text-brand-primary transition-colors">
                      {lesson.type === 'VIDEO' ? <Video size={18} /> : 
                       lesson.type === 'TEXT' ? <FileText size={18} /> : 
                       <HelpCircle size={18} />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text" 
                        className="w-full font-medium text-slate-700 outline-none"
                        value={lesson.title}
                        onChange={(e) => updateLessonTitle(module.id, lesson.id, e.target.value)}
                        placeholder="Lesson Title"
                      />
                      {lesson.type === 'VIDEO' && (
                        <input 
                          type="text" 
                          className="w-full text-xs text-slate-400 outline-none bg-transparent"
                          value={lesson.content}
                          onChange={(e) => updateLessonContent(module.id, lesson.id, e.target.value)}
                          placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                        />
                      )}
                    </div>
                    {lesson.type === 'TEXT' && (
                      <button 
                        onClick={() => setEditingLesson({ moduleId: module.id, lessonId: lesson.id, title: lesson.title, content: lesson.content || '' })}
                        className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-white transition-all"
                      >
                        <FileText size={14} />
                        Edit Content
                      </button>
                    )}
                    {lesson.type === 'QUIZ' && (
                      <button 
                        onClick={() => setPreviewQuizId('quiz-1')} // Using dummy ID for now as per previous implementation
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                    )}
                    <button 
                      onClick={() => removeLesson(module.id, lesson.id)}
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    onClick={() => addLesson(module.id, 'VIDEO')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm font-bold hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    <Plus size={16} />
                    Add Video
                  </button>
                  <button 
                    onClick={() => addLesson(module.id, 'TEXT')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm font-bold hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    <Plus size={16} />
                    Add Text
                  </button>
                  <button 
                    onClick={() => addLesson(module.id, 'QUIZ')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm font-bold hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    <Plus size={16} />
                    Add Quiz
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button 
          onClick={addModule}
          className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
        >
          <Plus size={24} />
          Add New Module
        </button>
      </div>

      <AnimatePresence>
        {editingLesson && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Edit Lesson Content</h2>
                  <p className="text-sm text-slate-500">{editingLesson.title}</p>
                </div>
                <button 
                  onClick={() => setEditingLesson(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Text Content</label>
                <textarea 
                  className="w-full h-64 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all resize-none font-sans leading-relaxed"
                  placeholder="Enter your lesson content here..."
                  value={editingLesson.content}
                  onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                />
              </div>

              <div className="p-8 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => setEditingLesson(null)}
                  className="px-6 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    updateLessonContent(editingLesson.moduleId, editingLesson.lessonId, editingLesson.content);
                    setEditingLesson(null);
                  }}
                  className="px-8 py-2 bg-brand-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all"
                >
                  Save Content
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {previewQuizId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-y-auto relative p-12"
            >
              <button 
                onClick={() => setPreviewQuizId(null)}
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
              
              <div className="mb-8">
                <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">
                  Preview Mode
                </span>
                <h2 className="text-2xl font-bold mt-2">Quiz Preview</h2>
              </div>

              <QuizPlayer 
                quizId={previewQuizId} 
                userId={user?.id} 
                onComplete={() => setPreviewQuizId(null)} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
