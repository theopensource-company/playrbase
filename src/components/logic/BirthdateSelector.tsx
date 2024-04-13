'use client';

import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { Baby, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { DD, DDContent, DDDescription, DDTitle } from '../ui-custom/dd';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Input } from '../ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from '../ui/input-otp';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export function useBirthdateSelector({
    token,
    birthdate: defaultBirthdate,
}: {
    token?: string;
    birthdate?: Date;
} = {}) {
    const t = useTranslations('components.logic.birthdate-selector');
    type State = {
        status:
            | 'pending'
            | 'invalid-email'
            | 'permit-requested'
            | 'request-failed'
            | 'awaiting-input'
            | 'validating-permit'
            | 'invalid-permit'
            | 'valid-permit';
        birthdate?: Date;
        parentEmail?: string;
        birthdatePermit?: string;
    };

    const [{ status, birthdate, parentEmail, birthdatePermit }, setState] =
        useState<State>({
            status: 'pending',
            birthdate: defaultBirthdate,
        });

    const setStatus = useCallback(
        (status: State['status']) => setState((s) => ({ ...s, status })),
        [setState]
    );

    const setBirthdate = useCallback(
        (birthdate: State['birthdate']) =>
            setState(() => ({
                status: 'pending',
                birthdate: birthdate ?? defaultBirthdate,
            })),
        [setState, defaultBirthdate]
    );

    const setParentEmail = useCallback(
        (parentEmail: State['parentEmail']) =>
            setState((s) => ({ ...s, parentEmail })),
        [setState]
    );

    const setBirthdatePermit = useCallback(
        (birthdatePermit: State['birthdatePermit']) =>
            setState((s) => ({ ...s, birthdatePermit })),
        [setState]
    );

    const permitRequired = useMemo(
        () => birthdate && dayjs().diff(birthdate, 'years') <= 16,
        [birthdate]
    );

    const parentEmailValid = useMemo(
        () => z.string().email().safeParse(parentEmail).success,
        [parentEmail]
    );

    const isBirthdateReady = useMemo(
        () => birthdate && (!permitRequired || status == 'valid-permit'),
        [birthdate, permitRequired, status]
    );

    const requestPermit = useCallback(async () => {
        if (!permitRequired) return;
        if (!parentEmailValid) {
            setStatus('invalid-email');
            return;
        }

        setStatus('permit-requested');

        const res = await fetch(`/api/birthdate/permit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                birthdate,
                token,
                parent_email: parentEmail?.toLowerCase(),
            }),
        });

        const { success } = await res.json();

        setStatus(success ? 'awaiting-input' : 'request-failed');
    }, [
        birthdate,
        token,
        parentEmail,
        permitRequired,
        parentEmailValid,
        setStatus,
    ]);

    const validatePermit = useCallback(async () => {
        if (!birthdatePermit || birthdatePermit.length != 6) {
            setStatus('invalid-permit');
            return;
        }

        const res = await fetch(`/api/birthdate/permit/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                birthdate,
                token,
                birthdate_permit: birthdatePermit,
            }),
        });

        const { success } = await res.json();
        setStatus(success ? 'valid-permit' : 'invalid-permit');
        toast.success(t('validated'));
    }, [birthdatePermit, birthdate, token, setStatus, t]);

    useEffect(() => {
        if (birthdatePermit && birthdatePermit.length == 6) {
            validatePermit();
        }
    }, [birthdatePermit, validatePermit]);

    return {
        birthdate,
        setBirthdate,
        parentEmail,
        setParentEmail,
        birthdatePermit,
        setBirthdatePermit,
        permitRequired,
        parentEmailValid,
        status,
        setStatus,
        requestPermit,
        validatePermit,
        isBirthdateReady,
    };
}

export function BirthdateSelector({
    status,
    birthdate,
    setBirthdate,
    parentEmail,
    parentEmailValid,
    setParentEmail,
    birthdatePermit,
    setBirthdatePermit,
    permitRequired,
    requestPermit,
    validatePermit,
}: ReturnType<typeof useBirthdateSelector>) {
    const t = useTranslations('components.logic.birthdate-selector');
    const [selectorOpen, setSelectorOpen] = useState(false);

    const onSelect = useCallback(
        (date?: Date) => {
            if (date) {
                setBirthdate(date);
                setSelectorOpen(false);
            }
        },
        [setBirthdate]
    );

    const openState = useMemo(
        () =>
            permitRequired && status != 'valid-permit'
                ? [
                      'request-failed',
                      'awaiting-input',
                      'validating-permit',
                      'invalid-permit',
                  ].includes(status)
                    ? 'verification'
                    : 'email'
                : false,
        [permitRequired, status]
    );

    const onOpenChange = useCallback(
        (open: boolean) => {
            if (openState == 'email' && !open) {
                setBirthdate(undefined);
            }
        },
        [openState, setBirthdate]
    );

    const today = useMemo(() => new Date(), []);

    return (
        <div className="space-y-2">
            <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={'outline'}
                        className={cn(
                            'w-full max-w-md justify-start text-left font-normal',
                            !birthdate && 'text-muted-foreground'
                        )}
                    >
                        <Baby className="mr-2 h-4 w-4" />
                        {birthdate ? (
                            dayjs(birthdate).format('LL')
                        ) : (
                            <span>{t('placeholder')}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        defaultMonth={birthdate}
                        selected={birthdate}
                        onSelect={onSelect}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={today.getFullYear() - 100}
                        toYear={today.getFullYear()}
                    />
                </PopoverContent>
            </Popover>
            <DD
                dismissable={openState != 'verification'}
                open={!!openState}
                onOpenChange={onOpenChange}
            >
                <DDContent>
                    {openState == 'email' ? (
                        <div className="space-y-6">
                            <DDTitle>{t('dialog-email.title')}</DDTitle>
                            <DDDescription>
                                {t('dialog-email.description')}
                            </DDDescription>
                            <Input
                                className="lowercase"
                                placeholder={t('dialog-email.placeholder')}
                                value={parentEmail}
                                onChange={({ target: { value } }) =>
                                    setParentEmail(value)
                                }
                            />
                            {status == 'invalid-email' && (
                                <p className="text-red-600">
                                    {t('dialog-email.invalid-email')}
                                </p>
                            )}
                            <Button
                                disabled={
                                    !parentEmailValid ||
                                    status == 'permit-requested'
                                }
                                onClick={requestPermit}
                            >
                                {t('dialog-email.submit')}
                                {status == 'permit-requested' && (
                                    <Loader2 className="ml-2 w-4 animate-spin" />
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <DDTitle>{t('dialog-confirm.title')}</DDTitle>
                            <DDDescription>
                                {t('dialog-confirm.description')}
                            </DDDescription>
                            <InputOTP
                                maxLength={6}
                                value={birthdatePermit}
                                onChange={setBirthdatePermit}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                </InputOTPGroup>
                                <InputOTPSeparator />
                                <InputOTPGroup>
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                            {status == 'invalid-permit' && (
                                <p className="text-red-600">
                                    {t('dialog-confirm.invalid-permit')}
                                </p>
                            )}
                            <Button
                                disabled={
                                    !birthdatePermit ||
                                    birthdatePermit.length != 6 ||
                                    status == 'validating-permit'
                                }
                                onClick={validatePermit}
                            >
                                {t('dialog-confirm.submit')}
                                {status == 'validating-permit' && (
                                    <Loader2 className="ml-2 w-4 animate-spin" />
                                )}
                            </Button>
                            <Button
                                className="text-muted-foreground no-underline"
                                disabled={status == 'validating-permit'}
                                variant="link"
                                onClick={() => setBirthdate(undefined)}
                            >
                                {t('dialog-confirm.cancel')}
                            </Button>
                        </div>
                    )}
                </DDContent>
            </DD>
        </div>
    );
}
