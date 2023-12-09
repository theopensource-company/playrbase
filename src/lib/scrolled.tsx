import React, {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

export const ScrolledStateContext = createContext({
    mobile: false,
    scrolled: false,
});

function useCreateState() {
    const init = useRef<boolean>(false);
    const [state, setState] = useState({ mobile: false, scrolled: false });

    useEffect(() => {
        const handler = () => {
            const updated = {
                scrolled:
                    (window.pageYOffset || document.documentElement.scrollTop) >
                    0,
                mobile: window.innerWidth < 768,
            };

            if (
                updated.scrolled !== state.scrolled ||
                updated.mobile !== state.mobile
            ) {
                setState(updated);
            }
        };

        if (!init.current) {
            init.current = true;
            handler();
        }

        window.addEventListener('scroll', handler);
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('scroll', handler);
            window.removeEventListener('resize', handler);
        };
    }, [setState, state]);

    return state;
}

export function ScrolledStateProvider({ children }: { children: ReactNode }) {
    const state = useCreateState();

    return (
        <ScrolledStateContext.Provider value={state}>
            {children}
        </ScrolledStateContext.Provider>
    );
}

export function useScrolledContext() {
    return useContext(ScrolledStateContext);
}

export function useScrolledState({
    protectMobile,
}: { protectMobile?: boolean } = {}) {
    protectMobile = typeof protectMobile != 'boolean' || protectMobile;
    const { scrolled, mobile } = useContext(ScrolledStateContext);
    return protectMobile && mobile ? false : scrolled;
}

export function useIsMobileState() {
    const { mobile } = useContext(ScrolledStateContext);
    return mobile;
}
