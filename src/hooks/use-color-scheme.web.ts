import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * Nilai belum diketahui saat server render → server selalu mengembalikan 'light'.
 */
function subscribe(onChange: () => void) {
  const listener = Appearance.addChangeListener(onChange);
  return () => listener.remove();
}

export function useColorScheme() {
  return useSyncExternalStore(
    subscribe,
    () => Appearance.getColorScheme(),
    () => 'light'
  );
}
