import { BarChart3 } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-bold text-white">BotPanel</span>
            </div>
            <p className="text-sm">
              Аналитика для Telegram ботов и Mini App за 1 минуту
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#features" className="hover:text-white transition-colors">
                  Возможности
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-white transition-colors">
                  Цена
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Информация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Документация
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Пользовательское соглашение
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Политика конфиденциальности
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Контакты</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Напишите нам
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Партнерство
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© 2024 BotPanel. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

