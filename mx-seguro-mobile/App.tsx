import { Navigation } from './src/app/Navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';

export default function App() {
  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
}
