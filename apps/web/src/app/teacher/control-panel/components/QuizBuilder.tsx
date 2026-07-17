'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export default function QuizBuilder() {
  const [questions, setQuestions] = useState([{ text: '', points: 1 }]);

  const addQuestion = () => setQuestions([...questions, { text: '', points: 1 }]);

  const updateQuestion = (index: number, field: string, value: string | number) => {
    const newQuestions = [...questions];
    newQuestions[index][field as keyof typeof newQuestions[0]] = value as never;
    setQuestions(newQuestions);
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
      <h3 className="text-xl font-bold">Quiz Builder</h3>
      {questions.map((q, index) => (
        <div key={index} className="flex gap-4 items-center">
          <input 
            placeholder="Question text" 
            className="flex-1 p-3 bg-gray-50 rounded-xl border"
            onChange={(e) => updateQuestion(index, 'text', e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Pts" 
            className="w-20 p-3 bg-gray-50 rounded-xl border"
            onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
          />
        </div>
      ))}
      <Button onClick={addQuestion} variant="outline" className="w-full gap-2">
        <Plus size={16} /> Add Question
      </Button>
      <Button className="w-full bg-green-600">Save Quiz & Points</Button>
    </div>
  );
}