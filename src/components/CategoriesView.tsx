import React, { useState } from 'react';
import { Plus, Tags, Check } from 'lucide-react';
import { Category, EventItem, User } from '../types';

interface CategoriesViewProps {
  user: User;
  categories: Category[];
  events: EventItem[];
  onAddCategory: (category: Category) => void;
  onFilterByCategory: (categoryId: string) => void;
}

const PALETTE = [
  '#2563EB', // Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Purple
  '#9333EA', // Violet
  '#C026D3', // Fuchsia
  '#E11D48', // Rose
  '#EA580C', // Orange
  '#D97706', // Amber
  '#059669', // Emerald
  '#0D9488', // Teal
  '#0284C7', // Sky
  '#475569', // Slate
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  user,
  categories,
  events,
  onAddCategory,
  onFilterByCategory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setErrorMsg('Please enter a category name');
      return;
    }

    if (
      categories.some(
        (c) => c.name.toLowerCase() === newCatName.trim().toLowerCase()
      )
    ) {
      setErrorMsg('A category with this name already exists');
      return;
    }

    const newCat: Category = {
      id: `cat_${Date.now()}`,
      userId: user.id,
      name: newCatName.trim(),
      color: selectedColor,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    onAddCategory(newCat);
    setNewCatName('');
    setErrorMsg('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Categories
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize and color-code your personal and professional events
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const count = events.filter((e) => e.categoryId === cat.id).length;
          return (
            <div
              key={cat.id}
              onClick={() => onFilterByCategory(cat.id)}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex items-start justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="tabular-nums">{count} {count === 1 ? 'event' : 'events'}</span>
                    {cat.isDefault && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[11px] text-slate-400">Default</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="w-3 h-3 rounded-full mt-1.5"
                style={{ backgroundColor: cat.color }}
              />
            </div>
          );
        })}
      </div>

      {/* Create Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Category</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Research, Hobbies, Finances"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {errorMsg && (
                  <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Accent Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
                      style={{ backgroundColor: c }}
                    >
                      {selectedColor === c && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
