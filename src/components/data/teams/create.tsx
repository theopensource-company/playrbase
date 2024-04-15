import { Profile } from '@/components/cards/profile';
import {
    UserEmailSelector,
    useUserEmailSelector,
} from '@/components/logic/UserEmailSelector';
import {
    DD,
    DDContent,
    DDDescription,
    DDFooter,
    DDHeader,
    DDTitle,
    DDTrigger,
} from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSurreal } from '@/lib/Surreal';
import { EmailProfile } from '@/schema/resources/profile';
import { Team } from '@/schema/resources/team';
import { UserAnonymous } from '@/schema/resources/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export function CreateTeamDialog({
    open,
    setOpen,
    trigger,
    refetch,
}: {
    open: boolean;
    setOpen: (open: boolean) => unknown;
    trigger?: ReactNode | false;
    refetch?: () => unknown;
}) {
    const [team, setTeam] = useState<Team['id'] | undefined>();
    const [finished, setFinished] = useState<boolean>(false);
    const t = useTranslations('components.data.teams.create');

    useEffect(() => {
        if (finished && !open) {
            setTeam(undefined);
            setFinished(false);
            refetch?.();
        }
    }, [finished, open, refetch]);

    const onOpenChange = useCallback(
        (open: boolean) => {
            if (finished || !team) setOpen(open);
        },
        [setOpen, finished, team]
    );

    return (
        <DD
            open={open}
            onOpenChange={onOpenChange}
            dismissable={!team || finished}
        >
            {trigger !== false && (
                <DDTrigger asChild>
                    {trigger ?? (
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> {t('trigger')}
                        </Button>
                    )}
                </DDTrigger>
            )}
            <DDContent>
                {!team ? (
                    <StepCreateTeam setTeam={setTeam} />
                ) : !finished ? (
                    <StepInvitePlayers
                        team={team}
                        finish={() => setFinished(true)}
                    />
                ) : (
                    <StepFinished setOpen={setOpen} />
                )}
            </DDContent>
        </DD>
    );
}

function StepCreateTeam({
    setTeam,
}: {
    setTeam: (team: Team['id']) => unknown;
}) {
    const surreal = useSurreal();
    const t = useTranslations('components.data.teams.create.step-create');

    const CreateTeamSchema = Team.pick({
        name: true,
    });

    type CreateTeamSchema = z.infer<typeof CreateTeamSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid },
    } = useForm<CreateTeamSchema>({
        resolver: zodResolver(CreateTeamSchema),
    });

    const handler = handleSubmit(async ({ name }) => {
        const [team] = await surreal.query<[Team]>(
            /* surql */ `
            CREATE ONLY team CONTENT {
                name: $name,
            };
        `,
            { name }
        );

        setTeam(team.id);
    });

    return (
        <form onSubmit={handler}>
            <DDHeader>
                <DDTitle>{t('title')}</DDTitle>
                <DDDescription>{t('description')}</DDDescription>
            </DDHeader>
            <div className="space-y-3">
                <Label htmlFor="name">{t('fields.name.label')}</Label>
                <Input
                    id="name"
                    {...register('name')}
                    maxLength={Team.shape.name.maxLength ?? undefined}
                    autoFocus
                    autoComplete="off"
                />
                {errors?.name && !isSubmitSuccessful && (
                    <p className="text-red-600">{errors.name.message}</p>
                )}
            </div>
            <DDFooter>
                <Button disabled={!isValid}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('submit')}
                </Button>
                {errors?.root && !isSubmitSuccessful && (
                    <p className="text-red-600">{errors.root.message}</p>
                )}
            </DDFooter>
        </form>
    );
}

function StepInvitePlayers({
    team,
    finish,
}: {
    team: Team['id'];
    finish: () => unknown;
}) {
    const surreal = useSurreal();
    const [user, setUser] = useUserEmailSelector();
    const [invited, setInvited] = useState<(EmailProfile | UserAnonymous)[]>(
        []
    );
    const t = useTranslations('components.data.teams.create.step-invite');

    useEffect(() => {
        if (user) {
            fetch('/api/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origin: user.toLowerCase(),
                    target: team,
                }),
            }).then(async () => {
                if (z.string().email().safeParse(user).success) {
                    setInvited([{ email: user, type: 'email' }, ...invited]);
                } else {
                    await surreal.select<UserAnonymous>(user).then(([user]) => {
                        const parsed = UserAnonymous.safeParse(user);
                        if (parsed.success) {
                            setInvited([parsed.data, ...invited]);
                        }
                    });
                }
            });

            setUser(undefined);
        }
    }, [user, setUser, invited, setInvited, surreal, team]);

    return (
        <>
            <DDHeader>
                <DDTitle>{t('title')}</DDTitle>
                <DDDescription>{t('description')}</DDDescription>
            </DDHeader>
            <div className="space-y-6">
                <UserEmailSelector
                    user={user}
                    setUser={setUser}
                    autoFocus
                    autoComplete="off"
                >
                    {t('button-invite')}
                </UserEmailSelector>
                {invited.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">
                            {t('sent-invites')}
                        </h3>
                        <div className="space-y-3">
                            {invited.map((profile) => (
                                <Profile
                                    key={
                                        'id' in profile
                                            ? profile.id
                                            : profile.email
                                    }
                                    profile={profile}
                                    size="tiny"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <DDFooter>
                <Button onClick={finish}>{t('button-continue')}</Button>
            </DDFooter>
        </>
    );
}

function StepFinished({ setOpen }: { setOpen: (open: boolean) => unknown }) {
    const t = useTranslations('components.data.teams.create.step-finished');
    return (
        <>
            <DDHeader>
                <DDTitle>{t('title')}</DDTitle>
                <DDDescription>{t('description')}</DDDescription>
            </DDHeader>
            <DDFooter>
                <Button onClick={() => setOpen(false)}>
                    {t('button-finish')}
                </Button>
            </DDFooter>
        </>
    );
}
