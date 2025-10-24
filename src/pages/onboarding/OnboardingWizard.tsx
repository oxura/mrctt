import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppStore, NichePreset } from '../../store/appStore';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { 
  AcademicCapIcon, 
  BriefcaseIcon, 
  BuildingOffice2Icon, 
  GlobeAltIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { nanoid } from '../../utils/nanoid';
import { baseLeadStatuses } from '../../data/mockData';

type Step = 1 | 2 | 3;

const nichePresets: { value: NichePreset; label: string; icon: typeof AcademicCapIcon; description: string }[] = [
  { 
    value: 'Онлайн-школа/Курсы', 
    label: 'Онлайн-школа', 
    icon: AcademicCapIcon,
    description: 'Для образовательных программ и курсов',
  },
  { 
    value: 'Услуги/Freelance', 
    label: 'Услуги / Freelance', 
    icon: BriefcaseIcon,
    description: 'Для фрилансеров и агентств',
  },
  { 
    value: 'Медицина/Клиника', 
    label: 'Медицина', 
    icon: BuildingOffice2Icon,
    description: 'Для клиник и медицинских центров',
  },
  { 
    value: 'Туризм', 
    label: 'Туризм', 
    icon: GlobeAltIcon,
    description: 'Для турагентств и туроператоров',
  },
  { 
    value: 'Другое', 
    label: 'Другое', 
    icon: EllipsisHorizontalIcon,
    description: 'Универсальная настройка',
  },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { onboarding, completeOnboarding, setPreset, toggleModule } = useAppStore();

  const [step, setStep] = useState<Step>(1);
  const [companyData, setCompanyData] = useState({
    name: onboarding.companyName,
    country: onboarding.country,
    city: onboarding.city,
  });
  const [selectedNiche, setSelectedNiche] = useState<NichePreset | null>(onboarding.preset || null);

  const handleNext = () => {
    if (step === 1 && !companyData.name) {
      alert('Введите название компании');
      return;
    }
    if (step === 2 && !selectedNiche) {
      alert('Выберите нишу');
      return;
    }
    if (step < 3) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleComplete = () => {
    const newCompany = {
      id: nanoid(),
      name: companyData.name,
      country: companyData.country,
      city: companyData.city,
      niche: selectedNiche!,
      modules: onboarding.modules,
      leadStatuses: baseLeadStatuses,
    };

    if (user) {
      completeOnboarding(newCompany, {
        ...user,
        onboardingCompleted: true,
        companyId: newCompany.id,
      });
      updateUser({ onboardingCompleted: true, companyId: newCompany.id });
    }

    navigate('/');
  };

  const handleNicheSelect = (niche: NichePreset) => {
    setSelectedNiche(niche);
    setPreset(niche);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Настройка рабочего пространства</h1>
          <p className="mt-2 text-gray-600">Шаг {step} из 3</p>
        </div>

        <div className="mb-6 flex items-center justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-medium ${
                  s <= step
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`mx-4 h-1 w-16 ${
                    s < step ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {step === 1 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">О компании</h2>
              <div className="space-y-4">
                <Input
                  label="Название компании"
                  placeholder="Ваша крутая компания"
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Страна"
                    placeholder="Россия"
                    value={companyData.country}
                    onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                  />
                  <Input
                    label="Город"
                    placeholder="Москва"
                    value={companyData.city}
                    onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Выберите вашу нишу</h2>
              <p className="mb-6 text-gray-600">
                Мы автоматически подберем нужные модули для вашего бизнеса
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nichePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleNicheSelect(preset.value)}
                    className={`flex flex-col items-center rounded-lg border-2 p-6 text-center transition-all hover:shadow-lg ${
                      selectedNiche === preset.value
                        ? 'border-primary-600 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <preset.icon className={`h-12 w-12 mb-4 ${
                      selectedNiche === preset.value ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-gray-900">{preset.label}</h3>
                    <p className="mt-2 text-sm text-gray-500">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Настройка модулей</h2>
              <p className="mb-6 text-gray-600">
                Выберите функции, которые нужны вашему бизнесу. Вы можете изменить это позже.
              </p>
              <div className="space-y-3">
                {onboarding.modules.map((module) => (
                  <label
                    key={module.key}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{module.label}</p>
                      {module.description && (
                        <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={module.enabled}
                      onChange={(e) => toggleModule(module.key, e.target.checked)}
                      disabled={module.key === 'dashboard' || module.key === 'leads'}
                      className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500">
                * Главная и Лиды обязательны для всех
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
            >
              Назад
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>
                Далее
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Завершить настройку
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
