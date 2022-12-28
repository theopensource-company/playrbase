DEFINE SCOPE manager 
    SIGNIN ( SELECT * FROM manager WHERE email = $identifier AND crypto::argon2::compare(password, $password) )
;
