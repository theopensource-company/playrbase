import React, {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

export const ScrolledStateContext = createContext(false);

function useCreateState() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => {
            setScrolled(
                (window.pageYOffset || document.documentElement.scrollTop) > 0
            );
        };

        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, [setScrolled]);

    return scrolled;
}

export function ScrolledStateProvider({ children }: { children: ReactNode }) {
    const state = useCreateState();

    return (
        <ScrolledStateContext.Provider value={state}>
            {children}
        </ScrolledStateContext.Provider>
    );
}

export function useScrolledState() {
    return useContext(ScrolledStateContext);
}
