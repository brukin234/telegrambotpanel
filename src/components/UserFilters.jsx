import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useBots } from '../context/BotsContext'
import { useLanguage } from '../context/LanguageContext'
import CustomSelect from './CustomSelect'

const UserFilters = ({ isOpen, onClose, onApply, filters }) => {
  const { bots } = useBots()
  const { t } = useLanguage()
  const [localFilters, setLocalFilters] = useState(filters || {
    bot: '',
    gender: '',
    premium: '',
    blocked: '',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    if (filters) {
      setLocalFilters(filters)
    }
  }, [filters])

  if (!isOpen) return null

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters = {
      bot: '',
      gender: '',
      premium: '',
      blocked: '',
      dateFrom: '',
      dateTo: '',
    }
    setLocalFilters(resetFilters)
    onApply(resetFilters)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-dark-200 border border-dark-300 rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-100">{t('filters')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('botFilter')}
                    </label>
                    <CustomSelect
                      value={localFilters.bot}
                      onChange={(value) => setLocalFilters({ ...localFilters, bot: value })}
                      options={[
                        { value: '', label: t('allBots') },
                        ...bots.map(bot => ({ value: bot.id, label: bot.name }))
                      ]}
                      placeholder={t('allBots')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('genderFilter')}
                    </label>
                    <CustomSelect
                      value={localFilters.gender}
                      onChange={(value) => setLocalFilters({ ...localFilters, gender: value })}
                      options={[
                        { value: '', label: t('all') },
                        { value: 'male', label: t('male') },
                        { value: 'female', label: t('female') },
                      ]}
                      placeholder={t('all')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('premiumFilter')}
                    </label>
                    <CustomSelect
                      value={localFilters.premium}
                      onChange={(value) => setLocalFilters({ ...localFilters, premium: value })}
                      options={[
                        { value: '', label: t('all') },
                        { value: 'yes', label: t('yes') },
                        { value: 'no', label: t('no') },
                      ]}
                      placeholder={t('all')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('blockingFilter')}
                    </label>
                    <CustomSelect
                      value={localFilters.blocked}
                      onChange={(value) => setLocalFilters({ ...localFilters, blocked: value })}
                      options={[
                        { value: '', label: t('all') },
                        { value: 'blocked', label: t('blockedUsers') },
                        { value: 'not_blocked', label: t('notBlockedUsers') },
                      ]}
                      placeholder={t('all')}
                    />
                  </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('activityDateFrom')}
              </label>
              <input
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
                className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('activityDateTo')}
              </label>
              <input
                type="date"
                value={localFilters.dateTo}
                onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
                className="w-full px-4 py-2 bg-dark-300 border border-dark-400 text-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
          >
            {t('reset')}
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors btn-glow btn-glow-primary"
          >
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserFilters

