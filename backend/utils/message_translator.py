# Helper for backend system message translations

MESSAGES = {
    'fr': {
        'unauthorized': "Non autorisé",
        'user_not_found': "Utilisateur non trouvé",
        'email_exists': "L'email existe déjà",
        'invalid_credentials': "Identifiants invalides",
        'account_inactive': "Compte non activé",
        'logged_out': "Déconnexion réussie",
        'token_missing': "Token manquant",
        'token_invalid': "Token invalide",
        'token_expired': "Token expiré",
        'permission_denied': "Permission refusée",
        'child_not_found': "Enfant non trouvé",
        'session_not_found': "Session non trouvée",
        'recording_not_found': "Enregistrement non trouvé",
        'server_error': "Erreur interne du serveur",
        'success_created': "Créé avec succès",
        'success_updated': "Mis à jour avec succès",
        'success_deleted': "Supprimé avec succès",
        'invalid_file': "Type de fichier invalide"
    },
    'en': {
        'unauthorized': "Unauthorized",
        'user_not_found': "User not found",
        'email_exists': "Email already exists",
        'invalid_credentials': "Invalid credentials",
        'account_inactive': "Account inactive",
        'logged_out': "Logged out successfully",
        'token_missing': "Token missing",
        'token_invalid': "Invalid token",
        'token_expired': "Token expired",
        'permission_denied': "Permission denied",
        'child_not_found': "Child not found",
        'session_not_found': "Session not found",
        'recording_not_found': "Recording not found",
        'server_error': "Internal server error",
        'success_created': "Created successfully",
        'success_updated': "Updated successfully",
        'success_deleted': "Deleted successfully",
        'invalid_file': "Invalid file type"
    },
    'ar': {
        'unauthorized': "غير مصرح",
        'user_not_found': "المستخدم غير موجود",
        'email_exists': "البريد الإلكتروني موجود بالفعل",
        'invalid_credentials': "بيانات الدخول غير صحيحة",
        'account_inactive': "الحساب غير مفعل",
        'logged_out': "تم تسجيل الخروج بنجاح",
        'token_missing': "الرمز مفقود",
        'token_invalid': "الرمز غير صالح",
        'token_expired': "انتهت صلاحية الرمز",
        'permission_denied': "تم رفض الإذن",
        'child_not_found': "الطفل غير موجود",
        'session_not_found': "الجلسة غير موجودة",
        'recording_not_found': "التسجيل غير موجود",
        'server_error': "خطأ داخلي في الخادم",
        'success_created': "تم الإنشاء بنجاح",
        'success_updated': "تم التحديث بنجاح",
        'success_deleted': "تم الحذف بنجاح",
        'invalid_file': "نوع الملف غير صالح"
    }
}

def get_message(key, lang='fr'):
    """
    Get translated system message.
    :param key: Message key (e.g. 'unauthorized')
    :param lang: Language code
    :return: Translated string
    """
    # Use fallback if lang not supported or key not found
    lang_dict = MESSAGES.get(lang, MESSAGES['fr'])
    return lang_dict.get(key, MESSAGES['en'].get(key, key))
