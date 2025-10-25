import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Landing.module.css';

const Landing: React.FC = () => {
  return (
    <div className={styles.landing}>
      <header className={styles.header}>
        <div className={styles.container}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🌿</span>
            <span className={styles.logoText}>Экосистема заявок</span>
          </div>
          <nav className={styles.nav}>
            <a href="#features">Возможности</a>
            <a href="#pricing">Тарифы</a>
            <a href="#contact">Контакты</a>
            <Link to="/login" className={styles.loginBtn}>
              Войти
            </Link>
            <Link to="/register" className={styles.ctaBtn}>
              Попробовать бесплатно
            </Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1>
              CRM система, которая <span className={styles.highlight}>подстраивается</span> под ваш
              бизнес
            </h1>
            <p className={styles.subtitle}>
              Универсальная платформа для управления лидами, продажами и клиентами. Настраивается
              за 2 минуты под любую нишу: курсы, услуги, медицину, туризм.
            </p>
            <div className={styles.heroCta}>
              <Link to="/register" className={styles.primaryBtn}>
                Начать бесплатно
              </Link>
              <a href="#demo" className={styles.secondaryBtn}>
                Смотреть демо
              </a>
            </div>
            <div className={styles.heroHighlights}>
              <div className={styles.feature}>
                <span>✓</span> Без кредитной карты
              </div>
              <div className={styles.feature}>
                <span>✓</span> 14 дней пробного периода
              </div>
              <div className={styles.feature}>
                <span>✓</span> Настройка за 2 минуты
              </div>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.mockup}>
              <div className={styles.mockupHeader}>
                <div className={styles.dots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className={styles.mockupContent}>
                <div className={styles.mockupSidebar}></div>
                <div className={styles.mockupMain}>
                  <div className={styles.mockupCard}></div>
                  <div className={styles.mockupCard}></div>
                  <div className={styles.mockupCard}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.featuresSection}>
        <div className={styles.container}>
          <h2>Адаптируется под вашу нишу</h2>
          <p className={styles.sectionSubtitle}>
            Выберите готовый пресет или настройте модули самостоятельно
          </p>

          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎓</div>
              <h3>Онлайн-школы и курсы</h3>
              <p>Управление потоками, группами студентов, заявками на курсы. Автоматическое закрытие набора при достижении лимита.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🛠️</div>
              <h3>Услуги и фриланс</h3>
              <p>Простая воронка продаж, управление клиентами и проектами. Режим соло-работы без модуля команды.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏥</div>
              <h3>Медицина и клиники</h3>
              <p>Записи на прием, история взаимодействий с пациентами, напоминания о консультациях.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>✈️</div>
              <h3>Туризм и мероприятия</h3>
              <p>Управление турами, группами туристов, ограничениями по местам. Контроль заполняемости групп.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.coreFeatures}>
        <div className={styles.container}>
          <h2>Все необходимое для работы с клиентами</h2>

          <div className={styles.coreGrid}>
            <div className={styles.coreItem}>
              <div className={styles.coreIcon}>📊</div>
              <h4>CRM Pipeline</h4>
              <p>Воронка продаж с визуализацией. Таблица и канбан-доска для управления лидами.</p>
            </div>

            <div className={styles.coreItem}>
              <div className={styles.coreIcon}>📝</div>
              <h4>Конструктор форм</h4>
              <p>Создавайте формы сбора лидов за 5 минут. Публичные ссылки для Instagram и сайтов.</p>
            </div>

            <div className={styles.coreItem}>
              <div className={styles.coreIcon}>👥</div>
              <h4>Команда и роли</h4>
              <p>Приглашайте менеджеров, настраивайте права доступа. Отслеживайте работу сотрудников.</p>
            </div>

            <div className={styles.coreItem}>
              <div className={styles.coreIcon}>🗓️</div>
              <h4>Задачи и календарь</h4>
              <p>Напоминания о звонках, встречах. Не теряйте ни одного клиента.</p>
            </div>

            <div className={styles.coreItem}>
              <div className={styles.coreIcon}>📈</div>
              <h4>Аналитика</h4>
              <p>Дашборд с ключевыми метриками. Отслеживайте новых лидов, продажи, конверсию.</p>
            </div>

            <div className={styles.coreItem}>
              <div className={styles.coreIcon}>🔒</div>
              <h4>Безопасность</h4>
              <p>Полная изоляция данных компаний. JWT аутентификация, шифрование паролей.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className={styles.pricing}>
        <div className={styles.container}>
          <h2>Прозрачные цены</h2>
          <p className={styles.sectionSubtitle}>Выберите тариф, который подходит вашему бизнесу</p>

          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <h3>Стартовый</h3>
              <div className={styles.price}>
                <span className={styles.currency}>₽</span>
                <span className={styles.amount}>990</span>
                <span className={styles.period}>/мес</span>
              </div>
              <ul className={styles.features}>
                <li>✓ До 100 лидов в месяц</li>
                <li>✓ 1 пользователь</li>
                <li>✓ Все базовые модули</li>
                <li>✓ Конструктор форм</li>
                <li>✓ Поддержка по email</li>
              </ul>
              <Link to="/register" className={styles.pricingBtn}>
                Попробовать бесплатно
              </Link>
            </div>

            <div className={`${styles.pricingCard} ${styles.popular}`}>
              <div className={styles.badge}>Популярный</div>
              <h3>Профессиональный</h3>
              <div className={styles.price}>
                <span className={styles.currency}>₽</span>
                <span className={styles.amount}>2990</span>
                <span className={styles.period}>/мес</span>
              </div>
              <ul className={styles.features}>
                <li>✓ До 1000 лидов в месяц</li>
                <li>✓ До 5 пользователей</li>
                <li>✓ Все модули</li>
                <li>✓ Приоритетная поддержка</li>
                <li>✓ Интеграции (скоро)</li>
              </ul>
              <Link to="/register" className={`${styles.pricingBtn} ${styles.primary}`}>
                Начать бесплатно
              </Link>
            </div>

            <div className={styles.pricingCard}>
              <h3>Корпоративный</h3>
              <div className={styles.price}>
                <span className={styles.amount}>По запросу</span>
              </div>
              <ul className={styles.features}>
                <li>✓ Неограниченно лидов</li>
                <li>✓ Неограниченно пользователей</li>
                <li>✓ Индивидуальные модули</li>
                <li>✓ Персональный менеджер</li>
                <li>✓ SLA 99.9%</li>
              </ul>
              <a href="#contact" className={styles.pricingBtn}>
                Связаться с нами
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>Готовы начать работу?</h2>
          <p>Настройте CRM за 2 минуты и начните привлекать больше клиентов уже сегодня</p>
          <Link to="/register" className={styles.ctaButton}>
            Создать аккаунт бесплатно →
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <div className={styles.footerLogo}>
                <span className={styles.logoIcon}>🌿</span>
                <span>Экосистема заявок</span>
              </div>
              <p>Современная CRM для малого и среднего бизнеса</p>
            </div>

            <div className={styles.footerCol}>
              <h4>Продукт</h4>
              <ul>
                <li><a href="#features">Возможности</a></li>
                <li><a href="#pricing">Тарифы</a></li>
                <li><Link to="/register">Регистрация</Link></li>
                <li><Link to="/login">Вход</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Компания</h4>
              <ul>
                <li><a href="#about">О нас</a></li>
                <li><a href="#blog">Блог</a></li>
                <li><a href="#contact">Контакты</a></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4>Поддержка</h4>
              <ul>
                <li><a href="#help">Помощь</a></li>
                <li><a href="#docs">Документация</a></li>
                <li><a href="#terms">Условия использования</a></li>
                <li><a href="#privacy">Политика конфиденциальности</a></li>
              </ul>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>&copy; 2024 Экосистема заявок. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
