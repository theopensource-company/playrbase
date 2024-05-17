import { brand_name } from '@/lib/branding';
import {
    Body,
    Container,
    Font,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface BirthdatePermitEmailProps {
    challenge: string;
}

const baseUrl = process.env.PLAYRBASE_ENV_ORIGIN ?? 'http://localhost:13000';

export const BirthdatePermitEmail = ({
    challenge = '123456',
}: BirthdatePermitEmailProps) => {
    return (
        <Html lang="en" dir="ltr">
            <Head>
                <title>{`Child account on ${brand_name}`}</title>
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
            <Preview>
                Confirm your child opening an account on {brand_name}
            </Preview>
            <Body style={main}>
                <Container style={container}>
                    <Img
                        src={`${baseUrl}/static/logo.png`}
                        height="50"
                        alt={`${brand_name} logo`}
                        style={logo}
                    />
                    <Heading style={heading}>
                        Child account on {brand_name}
                    </Heading>
                    <Text style={paragraph}>
                        Your child has requested to open an account on
                        {brand_name}. Because they are 16 years or younger, we
                        are required to verify with a parent if this action is
                        permitted. Let your child enter the following code on
                        their device to confirm your approval.
                    </Text>
                    <Section style={codeBox}>
                        <Text style={confirmationCodeText}>{challenge}</Text>
                    </Section>
                    <Text style={paragraph}>
                        This code will be valid for 30 minutes.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default BirthdatePermitEmail;

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

const codeBox = {
    background: '#1d283a',
    borderRadius: '10px',
    margin: '30px 0px',
    padding: '40px 10px',
};

const confirmationCodeText = {
    fontSize: '30px',
    textAlign: 'center' as const,
    verticalAlign: 'middle',
    color: '#ffffff',
};
