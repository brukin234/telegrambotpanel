import { Link } from 'react-router-dom'
import { Zap, TrendingUp, Users, MessageSquare } from 'lucide-react'

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Аналитика для Телеграм ботов и Mini App{' '}
            <span className="text-blue-600">за 1 минуту</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Мы создаем аналитику, которую вы сможете подключить самостоятельно
            вне зависимости от платформы вашего бота
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Запустить Демо
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Подключение за 1 минуту</h3>
            <p className="text-gray-600">
              Простое подключение не требующее написание кода и изучение талмудов
              документации
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Владейте информацией</h3>
            <p className="text-gray-600">
              Узнайте как клиенты взаимодействуют с вашим ботом и оптимизируйте
              маркетинг
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Общайтесь с пользователями</h3>
            <p className="text-gray-600">
              Используйте встроенные инструменты для диалога и рассылок по сегментам
              пользователей
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

