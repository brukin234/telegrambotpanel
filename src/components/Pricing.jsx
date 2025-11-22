import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

const Pricing = () => {
  const plans = [
    {
      name: 'Стартовый',
      price: 'Бесплатно',
      period: 'Навсегда бесплатный тариф',
      features: [
        'до 2-х ботов на аккаунте',
        '6 отчетов о пользователях',
        'Базовый отчет о командах',
        'Базовый utm-отчет',
        'Список пользователей',
        'Отчеты о конверсиях',
        'Пол пользователей',
        'Лог активности пользователя',
        'Чат с пользователем',
        'Рассылки пользователям',
      ],
      limit: 'до 5к запросов в день',
      buttonText: 'Запустить',
      popular: false,
    },
    {
      name: 'Базовый',
      price: '300р.',
      period: 'Статистика и аналитика',
      features: [
        'неограниченное кол-во ботов',
        '11 отчетов о пользователях',
        'Расширенный отчет о командах',
        'Расширенный utm-отчет',
        'Список пользователей',
        'Отчеты о конверсиях',
        'Пол пользователей',
        'Лог активности пользователя',
        'Чат с пользователем',
        'Рассылки пользователям',
      ],
      limit: 'до 20к запросов в день',
      buttonText: 'Запустить',
      popular: true,
    },
    {
      name: 'Продвинутый',
      price: '500р.',
      period: 'Инструменты и сервисы',
      features: [
        'неограниченное кол-во ботов',
        '11 отчетов о пользователях',
        'Расширенный отчет о командах',
        'Расширенный utm-отчет',
        'Список пользователей',
        'Отчеты о конверсиях',
        'Пол пользователей',
        'Лог активности пользователя',
        'Рассылки пользователям',
      ],
      limit: 'до 35к запросов в день',
      buttonText: 'Запустить',
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Подходящий тариф для любого проекта
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-blue-600 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Популярный
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              </div>
              <p className="text-gray-600 mb-6">{plan.period}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t pt-4 mb-6">
                <p className="text-sm text-gray-600">{plan.limit}</p>
              </div>

              <Link
                to="/dashboard"
                className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.buttonText}
              </Link>
              <p className="text-xs text-gray-500 text-center mt-2">
                2 недели бесплатного доступа
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Pricing

