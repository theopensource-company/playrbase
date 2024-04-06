import { brand_name } from '@/lib/branding';
import {
    Body,
    Button,
    Container,
    Font,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface AuthMagicLinkEmailProps {
    token: string;
    followup?: string;
}

const baseUrl = process.env.PLAYRBASE_ENV_ORIGIN ?? 'http://localhost:13000';

export const AuthMagicLinkEmail = ({
    token = 'this-is-a-demo-token',
    followup,
}: AuthMagicLinkEmailProps) => {
    const params = new URLSearchParams({ token });
    if (followup) params.set('followup', followup);
    const url = new URL(baseUrl + `/api/auth/magic-link?` + params).toString();

    return (
        <Html lang="en" dir="ltr">
            <Head>
                <title>{`Your sign in link for ${brand_name}`}</title>
                <Font
                    fontFamily="Inter"
                    fallbackFontFamily="Arial"
                    webFont={{
                        url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
                        format: 'woff2',
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>
            <Preview>Your sign in link for {brand_name}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Img
                        src={`${baseUrl}/static/logo.png`}
                        height="50"
                        alt={`${brand_name} logo`}
                        style={logo}
                    />
                    <Heading style={heading}>
                        Your {brand_name} sign in link
                    </Heading>
                    <Text style={paragraph}>
                        The following link will be valid for 30 minutes.
                    </Text>
                    <Section style={buttonContainer}>
                        <Button style={button} href={url}>
                            Continue to {brand_name}
                        </Button>
                    </Section>
                    <Hr style={line} />
                    <Section style={fallback}>
                        <Text style={paragraph}>
                            If you have issues with the link above, please
                            follow the below url:
                        </Text>
                        <Link href={url} style={fallbackLink}>
                            {url}
                        </Link>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default AuthMagicLinkEmail;

// Styles

const main = {
    backgroundColor: '#030712',
};

const container = {
    margin: '40px auto 0',
    padding: '40px 50px',
    width: '560px',
    border: '1px solid #1d283a',
    borderRadius: '0.5rem',
};

const logo = {
    borderRadius: 21,
    height: 50,
    margin: '20px auto 40px',
};

const heading = {
    fontSize: '1.5rem',
    letterSpacing: '-0.5px',
    lineHeight: '1.3',
    fontWeight: '400',
    color: '#ffffff',
    padding: '17px 0 0',
};

const paragraph = {
    margin: '0 0 10px',
    fontSize: '15px',
    lineHeight: '1.4',
    color: '#7f8ea3',
};

const buttonContainer = {
    padding: '27px 0 27px',
};

const button = {
    backgroundColor: '#f8fafc',
    borderRadius: 'calc(0.5rem - 2px)',
    fontWeight: '500',
    color: '#020205',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    padding: '0.75rem 1rem',
};

const line = {
    borderColor: '#1d283a',
};

const fallback = {
    paddingTop: '27px',
};

const fallbackLink = {
    fontSize: '14px',
    color: '#535969',
    wordBreak: 'break-all',
} as const;
