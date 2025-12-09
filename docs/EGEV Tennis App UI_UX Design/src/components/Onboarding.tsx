import { useState } from 'react';
import { ChevronRight, Trophy, Calendar, Swords } from 'lucide-react';

interface OnboardingProps {
  onGetStarted: () => void;
}

export function Onboarding({ onGetStarted }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Calendar,
      title: 'Book Courts',
      description: 'Reserve tennis courts easily and manage your bookings in one place',
      color: '#54CE8F',
    },
    {
      icon: Trophy,
      title: 'Join Leagues',
      description: 'Compete in exciting leagues, track rankings and improve your game',
      color: '#B4AEBD',
    },
    {
      icon: Swords,
      title: 'Challenge Players',
      description: 'Challenge other members and enjoy competitive tennis matches',
      color: '#54CE8F',
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Logo Area */}
      <div className="pt-16 px-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B4AEBD' }}>
            <Trophy size={24} color="white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl" style={{ color: '#B4AEBD' }}>EGEV Tenis</h1>
        </div>
        <p className="text-sm text-gray-500">Premium Tennis Experience</p>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Icon Circle */}
        <div 
          className="w-40 h-40 rounded-full flex items-center justify-center mb-8 shadow-lg"
          style={{ backgroundColor: currentStepData.color }}
        >
          <Icon size={80} color="white" strokeWidth={1.5} />
        </div>

        {/* Title & Description */}
        <h2 className="text-3xl text-center mb-4" style={{ color: '#1F2937' }}>
          {currentStepData.title}
        </h2>
        <p className="text-center text-gray-600 max-w-sm leading-relaxed">
          {currentStepData.description}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="px-8 pb-12">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className="h-2 rounded-full transition-all"
              style={{
                width: currentStep === index ? '32px' : '8px',
                backgroundColor: currentStep === index ? '#54CE8F' : '#D1D5DB',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        {currentStep < steps.length - 1 ? (
          <div className="flex gap-4">
            <button
              onClick={onGetStarted}
              className="flex-1 py-4 rounded-2xl text-gray-600 transition-all"
            >
              Skip
            </button>
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex-1 py-4 rounded-2xl text-white shadow-lg flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: '#54CE8F' }}
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={onGetStarted}
            className="w-full py-4 rounded-2xl text-white shadow-lg transition-all"
            style={{ backgroundColor: '#54CE8F' }}
          >
            Get Started
          </button>
        )}
      </div>
    </div>
  );
}
