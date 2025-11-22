import { Target, BarChart, Users, MessageCircle, AlertCircle, Download } from 'lucide-react'

const Features = () => {
  const features = [
    {
      icon: Target,
      title: 'Конверсии',
      description: 'Отслеживайте достижение целей клиентами и считайте прибыль',
      color: 'blue',
    },
    {
      icon: BarChart,
      title: 'Маркетинг',
      description: 'Узнайте какую роль играют различные каналы и повысьте эффективность маркетинга',
      color: 'purple',
    },
    {
      icon: Users,
      title: 'Сегментируйте пользователей',
      description: 'Сегментируйте пользователей и рассылайте сообщения',
      color: 'pink',
    },
    {
      icon: AlertCircle,
      title: 'Мониторинг ошибок',
      description: 'Мониторинг ошибок и работоспособности бота',
      color: 'orange',
    },
    {
      icon: Download,
      title: 'Выгрузка данных',
      description: 'Выгружайте данные в вашу CRM систему',
      color: 'green',
    },
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Получите полное представление о клиентах и конверсиях
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              purple: 'bg-purple-100 text-purple-600',
              pink: 'bg-pink-100 text-pink-600',
              orange: 'bg-orange-100 text-orange-600',
              green: 'bg-green-100 text-green-600',
            }

            return (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <div className={`w-12 h-12 ${colorClasses[feature.color]} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Features

