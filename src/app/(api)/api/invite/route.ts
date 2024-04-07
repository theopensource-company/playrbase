import { surreal } from '@/app/(api)/lib/surreal';
import { extractUserTokenFromRequest } from '@/app/(api)/lib/token';
import OrganisationInviteEmail from '@/emails/organisation-invite';
import TeamInviteEmail from '@/emails/team-invite';
import { brand_name } from '@/lib/branding';
import { Invite } from '@/schema/resources/invite';
import { Organisation } from '@/schema/resources/organisation';
import { Team } from '@/schema/resources/team';
import { User } from '@/schema/resources/user';
import { render } from '@react-email/components';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { email_from } from '../../config/env';
import { sendEmail } from '../../lib/email';

const Body = Invite.pick({
    origin: true,
    target: true,
    role: true,
});

type Body = z.infer<typeof Body>;

async function createInvite({
    user,
    origin,
    target,
    role,
}: Body & {
    user: User['id'];
}) {
    const [res, target_email, fetched_user, fetched_target] = await surreal
        .query<[Invite, string, User, Team | Organisation]>(
            /* surrealql */ `
            RETURN IF meta::tb(<record> $target) == "team" {
                RETURN IF $user IN $target.players {
                    RETURN CREATE ONLY invite CONTENT {
                        origin: $origin,
                        target: $target,
                        invited_by: $user,
                    }
                }
            } ELSE IF meta::tb(<record> $target) == "organisation" {
                RETURN IF $user IN $target.managers[WHERE role = "owner" OR (role = "administrator" AND org != NONE)].user {
                    RETURN IF type::is::string($role) {
                        RETURN CREATE ONLY invite CONTENT {
                            origin: $origin,
                            target: $target,
                            invited_by: $user,
                            role: $role,
                        }
                    }
                }
            };

            $origin.email OR $origin;
            $user.*;
            $target.*;
        `,
            {
                user,
                origin,
                target,
                role,
            }
        )
        .catch(() => []);

    const invite = Invite.safeParse(res);
    if (invite.success) {
        return {
            invite: invite.data,
            target_email,
            fetched_user,
            fetched_target,
        };
    } else {
        console.log(invite.error);
    }
}

export async function POST(req: NextRequest) {
    const res = extractUserTokenFromRequest(req);
    if (!res.success) return NextResponse.json(res);

    if (!res.decoded?.ID)
        return NextResponse.json({
            success: false,
            error: 'id_lookup_failed',
        });

    const user = User.shape.id.parse(res.decoded.ID);
    const body = Body.safeParse(await req.json());
    if (!body.success)
        return NextResponse.json(
            { success: false, error: 'invalid_body' },
            { status: 400 }
        );

    const { origin, target, role } = body.data;
    const invite = await createInvite({
        user,
        origin,
        target,
        role,
    });

    if (!invite)
        return NextResponse.json(
            { success: false, error: 'invite_creation_failed' },
            { status: 400 }
        );

    if (invite.fetched_target.type == 'team') {
        const renderProps = {
            invite_id: invite.invite.id.slice(7),
            invited_by: invite.fetched_user.name,
            team: invite.fetched_target.name,
            email: invite.target_email,
        };

        await sendEmail({
            from: email_from,
            to: invite.target_email,
            subject: `${brand_name} Team invite`,
            text: render(TeamInviteEmail(renderProps), {
                plainText: true,
            }),
            html: render(TeamInviteEmail(renderProps)),
        });
    } else if (invite.fetched_target.type == 'organisation') {
        const renderProps = {
            invite_id: invite.invite.id.slice(7),
            invited_by: invite.fetched_user.name,
            organisation: invite.fetched_target.name,
            email: invite.target_email,
        };

        await sendEmail({
            from: email_from,
            to: invite.target_email,
            subject: `${brand_name} Team invite`,
            text: render(OrganisationInviteEmail(renderProps), {
                plainText: true,
            }),
            html: render(OrganisationInviteEmail(renderProps)),
        });
    }

    return NextResponse.json({
        success: true,
    });
}
