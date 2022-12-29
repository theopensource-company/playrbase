DEFINE TABLE email_templates SCHEMAFULL
    PERMISSIONS NONE;

DEFINE FIELD content ON TABLE email_templates TYPE string ASSERT $value != NONE; 