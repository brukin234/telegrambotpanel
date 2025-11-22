import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'Подключение реально за 1 минуту?',
      answer:
        'Реально, но это зависит от вашего бота. Если ваш бот работает через метод webhook, то в большинстве случаев подключение займет около минуты. В иных случаях это может занять чуть больше времени. При подключении система автоматически определит тип вашего бота и выдаст инструкции.',
    },
    {
      question: 'Какие платформы поддерживаются?',
      answer:
        'Мы поддерживаем все самописные боты. Если ваш бот на конструкторе, то при подключении система проверит возможно ли подключение и уведомит вас.',
    },
    {
      question: 'Как все это работает?',
      answer:
        'Наша система анализирует проходящие через нее данные и строит статистику. Ваш бот продолжает работать как обычно. У нас есть разные варианты подключения. После регистрации вы можете ознакомиться подробней и выбрать более подходящий вам вариант.',
    },
    {
      question: 'Есть демо? Хочу вживую увидеть что за сервис.',
      answer: 'Да, вы можете запустить демонстрацию по ссылке.',
    },
    {
      question: 'Нужен ли тех. спец для подключения?',
      answer:
        'Это зависит от вашего бота. Боты которые работают через метод webhook обычно подключаются без программиста. В иных случаях потребуется добавить пару строк кода.',
    },
    {
      question: 'Я увижу старые данные?',
      answer:
        'Только список всех ваших активных пользователей. Телеграм боты устроены таким образом, что невозможно повторно получить старые данные.',
    },
    {
      question: 'Вы можете отключить, удалить или сломать бот?',
      answer:
        'Мы не можем удалить вашего бота. Если будут нарушены правила платформы, мы можем отключить бота, но это не всегда означает что он перестанет работать.',
    },
    {
      question: 'Через вас проходят все наши данные? Это безопасно?',
      answer:
        'Наша система не делает ничего принципиально нового. Google Analytics, Яндекс Метрика, любые конструкторы также имеют доступ ко всем вашим данным. Мы уделяем большое внимание безопасности, не сохраняем ничего лишнего и никому не передаем ваши данные.',
    },
  ]

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Часто задаваемые вопросы
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 text-gray-600 border-t border-gray-200">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ

