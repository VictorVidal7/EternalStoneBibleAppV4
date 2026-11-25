/**
 * Where the current toast is drawn (R9-560).
 *
 * The toast is a plain absolutely-positioned View, not a `Modal` (see the
 * comment in `ToastContext.tsx` for why: an Android Modal is a Dialog window
 * that swallows every touch for the toast's duration). A plain View lives in
 * the window of whatever renders it, so a toast drawn by the root provider
 * sits in the app's MAIN window — and an open native `Modal` is another
 * window on top of it. Every toast fired from inside the «Datos» modal was
 * drawn behind it and never seen.
 *
 * A `<ToastHost />` mounted inside a modal's content claims the toast while
 * it is mounted: the most recently mounted host draws it, in its own window,
 * as the same box-none View the root draws (so it still never steals a
 * touch outside the toast's own bounds). With no host mounted the root
 * draws it, exactly as before. A Modal only mounts its children while it is
 * visible, so a host inside a closed modal claims nothing.
 *
 * Its own module, not `ToastContext.tsx`, on purpose: many test files mock
 * `ToastContext` with a literal factory, and a host rendered without a
 * provider must simply render nothing.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  ReactNode,
} from 'react';
import {StyleSheet, View} from 'react-native';

export interface ToastLayerValue {
  /** The id of the host that draws the toast, or null for the root. */
  topHostId: number | null;
  register: (id: number) => () => void;
  /** The toast element itself (null when there is nothing to draw). */
  node: ReactNode;
}

export const ToastLayerContext = createContext<ToastLayerValue | null>(null);

let nextHostId = 1;

/** The box-none overlay both the root and a host draw the toast in. */
export function ToastOverlay({children}: {children: ReactNode}) {
  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {children}
    </View>
  );
}

export function ToastHost() {
  const layer = useContext(ToastLayerContext);
  const idRef = useRef(0);
  if (idRef.current === 0) idRef.current = nextHostId++;
  const register = layer?.register;
  useLayoutEffect(() => {
    if (!register) return undefined;
    return register(idRef.current);
  }, [register]);
  if (!layer || layer.topHostId !== idRef.current || !layer.node) return null;
  return <ToastOverlay>{layer.node}</ToastOverlay>;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
});
