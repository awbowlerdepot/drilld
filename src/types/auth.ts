/**
 * The signed-in Cognito user, as the app needs it. Company and roles are not
 * part of this: they come from the database (see resolve_app_user).
 */
export interface SignedInUser {
    userId: string;          // Cognito sub
    email: string;
    signOut: () => void;
}
