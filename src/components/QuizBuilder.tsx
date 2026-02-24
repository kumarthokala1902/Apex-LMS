import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, CheckCircle2, Circle, Settings2, Save, X } from 'lucide-react';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'TF';
  points: number;
  options: Option[];
}

export const QuizBuilder = ({ onSave, onCancel }: any) => {
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [randomize, setRandomize] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = (type: 'MCQ' | 'TF') => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      type,
      points: 1,
      options: type === 'TF' 
        ? [
            { id: crypto.randomUUID(), text: 'True', isCorrect: true },
            { id: crypto.randomUUID(), text: 'False', isCorrect: false }
          ]
        : [
            { id: crypto.randomUUID(), text: '', isCorrect: true },
            { id: crypto.randomUUID(), text: '', isCorrect: false }
          ]
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: [...q.options, { id: crypto.randomUUID(), text: '', isCorrect: false }]
        };
      }
      return q;
    }));
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<Option>) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.map(opt => {
            if (opt.id === optionId) {
              return { ...opt, ...updates };
            }
            // If setting this option as correct, unset others for MCQ
            if (updates.isCorrect && q.type === 'MCQ') {
              return { ...opt, isCorrect: false };
            }
            return opt;
          })
        };
      }
      return q;
    }));
  };

  const handleSave = () => {
    onSave({ title, passingScore, randomize, questionCount, questions });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Quiz Builder</h1>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-6 py-3 rounded-2xl border border-slate-200 font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all">
            <Save size={20} />
            Save Quiz
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Quiz Title</label>
            <input 
              type="text" 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              placeholder="e.g. Final Assessment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Passing Score (%)</label>
            <input 
              type="number" 
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center gap-8 pt-4 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${randomize ? 'bg-brand-primary border-brand-primary' : 'border-slate-300 group-hover:border-slate-400'}`}>
              {randomize && <CheckCircle2 size={16} className="text-white" />}
            </div>
            <input type="checkbox" className="hidden" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} />
            <span className="font-medium text-slate-700">Randomize Questions</span>
          </label>
          
          {randomize && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Pick</span>
              <input 
                type="number" 
                className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              />
              <span className="text-sm text-slate-500">questions from bank</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {questions.map((q, idx) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative group"
            >
              <button 
                onClick={() => removeQuestion(q.id)}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                  {idx + 1}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full uppercase tracking-wider">
                  {q.type}
                </span>
              </div>

              <textarea 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all mb-6 text-lg font-medium resize-none"
                placeholder="Enter your question here..."
                rows={2}
                value={q.text}
                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
              />

              <div className="space-y-3">
                {q.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-4">
                    <button 
                      onClick={() => updateOption(q.id, opt.id, { isCorrect: true })}
                      className={`p-2 rounded-full transition-colors ${opt.isCorrect ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      {opt.isCorrect ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    <input 
                      type="text" 
                      className={`flex-1 px-4 py-3 rounded-xl border transition-all outline-none ${opt.isCorrect ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-slate-200 focus:border-brand-primary'}`}
                      placeholder="Option text..."
                      value={opt.text}
                      onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                      disabled={q.type === 'TF'}
                    />
                    {q.type === 'MCQ' && q.options.length > 2 && (
                      <button 
                        onClick={() => {
                          const newOptions = q.options.filter(o => o.id !== opt.id);
                          updateQuestion(q.id, { options: newOptions });
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                
                {q.type === 'MCQ' && (
                  <button 
                    onClick={() => addOption(q.id)}
                    className="flex items-center gap-2 text-brand-primary text-sm font-bold mt-4 hover:underline ml-12"
                  >
                    <Plus size={16} />
                    Add Option
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => addQuestion('MCQ')}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all group"
          >
            <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold">Multiple Choice</span>
          </button>
          <button 
            onClick={() => addQuestion('TF')}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all group"
          >
            <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold">True / False</span>
          </button>
        </div>
      </div>
    </div>
  );
};
