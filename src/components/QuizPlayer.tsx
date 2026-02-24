import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, ChevronRight, ChevronLeft } from 'lucide-react';

export const QuizPlayer = ({ quizId, userId, onComplete }: any) => {
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quizzes/${quizId}`)
      .then(res => res.json())
      .then(data => {
        setQuiz(data);
        setLoading(false);
      });
  }, [quizId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, answers })
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">Preparing your assessment...</p>
    </div>
  );

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl text-center max-w-2xl mx-auto"
      >
        <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-8 ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {result.passed ? <Award size={48} /> : <XCircle size={48} />}
        </div>
        
        <h2 className="text-4xl font-bold mb-2">{result.passed ? 'Congratulations!' : 'Keep Practicing'}</h2>
        <p className="text-slate-500 text-lg mb-10">
          {result.passed 
            ? `You passed the assessment with a score of ${result.score}%!` 
            : `You scored ${result.score}%, but you need ${result.passingScore}% to pass.`}
        </p>

        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-50 p-6 rounded-3xl">
            <p className="text-sm text-slate-500 mb-1">Your Score</p>
            <p className={`text-3xl font-bold ${result.passed ? 'text-emerald-600' : 'text-red-600'}`}>{result.score}%</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl">
            <p className="text-sm text-slate-500 mb-1">Passing Score</p>
            <p className="text-3xl font-bold text-slate-900">{result.passingScore}%</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!result.passed && (
            <button 
              onClick={() => { setResult(null); setCurrentQuestionIdx(0); setAnswers({}); }}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              <RotateCcw size={20} />
              Try Again
            </button>
          )}
          <button 
            onClick={() => onComplete(result)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all"
          >
            {result.passed ? 'Continue to Next Lesson' : 'Back to Course'}
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === quiz.questions.length - 1;
  const progress = ((currentQuestionIdx + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1 block">Question {currentQuestionIdx + 1} of {quiz.questions.length}</span>
            <h2 className="text-2xl font-bold text-slate-900">{quiz.title}</h2>
          </div>
          <span className="text-sm font-bold text-slate-400">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-brand-primary rounded-full"
          />
        </div>
      </div>

      <motion.div 
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm"
      >
        <h3 className="text-2xl font-bold text-slate-900 mb-10 leading-snug">
          {currentQuestion.text}
        </h3>

        <div className="space-y-4">
          {currentQuestion.options.map((option: any) => (
            <button
              key={option.id}
              onClick={() => handleSelectOption(currentQuestion.id, option.id)}
              className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all text-left group ${
                answers[currentQuestion.id] === option.id
                  ? 'bg-brand-primary/5 border-brand-primary text-brand-primary'
                  : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-lg font-medium">{option.text}</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                answers[currentQuestion.id] === option.id
                  ? 'bg-brand-primary border-brand-primary'
                  : 'border-slate-200 group-hover:border-slate-300'
              }`}>
                {answers[currentQuestion.id] === option.id && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex items-center justify-between pt-4">
        <button
          disabled={currentQuestionIdx === 0}
          onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
          className="flex items-center gap-2 px-6 py-3 text-slate-500 font-bold hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
          Previous
        </button>

        {isLastQuestion ? (
          <button
            disabled={!answers[currentQuestion.id]}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-10 py-4 bg-brand-primary text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Submit Assessment
            <CheckCircle2 size={20} />
          </button>
        ) : (
          <button
            disabled={!answers[currentQuestion.id]}
            onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
            className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Question
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
