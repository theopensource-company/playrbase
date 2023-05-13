DEFINE TABLE email_verification SCHEMAFULL DROP;

DEFINE FIELD email ON email_verification TYPE string ASSERT is::email($value);
DEFINE FIELD recipient ON email_verification TYPE string;
DEFINE FIELD template ON email_verification TYPE string; // No templates just yet
DEFINE FIELD origin ON email_verification TYPE string;

///////////////////////////////////
////  SEND EMAIL VERIFICATION  ////
///////////////////////////////////


DEFINE TABLE send_email_verification SCHEMAFULL
    PERMISSIONS NONE;

DEFINE FIELD created ON send_email_verification TYPE datetime VALUE $before OR time::now();
DEFINE FIELD email ON send_email_verification TYPE string ASSERT is::email($value);
DEFINE FIELD recipient ON send_email_verification TYPE string;
DEFINE FIELD secret ON send_email_verification TYPE string VALUE $before OR rand::string(32);
DEFINE FIELD template ON send_email_verification TYPE string; // No templates just yet
DEFINE FIELD origin ON send_email_verification TYPE string;