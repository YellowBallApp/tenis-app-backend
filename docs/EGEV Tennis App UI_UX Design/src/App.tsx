import { useState } from 'react';
import { Home } from './components/Home';
import { Courts } from './components/Courts';
import { League } from './components/League';
import { Members } from './components/Members';
import { Profile } from './components/Profile';
import { Onboarding } from './components/Onboarding';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { CourtDetail } from './components/CourtDetail';
import { ReservationConfirm } from './components/ReservationConfirm';
import { CreateChallenge } from './components/CreateChallenge';
import { ChallengeDetail } from './components/ChallengeDetail';
import { MemberProfile } from './components/MemberProfile';
import { WriteReview } from './components/WriteReview';
import { Notifications } from './components/Notifications';
import { MatchDetail } from './components/MatchDetail';
import { EnterMatchResult } from './components/EnterMatchResult';
import { BottomNav } from './components/BottomNav';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [selectedTab, setSelectedTab] = useState('home');
  const [screenData, setScreenData] = useState<any>(null);

  const navigate = (screen: string, data?: any) => {
    setCurrentScreen(screen);
    if (data) setScreenData(data);
  };

  const navigateToTab = (tab: string) => {
    setSelectedTab(tab);
    const tabScreenMap: { [key: string]: string } = {
      home: 'home',
      courts: 'courts',
      league: 'league',
      members: 'members',
      profile: 'profile',
    };
    setCurrentScreen(tabScreenMap[tab]);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <Onboarding onGetStarted={() => navigate('login')} />;
      case 'login':
        return <Login onLogin={() => navigate('home')} onSignup={() => navigate('signup')} />;
      case 'signup':
        return <Signup onSignup={() => navigate('home')} onLogin={() => navigate('login')} />;
      case 'home':
        return <Home onNavigate={navigate} />;
      case 'courts':
        return <Courts onNavigate={navigate} />;
      case 'courtDetail':
        return <CourtDetail court={screenData} onNavigate={navigate} onBack={() => navigate('courts')} />;
      case 'reservationConfirm':
        return <ReservationConfirm reservation={screenData} onNavigate={navigate} onBack={() => navigate('courts')} />;
      case 'league':
        return <League onNavigate={navigate} />;
      case 'matchDetail':
        return <MatchDetail match={screenData} onNavigate={navigate} onBack={() => navigate('league')} />;
      case 'enterMatchResult':
        return <EnterMatchResult match={screenData} onNavigate={navigate} onBack={() => navigate('league')} />;
      case 'createChallenge':
        return <CreateChallenge onNavigate={navigate} onBack={() => navigate('home')} />;
      case 'challengeDetail':
        return <ChallengeDetail challenge={screenData} onNavigate={navigate} onBack={() => navigate('home')} />;
      case 'members':
        return <Members onNavigate={navigate} />;
      case 'memberProfile':
        return <MemberProfile member={screenData} onNavigate={navigate} onBack={() => navigate('members')} />;
      case 'writeReview':
        return <WriteReview member={screenData} onNavigate={navigate} onBack={() => navigate('memberProfile', screenData)} />;
      case 'notifications':
        return <Notifications onNavigate={navigate} onBack={() => navigate('home')} />;
      case 'profile':
        return <Profile onNavigate={navigate} />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  const showBottomNav = !['onboarding', 'login', 'signup'].includes(currentScreen);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAFCFB' }}>
      {/* Mobile Frame */}
      <div className="relative w-full max-w-[430px] h-[932px] bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto">
          {renderScreen()}
        </div>

        {/* Bottom Navigation */}
        {showBottomNav && (
          <BottomNav selectedTab={selectedTab} onTabChange={navigateToTab} />
        )}
      </div>
    </div>
  );
}
