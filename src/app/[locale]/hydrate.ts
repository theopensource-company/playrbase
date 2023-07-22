'use client';

import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export function Hydrate() {
    const refreshUser = useAuth(({ refreshUser }) => refreshUser);

    useEffect(() => {
        setInterval(refreshUser, 60000);
        window.addEventListener('focus', refreshUser, false);
        refreshUser();
    }, []);

    return null;
};