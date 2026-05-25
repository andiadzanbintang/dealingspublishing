// src/pages/TopicsManagePage.jsx
import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, X, Save } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { topicAPI } from '@/services/api'
import { slugify } from '@/lib/utils'

export default function TopicsManagePage() {
  const [topics, setTopics] = useState([])
  const [editingTopic, setEditingTopic] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '#6366F1',
    description: '',
    isActive: true,
    sortOrder: 0,
  })

  const fetchTopics = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await topicAPI.getAll()
      setTopics(response?.data || [])
    } catch (err) {
      console.error('Failed to fetch topics:', err)
      setError(
        err.response?.data?.message ||
          'Failed to load topics. Please try again.'
      )
      setTopics([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopics()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      color: '#6366F1',
      description: '',
      isActive: true,
      sortOrder: 0,
    })
    setEditingTopic(null)
    setIsCreating(false)
    setError('')
  }

  const handleCreateClick = () => {
    setIsCreating(true)
    setEditingTopic(null)
    setFormData({
      name: '',
      icon: '',
      color: '#6366F1',
      description: '',
      isActive: true,
      sortOrder: topics.length + 1,
    })
    setError('')
  }

  const handleEdit = (topic) => {
    setEditingTopic(topic._id)
    setIsCreating(false)
    setFormData({
      name: topic.name || '',
      icon: topic.icon || '',
      color: topic.color || '#6366F1',
      description: topic.description || '',
      isActive: topic.isActive ?? true,
      sortOrder: topic.sortOrder ?? 0,
    })
    setError('')
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Topic name is required.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      ...formData,
      name: formData.name.trim(),
      slug: slugify(formData.name.trim()),
      icon: formData.icon || '📄',
      color: formData.color || '#6366F1',
      description: formData.description || '',
      isActive: Boolean(formData.isActive),
      sortOrder: Number(formData.sortOrder) || 0,
    }

    try {
      if (editingTopic) {
        const response = await topicAPI.update(editingTopic, payload)
        const updatedTopic = response?.data

        setTopics((prev) =>
          prev.map((topic) =>
            topic._id === editingTopic ? updatedTopic || topic : topic
          )
        )
      } else {
        const response = await topicAPI.create(payload)
        const newTopic = response?.data

        if (newTopic) {
          setTopics((prev) => [...prev, newTopic])
        } else {
          await fetchTopics()
        }
      }

      resetForm()
    } catch (err) {
      console.error('Failed to save topic:', err)
      setError(
        err.response?.data?.message ||
          'Failed to save topic. Please check the data and try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!id) return

    setDeleting(true)
    setError('')

    try {
      await topicAPI.delete(id)
      setTopics((prev) => prev.filter((topic) => topic._id !== id))
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete topic:', err)
      setError(
        err.response?.data?.message ||
          'Failed to delete topic. Please try again.'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Topics</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage journal categories and topic groupings.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Topic
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {(isCreating || editingTopic) && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">
              {editingTopic ? 'Edit Topic' : 'New Topic'}
            </h2>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Name
              </label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Health Sciences"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Icon (emoji)
              </label>
              <input
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="🏥"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-10 h-10 rounded-lg border border-neutral-200 cursor-pointer"
                />
                <input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: e.target.value })
                }
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isActive: e.target.value === 'active',
                  })
                }
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-5">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Description
              </label>
              <input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description"
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving
                ? 'Saving...'
                : `${editingTopic ? 'Update' : 'Create'} Topic`}
            </button>
          </div>
        </div>
      )}

      {/* Topics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-neutral-100 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-neutral-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-neutral-100 rounded w-1/3" />
                </div>
              </div>
              <div className="mt-4 h-3 bg-neutral-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : topics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <div
              key={topic._id}
              className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${topic.color}15` }}
                  >
                    {topic.icon || '📄'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {topic.journalCount || 0} journals
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(topic)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(topic)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {topic.description && (
                <p className="mt-3 text-xs text-neutral-500 line-clamp-2">
                  {topic.description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-neutral-200"
                  style={{ backgroundColor: topic.color }}
                />
                <span className="text-xs text-neutral-400">{topic.color}</span>

                <span className="text-xs text-neutral-300">
                  Order: {topic.sortOrder ?? 0}
                </span>

                <span
                  className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    topic.isActive
                      ? 'bg-success-50 text-success-600'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {topic.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 p-10 text-center">
          <div className="text-5xl mb-4">🏷️</div>
          <h3 className="text-lg font-semibold text-neutral-900">
            No topics yet
          </h3>
          <p className="mt-2 text-sm text-neutral-500">
            Create your first topic to organize journals.
          </p>
          <button
            onClick={handleCreateClick}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Topic
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        title="Delete Topic"
        description={`Delete "${deleteTarget?.name}"? Journals under this topic may no longer display this category correctly.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Topic'}
      />
    </div>
  )
}