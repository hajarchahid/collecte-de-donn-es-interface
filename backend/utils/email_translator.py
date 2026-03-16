# Helper for email translations

EMAIL_TRANSLATIONS = {
    'fr': {
        'activation_subject': "Activation de votre compte OrthoData",
        'reset_password_subject': "Réinitialisation de mot de passe - OrthoData",
        'activation_body': """
            <h1>Bienvenue sur OrthoData</h1>
            <p>Bonjour {name},</p>
            <p>Votre compte a été créé avec succès.</p>
            <p>Voici vos identifiants temporaires :</p>
            <ul>
                <li><strong>Email :</strong> {email}</li>
                <li><strong>Mot de passe temporaire :</strong> {password}</li>
            </ul>
            <p>Veuillez cliquer sur le lien ci-dessous pour activer votre compte et changer votre mot de passe :</p>
            <a href="{link}" style="display:inline-block; padding:10px 20px; background-color:#3b82f6; color:white; text-decoration:none; border-radius:5px;">Activer mon compte</a>
            <p>Si le bouton ne fonctionne pas, copiez ce lien : {link}</p>
        """,
        'reset_password_body': """
            <h1>Réinitialisation de mot de passe</h1>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous pour procéder :</p>
            <a href="{link}" style="display:inline-block; padding:10px 20px; background-color:#3b82f6; color:white; text-decoration:none; border-radius:5px;">Réinitialiser mon mot de passe</a>
            <p>Ce lien expire dans 1 heure.</p>
            <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        """
    },
    'en': {
        'activation_subject': "Activate your OrthoData Account",
        'reset_password_subject': "Password Reset - OrthoData",
        'activation_body': """
            <h1>Welcome to OrthoData</h1>
            <p>Hello {name},</p>
            <p>Your account has been successfully created.</p>
            <p>Here are your temporary credentials:</p>
            <ul>
                <li><strong>Email:</strong> {email}</li>
                <li><strong>Temporary Password:</strong> {password}</li>
            </ul>
            <p>Please click the link below to activate your account and change your password:</p>
            <a href="{link}" style="display:inline-block; padding:10px 20px; background-color:#3b82f6; color:white; text-decoration:none; border-radius:5px;">Activate my Account</a>
            <p>If the button doesn't work, copy this link: {link}</p>
        """,
        'reset_password_body': """
            <h1>Password Reset</h1>
            <p>Hello,</p>
            <p>You requested a password reset.</p>
            <p>Click the link below to proceed:</p>
            <a href="{link}" style="display:inline-block; padding:10px 20px; background-color:#3b82f6; color:white; text-decoration:none; border-radius:5px;">Reset my Password</a>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
        """
    },
    'ar': {
        'activation_subject': "تفعيل حساب OrthoData الخاص بك",
        'reset_password_subject': "إعادة تعيين كلمة المرور - OrthoData",
        'activation_body': """
            <div dir="rtl" style="text-align: right;">
                <h1>مرحباً بكم في OrthoData</h1>
                <p>مرحباً {name}،</p>
                <p>تم إنشاء حسابك بنجاح.</p>
                <p>إليك بيانات الدخول المؤقتة:</p>
                <ul>
                    <li><strong>البريد الإلكتروني:</strong> {email}</li>
                    <li><strong>كلمة المرور المؤقتة:</strong> {password}</li>
                </ul>
                <p>يرجى النقر على الرابط أدناه لتفعيل حسابك وتغيير كلمة المرور:</p>
                <a href="{link}" style="display:inline-block; padding:10px 20px; background-color:#3b82f6; color:white; text-decoration:none; border-radius:5px;">تفعيل حسابي</a>
                <p>إذا لم يعمل الزر، انسخ هذا الرابط: {link}</p>
            </div>
        """,
        'reset_password_body': """
            <div dir="rtl" style="text-align: right;">
                <h1>إعادة تعيين كلمة المرور</h1>
                <p>مرحباً،</p>
                <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.</p>
                <p>انقر على الرابط أدناه للمتابعة:</p>
                <a href="{link}" style="display:inline-block; padding:10px 20px; background-color:#3b82f6; color:white; text-decoration:none; border-radius:5px;">إعادة تعيين كلمة المرور</a>
                <p>تنتهي صلاحية هذا الرابط خلال ساعة واحدة.</p>
                <p>إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.</p>
            </div>
        """
    }
}

def get_email_content(key, lang='fr', **kwargs):
    """
    Get translated email subject and body.
    :param key: 'activation' or 'reset_password'
    :param lang: 'fr', 'en', or 'ar'
    :param kwargs: variables to format the string (name, email, password, link)
    :return: (subject, body)
    """
    lang = lang if lang in EMAIL_TRANSLATIONS else 'fr'
    translations = EMAIL_TRANSLATIONS[lang]
    
    subject = translations.get(f'{key}_subject', '')
    body_template = translations.get(f'{key}_body', '')
    
    try:
        body = body_template.format(**kwargs)
    except KeyError as e:
        body = body_template # Fallback if missing keys
        print(f"Missing key for email formatting: {e}")
        
    return subject, body
