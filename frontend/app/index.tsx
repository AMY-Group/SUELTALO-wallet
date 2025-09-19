import { Redirect } from 'expo-router';

// TEMPORARY: Force redirect to test wallet/home routing
export default function Index() {
  return <Redirect href="/(wallet)/home" />;
}