import React, {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

export const ScrolledStateContext = createContext({
    mobile: false,
    scrolled: false,
});

function useCreateState() {
    const [state, setState] = useState({ mobile: false, scrolled: false });

    useEffect(() => {
        const handler = () => {
            setState({
                scrolled:
                    (window.pageYOffset || document.documentElement.scrollTop) >
                    0,
                mobile: window.innerWidth < 768,
            });
        };

        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, [setState]);

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

export function useScrolledState({
    protectMobile,
}: { protectMobile?: boolean } = {}) {
    protectMobile = typeof protectMobile != 'boolean' || protectMobile;
    const { scrolled, mobile } = useContext(ScrolledStateContext);
    return protectMobile && mobile ? false : scrolled;
}
