import { useState, useEffect } from 'react';
import { ChevronUp, TrendingUp, Users, Star, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Animated Counter Component
interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '',
  className = '' 
}: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return (
    <span className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Animated Stats Card
interface AnimatedStatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  suffix?: string;
  delay?: number;
}

export const AnimatedStatsCard = ({ 
  icon, 
  title, 
  value, 
  suffix = '', 
  delay = 0 
}: AnimatedStatsCardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Card 
      className={`transform transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } hover:scale-105 hover:shadow-lg`}
    >
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {isVisible && (
            <AnimatedCounter 
              end={value} 
              suffix={suffix}
              duration={1500}
            />
          )}
        </div>
        <p className="text-gray-600 font-medium">{title}</p>
      </CardContent>
    </Card>
  );
};

// Scroll to Top Button
export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-16 opacity-0 scale-0'
      }`}
    >
      <ChevronUp className="w-5 h-5 text-white" />
    </Button>
  );
};

// Fade In Animation Hook
export const useFadeInAnimation = (delay = 0) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return {
    className: `transform transition-all duration-700 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`,
    isVisible
  };
};

// Staggered List Animation
interface StaggeredListProps {
  children: React.ReactNode[];
  delay?: number;
  className?: string;
}

export const StaggeredList = ({ children, delay = 150, className = '' }: StaggeredListProps) => {
  return (
    <div className={className}>
      {children.map((child, index) => {
        const animation = useFadeInAnimation(index * delay);
        return (
          <div key={index} className={animation.className}>
            {child}
          </div>
        );
      })}
    </div>
  );
};

// Typing Animation Component
interface TypingAnimationProps {
  text: string;
  speed?: number;
  className?: string;
}

export const TypingAnimation = ({ text, speed = 100, className = '' }: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};

// Floating Animation
export const FloatingCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`animate-float ${className}`}>
      {children}
    </div>
  );
};

// Progress Bar Animation
interface AnimatedProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
}

export const AnimatedProgressBar = ({ 
  progress, 
  className = '', 
  showPercentage = true 
}: AnimatedProgressBarProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{animatedProgress}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
    </div>
  );
};

// Hero Stats Section with Animations
export const AnimatedHeroStats = () => {
  const stats = [
    { icon: <Home className="w-6 h-6" />, value: 15000, suffix: '+', title: 'Active Properties' },
    { icon: <Users className="w-6 h-6" />, value: 50000, suffix: '+', title: 'Happy Renters' },
    { icon: <TrendingUp className="w-6 h-6" />, value: 96, suffix: '%', title: 'Success Rate' },
    { icon: <Star className="w-6 h-6" />, value: 4.9, suffix: '/5', title: 'Average Rating' }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <AnimatedStatsCard
          key={index}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          suffix={stat.suffix}
          delay={index * 200}
        />
      ))}
    </div>
  );
};

// Page Transition Wrapper
export const PageTransition = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const animation = useFadeInAnimation(100);
  
  return (
    <div className={`${animation.className} ${className}`}>
      {children}
    </div>
  );
}; 